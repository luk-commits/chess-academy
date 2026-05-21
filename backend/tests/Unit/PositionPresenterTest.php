<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Unit;

use ChessAcademy\Models\Position;
use ChessAcademy\Services\PositionPresenter;
use PHPUnit\Framework\TestCase;

final class PositionPresenterTest extends TestCase
{
    public function testDecodeThemeTagsReturnsEmptyForNullOrEmpty(): void
    {
        $this->assertSame([], PositionPresenter::decodeThemeTags(null));
        $this->assertSame([], PositionPresenter::decodeThemeTags(''));
    }

    public function testDecodeThemeTagsReturnsEmptyForInvalidJson(): void
    {
        $this->assertSame([], PositionPresenter::decodeThemeTags('not-json'));
    }

    public function testDecodeThemeTagsFiltersNonStrings(): void
    {
        $raw = json_encode(['fork', 42, 'pin', null, 'discovered_check']);
        $this->assertSame(['fork', 'pin', 'discovered_check'], PositionPresenter::decodeThemeTags($raw));
    }

    public function testFormatOpeningReturnsEmptyForNull(): void
    {
        $this->assertSame('', PositionPresenter::formatOpening(null));
    }

    public function testFormatOpeningStripsEcoPrefix(): void
    {
        $this->assertSame('Ruy Lopez', PositionPresenter::formatOpening('C60 Ruy Lopez'));
    }

    public function testFormatOpeningReturnsOriginalWithoutSpace(): void
    {
        $this->assertSame('NoSpace', PositionPresenter::formatOpening('NoSpace'));
    }

    public function testDecodeMovesReturnsEmptyWhenMissing(): void
    {
        $position = new Position();
        $position->engine_top_lines = null;
        $this->assertSame([null, []], PositionPresenter::decodeMoves($position));

        $position->engine_top_lines = '';
        $this->assertSame([null, []], PositionPresenter::decodeMoves($position));
    }

    public function testDecodeMovesReturnsEmptyWhenInvalidShape(): void
    {
        $position = new Position();
        $position->engine_top_lines = json_encode(['no_moves_key' => true]);
        $this->assertSame([null, []], PositionPresenter::decodeMoves($position));
    }

    public function testDecodeMovesReturnsFirstAndAllMoves(): void
    {
        $position = new Position();
        $position->engine_top_lines = json_encode([
            ['moves' => ['e4', 'e5', 'Nf3']],
            ['moves' => ['d4']],
        ]);

        $this->assertSame(['e4', ['e4', 'e5', 'Nf3']], PositionPresenter::decodeMoves($position));
    }

    public function testDecodeMovesFiltersNonStringMoves(): void
    {
        $position = new Position();
        $position->engine_top_lines = json_encode([
            ['moves' => ['e4', 42, 'e5', null]],
        ]);

        $this->assertSame(['e4', ['e4', 'e5']], PositionPresenter::decodeMoves($position));
    }

    public function testPresentFullShape(): void
    {
        $position = new Position();
        $position->id = 7;
        $position->fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        $position->theme_tags = json_encode(['fork', 'pin']);
        $position->engine_top_lines = json_encode([['moves' => ['e4', 'e5']]]);
        $position->opening = 'C00 Open Game';
        $position->difficulty = 3;

        $result = PositionPresenter::present($position);

        $this->assertSame([
            'id'         => 7,
            'fen'        => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            'firstMove'  => 'e4',
            'opening'    => 'Open Game',
            'themeTags'  => ['fork', 'pin'],
            'difficulty' => 3,
            'moves'      => ['e4', 'e5'],
        ], $result);
    }

    public function testPresentWithoutMoves(): void
    {
        $position = new Position();
        $position->id = 1;
        $position->fen = 'fen';
        $position->theme_tags = null;
        $position->engine_top_lines = null;
        $position->opening = null;
        $position->difficulty = null;

        $result = PositionPresenter::present($position, includeMoves: false);

        $this->assertArrayNotHasKey('moves', $result);
        $this->assertNull($result['firstMove']);
        $this->assertSame('', $result['opening']);
        $this->assertSame([], $result['themeTags']);
        $this->assertNull($result['difficulty']);
    }
}
