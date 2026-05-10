<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use ChessAcademy\Models\RefreshToken;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Phalcon\Config\Config;

class JwtService
{
    private string $secret;
    private string $algorithm;
    private int $ttl;
    private int $refreshTtl;
    private string $issuer;

    public function __construct(Config $config)
    {
        $this->secret = (string) $config->secret;
        $this->algorithm = (string) $config->algorithm;
        $this->ttl = (int) $config->ttl;
        $this->refreshTtl = (int) ($config->refreshTtl ?? 2592000);
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

    public function refreshTtl(): int
    {
        return $this->refreshTtl;
    }

    public function issueRefreshToken(int $userId): string
    {
        $plain = bin2hex(random_bytes(32));
        $expiresAt = gmdate('Y-m-d H:i:s', time() + $this->refreshTtl);

        $record = new RefreshToken();
        $record->user_id = $userId;
        $record->token_hash = RefreshToken::hashToken($plain);
        $record->expires_at = $expiresAt;

        if ($record->save() === false) {
            throw new \RuntimeException('Failed to persist refresh token');
        }

        return $plain;
    }

    public function findRefreshToken(string $plain): ?RefreshToken
    {
        $record = RefreshToken::findFirst([
            'conditions' => 'token_hash = :hash:',
            'bind' => ['hash' => RefreshToken::hashToken($plain)],
        ]);

        return $record instanceof RefreshToken ? $record : null;
    }
}
