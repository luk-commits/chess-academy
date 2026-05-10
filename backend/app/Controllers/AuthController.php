<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\User;
use ChessAcademy\Services\JwtService;

class AuthController extends ControllerBase
{
    public function loginAction(): \Phalcon\Http\Response
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

        /** @var JwtService $jwt */
        $jwt = $this->di->getShared('jwtService');
        $token = $jwt->issue((int) $user->id, $user->role);

        $this->setSessionCookie($token, $jwt->ttl());

        return $this->json([
            'user' => $user->toPublicArray(),
        ]);
    }

    public function registerAction(): \Phalcon\Http\Response
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
            $messages = $user->getMessages();
            $errorMsg = '';
            foreach ($messages as $msg) {
                $errorMsg .= (string) $msg . ' ';
            }
            return $this->error(trim($errorMsg), 422);
        }

        return $this->json(['ok' => true], 201);
    }

    public function logoutAction(): \Phalcon\Http\Response
    {
        $this->setSessionCookie('', -3600);

        return $this->json(['ok' => true]);
    }

    public function meAction(): \Phalcon\Http\Response
    {
        $userId = (int) $this->dispatcher->getParam('authUserId');
        $user = User::findFirst($userId);

        if (!$user instanceof User) {
            return $this->error('User not found', 404);
        }

        return $this->json(['user' => $user->toPublicArray()]);
    }

    public function preflightAction(): \Phalcon\Http\Response
    {
        return $this->response->setStatusCode(204);
    }

    private function setSessionCookie(string $value, int $ttl): void
    {
        $cookieName = (string) $this->config->jwt->cookieName;
        $isProd = ($this->config->app->env ?? 'development') === 'production';

        setcookie($cookieName, $value, [
            'expires' => $ttl > 0 ? time() + $ttl : time() + $ttl,
            'path' => '/',
            'domain' => '',
            'secure' => $isProd,
            'httponly' => true,
            'samesite' => $isProd ? 'Strict' : 'Lax',
        ]);
    }
}
