<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

class ErrorsController extends AbstractController
{
    public function notFoundAction(): \Phalcon\Http\Response
    {
        return $this->error('Resource not found', 404);
    }
}
