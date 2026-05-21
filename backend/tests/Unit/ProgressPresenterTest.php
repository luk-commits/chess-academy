<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Unit;

use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Services\ProgressPresenter;
use PHPUnit\Framework\TestCase;

final class ProgressPresenterTest extends TestCase
{
    public function testTaskProgressFullShape(): void
    {
        $p = new UserTaskProgress();
        $p->status = 'in_progress';
        $p->current_stage_id = 7;
        $p->started_at = '2026-01-01T12:00:00+00:00';
        $p->last_activity_at = '2026-01-02T12:00:00+00:00';
        $p->interrupted_at = '2026-01-02T13:00:00+00:00';
        $p->completed_at = null;
        $p->archived_at = null;
        $p->total_time_ms = 1500;
        $p->attempts_total = 5;
        $p->errors_total = 1;

        $result = ProgressPresenter::taskProgress($p);

        $this->assertSame([
            'status'         => 'in_progress',
            'currentStageId' => 7,
            'startedAt'      => '2026-01-01T12:00:00+00:00',
            'lastActivityAt' => '2026-01-02T12:00:00+00:00',
            'interruptedAt'  => '2026-01-02T13:00:00+00:00',
            'completedAt'    => null,
            'archivedAt'     => null,
            'totalTimeMs'    => 1500,
            'attemptsTotal'  => 5,
            'errorsTotal'    => 1,
        ], $result);
    }

    public function testTaskProgressHandlesAllNullableFieldsAsNull(): void
    {
        $p = new UserTaskProgress();
        $p->status = 'new';
        $p->current_stage_id = null;
        $p->started_at = null;
        $p->last_activity_at = null;
        $p->interrupted_at = null;
        $p->completed_at = null;
        $p->archived_at = null;
        $p->total_time_ms = 0;
        $p->attempts_total = 0;
        $p->errors_total = 0;

        $result = ProgressPresenter::taskProgress($p);

        $this->assertNull($result['currentStageId']);
        $this->assertNull($result['startedAt']);
        $this->assertNull($result['lastActivityAt']);
        $this->assertNull($result['interruptedAt']);
        $this->assertNull($result['completedAt']);
        $this->assertNull($result['archivedAt']);
        $this->assertSame(0, $result['totalTimeMs']);
    }

    public function testStageProgressDecodesWrongMoves(): void
    {
        $p = new UserTaskStageProgress();
        $p->status = 'in_progress';
        $p->attempts_total = 3;
        $p->errors_total = 2;
        $p->wrong_moves = json_encode([['ply' => 1, 'move' => 'e5'], ['ply' => 3, 'move' => 'Nc6']]);
        $p->thinking_time_ms = 500;
        $p->avg_move_time_ms = 100;
        $p->longest_move_time_ms = 250;
        $p->first_error_at_ply = 1;
        $p->completed_at = null;
        $p->in_repetition = true;
        $p->added_to_repetition_at = '2026-01-01T00:00:00+00:00';

        $result = ProgressPresenter::stageProgress($p);

        $this->assertSame([
            ['ply' => 1, 'move' => 'e5'],
            ['ply' => 3, 'move' => 'Nc6'],
        ], $result['wrongMoves']);
        $this->assertTrue($result['inRepetition']);
        $this->assertSame(1, $result['firstErrorAtPly']);
    }

    public function testStageProgressFallsBackToEmptyArrayForInvalidWrongMoves(): void
    {
        $p = new UserTaskStageProgress();
        $p->wrong_moves = 'not-json';
        $p->in_repetition = false;
        $p->status = 'new';
        $p->attempts_total = 0;
        $p->errors_total = 0;
        $p->thinking_time_ms = 0;
        $p->avg_move_time_ms = 0;
        $p->longest_move_time_ms = 0;
        $p->first_error_at_ply = null;
        $p->completed_at = null;
        $p->added_to_repetition_at = null;

        $result = ProgressPresenter::stageProgress($p);

        $this->assertSame([], $result['wrongMoves']);
        $this->assertFalse($result['inRepetition']);
        $this->assertNull($result['firstErrorAtPly']);
        $this->assertNull($result['addedToRepetitionAt']);
    }

    public function testStageProgressTreatsEmptyWrongMovesAsEmptyArray(): void
    {
        $p = new UserTaskStageProgress();
        $p->wrong_moves = '';
        $p->in_repetition = false;
        $p->status = 'new';
        $p->attempts_total = 0;
        $p->errors_total = 0;
        $p->thinking_time_ms = 0;
        $p->avg_move_time_ms = 0;
        $p->longest_move_time_ms = 0;
        $p->first_error_at_ply = null;
        $p->completed_at = null;
        $p->added_to_repetition_at = null;

        $this->assertSame([], ProgressPresenter::stageProgress($p)['wrongMoves']);
    }

    public function testSpacedRepetitionFullShape(): void
    {
        $p = new UserStageProgress();
        $p->repetitions = 3;
        $p->interval_days = 6;
        $p->last_result = 'pass';
        $p->last_reviewed_at = '2026-01-01T00:00:00+00:00';
        $p->next_review_at = '2026-01-07T00:00:00+00:00';
        $p->attempts_total = 3;

        $this->assertSame([
            'repetitions'    => 3,
            'intervalDays'   => 6,
            'lastResult'     => 'pass',
            'lastReviewedAt' => '2026-01-01T00:00:00+00:00',
            'nextReviewAt'   => '2026-01-07T00:00:00+00:00',
            'attemptsTotal'  => 3,
        ], ProgressPresenter::spacedRepetition($p));
    }

    public function testSpacedRepetitionHandlesNullableFields(): void
    {
        $p = new UserStageProgress();
        $p->repetitions = 0;
        $p->interval_days = 0;
        $p->last_result = null;
        $p->last_reviewed_at = null;
        $p->next_review_at = '2026-01-02T00:00:00+00:00';
        $p->attempts_total = 0;

        $result = ProgressPresenter::spacedRepetition($p);

        $this->assertNull($result['lastResult']);
        $this->assertNull($result['lastReviewedAt']);
        $this->assertSame('2026-01-02T00:00:00+00:00', $result['nextReviewAt']);
    }
}
