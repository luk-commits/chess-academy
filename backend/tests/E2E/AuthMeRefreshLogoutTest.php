<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Tests\Support\HttpTestCase;

final class AuthMeRefreshLogoutTest extends HttpTestCase
{
    public function testMeReturnsCurrentUserAfterLogin(): void
    {
        $this->loginAsPlayer();

        $response = $this->request('GET', '/api/me');

        $this->assertSame(200, $response['status']);
        $this->assertSame(self::PLAYER_EMAIL, $response['body']['user']['email']);
        $this->assertSame('PLAYER', $response['body']['user']['role']);
        $this->assertArrayNotHasKey('password_hash', $response['body']['user']);
    }

    public function testMeRequiresAuthentication(): void
    {
        $response = $this->request('GET', '/api/me');
        $this->assertSame(401, $response['status']);
    }

    public function testRefreshRotatesTokenAndKeepsUserAccess(): void
    {
        $this->loginAsCoach();

        $refresh = $this->request('POST', '/api/refresh');
        $this->assertSame(200, $refresh['status']);
        $this->assertSame(self::COACH_EMAIL, $refresh['body']['user']['email']);

        // After rotation, /api/me should still work with the freshly-issued access cookie.
        $me = $this->request('GET', '/api/me');
        $this->assertSame(200, $me['status']);
        $this->assertSame('COACH', $me['body']['user']['role']);
    }

    public function testRefreshWithoutCookieReturns401(): void
    {
        $response = $this->request('POST', '/api/refresh');
        $this->assertSame(401, $response['status']);
    }

    public function testLogoutInvalidatesRefreshToken(): void
    {
        $this->loginAsPlayer();

        $logout = $this->request('POST', '/api/logout');
        $this->assertSame(200, $logout['status']);
        $this->assertTrue($logout['body']['ok']);

        // After logout, the refresh cookie has been cleared, so /api/refresh must fail.
        $refresh = $this->request('POST', '/api/refresh');
        $this->assertSame(401, $refresh['status']);
    }

    public function testReusingRotatedRefreshTokenFails(): void
    {
        $this->loginAsPlayer();

        // Capture refresh cookie value before rotation.
        $beforeJar = file_get_contents($this->cookieJar);

        $firstRefresh = $this->request('POST', '/api/refresh');
        $this->assertSame(200, $firstRefresh['status']);

        // Restore the pre-rotation cookie jar - the old refresh token is now revoked.
        file_put_contents($this->cookieJar, $beforeJar);

        $secondRefresh = $this->request('POST', '/api/refresh');
        $this->assertSame(401, $secondRefresh['status']);
    }
}
