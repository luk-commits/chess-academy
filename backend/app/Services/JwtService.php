<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Phalcon\Config\Config;

class JwtService
{
    private string $secret;
    private string $algorithm;
    private int $ttl;
    private string $issuer;

    public function __construct(Config $config)
    {
        $this->secret = (string) $config->secret;
        $this->algorithm = (string) $config->algorithm;
        $this->ttl = (int) $config->ttl;
        $this->issuer = (string) $config->issuer;
    }

    public function issue(int $userId, string $role): string
    {
        $now = time();
        $payload = [
            'iss' => $this->issuer,
            'iat' => $now,
            'exp' => $now + $this->ttl,
            'sub' => (string) $userId,
            'role' => $role,
        ];

        return JWT::encode($payload, $this->secret, $this->algorithm);
    }

    public function verify(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            return (array) $decoded;
        } catch (\Throwable) {
            return null;
        }
    }

    public function ttl(): int
    {
        return $this->ttl;
    }
}
