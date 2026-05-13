<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class TaskGroup extends AbstractModel
{
    public $task_id;
    public $group_id;
    public $created_at;

    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("task_groups");
    }
}
