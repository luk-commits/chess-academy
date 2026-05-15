<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class UserStageProgress extends UserStageProgressModel
{
    public function initialize()
    {
        parent::initialize();

        $this->belongsTo('user_id', User::class, 'id', [
            'alias' => 'User',
            'reusable' => true,
        ]);

        $this->belongsTo('task_stage_id', TaskStage::class, 'id', [
            'alias' => 'Stage',
            'reusable' => true,
        ]);

        $this->skipAttributesOnCreate(['id', 'created_at', 'updated_at']);
        $this->skipAttributesOnUpdate(['id', 'created_at', 'updated_at']);
    }
}
