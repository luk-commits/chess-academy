<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\Position;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Tests\Support\HttpTestCase;

final class CoachStageEditTest extends HttpTestCase
{
    private int $taskId;
    private int $stageId;
    private int $groupId;

    protected function setUp(): void
    {
        parent::setUp();

        $group = new Group();
        $group->name = 'Coach edit test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertSavedOk($group);
        $this->groupId = (int) $group->id;

        $task = new Task();
        $task->title = 'Coach edit task';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'draft';
        $this->assertSavedOk($task);
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertSavedOk($tg);

        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->title = 'Stage 1';
        $stage->sort_order = 0;
        $stage->status = 'draft';
        $this->assertSavedOk($stage);
        $this->stageId = (int) $stage->id;
    }

    protected function tearDown(): void
    {
        Task::findFirst($this->taskId)?->delete();
        Group::findFirst($this->groupId)?->delete();
        parent::tearDown();
    }

    public function testCoachCanSaveSolutionPgn(): void
    {
        $this->loginAsCoach();

        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => '1. e4 e5 2. Nf3 Nc6',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertSame('1. e4 e5 2. Nf3 Nc6', $response['body']['stage']['solutionPgn']);

        $stage = TaskStage::findFirst($this->stageId);
        $this->assertSame('1. e4 e5 2. Nf3 Nc6', $stage->solution_pgn);
    }

    public function testEmptyPgnClearsField(): void
    {
        $stage = TaskStage::findFirst($this->stageId);
        $stage->solution_pgn = '1. e4';
        $stage->save();

        $this->loginAsCoach();
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => '',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertNull($response['body']['stage']['solutionPgn']);
    }

