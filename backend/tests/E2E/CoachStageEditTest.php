<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use PHPUnit\Framework\TestCase;

final class CoachStageEditTest extends TestCase
{
    private const COACH_EMAIL = 'coach@chess.local';
    private const COACH_PASSWORD = 'password123';
    private const COACH_ID = 3;
    private const PLAYER_EMAIL = 'player@chess.local';
    private const PLAYER_PASSWORD = 'password123';

    private string $baseUrl;
    private string $cookieJar;
    private int $taskId;
    private int $stageId;
    private int $groupId;

    protected function setUp(): void
    {
        $this->baseUrl = rtrim(getenv('API_BASE_URL') ?: 'http://web', '/');
        $this->cookieJar = tempnam(sys_get_temp_dir(), 'cj_');

        $group = new Group();
        $group->name = 'Coach edit test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertTrue($group->save(), $this->errors($group));
        $this->groupId = (int) $group->id;

        $task = new Task();
        $task->title = 'Coach edit task';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'draft';
        $this->assertTrue($task->save(), $this->errors($task));
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertTrue($tg->save(), $this->errors($tg));

        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->title = 'Stage 1';
        $stage->sort_order = 0;
        $stage->status = 'draft';
        $this->assertTrue($stage->save(), $this->errors($stage));
        $this->stageId = (int) $stage->id;
    }

    protected function tearDown(): void
    {
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

    public function testCoachCanSaveSolutionPgn(): void
    {
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);

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

        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => '',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertNull($response['body']['stage']['solutionPgn']);
    }

    public function testCannotPublishStageWithoutPgn(): void
    {
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'status' => 'published',
        ]);

        $this->assertSame(422, $response['status']);
    }

    public function testCanPublishStageWithPgn(): void
    {
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
        $response = $this->request('PATCH', "/api/coach/stages/{$this->stageId}", [
            'solutionPgn' => '1. e4 e5',
            'status' => 'published',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertSame('published', $response['body']['stage']['status']);
    }

    public function testPlayerCannotEditStage(): void
    {
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);
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

        $otherTask = new Task();
        $otherTask->title = 'Other coach task';
        $otherTask->coach_id = 1;
        $otherTask->status = 'draft';
        $this->assertTrue($otherTask->save());

        $otherStage->task_id = (int) $otherTask->id;
        $this->assertTrue($otherStage->save());

        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
        $response = $this->request('PATCH', "/api/coach/stages/{$otherStage->id}", [
            'solutionPgn' => '1. e4',
        ]);

        $otherTask->delete();

        $this->assertSame(404, $response['status']);
    }

    public function testCoachListsTheirOwnTasks(): void
    {
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
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
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
        $response = $this->request('PATCH', "/api/coach/tasks/{$this->taskId}", [
            'status' => 'published',
        ]);

        $this->assertSame(200, $response['status']);
        $this->assertSame('published', $response['body']['task']['status']);
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

    private function errors(\Phalcon\Mvc\ModelInterface $m): string
    {
        return implode('; ', array_map(static fn ($msg) => (string) $msg->getMessage(), $m->getMessages()));
    }
}
