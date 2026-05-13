<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class TaskStagePosition extends AbstractModel
{
    public $task_stage_id;
    public $position_id;
    public $sort_order;
    public $created_at;

    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("task_stage_positions");
    }
}
