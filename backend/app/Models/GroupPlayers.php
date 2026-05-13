<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class GroupPlayers extends AbstractModel
{
    public $group_id;
    public $player_id;
    public $created_at;

    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("group_players");
    }
}
