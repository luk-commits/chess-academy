<?php

namespace ChessAcademy\Models;

class TaskStageModel extends AbstractModel
{

    /**
     *
     * @var integer
     */
    public $id;

    /**
     *
     * @var integer
     */
    public $task_id;

    /**
     *
     * @var string
     */
    public $title;

    /**
     *
     * @var string
     */
    public $description;

    /**
     *
     * @var integer
     */
    public $sort_order;

    /**
     *
     * @var string
     */
    public $created_at;

    /**
     *
     * @var string
     */
    public $updated_at;

    /**
     *
     * @var integer
     */
    public $position_id;

    /**
     *
     * @var string
     */
    public $status;

    /**
     *
     * @var string
     */
    public $solution_pgn;

    /**
     * Initialize method for model.
     */
    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("task_stages");
        $this->hasMany('id', 'ChessAcademy\Models\UserStageProgress', 'task_stage_id', ['alias' => 'UserStageProgress']);
        $this->belongsTo('position_id', 'ChessAcademy\Models\Positions', 'id', ['alias' => 'Positions']);
        $this->belongsTo('task_id', 'ChessAcademy\Models\Tasks', 'id', ['alias' => 'Tasks']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return TaskStageModel[]|TaskStageModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return TaskStageModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
