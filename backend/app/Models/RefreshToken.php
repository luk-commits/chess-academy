<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class RefreshToken extends AbstractModel
{
    public $id;
    public $user_id;
    public $token_hash;
    public $expires_at;
    public $revoked_at;
    public $created_at;

    public function initialize(): void
    {
        $this->setSchema('public');
        $this->setSource('refresh_tokens');
    }

    public static function hashToken(string $plain): string
    {
        return hash('sha256', $plain);
    }

    public function isUsable(): bool
    {
        if ($this->revoked_at !== null) {
            return false;
        }

        return strtotime((string) $this->expires_at) > time();
    }

    public function revoke(): void
    {
        $this->revoked_at = date('Y-m-d H:i:sO');
        $this->save();
    }
}
