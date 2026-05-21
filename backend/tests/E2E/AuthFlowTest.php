<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Tests\Support\HttpTestCase;

final class AuthFlowTest extends HttpTestCase
{
    public function testRegisterAndLogin(): void
    {
        $email = 'e2e_' . bin2hex(random_bytes(4)) . '@chess.local';

        $register = $this->request('POST', '/api/register', [
            'email'    => $email,
            'password' => 'Secret123!',
            'fullName' => 'E2E User',
            'role'     => 'PLAYER',
        ]);
        $this->assertSame(201, $register['status']);
        $this->assertTrue($register['body']['ok']);

        $login = $this->request('POST', '/api/login', [
            'email'    => $email,
            'password' => 'Secret123!',
        ]);
        $this->assertSame(200, $login['status']);
        $this->assertSame($email, $login['body']['user']['email']);
        $this->assertSame('E2E User', $login['body']['user']['fullName']);
    }

    public function testLoginWithInvalidCredentialsReturns401(): void
    {
        $response = $this->request('POST', '/api/login', [
            'email'    => 'nonexistent@chess.local',
            'password' => 'wrong',
        ]);
        $this->assertSame(401, $response['status']);
        $this->assertSame('Invalid credentials', $response['body']['error']);
    }

    public function testRegisterWithMissingFieldsReturns422(): void
    {
        $response = $this->request('POST', '/api/register', [
            'email' => 'incomplete@chess.local',
        ]);
        $this->assertSame(422, $response['status']);
        $this->assertStringContainsString('required', $response['body']['error']);
    }
}
