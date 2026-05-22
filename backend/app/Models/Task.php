<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

use Phalcon\Filter\Validation;
use Phalcon\Filter\Validation\Validator\PresenceOf;

class Task extends TaskModel
{
    public function initialize()
    {
        parent::initialize();

        $this->belongsTo('coach_id', User::class, 'id', [
            'alias' => 'Coach',
            'reusable' => true,
        ]);

        $this->belongsTo('group_id', Group::class, 'id', [
            'alias' => 'Group',
            'reusable' => true,
        ]);

        $this->hasMany('id', TaskStage::class, 'task_id', [
            'alias' => 'Stages',
            'reusable' => true,
        ]);

        $this->hasMany('id', UserTaskProgress::class, 'task_id', [
            'alias' => 'UserProgress',
            'reusable' => true,
        ]);

        $this->hasManyToMany(
            'id',
            TaskGroup::class,
            'task_id',
            'group_id',
            Group::class,
            'id',
            ['alias' => 'Groups']
        );
    }

    public function validation(): bool
    {
        $validator = new Validation();
        $validator->add('group_id', new PresenceOf(['message' => 'Zadanie musi byc przypisane do co najmniej jednej grupy']));

        return $this->validate($validator);
    }
}
