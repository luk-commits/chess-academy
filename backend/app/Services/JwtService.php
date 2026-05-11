<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use ChessAcademy\Models\RefreshToken;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Phalcon\Config\Config;

/**
 * Dual-token authentication strategy:
 * - Short-lived JWT access token (signed, self-contained, stored in HttpOnly cookie)
 * - Long-lived opaque refresh token (stored hashed in DB, supports rotation and revocation)
 *
 * The JWT carries user identity so API resources can authenticate without a DB lookup.
 * The refresh token is opaque (random bytes), hashed with SHA-256 in the database,
 * so a leaked DB does not expose active tokens.
 */
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

    /**
     * Issue a signed JWT containing user ID and role.
     * The token is short-lived (configurable TTL, default 1 hour) so no server-side
     * session storage is needed.
     */
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

    /**
     * Verify and decode a JWT.
     * Returns null instead of throwing so callers always handle failure the same way.
     */
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

    /**
     * Generate a new opaque refresh token.
     * Only the SHA-256 hash is stored in the database; the plaintext value is returned
     * to the caller and set as an HttpOnly cookie. This means a DB leak does not reveal
     * active tokens.
     */
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

    /**
     * Look up a refresh token by its plaintext value.
     * The lookup is done via SHA-256 hash, so the plaintext is never stored or logged.
     */
    public function findRefreshToken(string $plain): ?RefreshToken
    {
        $record = RefreshToken::findFirst([
            'conditions' => 'token_hash = :hash:',
            'bind' => ['hash' => RefreshToken::hashToken($plain)],
        ]);

        return $record instanceof RefreshToken ? $record : null;
    }
}
