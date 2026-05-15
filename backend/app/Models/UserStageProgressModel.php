<?php

namespace ChessAcademy\Models;

class UserStageProgressModel extends AbstractModel
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
    public $task_stage_id;

    /**
     *
     * @var integer
     */
    public $repetitions;

    /**
     *
     * @var integer
     */
    public $interval_days;

    /**
     *
     * @var string
     */
    public $last_result;

    /**
     *
     * @var string
     */
    public $last_reviewed_at;

    /**
     *
     * @var string
     */
    public $next_review_at;

    /**
     *
     * @var integer
     */
    public $attempts_total;

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
        $this->setSource("user_stage_progress");
        $this->belongsTo('task_stage_id', 'ChessAcademy\Models\TaskStages', 'id', ['alias' => 'TaskStages']);
        $this->belongsTo('user_id', 'ChessAcademy\Models\Users', 'id', ['alias' => 'Users']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return UserStageProgressModel[]|UserStageProgressModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return UserStageProgressModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
