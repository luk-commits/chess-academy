<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Unit;

use ChessAcademy\Services\JwtService;
use Phalcon\Config\Config;
use PHPUnit\Framework\TestCase;

final class JwtServiceTest extends TestCase
{
    public function testIssueAndVerifyReturnsExpectedPayload(): void
    {
        $service = new JwtService(new Config([
            'secret' => 'test_secret_key_min_32_chars_long',
            'algorithm' => 'HS256',
            'ttl' => 3600,
            'refreshTtl' => 7200,
            'issuer' => 'chess-academy-tests',
        ]));

        $token = $service->issue(42, 'COACH');
        $payload = $service->verify($token);

        $this->assertIsArray($payload);
        $this->assertSame('42', $payload['sub']);
        $this->assertSame('COACH', $payload['role']);
        $this->assertSame('chess-academy-tests', $payload['iss']);
        $this->assertSame(3600, (int) $payload['exp'] - (int) $payload['iat']);
    }
}
