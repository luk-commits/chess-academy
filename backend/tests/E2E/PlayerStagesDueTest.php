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
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Models\UserTaskProgress;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class PlayerStagesDueTest extends TestCase
{
    private const COACH_EMAIL = 'coach@chess.local';
    private const COACH_PASSWORD = 'password123';
    private const COACH_ID = 3;
    private const PLAYER_EMAIL = 'player@chess.local';
    private const PLAYER_PASSWORD = 'password123';
    private const PLAYER_ID = 4;

    private string $baseUrl;
    private string $cookieJar;
    private int $taskId;
    private int $groupId;
    private int $newStageId;
    private int $dueStageId;
    private int $futureStageId;
    private int $positionId;

    protected function setUp(): void
    {
        $this->baseUrl = rtrim(getenv('API_BASE_URL') ?: 'http://web', '/');
        $this->cookieJar = tempnam(sys_get_temp_dir(), 'cj_');

        $existingPosition = Position::findFirst();
        $this->assertNotNull($existingPosition, 'Test requires at least one position in DB');
        $this->positionId = (int) $existingPosition->id;

        $group = new Group();
        $group->name = 'Due test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertTrue($group->save(), $this->modelErrors($group));
        $this->groupId = (int) $group->id;

        $member = new GroupPlayers();
        $member->group_id = $this->groupId;
        $member->player_id = self::PLAYER_ID;
        $this->assertTrue($member->save(), $this->modelErrors($member));

        $task = new Task();
        $task->title = 'Due test task';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'published';
        $this->assertTrue($task->save(), $this->modelErrors($task));
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertTrue($tg->save(), $this->modelErrors($tg));

        $this->newStageId = $this->createStage('New stage', 0);
        $this->dueStageId = $this->createStage('Due stage', 1);
        $this->futureStageId = $this->createStage('Future stage', 2);

        $duePast = (new DateTimeImmutable('-2 days'))->format('c');
        $futurePast = (new DateTimeImmutable('+5 days'))->format('c');

        $this->seedProgress($this->dueStageId, $duePast);
        $this->seedProgress($this->futureStageId, $futurePast);

        // Mark all three stages for repetition so they're eligible for due
        foreach ([$this->newStageId, $this->dueStageId, $this->futureStageId] as $sid) {
            $sp = new UserTaskStageProgress();
            $sp->user_id = self::PLAYER_ID;
            $sp->task_id = $this->taskId;
            $sp->task_stage_id = $sid;
            $sp->in_repetition = true;
            $this->assertTrue($sp->save(), $this->modelErrors($sp));
        }

        // Mark task as started (not archived) for due eligibility
        $tp = new UserTaskProgress();
        $tp->user_id = self::PLAYER_ID;
        $tp->task_id = $this->taskId;
        $tp->status = 'in_progress';
        $this->assertTrue($tp->save(), $this->modelErrors($tp));
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
        $task = Task::findFirst($this->taskId);
        if ($task !== null) {
            $task->delete();
        }
        $group = Group::findFirst($this->groupId);
        if ($group !== null) {
            $group->delete();
        }
        if (is_file($this->cookieJar)) {
            unlink($this->cookieJar);
        }
    }

    public function testReturnsNewAndOverdueStagesButSkipsFutureOnes(): void
    {
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);
        $response = $this->request('GET', '/api/player/stages/due');

        $this->assertSame(200, $response['status']);
        $this->assertArrayHasKey('stages', $response['body']);

        $stageIdsInResponse = array_map(static fn (array $s): int => (int) $s['id'], $response['body']['stages']);
        $this->assertContains($this->newStageId, $stageIdsInResponse);
        $this->assertContains($this->dueStageId, $stageIdsInResponse);
        $this->assertNotContains($this->futureStageId, $stageIdsInResponse);
    }

    public function testNewStagesSortedBeforeOverdueOnes(): void
    {
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);
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
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);
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
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
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
        $this->assertTrue($stage->save(), $this->modelErrors($stage));
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
        $this->assertTrue($progress->save(), $this->modelErrors($progress));
    }

    private function loginAs(string $email, string $password): void
    {
        if (is_file($this->cookieJar)) {
            file_put_contents($this->cookieJar, '');
        }
        $login = $this->request('POST', '/api/login', ['email' => $email, 'password' => $password]);
        $this->assertSame(200, $login['status'], 'login failed: ' . json_encode($login['body']));
    }

    private function request(string $method, string $path, ?array $data = null): array
    {
        $ch = curl_init($this->baseUrl . $path);
        $jsonBody = $data !== null ? json_encode($data, JSON_THROW_ON_ERROR) : null;

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_COOKIEJAR => $this->cookieJar,
            CURLOPT_COOKIEFILE => $this->cookieJar,
        ]);

        if ($jsonBody !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
        }

        $raw = curl_exec($ch);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = $raw !== false ? substr((string) $raw, $headerSize) : '';
        curl_close($ch);

        return [
            'status' => $statusCode,
            'body' => json_decode($body, true) ?? [],
        ];
    }

    private function modelErrors(\Phalcon\Mvc\ModelInterface $m): string
    {
        return implode('; ', array_map(static fn ($msg) => (string) $msg->getMessage(), $m->getMessages()));
    }
}
