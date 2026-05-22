<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Models\Position;
use ChessAcademy\Tests\Support\HttpTestCase;

final class CoachPositionsIndexTest extends HttpTestCase
{
    private int $positionId;
    private string $originalFen;
    private ?string $originalOpening;
    private ?string $originalThemeTags;

    protected function setUp(): void
    {
        parent::setUp();

        $tags = [];
        for ($i = 1; $i <= 20; $i++) {
            $tags[] = 'clip_tag_' . $i;
        }
        $tags[] = str_repeat('l', 50);

        $position = Position::findFirst();
        $this->assertNotNull($position, 'Test requires at least one position in DB');

        $this->positionId = (int) $position->id;
        $this->originalFen = (string) $position->fen;
        $this->originalOpening = $position->opening !== null ? (string) $position->opening : null;
        $this->originalThemeTags = $position->theme_tags !== null ? (string) $position->theme_tags : null;

        $position->opening = 'Clip tags opening';
        $position->theme_tags = json_encode($tags, JSON_UNESCAPED_UNICODE);
        $this->assertSavedOk($position);
    }

    protected function tearDown(): void
    {
        $position = Position::findFirst($this->positionId);
        if ($position !== null) {
            $position->fen = $this->originalFen;
            $position->opening = $this->originalOpening;
            $position->theme_tags = $this->originalThemeTags;
            $position->save();
        }
        parent::tearDown();
    }

    public function testTagsAboveTwentyAreSilentlyIgnored(): void
    {
        $tags = [];
        for ($i = 1; $i <= 20; $i++) {
            $tags[] = 'clip_tag_' . $i;
        }
        $tags[] = 'missing_tag_ignored';

        $this->loginAsCoach();
        $response = $this->request('GET', '/api/coach/positions?tags=' . implode(',', $tags));

        $this->assertSame(200, $response['status']);
        $ids = array_map(static fn (array $item): int => (int) $item['id'], $response['body']['items']);
        $this->assertContains($this->positionId, $ids);
    }

    public function testFirstTwentyTagsStillApplyNormalFiltering(): void
    {
        $tags = [];
        for ($i = 1; $i <= 20; $i++) {
            $tags[] = $i === 5 ? 'missing_in_first_twenty' : 'clip_tag_' . $i;
        }

        $this->loginAsCoach();
        $response = $this->request('GET', '/api/coach/positions?tags=' . implode(',', $tags));

        $this->assertSame(200, $response['status']);
        $ids = array_map(static fn (array $item): int => (int) $item['id'], $response['body']['items']);
        $this->assertNotContains($this->positionId, $ids);
    }
}
