<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Integration;

use ChessAcademy\Models\RefreshToken;
use ChessAcademy\Services\JwtService;
use Phalcon\Config\Config;
use PHPUnit\Framework\TestCase;

final class JwtServiceWithRefreshTokenTest extends TestCase
{
    private JwtService $service;

    protected function setUp(): void
    {
        $this->service = new JwtService(new Config([
            'secret' => 'test_secret_key_min_32_chars_long',
            'algorithm' => 'HS256',
            'ttl' => 3600,
            'refreshTtl' => 7200,
            'issuer' => 'chess-academy-tests',
        ]));
    }

    public function testIssueRefreshTokenPersistsAndCanBeFound(): void
    {
        $plain = $this->service->issueRefreshToken(1);

        $this->assertNotEmpty($plain);
        $this->assertSame(64, strlen($plain));

        $found = $this->service->findRefreshToken($plain);
        $this->assertInstanceOf(RefreshToken::class, $found);
        $this->assertSame(1, $found->user_id);
        $this->assertTrue($found->isUsable());

        $found->revoke();
    }

    public function testRevokedRefreshTokenIsNotUsable(): void
    {
        $plain = $this->service->issueRefreshToken(1);
        $found = $this->service->findRefreshToken($plain);
        $this->assertInstanceOf(RefreshToken::class, $found);

        $found->revoke();

        $this->assertFalse($found->isUsable());
        $this->assertNotNull($found->revoked_at);
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        $connection = $this->getConnection();

        if ($connection !== null) {
            $connection->execute('DELETE FROM refresh_tokens WHERE user_id = 1');
        }
    }

    private function getConnection(): ?\Phalcon\Db\Adapter\Pdo\Postgresql
    {
        if (\Phalcon\Di\Di::getDefault() !== null
            && \Phalcon\Di\Di::getDefault()->has('db')
        ) {
            return \Phalcon\Di\Di::getDefault()->getShared('db');
        }

        return null;
    }
}
