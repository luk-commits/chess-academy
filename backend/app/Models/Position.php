<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class Position extends PositionModel
{
    public function initialize()
    {
        parent::initialize();
        $this->skipAttributesOnCreate(['id']);
        $this->skipAttributesOnUpdate(['id']);
    }
}
