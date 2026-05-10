<?php

declare(strict_types=1);

namespace ChessAcademy\Middleware;

use Phalcon\Events\Event;
use Phalcon\Mvc\Application;

class CorsMiddleware
{
    public function __construct(private readonly string $allowedOrigin)
    {
    }

    public function beforeHandleRequest(Event $event, Application $application): bool
    {
        $response = $application->getDI()->getShared('response');

        $response->setHeader('Access-Control-Allow-Origin', $this->allowedOrigin);
        $response->setHeader('Access-Control-Allow-Credentials', 'true');
        $response->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->setHeader('Access-Control-Max-Age', '86400');
        $response->setHeader('Vary', 'Origin');

        return true;
    }
}
