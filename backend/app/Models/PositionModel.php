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
    public $fen;

    /**
     *
     * @var string
     */
    public $description;

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
    public $pieces;

    /**
     *
     * @var string
     */
    public $type;

    /**
     *
     * @var integer
     */
    public $difficulty;

    /**
     *
     * @var integer
     */
    public $evaluation_mate;

    /**
     *
     * @var string
     */
    public $theme_tags;

    /**
     *
     * @var integer
     */
    public $material_balance;

    /**
     *
     * @var integer
     */
    public $source_pgn_id;

    /**
     *
     * @var boolean
     */
    public $is_puzzle;

    /**
     *
     * @var boolean
     */
    public $is_study_position;

    /**
     *
     * @var boolean
     */
    public $is_opening_position;

    /**
     *
     * @var boolean
     */
    public $is_endgame_position;

    /**
     *
     * @var integer
     */
    public $popularity_score;

    /**
     *
     * @var integer
     */
    public $times_seen;

    /**
     *
     * @var integer
     */
    public $times_solved;

    /**
     *
     * @var double
     */
    public $success_rate;

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
     *
     * @var string
     */
    public $board_orientation;

    /**
     *
     * @var string
     */
    public $prev_move;

    /**
     *
     * @var integer
     */
    public $popularity;

    /**
     *
     * @var integer
     */
    public $rating;

    /**
     *
     * @var string
     */
    public $other_game_id;

    /**
     *
     * @var string
     */
    public $game_phase;

    /**
     *
     * @var integer
     */
    public $king_safety_score;

    /**
     *
     * @var integer
     */
    public $space_advantage;

    /**
     *
     * @var string
     */
    public $initiative_side;

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
        $this->belongsTo('created_by_user_id', 'ChessAcademy\Models\Users', 'id', ['alias' => 'Users']);
        $this->belongsTo('source_pgn_id', 'ChessAcademy\Models\PgnGames', 'id', ['alias' => 'PgnGames']);
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
