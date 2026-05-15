<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\UserStageProgress;
use PHPUnit\Framework\TestCase;

final class PlayerStageAttemptTest extends TestCase
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
    private int $stageId;
    private int $groupId;

    protected function setUp(): void
    {
        $this->baseUrl = rtrim(getenv('API_BASE_URL') ?: 'http://web', '/');
        $this->cookieJar = tempnam(sys_get_temp_dir(), 'cj_');

        $group = new Group();
        $group->name = 'SR test group ' . bin2hex(random_bytes(3));
        $group->coach_id = self::COACH_ID;
        $group->is_individual = true;
        $this->assertTrue($group->save(), $this->modelErrors($group));
        $this->groupId = (int) $group->id;

        $member = new GroupPlayers();
        $member->group_id = $this->groupId;
        $member->player_id = self::PLAYER_ID;
        $this->assertTrue($member->save(), $this->modelErrors($member));

        $task = new Task();
        $task->title = 'SR endpoint task';
        $task->description = 'e2e fixture';
        $task->coach_id = self::COACH_ID;
        $task->group_id = $this->groupId;
        $task->status = 'published';
        $this->assertTrue($task->save(), $this->modelErrors($task));
        $this->taskId = (int) $task->id;

        $tg = new TaskGroup();
        $tg->task_id = $this->taskId;
        $tg->group_id = $this->groupId;
        $this->assertTrue($tg->save(), $this->modelErrors($tg));

        $stage = new TaskStage();
        $stage->task_id = $this->taskId;
        $stage->title = 'SR endpoint stage';
        $stage->sort_order = 0;
        $stage->status = 'published';
        $this->assertTrue($stage->save(), $this->modelErrors($stage));
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

    public function testPlayerCanSubmitPassAndProgressIsPersisted(): void
    {
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);

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
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);

        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);

        $this->assertSame(403, $response['status']);
    }

    public function testDraftStageReturns404ToPlayer(): void
    {
        $stage = TaskStage::findFirst($this->stageId);
        $stage->status = 'draft';
        $this->assertTrue($stage->save(), $this->modelErrors($stage));

        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);
        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);

        $this->assertSame(404, $response['status']);
    }

    public function testMissingPassedFieldReturns400(): void
    {
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);

        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['something' => 'else']);

        $this->assertSame(400, $response['status']);
    }

    public function testUnauthenticatedRequestReturns401(): void
    {
        $response = $this->request('POST', "/api/player/stages/{$this->stageId}/attempt", ['passed' => true]);
        $this->assertSame(401, $response['status']);
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
