<?php

namespace ChessAcademy\Models;

class UserTaskStageProgressModel extends AbstractModel
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
    public $user_id;

    /**
     *
     * @var integer
     */
    public $task_id;

    /**
     *
     * @var integer
     */
    public $task_stage_id;

    /**
     *
     * @var string
     */
    public $status;

    /**
     *
     * @var integer
     */
    public $attempts_total;

    /**
     *
     * @var integer
     */
    public $errors_total;

    /**
     *
     * @var string
     */
    public $wrong_moves;

    /**
     *
     * @var integer
     */
    public $thinking_time_ms;

    /**
     *
     * @var integer
     */
    public $avg_move_time_ms;

    /**
     *
     * @var integer
     */
    public $longest_move_time_ms;

    /**
     *
     * @var integer
     */
    public $first_error_at_ply;

    /**
     *
     * @var string
     */
    public $completed_at;

    /**
     *
     * @var boolean
     */
    public $in_repetition;

    /**
     *
     * @var string
     */
    public $added_to_repetition_at;

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
     * Initialize method for model.
     */
    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("user_task_stage_progress");
        $this->belongsTo('user_id', 'ChessAcademy\Models\Users', 'id', ['alias' => 'Users']);
        $this->belongsTo('task_id', 'ChessAcademy\Models\Tasks', 'id', ['alias' => 'Tasks']);
        $this->belongsTo('task_stage_id', 'ChessAcademy\Models\TaskStages', 'id', ['alias' => 'TaskStages']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return UserTaskStageProgressModel[]|UserTaskStageProgressModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return UserTaskStageProgressModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
