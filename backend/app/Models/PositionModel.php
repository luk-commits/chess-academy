<?php

namespace ChessAcademy\Models;

class PositionModel extends AbstractModel
{

    /**
     *
     * @var integer
     */
    public $id;

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
    public $times_seen;

    /**
     *
     * @var integer
     */
    public $difficulty;

    /**
     *
     * @var integer
     */
    public $popularity;

    /**
     *
     * @var boolean
     */
    public $is_puzzle;

    /**
     *
     * @var string
     */
    public $fen;

    /**
     *
     * @var string
     */
    public $opening;

    /**
     *
     * @var string
     */
    public $other_id;

    /**
     *
     * @var string
     */
    public $other_game_id;

    /**
     *
     * @var string
     */
    public $theme_tags;

    /**
     *
     * @var string
     */
    public $engine_top_lines;

    /**
     * Initialize method for model.
     */
    public function initialize()
    {
        $this->setSchema("public");
        $this->setSource("positions");
        $this->hasMany('id', 'ChessAcademy\Models\TaskStages', 'position_id', ['alias' => 'TaskStages']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return PositionModel[]|PositionModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return PositionModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
