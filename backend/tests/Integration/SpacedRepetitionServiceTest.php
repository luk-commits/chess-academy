<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Integration;

use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Services\SpacedRepetitionService;
use PHPUnit\Framework\TestCase;

final class SpacedRepetitionServiceTest extends TestCase
{
    private const COACH_ID = 3;
    private const PLAYER_ID = 4;

    private SpacedRepetitionService $service;
    private int $taskId;
    private int $stageId;

    protected function setUp(): void
    {
        $this->service = new SpacedRepetitionService();

        $task = new Task();
        $task->title = 'SR test task';
        $task->description = 'integration fixture';
        $task->coach_id = self::COACH_ID;
        $task->status = 'published';
        $this->assertTrue($task->save(), implode('; ', array_map(fn($m) => (string)$m->getMessage(), $task->getMessages())));
        $this->taskId = (int) $task->id;

        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->title = 'SR test stage';
        $stage->sort_order = 0;
        $stage->status = 'published';
        $this->assertTrue($stage->save(), implode('; ', array_map(fn($m) => (string)$m->getMessage(), $stage->getMessages())));
        $this->stageId = (int) $stage->id;
    }

    protected function tearDown(): void
    {
        $task = Task::findFirst($this->taskId);
        if ($task !== null) {
            $task->delete();
        }
    }

    public function testFirstPassSetsIntervalToOneAndSchedulesTomorrow(): void
    {
        $progress = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);

        $this->assertSame(1, (int) $progress->repetitions);
        $this->assertSame(1, (int) $progress->interval_days);
        $this->assertSame('pass', $progress->last_result);
        $this->assertSame(1, (int) $progress->attempts_total);

        $next = new \DateTimeImmutable((string) $progress->next_review_at);
        $now = new \DateTimeImmutable();
        $diffHours = ($next->getTimestamp() - $now->getTimestamp()) / 3600;
        $this->assertGreaterThan(23, $diffHours);
        $this->assertLessThan(25, $diffHours);
    }

    public function testSequenceOfPassesFollowsCurve(): void
    {
        $p = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $this->assertSame(1, (int) $p->interval_days);

        $p = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $this->assertSame(3, (int) $p->interval_days);
        $this->assertSame(2, (int) $p->repetitions);

        $p = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $this->assertSame(6, (int) $p->interval_days);
        $this->assertSame(3, (int) $p->repetitions);

        $p = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $this->assertSame(15, (int) $p->interval_days);
        $this->assertSame(4, (int) $p->repetitions);
    }

    public function testFailResetsRepetitionsAndIntervalToLapse(): void
    {
        $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $p = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);
        $this->assertSame(3, (int) $p->repetitions);

        $p = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, false);

        $this->assertSame(0, (int) $p->repetitions);
        $this->assertSame(1, (int) $p->interval_days);
        $this->assertSame('fail', $p->last_result);
        $this->assertSame(4, (int) $p->attempts_total);
    }

    public function testLazyCreatesProgressRowOnFirstAttempt(): void
    {
        $existing = UserStageProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_stage_id = :s:',
            'bind' => ['u' => self::PLAYER_ID, 's' => $this->stageId],
        ]);
        $this->assertNull($existing);

        $progress = $this->service->recordAttempt(self::PLAYER_ID, $this->stageId, true);

        $this->assertNotNull($progress->id);
        $reloaded = UserStageProgress::findFirst((int) $progress->id);
        $this->assertNotNull($reloaded);
        $this->assertSame(self::PLAYER_ID, (int) $reloaded->user_id);
        $this->assertSame($this->stageId, (int) $reloaded->task_stage_id);
    }
}
