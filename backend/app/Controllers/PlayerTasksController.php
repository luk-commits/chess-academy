<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\User;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Services\PositionPresenter;
use ChessAcademy\Services\ProgressPresenter;
use Phalcon\Http\Response;

class PlayerTasksController extends AbstractController
{
    public function indexAction(): Response
    {
        if ($err = $this->requireRole('PLAYER')) return $err;

        $playerId = $this->authUserId();

        $allGroupIds = [];
        foreach (GroupPlayers::find([
            'conditions' => 'player_id = :playerId:',
            'bind' => ['playerId' => $playerId],
        ]) as $gp) {
            $allGroupIds[] = (int) $gp->group_id;
        }

        if (empty($allGroupIds)) {
            return $this->json(['tasks' => []]);
        }

        $individualGroupIds = [];
        $classGroupIds = [];
        foreach (Group::find([
            'conditions' => 'id IN ({groupIds:array})',
            'bind' => ['groupIds' => $allGroupIds],
        ]) as $g) {
            if ($g->is_individual) {
                $individualGroupIds[] = (int) $g->id;
            } else {
                $classGroupIds[] = (int) $g->id;
            }
        }

        $individualTaskIds = $this->taskIdsForGroups($individualGroupIds);
        $allTaskIds = array_values(array_unique(array_merge(
            $individualTaskIds,
            $this->taskIdsForGroups($classGroupIds)
        )));

        if (empty($allTaskIds)) {
            return $this->json(['tasks' => []]);
        }

        $tasks = Task::find([
            'conditions' => 'status = :status: AND id IN ({taskIds:array})',
            'bind' => ['status' => 'published', 'taskIds' => $allTaskIds],
            'order' => 'created_at DESC',
        ]);

        $coachIds = [];
        $taskIds = [];
        foreach ($tasks as $task) {
            $coachIds[] = (int) $task->coach_id;
            $taskIds[] = (int) $task->id;
        }
        $coachMap = $this->coachNameMap(array_values(array_unique($coachIds)));

        $progressMap = $this->mapBy(UserTaskProgress::find([
            'conditions' => 'user_id = :userId: AND task_id IN ({taskIds:array})',
            'bind' => ['userId' => $playerId, 'taskIds' => $taskIds],
        ]), 'task_id');

        $stageProgressMap = $this->mapBy(UserTaskStageProgress::find([
            'conditions' => 'user_id = :userId: AND task_id IN ({taskIds:array})',
            'bind' => ['userId' => $playerId, 'taskIds' => $taskIds],
        ]), 'task_stage_id');

        $individualTaskIdsUnique = array_values(array_unique($individualTaskIds));

        $result = [];
        foreach ($tasks as $task) {
            $stageData = [];
            foreach (TaskStage::find([
                'conditions' => 'task_id = :taskId: AND status = :status:',
                'bind' => ['taskId' => $task->id, 'status' => 'published'],
                'order' => 'sort_order ASC',
            ]) as $stage) {
                $position = $stage->position;
                if ($position === false) continue;

                $sp = $stageProgressMap[(int) $stage->id] ?? null;
                $stageData[] = [
                    'id'        => (int) $stage->id,
                    'title'     => $stage->title,
                    'sortOrder' => (int) $stage->sort_order,
                    'progress'  => $sp !== null ? ProgressPresenter::stageProgress($sp) : null,
                    'position'  => PositionPresenter::present($position),
                ];
            }

            if (!empty($stageData)) {
                $tp = $progressMap[(int) $task->id] ?? null;
                $result[] = [
                    'id'           => (int) $task->id,
                    'title'        => $task->title,
                    'description'  => $task->description,
                    'coachName'    => $coachMap[(int) $task->coach_id] ?? '',
                    'isIndividual' => in_array((int) $task->id, $individualTaskIdsUnique, true),
                    'taskProgress' => $tp !== null ? ProgressPresenter::taskProgress($tp) : null,
                    'stages'       => $stageData,
                ];
            }
        }

        return $this->json(['tasks' => $result]);
    }

    private function taskIdsForGroups(array $groupIds): array
    {
        if (empty($groupIds)) return [];
        $ids = [];
        foreach (TaskGroup::find([
            'conditions' => 'group_id IN ({groupIds:array})',
            'bind' => ['groupIds' => $groupIds],
        ]) as $tg) {
            $ids[] = (int) $tg->task_id;
        }
        return $ids;
    }

    private function coachNameMap(array $coachIds): array
    {
        if (empty($coachIds)) return [];
        $map = [];
        foreach (User::find([
            'conditions' => 'id IN ({coachIds:array})',
            'bind' => ['coachIds' => $coachIds],
        ]) as $c) {
            $map[(int) $c->id] = $c->full_name;
        }
        return $map;
    }

    private function mapBy(iterable $rows, string $field): array
    {
        $map = [];
        foreach ($rows as $r) {
            $map[(int) $r->{$field}] = $r;
        }
        return $map;
    }
}
