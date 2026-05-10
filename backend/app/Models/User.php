<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

use Phalcon\Mvc\Model;
use Phalcon\Filter\Validation;
use Phalcon\Filter\Validation\Validator\Email;
use Phalcon\Filter\Validation\Validator\InclusionIn;
use Phalcon\Filter\Validation\Validator\PresenceOf;
use Phalcon\Filter\Validation\Validator\Uniqueness;

class User extends Model
{
    public const ROLE_COACH = 'COACH';
    public const ROLE_PLAYER = 'PLAYER';

    public ?int $id = null;
    public string $email = '';
    public string $password_hash = '';
    public string $full_name = '';
    public string $role = self::ROLE_PLAYER;
    public ?string $created_at = null;
    public ?string $updated_at = null;

    public function initialize(): void
    {
        $this->setSource('users');
    }

    public function validation(): bool
    {
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
}
