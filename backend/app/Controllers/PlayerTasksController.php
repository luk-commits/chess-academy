<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\User;
use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;

class PlayerTasksController extends AbstractController
{
    public function indexAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'PLAYER') {
            return $this->error('Forbidden', 403);
        }

        $playerId = (int) $this->dispatcher->getParam('authUserId');

        $groupPlayers = GroupPlayers::find([
            'conditions' => 'player_id = :playerId:',
            'bind' => ['playerId' => $playerId],
        ]);

        $allGroupIds = [];
        foreach ($groupPlayers as $gp) {
            $allGroupIds[] = (int) $gp->group_id;
        }

        if (empty($allGroupIds)) {
            return $this->json(['tasks' => []]);
        }

        $individualGroupIds = [];
        $classGroupIds = [];
        $groupsData = Group::find([
            'conditions' => 'id IN ({groupIds:array})',
            'bind' => ['groupIds' => $allGroupIds],
        ]);
        foreach ($groupsData as $g) {
            if ($g->is_individual) {
                $individualGroupIds[] = (int) $g->id;
            } else {
                $classGroupIds[] = (int) $g->id;
            }
        }

        $individualTaskIds = [];
        if (!empty($individualGroupIds)) {
            $individualTaskGroups = TaskGroup::find([
                'conditions' => 'group_id IN ({groupIds:array})',
                'bind' => ['groupIds' => $individualGroupIds],
            ]);
            foreach ($individualTaskGroups as $tg) {
                $individualTaskIds[] = (int) $tg->task_id;
            }
        }

        $classTaskIds = [];
        if (!empty($classGroupIds)) {
            $classTaskGroups = TaskGroup::find([
                'conditions' => 'group_id IN ({groupIds:array})',
                'bind' => ['groupIds' => $classGroupIds],
            ]);
            foreach ($classTaskGroups as $tg) {
                $classTaskIds[] = (int) $tg->task_id;
            }
        }

        $allTaskIds = array_values(array_unique(array_merge($individualTaskIds, $classTaskIds)));
        $individualTaskIdsUnique = array_values(array_unique($individualTaskIds));

        if (empty($allTaskIds)) {
            return $this->json(['tasks' => []]);
        }

        $tasks = Task::find([
            'conditions' => 'status = :status: AND id IN ({taskIds:array})',
            'bind' => ['status' => 'published', 'taskIds' => $allTaskIds],
            'order' => 'created_at DESC',
        ]);

        $coachIds = [];
        foreach ($tasks as $task) {
            $coachIds[] = (int) $task->coach_id;
        }
        $coachIds = array_values(array_unique($coachIds));

        $coachMap = [];
        if (!empty($coachIds)) {
            $coaches = User::find([
                'conditions' => 'id IN ({coachIds:array})',
                'bind' => ['coachIds' => $coachIds],
            ]);
            foreach ($coaches as $c) {
                $coachMap[(int) $c->id] = $c->full_name;
            }
        }

        $taskIds = array_map(static fn ($t) => (int) $t->id, iterator_to_array($tasks));
        $progressMap = [];
        if (!empty($taskIds)) {
            $rows = UserTaskProgress::find([
                'conditions' => 'user_id = :userId: AND task_id IN ({taskIds:array})',
                'bind' => ['userId' => $playerId, 'taskIds' => $taskIds],
            ]);
            foreach ($rows as $r) {
                $progressMap[(int) $r->task_id] = $r;
            }
        }

        $stageProgressMap = [];
        if (!empty($taskIds)) {
            $rows = UserTaskStageProgress::find([
                'conditions' => 'user_id = :userId: AND task_id IN ({taskIds:array})',
                'bind' => ['userId' => $playerId, 'taskIds' => $taskIds],
            ]);
            foreach ($rows as $r) {
                $stageProgressMap[(int) $r->task_stage_id] = $r;
            }
        }

        $result = [];
        foreach ($tasks as $task) {
            $stages = TaskStage::find([
                'conditions' => 'task_id = :taskId: AND status = :status:',
                'bind' => ['taskId' => $task->id, 'status' => 'published'],
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
                $moves = [];
                if (is_string($position->engine_top_lines) && $position->engine_top_lines !== '') {
                    $decoded = json_decode($position->engine_top_lines, true);
                    if (is_array($decoded) && isset($decoded[0]['moves']) && is_array($decoded[0]['moves'])) {
                        $moves = array_values(array_filter($decoded[0]['moves'], static fn ($m): bool => is_string($m)));
                        if (isset($moves[0])) {
                            $firstMove = $moves[0];
                        }
                    }
                }

                $stageProgress = $stageProgressMap[(int) $stage->id] ?? null;
                $stageProgressData = $stageProgress !== null ? [
                    'status' => (string) $stageProgress->status,
                    'attemptsTotal' => (int) $stageProgress->attempts_total,
                    'errorsTotal' => (int) $stageProgress->errors_total,
                    'wrongMoves' => is_string($stageProgress->wrong_moves) ? (json_decode($stageProgress->wrong_moves, true) ?? []) : [],
                    'thinkingTimeMs' => (int) $stageProgress->thinking_time_ms,
                    'avgMoveTimeMs' => (int) $stageProgress->avg_move_time_ms,
                    'longestMoveTimeMs' => (int) $stageProgress->longest_move_time_ms,
                    'firstErrorAtPly' => $stageProgress->first_error_at_ply !== null ? (int) $stageProgress->first_error_at_ply : null,
                    'completedAt' => $stageProgress->completed_at !== null ? (string) $stageProgress->completed_at : null,
                    'inRepetition' => (bool) $stageProgress->in_repetition,
                    'addedToRepetitionAt' => $stageProgress->added_to_repetition_at !== null ? (string) $stageProgress->added_to_repetition_at : null,
                ] : null;

                $stageData[] = [
                    'id' => (int) $stage->id,
                    'title' => $stage->title,
                    'sortOrder' => (int) $stage->sort_order,
                    'progress' => $stageProgressData,
                    'position' => [
                        'id' => (int) $position->id,
                        'fen' => (string) $position->fen,
                        'firstMove' => $firstMove,
                        'moves' => $moves,
                        'opening' => $position->opening !== null ? (static fn(string $v): string =>
                            ($pos = mb_strpos($v, ' ')) !== false ? mb_substr($v, $pos + 1) : $v
                        )($position->opening) : '',
                        'themeTags' => $themeTags,
                        'difficulty' => $position->difficulty !== null ? (int) $position->difficulty : null,
                    ],
                ];
            }

            if (!empty($stageData)) {
                $tp = $progressMap[(int) $task->id] ?? null;
                $taskProgressData = $tp !== null ? [
                    'status' => (string) $tp->status,
                    'currentStageId' => $tp->current_stage_id !== null ? (int) $tp->current_stage_id : null,
                    'startedAt' => $tp->started_at !== null ? (string) $tp->started_at : null,
                    'lastActivityAt' => $tp->last_activity_at !== null ? (string) $tp->last_activity_at : null,
                    'interruptedAt' => $tp->interrupted_at !== null ? (string) $tp->interrupted_at : null,
                    'completedAt' => $tp->completed_at !== null ? (string) $tp->completed_at : null,
                    'archivedAt' => $tp->archived_at !== null ? (string) $tp->archived_at : null,
                    'totalTimeMs' => (int) $tp->total_time_ms,
                    'attemptsTotal' => (int) $tp->attempts_total,
                    'errorsTotal' => (int) $tp->errors_total,
                ] : null;

                $result[] = [
                    'id' => (int) $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'coachName' => $coachMap[(int) $task->coach_id] ?? '',
                    'isIndividual' => in_array((int) $task->id, $individualTaskIdsUnique, true),
                    'taskProgress' => $taskProgressData,
                    'stages' => $stageData,
                ];
            }
        }

        return $this->json(['tasks' => $result]);
    }
}
