<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\TaskStagePosition;

class TasksController extends AbstractController
{
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

        if ($title === '') {
            $title = 'Zadanie z pozycjami';
        }

        $task = new Task();
        $task->title = $title;
        $task->description = $description;
        $task->coach_id = $coachId;
        $task->status = 'active';

        if ($task->save() === false) {
            $messages = $task->getMessages();
            $errorMsg = '';
            foreach ($messages as $msg) {
                $errorMsg .= (string) $msg . ' ';
            }
            return $this->error(trim($errorMsg), 422);
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

            if ($stage->save() === false) {
                $task->delete();
                $messages = $stage->getMessages();
                $errorMsg = '';
                foreach ($messages as $msg) {
                    $errorMsg .= (string) $msg . ' ';
                }
                return $this->error(trim($errorMsg), 422);
            }

            $tsp = new TaskStagePosition();
            $tsp->task_stage_id = $stage->id;
            $tsp->position_id = (int) $positionId;
            $tsp->sort_order = $i;
            $tsp->save();

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
}
