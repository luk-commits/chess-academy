<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class TaskStage extends TaskStageModel
{
    public function initialize()
    {
        parent::initialize();

        $this->belongsTo('task_id', Task::class, 'id', [
            'alias' => 'Task',
            'reusable' => true,
        ]);

        $this->belongsTo('position_id', Position::class, 'id', [
            'alias' => 'Position',
            'reusable' => true,
        ]);

        $this->hasMany('id', UserStageProgress::class, 'task_stage_id', [
            'alias' => 'Progress',
            'reusable' => true,
        ]);
    }
}
