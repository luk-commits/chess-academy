<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use ChessAcademy\Models\Position;

class PositionPresenter
{
    public static function present(Position $position, bool $includeMoves = true): array
    {
        [$firstMove, $moves] = self::decodeMoves($position);

        $data = [
            'id'         => (int) $position->id,
            'fen'        => (string) $position->fen,
            'firstMove'  => $firstMove,
            'opening'    => self::formatOpening($position->opening),
            'themeTags'  => self::decodeThemeTags($position->theme_tags),
            'difficulty' => $position->difficulty !== null ? (int) $position->difficulty : null,
        ];

        if ($includeMoves) {
            $data['moves'] = $moves;
        }

        return $data;
    }

    public static function decodeThemeTags(?string $raw): array
    {
        if (!is_string($raw) || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }
        return array_values(array_filter($decoded, static fn ($item): bool => is_string($item)));
    }

    /**
     * @return array{0: ?string, 1: array<int, string>}
     */
    public static function decodeMoves(Position $position): array
    {
        $raw = $position->engine_top_lines;
        if (!is_string($raw) || $raw === '') {
            return [null, []];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded) || !isset($decoded[0]['moves']) || !is_array($decoded[0]['moves'])) {
            return [null, []];
        }
        $moves = array_values(array_filter($decoded[0]['moves'], static fn ($m): bool => is_string($m)));
        return [$moves[0] ?? null, $moves];
    }

    public static function formatOpening(?string $opening): string
    {
        if ($opening === null) {
            return '';
        }
        $pos = mb_strpos($opening, ' ');
        return $pos !== false ? mb_substr($opening, $pos + 1) : $opening;
    }
}
