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

final class PlayerTaskProgressTest extends HttpTestCase
{
    private int $taskId;
    private int $groupId;
    private int $stageId1;
    private int $stageId2;
    private int $positionId;

    protected function setUp(): void
    {
        parent::setUp();

        $position = Position::findFirst();
        $this->assertNotNull($position, 'Test requires at least one position in DB');
        $this->positionId = (int) $position->id;

        $group = new Group();
        $group->name = 'TP test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertSavedOk($group);
        $this->groupId = (int) $group->id;

        $member = new GroupPlayers();
        $member->group_id = $this->groupId;
        $member->player_id = self::PLAYER_ID;
        $this->assertSavedOk($member);

        $task = new Task();
        $task->title = 'TP task';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'published';
        $this->assertSavedOk($task);
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertSavedOk($tg);

        $this->stageId1 = $this->createStage(0);
        $this->stageId2 = $this->createStage(1);
    }

    protected function tearDown(): void
    {
        UserTaskStageProgress::find([
            'conditions' => 'task_id = :t:',
            'bind' => ['t' => $this->taskId],
        ])->delete();
        UserTaskProgress::find([
            'conditions' => 'task_id = :t:',
            'bind' => ['t' => $this->taskId],
        ])->delete();
        UserStageProgress::find([
            'conditions' => 'task_stage_id IN ({ids:array})',
            'bind' => ['ids' => [$this->stageId1, $this->stageId2]],
        ])->delete();
        Task::findFirst($this->taskId)?->delete();
        Group::findFirst($this->groupId)?->delete();
        parent::tearDown();
    }

    public function testStartCreatesInProgressTaskAndPointsAtFirstStage(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/start");

        $this->assertSame(200, $response['status']);
        $tp = $response['body']['taskProgress'];
        $this->assertSame('in_progress', $tp['status']);
        $this->assertSame($this->stageId1, $tp['currentStageId']);
        $this->assertNotNull($tp['startedAt']);
    }

    public function testStartTwiceWhileInProgressReturns422(): void
    {
        $this->loginAsPlayer();
        $this->request('POST', "/api/player/tasks/{$this->taskId}/start");

        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/start");

        $this->assertSame(422, $response['status']);
    }

    public function testInterruptThenResumeRestoresInProgress(): void
    {
        $this->loginAsPlayer();
        $this->request('POST', "/api/player/tasks/{$this->taskId}/start");

        $interrupted = $this->request('POST', "/api/player/tasks/{$this->taskId}/interrupt");
        $this->assertSame(200, $interrupted['status']);
        $this->assertSame('interrupted', $interrupted['body']['taskProgress']['status']);
        $this->assertNotNull($interrupted['body']['taskProgress']['interruptedAt']);

        $resumed = $this->request('POST', "/api/player/tasks/{$this->taskId}/resume");
        $this->assertSame(200, $resumed['status']);
        $this->assertSame('in_progress', $resumed['body']['taskProgress']['status']);
        $this->assertNull($resumed['body']['taskProgress']['interruptedAt']);
    }

    public function testInterruptFailsWhenNoProgressExists(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/interrupt");
        $this->assertSame(404, $response['status']);
    }

    public function testCompleteStageAdvancesAndFinalizesTask(): void
    {
        $this->loginAsPlayer();
        $this->request('POST', "/api/player/tasks/{$this->taskId}/start");

        $first = $this->request('POST', "/api/player/tasks/{$this->taskId}/stages/{$this->stageId1}/complete", [
            'attemptsTotal'   => 2,
            'errorsTotal'     => 1,
            'wrongMoves'      => [['ply' => 1, 'move' => 'e5']],
            'thinkingTimeMs'  => 1500,
            'moveTimesMs'     => [400, 600, 500],
            'firstErrorAtPly' => 1,
        ]);

        $this->assertSame(200, $first['status']);
        $this->assertSame('completed', $first['body']['stageProgress']['status']);
        $this->assertSame(1, $first['body']['stageProgress']['firstErrorAtPly']);
        $this->assertSame(600, $first['body']['stageProgress']['longestMoveTimeMs']);
        $this->assertSame('in_progress', $first['body']['taskProgress']['status']);
        $this->assertSame($this->stageId2, $first['body']['taskProgress']['currentStageId']);

        $second = $this->request('POST', "/api/player/tasks/{$this->taskId}/stages/{$this->stageId2}/complete", [
            'attemptsTotal'  => 1,
            'errorsTotal'    => 0,
            'thinkingTimeMs' => 800,
        ]);

        $this->assertSame(200, $second['status']);
        $this->assertSame('completed', $second['body']['taskProgress']['status']);
        $this->assertNull($second['body']['taskProgress']['currentStageId']);
        $this->assertNotNull($second['body']['taskProgress']['completedAt']);
        $this->assertSame(3, $second['body']['taskProgress']['attemptsTotal']);
        $this->assertSame(1, $second['body']['taskProgress']['errorsTotal']);
        $this->assertSame(2300, $second['body']['taskProgress']['totalTimeMs']);
    }

