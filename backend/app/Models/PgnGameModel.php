<?php

namespace ChessAcademy\Models;

class PgnGameModel extends AbstractModel
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
    public $pgn_text;

    /**
     *
     * @var string
     */
    public $event;

    /**
     *
     * @var string
     */
    public $site;

    /**
     *
     * @var string
     */
    public $date;

    /**
     *
     * @var string
     */
    public $round;

    /**
     *
     * @var string
     */
    public $white;

    /**
     *
     * @var string
     */
    public $black;

    /**
     *
     * @var string
     */
    public $result;

    /**
     *
     * @var string
     */
    public $eco;

    /**
     *
     * @var integer
     */
    public $created_by_user_id;

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
        $this->setSource("pgn_games");
        $this->hasMany('id', 'ChessAcademy\Models\Positions', 'source_pgn_id', ['alias' => 'Positions']);
        $this->belongsTo('created_by_user_id', 'ChessAcademy\Models\Users', 'id', ['alias' => 'Users']);
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return PgnGameModel[]|PgnGameModel|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return PgnGameModel|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
