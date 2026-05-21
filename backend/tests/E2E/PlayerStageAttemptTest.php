<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Tests\Support\HttpTestCase;

final class PlayerStageAttemptTest extends HttpTestCase
{
    private int $taskId;
    private int $stageId;
    private int $groupId;

    protected function setUp(): void
    {
        parent::setUp();

        $group = new Group();
        $group->name = 'SR test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertSavedOk($group);
        $this->groupId = (int) $group->id;

        $member = new GroupPlayers();
        $member->group_id = $this->groupId;
        $member->player_id = self::PLAYER_ID;
        $this->assertSavedOk($member);

        $task = new Task();
        $task->title = 'SR endpoint task';
        $task->description = 'e2e fixture';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'published';
        $this->assertSavedOk($task);
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertSavedOk($tg);

        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->title = 'SR endpoint stage';
        $stage->sort_order = 0;
        $stage->status = 'published';
        $this->assertSavedOk($stage);
        $this->stageId = (int) $stage->id;

        $stageProgress = new UserTaskStageProgress();
        $stageProgress->user_id = self::PLAYER_ID;
        $stageProgress->task_id = $this->taskId;
        $stageProgress->task_stage_id = $this->stageId;
        $stageProgress->in_repetition = true;
        $this->assertSavedOk($stageProgress);
    }

    protected function tearDown(): void
    {
        Task::findFirst($this->taskId)?->delete();
        Group::findFirst($this->groupId)?->delete();
        parent::tearDown();
    }

    public function testPlayerCanSubmitPassAndProgressIsPersisted(): void
    {
        $this->loginAsPlayer();

        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);

        $this->assertSame(200, $response['status']);
        $this->assertArrayHasKey('progress', $response['body']);
        $progress = $response['body']['progress'];
        $this->assertSame($this->stageId, $progress['stageId']);
        $this->assertSame(1, $progress['repetitions']);
        $this->assertSame(1, $progress['intervalDays']);
        $this->assertSame('pass', $progress['lastResult']);
        $this->assertSame(1, $progress['attemptsTotal']);

        $row = UserStageProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_stage_id = :s:',
            'bind' => ['u' => self::PLAYER_ID, 's' => $this->stageId],
        ]);
        $this->assertNotNull($row);
        $this->assertSame(1, (int) $row->repetitions);
    }

    public function testCoachIsForbiddenFromSubmittingAttempt(): void
    {
        $this->loginAsCoach();

        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);

        $this->assertSame(403, $response['status']);
    }

    public function testDraftStageReturns404ToPlayer(): void
    {
        $stage = TaskStage::findFirst($this->stageId);
        $stage->status = 'draft';
        $this->assertSavedOk($stage);

        $this->loginAsPlayer();
        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);

        $this->assertSame(404, $response['status']);
    }

    public function testMissingPassedFieldReturns400(): void
    {
        $this->loginAsPlayer();

        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['something' => 'else']);

        $this->assertSame(400, $response['status']);
    }

    public function testUnauthenticatedRequestReturns401(): void
    {
        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);
        $this->assertSame(401, $response['status']);
    }
}
