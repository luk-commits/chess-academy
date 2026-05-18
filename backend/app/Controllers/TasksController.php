<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\Position;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Services\TaskTitleGeneratorService;

class TasksController extends AbstractController
{
    private function createSingleTask(
        string $title,
        string $description,
        int $coachId,
        array $positionIds,
        array $groupIds
    ): \Phalcon\Http\Response {
        $task = new Task();
        $task->title = $title;
        $task->description = $description;
        $task->coach_id = $coachId;
        $task->status = 'published';
        $task->group_id = (int) $groupIds[0];

        if ($task->save() === false) {
            return $this->error(implode(' ', $task->getMessages()), 422);
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
            $stage->status = 'published';

            if ($stage->save() === false) {
                $task->delete();
                return $this->error(implode(' ', $stage->getMessages()), 422);
            }

            $stageData[] = [
                'id' => (int) $stage->id,
                'title' => $stage->title,
                'sortOrder' => (int) $stage->sort_order,
                'positionId' => (int) $positionId,
            ];
        }

        return $this->json([
            'task' => [
                'id' => (int) $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'stages' => $stageData,
                'groupIds' => $groupIds,
            ],
        ], 201);
    }

    private function createPublishedTasksWithLocalGenerator(
        string $description,
        int $coachId,
        array $positionIds,
        array $groupIds,
        array $positionDataMap
    ): \Phalcon\Http\Response {
        $titleGenerator = new TaskTitleGeneratorService();

        $positionList = [];
        foreach ($positionIds as $positionId) {
            if (isset($positionDataMap[$positionId])) {
                $positionList[] = $positionDataMap[$positionId];
            }
        }

        $generatedTitles = !empty($positionList)
            ? $titleGenerator->generateSeparateTitles($positionList)
            : [];

        $createdTasks = [];

        foreach ($positionIds as $i => $positionId) {
            $title = $generatedTitles[$i] ?? '';
            if ($title === '') {
                $title = 'Zadanie z pozycjami';
            }

            $task = new Task();
            $task->title = $title;
            $task->description = $description;
            $task->coach_id = $coachId;
            $task->status = 'published';
            $task->group_id = (int) $groupIds[0];

            if ($task->save() === false) {
                return $this->error(implode(' ', $task->getMessages()), 422);
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

            $stage = new TaskStage();
            $stage->task_id = $task->id;
            $stage->title = 'Pozycja';
            $stage->sort_order = 0;
            $stage->position_id = (int) $positionId;
            $stage->status = 'published';

            if ($stage->save() === false) {
                $task->delete();
                return $this->error(implode(' ', $stage->getMessages()), 422);
            }

            $createdTasks[] = [
                'id' => (int) $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'stages' => [
                    [
                        'id' => (int) $stage->id,
                        'title' => $stage->title,
                        'sortOrder' => (int) $stage->sort_order,
                        'positionId' => (int) $positionId,
                    ],
                ],
                'groupIds' => $groupIds,
            ];
        }

        return $this->json([
            'tasks' => $createdTasks,
            'task' => $createdTasks[0] ?? null,
        ], 201);
    }

    private function createPublishedTasks(
        string $title,
        string $description,
        int $coachId,
        array $positionIds,
        array $groupIds
    ): \Phalcon\Http\Response {
        $createdTasks = [];

        foreach ($positionIds as $positionId) {
            $task = new Task();
            $task->title = $title;
            $task->description = $description;
            $task->coach_id = $coachId;
            $task->status = 'published';
            $task->group_id = (int) $groupIds[0];

            if ($task->save() === false) {
                return $this->error(implode(' ', $task->getMessages()), 422);
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

            $stage = new TaskStage();
            $stage->task_id = $task->id;
            $stage->title = 'Pozycja';
            $stage->sort_order = 0;
            $stage->position_id = (int) $positionId;
            $stage->status = 'published';

            if ($stage->save() === false) {
                $task->delete();
                return $this->error(implode(' ', $stage->getMessages()), 422);
            }

            $createdTasks[] = [
                'id' => (int) $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'stages' => [
                    [
                        'id' => (int) $stage->id,
                        'title' => $stage->title,
                        'sortOrder' => (int) $stage->sort_order,
                        'positionId' => (int) $positionId,
                    ],
                ],
                'groupIds' => $groupIds,
            ];
        }

        return $this->json([
            'tasks' => $createdTasks,
            'task' => $createdTasks[0] ?? null,
        ], 201);
    }

    public function createAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $coachId = (int) $this->dispatcher->getParam('authUserId');
        $payload = $this->jsonInput();

        $positionIds = $payload['positionIds'] ?? [];
        $groupIds = $payload['groupIds'] ?? [];
        $title = trim((string) ($payload['title'] ?? ''));
        $description = trim((string) ($payload['description'] ?? ''));
        $publishDefault = (bool) ($payload['publishDefault'] ?? false);

        if (empty($positionIds)) {
            return $this->error('Wybierz przynajmniej jedna pozycje', 422);
        }

        if (empty($groupIds)) {
            return $this->error('Wybierz przynajmniej jedna grupe', 422);
        }

        $groups = Group::find([
            'conditions' => 'id IN ({ids:array}) AND coach_id = :coachId:',
            'bind' => ['ids' => $groupIds, 'coachId' => $coachId],
        ]);

        if (count($groups) !== count($groupIds)) {
            return $this->error('Jedna lub wiecej grup jest nieprawidlowa', 422);
        }

        if ($title !== '') {
            if ($publishDefault) {
                return $this->createPublishedTasks($title, $description, $coachId, $positionIds, $groupIds);
            }
            return $this->createSingleTask($title, $description, $coachId, $positionIds, $groupIds);
        }

        $positions = Position::find([
            'conditions' => 'id IN ({ids:array})',
            'bind' => ['ids' => $positionIds],
        ]);

        $positionDataMap = [];
        foreach ($positions as $pos) {
            $themeTags = $pos->theme_tags
                ? (json_decode($pos->theme_tags, true) ?? [])
                : [];
            $positionDataMap[(int) $pos->id] = [
                'fen' => $pos->fen ?? '',
                'opening' => $pos->opening ?? '',
                'themeTags' => $themeTags,
            ];
        }

        if ($publishDefault) {
            return $this->createPublishedTasksWithLocalGenerator($description, $coachId, $positionIds, $groupIds, $positionDataMap);
        }

        $titleGenerator = new TaskTitleGeneratorService();
        $generatedTitle = $titleGenerator->generateTaskTitle(array_values($positionDataMap));
        if ($generatedTitle === '') {
            $generatedTitle = 'Zadanie z pozycjami';
        }

        return $this->createSingleTask($generatedTitle, $description, $coachId, $positionIds, $groupIds);
    }

    public function indexAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $coachId = (int) $this->dispatcher->getParam('authUserId');

        $tasks = Task::find([
            'conditions' => 'coach_id = :coachId:',
            'bind'       => ['coachId' => $coachId],
            'order'      => 'created_at DESC',
        ]);

        if (count($tasks) === 0) {
            return $this->json(['tasks' => []]);
        }

        $taskIds = [];
        foreach ($tasks as $task) {
            $taskIds[] = (int) $task->id;
        }

        $stages = TaskStage::find([
            'conditions' => 'task_id IN ({taskIds:array})',
            'bind'       => ['taskIds' => $taskIds],
            'order'      => 'task_id ASC, sort_order ASC',
        ]);

        $stagesByTask = [];
        foreach ($stages as $stage) {
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

        $taskGroupRows = TaskGroup::find([
            'conditions' => 'task_id IN ({taskIds:array})',
            'bind'       => ['taskIds' => $taskIds],
        ]);
        $groupIdsByTask = [];
        foreach ($taskGroupRows as $tg) {
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

    public function updateAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $coachId = (int) $this->dispatcher->getParam('authUserId');
        $taskId = (int) $this->dispatcher->getParam('id');
        if ($taskId <= 0) {
            return $this->error('Invalid task id', 400);
        }

        $task = Task::findFirst($taskId);
        if ($task === null || (int) $task->coach_id !== $coachId) {
            return $this->error('Task not found', 404);
        }

        $payload = $this->jsonInput();

        if (array_key_exists('title', $payload)) {
            $task->title = trim((string) $payload['title']);
            if ($task->title === '') {
                return $this->error('Tytuł nie może być pusty', 422);
            }
        }

        if (array_key_exists('description', $payload)) {
            $task->description = (string) $payload['description'];
        }

        if (array_key_exists('status', $payload)) {
            $status = (string) $payload['status'];
            if (!in_array($status, ['draft', 'published', 'archived'], true)) {
                return $this->error('Nieprawidłowy status zadania', 422);
            }
            $task->status = $status;
        }

        if ($task->save() === false) {
            return $this->error(implode(' ', array_map(static fn ($m) => (string) $m->getMessage(), $task->getMessages())), 422);
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
}