    public function testArchiveRequiresCompleted(): void
    {
        $this->loginAsPlayer();
        $this->request('POST', "/api/player/tasks/{$this->taskId}/start");

        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/archive");
        $this->assertSame(422, $response['status']);
    }

    public function testArchiveSucceedsAfterCompletion(): void
    {
        $this->loginAsPlayer();
        $this->request('POST', "/api/player/tasks/{$this->taskId}/start");
        $this->request('POST', "/api/player/tasks/{$this->taskId}/stages/{$this->stageId1}/complete", ['thinkingTimeMs' => 100]);
        $this->request('POST', "/api/player/tasks/{$this->taskId}/stages/{$this->stageId2}/complete", ['thinkingTimeMs' => 100]);

        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/archive");
        $this->assertSame(200, $response['status']);
        $this->assertSame('archived', $response['body']['taskProgress']['status']);
        $this->assertNotNull($response['body']['taskProgress']['archivedAt']);
    }

    public function testResetClearsTaskAndStageProgress(): void
    {
        $this->loginAsPlayer();
        $this->request('POST', "/api/player/tasks/{$this->taskId}/start");
        $this->request('POST', "/api/player/tasks/{$this->taskId}/stages/{$this->stageId1}/complete", [
            'attemptsTotal' => 3,
            'errorsTotal'   => 1,
            'thinkingTimeMs' => 500,
        ]);

        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/reset");
        $this->assertSame(200, $response['status']);

        $tp = UserTaskProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_id = :t:',
            'bind' => ['u' => self::PLAYER_ID, 't' => $this->taskId],
        ]);
        $this->assertNotNull($tp);
        $this->assertSame('new', $tp->status);
        $this->assertNull($tp->current_stage_id);
        $this->assertSame(0, (int) $tp->attempts_total);

        $sp = UserTaskStageProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_stage_id = :s:',
            'bind' => ['u' => self::PLAYER_ID, 's' => $this->stageId1],
        ]);
        $this->assertNotNull($sp);
        $this->assertSame('new', $sp->status);
        $this->assertSame(0, (int) $sp->attempts_total);
    }

    public function testRepetitionToggleSetsAndClearsTimestamp(): void
    {
        $this->loginAsPlayer();

        $enable = $this->request('POST', "/api/player/stages/{$this->stageId1}/repetition", ['enabled' => true]);
        $this->assertSame(200, $enable['status']);
        $this->assertTrue($enable['body']['stageProgress']['inRepetition']);
        $this->assertNotNull($enable['body']['stageProgress']['addedToRepetitionAt']);

        $disable = $this->request('POST', "/api/player/stages/{$this->stageId1}/repetition", ['enabled' => false]);
        $this->assertSame(200, $disable['status']);
        $this->assertFalse($disable['body']['stageProgress']['inRepetition']);
        $this->assertNull($disable['body']['stageProgress']['addedToRepetitionAt']);
    }

    public function testRepetitionRequiresBooleanField(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('POST', "/api/player/stages/{$this->stageId1}/repetition", ['enabled' => 'yes']);
        $this->assertSame(400, $response['status']);
    }

    public function testCoachIsForbiddenFromStartingTask(): void
    {
        $this->loginAsCoach();
        $response = $this->request('POST', "/api/player/tasks/{$this->taskId}/start");
        $this->assertSame(403, $response['status']);
    }

    public function testPlayerWithoutAccessIsForbidden(): void
    {
        $otherGroup = new Group();
        $otherGroup->name = 'No-access group ' . bin2hex(random_bytes(3));
        $otherGroup->coach_id = self::COACH_ID;
        $otherGroup->is_individual = true;
        $this->assertSavedOk($otherGroup);

        $otherTask = new Task();
        $otherTask->title = 'No-access task';
        $otherTask->coach_id = self::COACH_ID;
        $otherTask->group_id = (int) $otherGroup->id;
        $otherTask->status = 'published';
        $this->assertSavedOk($otherTask);

        $otherTg = new TaskGroup();
        $otherTg->task_id = (int) $otherTask->id;
        $otherTg->group_id = (int) $otherGroup->id;
        $this->assertSavedOk($otherTg);

        $this->loginAsPlayer();
        $response = $this->request('POST', "/api/player/tasks/{$otherTask->id}/start");

        $otherTask->delete();
        $otherGroup->delete();

        $this->assertSame(403, $response['status']);
    }

    private function createStage(int $sortOrder): int
    {
        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->position_id = $this->positionId;
        $stage->title = 'Stage ' . $sortOrder;
        $stage->sort_order = $sortOrder;
        $stage->status = 'published';
        $stage->solution_pgn = '1. e4 e5';
        $this->assertSavedOk($stage);
        return (int) $stage->id;
    }
}
