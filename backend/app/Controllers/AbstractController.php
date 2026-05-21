<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use Phalcon\Http\Response;
use Phalcon\Mvc\Controller;
use Phalcon\Mvc\Model;

abstract class AbstractController extends Controller
{
    protected function jsonInput(): array
    {
        $raw = $this->request->getRawBody();
        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }

    protected function json(array $data, int $status = 200): Response
    {
        $this->response->setStatusCode($status);
        $this->response->setJsonContent($data);

        return $this->response;
    }

    protected function error(string $message, int $status = 400): Response
    {
        return $this->json(['error' => $message], $status);
    }

    protected function authUserId(): int
    {
        return (int) $this->dispatcher->getParam('authUserId');
    }

    protected function authRole(): string
    {
        return strtoupper((string) $this->dispatcher->getParam('authRole'));
    }

    protected function requireRole(string $expected): ?Response
    {
        if ($this->authRole() !== strtoupper($expected)) {
            return $this->error('Forbidden', 403);
        }
        return null;
    }

    protected function positiveIntParam(string $name, string $errorMessage = 'Invalid id'): int|Response
    {
        $value = (int) $this->dispatcher->getParam($name);
        if ($value <= 0) {
            return $this->error($errorMessage, 400);
        }
        return $value;
    }

    protected function modelErrors(Model $model, string $fallback = 'Validation failed'): string
    {
        $messages = $model->getMessages();
        if (empty($messages)) {
            return $fallback;
        }
        return implode(' ', array_map(static fn ($m) => (string) $m->getMessage(), $messages));
    }
}
