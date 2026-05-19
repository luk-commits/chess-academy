<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class UserTaskStageProgress extends UserTaskStageProgressModel
{
    public function initialize()
    {
        parent::initialize();

        $this->belongsTo('user_id', User::class, 'id', [
            'alias' => 'User',
            'reusable' => true,
        ]);

        $this->belongsTo('task_id', Task::class, 'id', [
            'alias' => 'Task',
            'reusable' => true,
        ]);

        $this->belongsTo('task_stage_id', TaskStage::class, 'id', [
            'alias' => 'Stage',
            'reusable' => true,
        ]);
    }
}
