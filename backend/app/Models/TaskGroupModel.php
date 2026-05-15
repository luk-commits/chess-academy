<?php

namespace ChessAcademy\Models;

class TaskGroupModel extends AbstractModel
{

    /**
     *
     * @var integer
     */
    public $task_id;

    /**
     *
     * @var integer
     */
    public $group_id;

    /**
     *
     * @var string
     */
    public $created_at;

    /**
     * Initialize method for model.
     */
    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("task_groups");
        $this->belongsTo('task_id', 'ChessAcademy\Models\Tasks', 'id', ['alias' => 'Tasks']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return TaskGroupModel[]|TaskGroupModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return TaskGroupModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
