<?php

declare(strict_types=1);

namespace ChessAcademy\Middleware;

use ChessAcademy\Services\JwtService;
use Phalcon\Events\Event;
use Phalcon\Mvc\Dispatcher;

/**
 * Protects API routes by verifying a JWT on every request.
 * Public routes (login, register, refresh, preflight) bypass verification.
 * The token can be provided via HttpOnly cookie (preferred) or Authorization header.
 */
class JwtMiddleware
{
    /**
     * Routes that do not require authentication.
     * CORS preflight OPTIONS requests must also be public.
     */
    private const PUBLIC_ROUTES = [
        'auth' => ['login', 'register', 'refresh', 'preflight'],
    ];

    public function __construct(
        private readonly JwtService $jwtService,
        private readonly string $cookieName,
    ) {
    }

    /**
     * Runs before every controller action.
     * If the route is public, execution continues immediately.
     * Otherwise, a valid JWT must be present — either in an HttpOnly cookie
     * (set on login) or an Authorization: Bearer header.
     * On success, the decoded user ID and role are injected as dispatcher params
     * so controllers do not need to parse the token again.
     */
    public function beforeExecuteRoute(Event $event, Dispatcher $dispatcher): bool
    {
        $controller = strtolower($dispatcher->getControllerName());
        $action = strtolower($dispatcher->getActionName());

        if (isset(self::PUBLIC_ROUTES[$controller]) && in_array($action, self::PUBLIC_ROUTES[$controller], true)) {
            return true;
        }

        $token = $this->extractToken();
        if ($token === null) {
            return $this->reject($dispatcher, 'Missing authentication token');
        }

        $claims = $this->jwtService->verify($token);
        if ($claims === null) {
            return $this->reject($dispatcher, 'Invalid or expired token');
        }

        $dispatcher->setParam('authUserId', (int) ($claims['sub'] ?? 0));
        $dispatcher->setParam('authRole', (string) ($claims['role'] ?? ''));

        return true;
    }

    /**
     * Extract JWT from HttpOnly cookie first (primary method), falling back
     * to Authorization: Bearer header (useful for testing or mobile clients).
     */
    private function extractToken(): ?string
    {
        if (!empty($_COOKIE[$this->cookieName])) {
            return (string) $_COOKIE[$this->cookieName];
        }

        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }

    private function reject(Dispatcher $dispatcher, string $message): bool
    {
        $response = $dispatcher->getDI()->getShared('response');
        $response->setStatusCode(401, 'Unauthorized');
        $response->setJsonContent(['error' => $message]);

        $dispatcher->setReturnedValue($response);

        return false;
    }
}
