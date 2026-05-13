<?php

namespace ChessAcademy\Models;

use Phalcon\Filter\Validation;
use Phalcon\Filter\Validation\Validator\Email;
use Phalcon\Filter\Validation\Validator\InclusionIn;
use Phalcon\Filter\Validation\Validator\PresenceOf;
use Phalcon\Filter\Validation\Validator\Uniqueness;

class User extends UserModel
{
    public const ROLE_COACH = 'COACH';
    public const ROLE_PLAYER = 'PLAYER';

    public function initialize()
    {
        parent::initialize();

        $this->hasMany('id', Group::class, 'coach_id', [
            'alias' => 'CoachedGroups',
            'reusable' => true,
        ]);

        $this->hasManyToMany(
            'id',
            GroupPlayers::class,
            'player_id',
            'class_id',
            Group::class,
            'id',
            ['alias' => 'EnrolledGroups']
        );
    }

    public function validation(): bool
    {
        if (parent::validation() === false) {
            return false;
        }

        $validator = new Validation();

        $validator->add('email', new PresenceOf(['message' => 'Email is required']));
        $validator->add('email', new Email(['message' => 'Email is invalid']));
        $validator->add('email', new Uniqueness(['message' => 'Email already exists']));
        $validator->add('password_hash', new PresenceOf(['message' => 'Password is required']));
        $validator->add('full_name', new PresenceOf(['message' => 'Full name is required']));
        $validator->add('role', new InclusionIn([
            'domain' => [self::ROLE_COACH, self::ROLE_PLAYER],
            'message' => 'Role must be COACH or PLAYER',
        ]));

        return $this->validate($validator);
    }

    public function verifyPassword(string $plain): bool
    { 
        return password_verify($plain, $this->password_hash);
    }


    public static function hashPassword(string $plain): string
    {
        return password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
    }


    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'fullName' => $this->full_name,
            'role' => $this->role,
        ];
    }

    /**
     * Allows to query a set of records that match the specified conditions
     *
     * @param mixed $parameters
     * @return User[]|User|\Phalcon\Mvc\Model\ResultSetInterface
     */
    public static function find($parameters = null): \Phalcon\Mvc\Model\ResultsetInterface
    {
        return parent::find($parameters);
    }

    /**
     * Allows to query the first record that match the specified conditions
     *
     * @param mixed $parameters
     * @return User|\Phalcon\Mvc\Model\ResultInterface|\Phalcon\Mvc\ModelInterface|null
     */
    public static function findFirst($parameters = null): ?\Phalcon\Mvc\ModelInterface
    {
        return parent::findFirst($parameters);
    }

}
