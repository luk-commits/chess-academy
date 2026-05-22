<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\Position;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Services\TaskTitleGeneratorService;
use Phalcon\Http\Response;

class TasksController extends AbstractController
{
    private const TASK_STATUSES = ['draft', 'published', 'archived'];
    private const MAX_TITLE_LENGTH = 200;
    private const MAX_DESCRIPTION_LENGTH = 10000;
    private const MAX_OPENING_NAME_LENGTH = 200;
    private const MAX_POSITION_IDS = 200;
    private const MAX_GROUP_IDS = 100;

    public function createAction(): Response
    {
        if ($err = $this->requireRole('COACH')) return $err;

        $coachId = $this->authUserId();
        $payload = $this->jsonInput();

        if (!is_array($payload['positionIds'] ?? null)) {
            return $this->error('positionIds musi być tablicą', 422);
        }
        if (!is_array($payload['groupIds'] ?? null)) {
            return $this->error('groupIds musi być tablicą', 422);
        }

        $positionIds = $payload['positionIds'] ?? [];
        $groupIds = $payload['groupIds'] ?? [];
        $title = trim((string) ($payload['title'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $openingName = trim((string) ($payload['openingName'] ?? ''));
        $status = ((bool) ($payload['publishDefault'] ?? false)) ? 'published' : 'draft';

        if (mb_strlen($title) > self::MAX_TITLE_LENGTH) {
            return $this->error('Tytuł zadania jest za długi', 422);
        }
        if (mb_strlen($description) > self::MAX_DESCRIPTION_LENGTH) {
            return $this->error('Opis zadania jest za długi', 422);
        }
        if (mb_strlen($openingName) > self::MAX_OPENING_NAME_LENGTH) {
            return $this->error('Nazwa debiutu jest za długa', 422);
        }

        if (count($positionIds) > self::MAX_POSITION_IDS) {
            return $this->error('Maksymalna liczba pozycji to 200', 422);
        }
        if (count($groupIds) > self::MAX_GROUP_IDS) {
            return $this->error('Maksymalna liczba grup to 100', 422);
        }

        foreach ($positionIds as $positionId) {
            if (!is_numeric($positionId) || (int) $positionId <= 0) {
                return $this->error('positionIds zawiera nieprawidłową wartość', 422);
            }
        }
        foreach ($groupIds as $groupId) {
            if (!is_numeric($groupId) || (int) $groupId <= 0) {
                return $this->error('groupIds zawiera nieprawidłową wartość', 422);
            }
        }

        if (empty($positionIds)) return $this->error('Wybierz przynajmniej jedna pozycje', 422);
        if (empty($groupIds))    return $this->error('Wybierz przynajmniej jedna grupe', 422);

        $groups = Group::find([
            'conditions' => 'id IN ({ids:array}) AND coach_id = :coachId:',
            'bind' => ['ids' => $groupIds, 'coachId' => $coachId],
        ]);
        if (count($groups) !== count($groupIds)) {
            return $this->error('Jedna lub wiecej grup jest nieprawidlowa', 422);
        }

        if ($title === '') {
            $title = $this->generateTitle($positionIds, $openingName);
        }

        return $this->createSingleTask($title, $description, $coachId, $positionIds, $groupIds, $status);
    }

    public function indexAction(): Response
    {
        if ($err = $this->requireRole('COACH')) return $err;

        $tasks = Task::find([
            'conditions' => 'coach_id = :coachId:',
            'bind'       => ['coachId' => $this->authUserId()],
            'order'      => 'created_at DESC',
        ]);

        if (count($tasks) === 0) return $this->json(['tasks' => []]);

        $taskIds = [];
        foreach ($tasks as $task) $taskIds[] = (int) $task->id;

        $stagesByTask = [];
        foreach (TaskStage::find([
            'conditions' => 'task_id IN ({taskIds:array})',
            'bind'       => ['taskIds' => $taskIds],
            'order'      => 'task_id ASC, sort_order ASC',
        ]) as $stage) {
            $tid = (int) $stage->task_id;
            $stagesByTask[$tid] ??= [];
            $stagesByTask[$tid][] = [
                'id'             => (int) $stage->id,
                'title'          => (string) $stage->title,
                'sortOrder'      => (int) $stage->sort_order,
                'status'         => (string) $stage->status,
                'positionId'     => $stage->position_id !== null ? (int) $stage->position_id : null,
                'hasSolutionPgn' => is_string($stage->solution_pgn) && $stage->solution_pgn !== '',
            ];
        }

        $groupIdsByTask = [];
        foreach (TaskGroup::find([
            'conditions' => 'task_id IN ({taskIds:array})',
            'bind'       => ['taskIds' => $taskIds],
        ]) as $tg) {
            $tid = (int) $tg->task_id;
            $groupIdsByTask[$tid] ??= [];
            $groupIdsByTask[$tid][] = (int) $tg->group_id;
        }

        $result = [];
        foreach ($tasks as $task) {
            $tid = (int) $task->id;
            $result[] = [
                'id'          => $tid,
                'title'       => (string) $task->title,
                'description' => (string) $task->description,
                'status'      => (string) $task->status,
                'stages'      => $stagesByTask[$tid] ?? [],
                'groupIds'    => $groupIdsByTask[$tid] ?? [],
            ];
        }

        return $this->json(['tasks' => $result]);
    }

    public function updateAction(): Response
    {
        if ($err = $this->requireRole('COACH')) return $err;

        $taskId = $this->positiveIntParam('id', 'Invalid task id');
        if ($taskId instanceof Response) return $taskId;

        $task = Task::findFirst($taskId);
        if ($task === null || (int) $task->coach_id !== $this->authUserId()) {
            return $this->error('Task not found', 404);
        }

        $payload = $this->jsonInput();

        if (array_key_exists('title', $payload)) {
            $task->title = trim((string) $payload['title']);
            if ($task->title === '') return $this->error('Tytuł nie może być pusty', 422);
            if (mb_strlen($task->title) > self::MAX_TITLE_LENGTH) {
                return $this->error('Tytuł zadania jest za długi', 422);
            }
        }

        if (array_key_exists('description', $payload)) {
            $description = (string) $payload['description'];
            if (mb_strlen($description) > self::MAX_DESCRIPTION_LENGTH) {
                return $this->error('Opis zadania jest za długi', 422);
            }
            $task->description = $description;
        }

        if (array_key_exists('status', $payload)) {
            $status = (string) $payload['status'];
            if (!in_array($status, self::TASK_STATUSES, true)) {
                return $this->error('Nieprawidłowy status zadania', 422);
            }
            $task->status = $status;
        }

        if ($task->save() === false) {
            return $this->error($this->modelErrors($task), 422);
        }

        return $this->json([
            'task' => [
                'id'          => (int) $task->id,
                'title'       => (string) $task->title,
                'description' => (string) $task->description,
                'status'      => (string) $task->status,
            ],
        ]);
    }

    private function createSingleTask(
        string $title,
        string $description,
        int $coachId,
        array $positionIds,
        array $groupIds,
        string $status
    ): Response {
        $task = new Task();
        $task->title = $title;
        $task->description = $description;
        $task->coach_id = $coachId;
        $task->status = $status;
        $task->group_id = (int) $groupIds[0];

        if ($task->save() === false) {
            return $this->error($this->modelErrors($task), 422);
        }

        foreach ($groupIds as $groupId) {
            $tg = new TaskGroup();
            $tg->task_id = $task->id;
            $tg->group_id = (int) $groupId;
            if ($tg->save() === false) {
                $task->delete();
                return $this->error('Nie udalo sie przypisac grupy do zadania', 422);
            }
        }

        $stageData = [];
        foreach ($positionIds as $i => $positionId) {
            $stage = new TaskStage();
            $stage->task_id = $task->id;
            $stage->title = 'Pozycja ' . ($i + 1);
            $stage->sort_order = $i;
            $stage->position_id = (int) $positionId;
            $stage->status = $status;

            if ($stage->save() === false) {
                $task->delete();
                return $this->error($this->modelErrors($stage), 422);
            }

            $stageData[] = [
                'id'         => (int) $stage->id,
                'title'      => $stage->title,
                'sortOrder'  => (int) $stage->sort_order,
                'positionId' => (int) $positionId,
            ];
        }

        return $this->json([
            'task' => [
                'id'          => (int) $task->id,
                'title'       => $task->title,
                'description' => $task->description,
                'status'      => $task->status,
                'stages'      => $stageData,
                'groupIds'    => $groupIds,
            ],
        ], 201);
    }

    private function generateTitle(array $positionIds, string $openingName): string
    {
        $positionDataMap = [];
        foreach (Position::find([
            'conditions' => 'id IN ({ids:array})',
            'bind' => ['ids' => $positionIds],
        ]) as $pos) {
            $positionDataMap[(int) $pos->id] = [
                'fen'       => $pos->fen ?? '',
                'opening'   => $pos->opening ?? '',
                'themeTags' => $pos->theme_tags ? (json_decode($pos->theme_tags, true) ?? []) : [],
            ];
        }

        $generated = (new TaskTitleGeneratorService())->generateTaskTitle(array_values($positionDataMap), $openingName);
        return $generated !== '' ? $generated : 'Zadanie z pozycjami';
    }
}
