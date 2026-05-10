<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use Phalcon\Mvc\Controller;

abstract class ControllerBase extends Controller
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

    protected function json(array $data, int $status = 200): \Phalcon\Http\Response
    {
        $this->response->setStatusCode($status);
        $this->response->setJsonContent($data);

        return $this->response;
    }

    protected function error(string $message, int $status = 400): \Phalcon\Http\Response
    {
        return $this->json(['error' => $message], $status);
    }
}
