<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Position;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Tests\Support\HttpTestCase;
use DateTimeImmutable;

final class PlayerStagesDueTest extends HttpTestCase
{
    private int $taskId;
    private int $groupId;
    private int $newStageId;
    private int $dueStageId;
    private int $futureStageId;
    private int $positionId;

    protected function setUp(): void
    {
        parent::setUp();

        $existingPosition = Position::findFirst();
        $this->assertNotNull($existingPosition, 'Test requires at least one position in DB');
        $this->positionId = (int) $existingPosition->id;

        $group = new Group();
        $group->name = 'Due test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertSavedOk($group);
        $this->groupId = (int) $group->id;

        $member = new GroupPlayers();
        $member->group_id = $this->groupId;
        $member->player_id = self::PLAYER_ID;
        $this->assertSavedOk($member);

        $task = new Task();
        $task->title = 'Due test task';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'published';
        $this->assertSavedOk($task);
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertSavedOk($tg);

        $this->newStageId    = $this->createStage('New stage', 0);
        $this->dueStageId    = $this->createStage('Due stage', 1);
        $this->futureStageId = $this->createStage('Future stage', 2);

        $this->seedProgress($this->dueStageId, (new DateTimeImmutable('-2 days'))->format('c'));
        $this->seedProgress($this->futureStageId, (new DateTimeImmutable('+5 days'))->format('c'));

        foreach ([$this->newStageId, $this->dueStageId, $this->futureStageId] as $sid) {
            $sp = new UserTaskStageProgress();
            $sp->user_id = self::PLAYER_ID;
            $sp->task_id = $this->taskId;
            $sp->task_stage_id = $sid;
            $sp->in_repetition = true;
            $this->assertSavedOk($sp);
        }

        $tp = new UserTaskProgress();
        $tp->user_id = self::PLAYER_ID;
        $tp->task_id = $this->taskId;
        $tp->status = 'in_progress';
        $this->assertSavedOk($tp);
    }

    protected function tearDown(): void
    {
        UserTaskStageProgress::find([
            'conditions' => 'task_stage_id IN ({ids:array})',
            'bind' => ['ids' => [$this->newStageId, $this->dueStageId, $this->futureStageId]],
        ])->delete();
        UserTaskProgress::find([
            'conditions' => 'task_id = :t:',
            'bind' => ['t' => $this->taskId],
        ])->delete();
        UserStageProgress::find([
            'conditions' => 'task_stage_id IN ({ids:array})',
            'bind' => ['ids' => [$this->newStageId, $this->dueStageId, $this->futureStageId]],
        ])->delete();
        Task::findFirst($this->taskId)?->delete();
        Group::findFirst($this->groupId)?->delete();
        parent::tearDown();
    }

    public function testReturnsNewAndOverdueStagesButSkipsFutureOnes(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('GET', '/api/player/stages/due');

        $this->assertSame(200, $response['status']);
        $this->assertArrayHasKey('stages', $response['body']);

        $ids = array_map(static fn (array $s): int => (int) $s['id'], $response['body']['stages']);
        $this->assertContains($this->newStageId, $ids);
        $this->assertContains($this->dueStageId, $ids);
        $this->assertNotContains($this->futureStageId, $ids);
    }

    public function testNewStagesSortedBeforeOverdueOnes(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('GET', '/api/player/stages/due');

        $ourStages = array_values(array_filter(
            $response['body']['stages'],
            fn (array $s): bool => in_array((int) $s['id'], [$this->newStageId, $this->dueStageId], true),
        ));

        $this->assertCount(2, $ourStages);
        $this->assertSame($this->newStageId, (int) $ourStages[0]['id']);
        $this->assertNull($ourStages[0]['progress']);
        $this->assertSame($this->dueStageId, (int) $ourStages[1]['id']);
        $this->assertNotNull($ourStages[1]['progress']);
        $this->assertSame(1, $ourStages[1]['progress']['repetitions']);
    }

    public function testResponseShapeIncludesTaskPositionAndSolutionPgn(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('GET', '/api/player/stages/due');

        $newStage = null;
        foreach ($response['body']['stages'] as $s) {
            if ((int) $s['id'] === $this->newStageId) {
                $newStage = $s;
                break;
            }
        }
        $this->assertNotNull($newStage);

        $this->assertSame('1. e4 e5 2. Nf3', $newStage['solutionPgn']);
        $this->assertSame($this->taskId, $newStage['task']['id']);
        $this->assertSame('Due test task', $newStage['task']['title']);
        $this->assertSame('Demo Coach', $newStage['task']['coachName']);
        $this->assertSame($this->positionId, $newStage['position']['id']);
        $this->assertNull($newStage['progress']);
    }

    public function testCoachIsForbidden(): void
    {
        $this->loginAsCoach();
        $response = $this->request('GET', '/api/player/stages/due');
        $this->assertSame(403, $response['status']);
    }

    public function testUnauthenticatedReturns401(): void
    {
        $response = $this->request('GET', '/api/player/stages/due');
        $this->assertSame(401, $response['status']);
    }

    private function createStage(string $title, int $sortOrder): int
    {
        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->position_id = $this->positionId;
        $stage->title = $title;
        $stage->sort_order = $sortOrder;
        $stage->status = 'published';
        $stage->solution_pgn = '1. e4 e5 2. Nf3';
        $this->assertSavedOk($stage);
        return (int) $stage->id;
    }

    private function seedProgress(int $stageId, string $nextReviewAt): void
    {
        $progress = new UserStageProgress();
        $progress->user_id = self::PLAYER_ID;
        $progress->task_stage_id = $stageId;
        $progress->repetitions = 1;
        $progress->interval_days = 1;
        $progress->last_result = 'pass';
        $progress->last_reviewed_at = (new DateTimeImmutable('-3 days'))->format('c');
        $progress->next_review_at = $nextReviewAt;
        $progress->attempts_total = 1;
        $this->assertSavedOk($progress);
    }
}
