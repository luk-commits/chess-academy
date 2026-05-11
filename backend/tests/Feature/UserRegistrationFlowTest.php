<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Feature;

use ChessAcademy\Models\User;
use PHPUnit\Framework\TestCase;

final class UserRegistrationFlowTest extends TestCase
{
    public function testPasswordIsHashedWithBcryptCost12(): void
    {
        $plain = 'MySecurePass99!';

        $hash = User::hashPassword($plain);
        $this->assertNotEmpty($hash);
        $this->assertStringStartsWith('$2y$12$', $hash);

        $user = new User();
        $user->password_hash = $hash;

        $this->assertTrue($user->verifyPassword($plain));
        $this->assertFalse($user->verifyPassword('wrong_password'));
    }

    public function testPublicArrayExcludesSensitiveFields(): void
    {
        $user = new User();
        $user->id = 10;
        $user->email = 'test@chess.local';
        $user->full_name = 'Feature Test';
        $user->role = 'COACH';
        $user->password_hash = User::hashPassword('secret');
        $user->created_at = '2025-01-01';
        $user->updated_at = '2025-01-01';

        $public = $user->toPublicArray();

        $this->assertSame(10, $public['id']);
        $this->assertSame('test@chess.local', $public['email']);
        $this->assertSame('Feature Test', $public['fullName']);
        $this->assertSame('COACH', $public['role']);

        $this->assertArrayNotHasKey('password_hash', $public);
        $this->assertArrayNotHasKey('created_at', $public);
        $this->assertArrayNotHasKey('updated_at', $public);
    }

    public function testRoleConstantsAreCorrect(): void
    {
        $this->assertSame('COACH', User::ROLE_COACH);
        $this->assertSame('PLAYER', User::ROLE_PLAYER);
    }

    public function testNewUserInstanceHasNullId(): void
    {
        $user = new User();
        $user->email = 'new@chess.local';
        $user->full_name = 'New Player';
        $user->password_hash = 'placeholder';
        $user->role = 'PLAYER';

        $this->assertNull($user->id);
        $this->assertSame('new@chess.local', $user->email);
        $this->assertSame('PLAYER', $user->role);
    }
}
