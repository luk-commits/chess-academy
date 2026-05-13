<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class Group extends GroupModel
{
    public function initialize()
    {
        parent::initialize();

        $this->belongsTo('coach_id', User::class, 'id', [
            'alias' => 'Coach',
            'reusable' => true,
        ]);

        $this->hasManyToMany(
            'id',
            GroupPlayers::class,
            'group_id',
            'player_id',
            User::class,
            'id',
            ['alias' => 'Players']
        );

        $this->hasManyToMany(
            'id',
            TaskGroup::class,
            'group_id',
            'task_id',
            Task::class,
            'id',
            ['alias' => 'Tasks']
        );
    }
}