    public function testCannotPublishStageWithoutPgn(): void
    {
        $this->loginAsCoach();
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'status' => 'published',
        ]);

        $this->assertSame(422, $response['status']);
    }

    public function testCanPublishStageWithPgn(): void
    {
        $this->loginAsCoach();
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => '1. e4 e5',
            'status'      => 'published',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertSame('published', $response['body']['stage']['status']);
    }

    public function testPlayerCannotEditStage(): void
    {
        $this->loginAsPlayer();
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => 'hack',
        ]);

        $this->assertSame(403, $response['status']);
    }

    public function testCoachCannotEditAnotherCoachsStage(): void
    {
        $otherStage = new TaskStage();
        $otherStage->task_id = $this->taskId;
        $otherStage->title = 'tmp';
        $otherStage->sort_order = 1;
        $otherStage->status = 'draft';
        $this->assertTrue($otherStage->save());

        $otherGroup = new Group();
        $otherGroup->name = 'Other coach group ' . bin2hex(random_bytes(3));
        $otherGroup->coach_id = 1;
        $otherGroup->is_individual = true;
        $this->assertSavedOk($otherGroup);

        $otherTask = new Task();
        $otherTask->title = 'Other coach task';
        $otherTask->coach_id = 1;
        $otherTask->status = 'draft';
        $otherTask->group_id = (int) $otherGroup->id;
        $this->assertTrue($otherTask->save());

        $otherStage->task_id = (int) $otherTask->id;
        $this->assertTrue($otherStage->save());

        $this->loginAsCoach();
        $response = $this->request('PATCH', "/api/coach/stages/{$otherStage->id}", [
            'solutionPgn' => '1. e4',
        ]);

        $otherTask->delete();

        $this->assertSame(404, $response['status']);
    }

    public function testCoachListsTheirOwnTasks(): void
    {
        $this->loginAsCoach();
        $response = $this->request('GET', '/api/coach/tasks');

        $this->assertSame(200, $response['status']);
        $ids = array_map(static fn (array $t): int => (int) $t['id'], $response['body']['tasks']);
        $this->assertContains($this->taskId, $ids);

        $ours = null;
        foreach ($response['body']['tasks'] as $t) {
            if ((int) $t['id'] === $this->taskId) {
                $ours = $t;
                break;
            }
        }
        $this->assertNotNull($ours);
        $this->assertSame('draft', $ours['status']);
        $this->assertCount(1, $ours['stages']);
        $this->assertFalse($ours['stages'][0]['hasSolutionPgn']);
    }

    public function testCoachCanPublishOwnTask(): void
    {
        $this->loginAsCoach();
        $response = $this->request('PATCH', "/api/coach/tasks/{$this->taskId}", [
            'status' => 'published',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertSame('published', $response['body']['task']['status']);
    }

    public function testCoachCanCreateTaskWithBoundaryLengths(): void
    {
        $position = Position::findFirst();
        $this->assertNotNull($position, 'Test requires at least one position in DB');

        $this->loginAsCoach();
        $response = $this->request('POST', '/api/coach/tasks', [
            'positionIds'  => [(int) $position->id],
            'groupIds'     => [$this->groupId],
            'title'        => str_repeat('T', 200),
            'description'  => str_repeat('D', 10000),
            'openingName'  => str_repeat('O', 200),
            'publishDefault' => false,
        ]);

        $this->assertSame(201, $response['status']);
        $this->assertSame(200, mb_strlen((string) $response['body']['task']['title']));
        $this->assertSame(10000, mb_strlen((string) $response['body']['task']['description']));
    }

    public function testCreateTaskRejectsNonArrayPositionIds(): void
    {
        $this->loginAsCoach();
        $response = $this->request('POST', '/api/coach/tasks', [
            'positionIds' => 1,
            'groupIds' => [$this->groupId],
        ]);

        $this->assertSame(422, $response['status']);
        $this->assertSame('positionIds musi być tablicą', $response['body']['error']);
    }

    public function testCreateTaskRejectsTooManyPositionIds(): void
    {
        $position = Position::findFirst();
        $this->assertNotNull($position, 'Test requires at least one position in DB');

        $this->loginAsCoach();
        $response = $this->request('POST', '/api/coach/tasks', [
            'positionIds' => array_fill(0, 201, (int) $position->id),
            'groupIds' => [$this->groupId],
        ]);

        $this->assertSame(422, $response['status']);
        $this->assertSame('Maksymalna liczba pozycji to 200', $response['body']['error']);
    }

    public function testCreateTaskRejectsInvalidGroupIdValue(): void
    {
        $position = Position::findFirst();
        $this->assertNotNull($position, 'Test requires at least one position in DB');

        $this->loginAsCoach();
        $response = $this->request('POST', '/api/coach/tasks', [
            'positionIds' => [(int) $position->id],
            'groupIds' => [0],
        ]);

        $this->assertSame(422, $response['status']);
        $this->assertSame('groupIds zawiera nieprawidłową wartość', $response['body']['error']);
    }

    public function testTaskUpdateRejectsTooLongTitleAndDescription(): void
    {
        $this->loginAsCoach();

        $titleResponse = $this->request('PATCH', "/api/coach/tasks/{$this->taskId}", [
            'title' => str_repeat('T', 201),
        ]);
        $this->assertSame(422, $titleResponse['status']);
        $this->assertSame('Tytuł zadania jest za długi', $titleResponse['body']['error']);

        $descriptionResponse = $this->request('PATCH', "/api/coach/tasks/{$this->taskId}", [
            'description' => str_repeat('D', 10001),
        ]);
        $this->assertSame(422, $descriptionResponse['status']);
        $this->assertSame('Opis zadania jest za długi', $descriptionResponse['body']['error']);
    }

    public function testStageUpdateRejectsTooLongTitleAndPgn(): void
    {
        $this->loginAsCoach();

        $titleResponse = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'title' => str_repeat('T', 201),
        ]);
        $this->assertSame(422, $titleResponse['status']);
        $this->assertSame('Tytuł etapu jest za długi', $titleResponse['body']['error']);

        $pgnResponse = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => str_repeat('p', 65537),
        ]);
        $this->assertSame(422, $pgnResponse['status']);
        $this->assertSame('Rozwiązanie PGN jest za długie', $pgnResponse['body']['error']);
    }
}
