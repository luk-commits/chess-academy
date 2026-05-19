<?php

namespace ChessAcademy\Models;

class UserTaskProgressModel extends AbstractModel
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
     * @var string
     */
    public $status;

    /**
     *
     * @var integer
     */
    public $current_stage_id;

    /**
     *
     * @var string
     */
    public $started_at;

    /**
     *
     * @var string
     */
    public $last_activity_at;

    /**
     *
     * @var string
     */
    public $interrupted_at;

    /**
     *
     * @var string
     */
    public $completed_at;

    /**
     *
     * @var string
     */
    public $archived_at;

    /**
     *
     * @var integer
     */
    public $total_time_ms;

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
        $this->setSource("user_task_progress");
        $this->belongsTo('user_id', 'ChessAcademy\Models\Users', 'id', ['alias' => 'Users']);
        $this->belongsTo('task_id', 'ChessAcademy\Models\Tasks', 'id', ['alias' => 'Tasks']);
        $this->belongsTo('current_stage_id', 'ChessAcademy\Models\TaskStages', 'id', ['alias' => 'CurrentStage']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return UserTaskProgressModel[]|UserTaskProgressModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return UserTaskProgressModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
