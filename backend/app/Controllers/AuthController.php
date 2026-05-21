<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\RefreshToken;
use ChessAcademy\Models\User;
use ChessAcademy\Services\JwtService;
use Phalcon\Http\Response;

class AuthController extends AbstractController
{
    public function loginAction(): Response
    {
        $payload = $this->jsonInput();
        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($email === '' || $password === '') {
            return $this->error('Email and password are required', 422);
        }

        $user = User::findFirst([
            'conditions' => 'email = :email:',
            'bind' => ['email' => $email],
        ]);

        if (!$user instanceof User || !$user->verifyPassword($password)) {
            return $this->error('Invalid credentials', 401);
        }

        $this->issueAndSetTokens($user);

        return $this->json(['user' => $user->toPublicArray()]);
    }

    public function registerAction(): Response
    {
        $payload = $this->jsonInput();

        $email = trim((string) ($payload['email'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $fullName = trim((string) ($payload['fullName'] ?? ''));
        $role = strtoupper(trim((string) ($payload['role'] ?? '')));

        if ($email === '' || $password === '' || $fullName === '' || $role === '') {
            return $this->error('All fields are required', 422);
        }

        if (!in_array($role, ['COACH', 'PLAYER'], true)) {
            return $this->error('Role must be COACH or PLAYER', 422);
        }

        $existing = User::findFirst([
            'conditions' => 'email = :email:',
            'bind' => ['email' => $email],
        ]);

        if ($existing instanceof User) {
            return $this->error('Email already exists', 409);
        }

        $user = new User();
        $user->email = $email;
        $user->password_hash = User::hashPassword($password);
        $user->full_name = $fullName;
        $user->role = $role;

        if ($user->save() === false) {
            return $this->error($this->modelErrors($user), 422);
        }

        return $this->json(['ok' => true], 201);
    }

    /**
     * Refresh token rotation: revoke the old token and issue a new pair.
     */
    public function refreshAction(): Response
    {
        $plain = (string) ($_COOKIE[(string) $this->config->jwt->refreshCookieName] ?? '');
        if ($plain === '') {
            return $this->error('Missing refresh token', 401);
        }

        $jwt = $this->jwt();
        $record = $jwt->findRefreshToken($plain);

        if (!$record instanceof RefreshToken || !$record->isUsable()) {
            return $this->error('Invalid refresh token', 401);
        }

        $user = User::findFirst((int) $record->user_id);
        if (!$user instanceof User) {
            return $this->error('User not found', 401);
        }

        $record->revoke();
        $this->issueAndSetTokens($user);

        return $this->json(['user' => $user->toPublicArray()]);
    }

    public function logoutAction(): Response
    {
        $plain = (string) ($_COOKIE[(string) $this->config->jwt->refreshCookieName] ?? '');

        if ($plain !== '') {
            $record = $this->jwt()->findRefreshToken($plain);
            if ($record instanceof RefreshToken && $record->revoked_at === null) {
                $record->revoke();
            }
        }

        $this->writeCookie((string) $this->config->jwt->cookieName, '', -3600);
        $this->writeCookie((string) $this->config->jwt->refreshCookieName, '', -3600);

        return $this->json(['ok' => true]);
    }

    public function meAction(): Response
    {
        $user = User::findFirst($this->authUserId());
        if (!$user instanceof User) {
            return $this->error('User not found', 404);
        }
        return $this->json(['user' => $user->toPublicArray()]);
    }

    public function preflightAction(): Response
    {
        return $this->response->setStatusCode(204);
    }

    private function jwt(): JwtService
    {
        return $this->di->getShared('jwtService');
    }

    private function issueAndSetTokens(User $user): void
    {
        $jwt = $this->jwt();
        $access = $jwt->issue((int) $user->id, $user->role);
        $refresh = $jwt->issueRefreshToken((int) $user->id);

        $this->writeCookie((string) $this->config->jwt->cookieName, $access, $jwt->ttl());
        $this->writeCookie((string) $this->config->jwt->refreshCookieName, $refresh, $jwt->refreshTtl());
    }

    /**
     * HttpOnly + SameSite=Lax cookie for token storage (XSS/CSRF mitigation).
     */
    private function writeCookie(string $name, string $value, int $ttl): void
    {
        $isProd = ($this->config->app->env ?? 'development') === 'production';

        setcookie($name, $value, [
            'expires'  => time() + $ttl,
            'path'     => '/',
            'domain'   => '',
            'secure'   => $isProd,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }
}
