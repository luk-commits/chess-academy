<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\GroupPlayers;

class PlayerTasksController extends AbstractController
{
    public function indexAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'PLAYER') {
            return $this->error('Forbidden', 403);
        }

        $playerId = (int) $this->dispatcher->getParam('authUserId');

        $groupIds = [];
        $groups = GroupPlayers::find([
            'conditions' => 'player_id = :playerId:',
            'bind' => ['playerId' => $playerId],
        ]);
        foreach ($groups as $gp) {
            $groupIds[] = (int) $gp->group_id;
        }

        if (empty($groupIds)) {
            return $this->json(['tasks' => []]);
        }

        $taskGroups = TaskGroup::find([
            'conditions' => 'group_id IN ({groupIds:array})',
            'bind' => ['groupIds' => $groupIds],
        ]);
        $taskIds = [];
        foreach ($taskGroups as $tg) {
            $taskIds[] = (int) $tg->task_id;
        }
        $taskIds = array_unique($taskIds);

        if (empty($taskIds)) {
            return $this->json(['tasks' => []]);
        }

        $tasks = Task::find([
            'conditions' => 'status = :status: AND id IN ({taskIds:array})',
            'bind' => ['status' => 'active', 'taskIds' => $taskIds],
            'order' => 'created_at DESC',
        ]);

        $result = [];
        foreach ($tasks as $task) {
            $stages = TaskStage::find([
                'conditions' => 'task_id = :taskId:',
                'bind' => ['taskId' => $task->id],
                'order' => 'sort_order ASC',
            ]);

            $stageData = [];
            foreach ($stages as $stage) {
                $position = $stage->position;

                if ($position === false) {
                    continue;
                }

                $themeTags = [];
                if (is_string($position->theme_tags) && $position->theme_tags !== '') {
                    $decoded = json_decode($position->theme_tags, true);
                    if (is_array($decoded)) {
                        $themeTags = array_values(array_filter($decoded, static fn ($item): bool => is_string($item)));
                    }
                }

                $firstMove = null;
                if (is_string($position->engine_top_lines) && $position->engine_top_lines !== '') {
                    $decoded = json_decode($position->engine_top_lines, true);
                    if (is_array($decoded) && isset($decoded[0]['moves'][0])) {
                        $firstMove = $decoded[0]['moves'][0];
                    }
                }

                $stageData[] = [
                    'id' => (int) $stage->id,
                    'title' => $stage->title,
                    'sortOrder' => (int) $stage->sort_order,
                    'position' => [
                        'id' => (int) $position->id,
                        'fen' => (string) $position->fen,
                        'firstMove' => $firstMove,
                        'opening' => $position->opening !== null ? (static fn(string $v): string =>
                            ($pos = mb_strpos($v, ' ')) !== false ? mb_substr($v, $pos + 1) : $v
                        )($position->opening) : '',
                        'themeTags' => $themeTags,
                        'rating' => $position->rating !== null ? (int) $position->rating : null,
                        'difficulty' => $position->difficulty !== null ? (int) $position->difficulty : null,
                    ],
                ];
            }

            if (!empty($stageData)) {
                $result[] = [
                    'id' => (int) $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'stages' => $stageData,
                ];
            }
        }

        return $this->json(['tasks' => $result]);
    }
}
