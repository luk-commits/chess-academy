<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\User;
use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Services\SpacedRepetitionService;
use DateTimeImmutable;
use RuntimeException;

class PlayerStagesController extends AbstractController
{
    public function attemptAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'PLAYER') {
            return $this->error('Forbidden', 403);
        }

        $playerId = (int) $this->dispatcher->getParam('authUserId');
        $stageId = (int) $this->dispatcher->getParam('id');
        if ($stageId <= 0) {
            return $this->error('Invalid stage id', 400);
        }

        $body = $this->jsonInput();
        if (!array_key_exists('passed', $body) || !is_bool($body['passed'])) {
            return $this->error("Field 'passed' must be a boolean", 400);
        }
        $passed = (bool) $body['passed'];

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null || $stage->status !== 'published') {
            return $this->error('Stage not found', 404);
        }

        $task = Task::findFirst((int) $stage->task_id);
        if ($task === null || $task->status !== 'published') {
            return $this->error('Stage not found', 404);
        }

        if (!$this->playerHasAccessToTask($playerId, (int) $task->id)) {
            return $this->error('Forbidden', 403);
        }

        try {
            $progress = (new SpacedRepetitionService())->recordAttempt($playerId, $stageId, $passed);
        } catch (RuntimeException $e) {
            return $this->error('Failed to record attempt', 500);
        }

        return $this->json([
            'progress' => [
                'stageId'        => (int) $progress->task_stage_id,
                'repetitions'    => (int) $progress->repetitions,
                'intervalDays'   => (int) $progress->interval_days,
                'lastResult'     => (string) $progress->last_result,
                'lastReviewedAt' => (string) $progress->last_reviewed_at,
                'nextReviewAt'   => (string) $progress->next_review_at,
                'attemptsTotal'  => (int) $progress->attempts_total,
            ],
        ]);
    }

    public function dueAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'PLAYER') {
            return $this->error('Forbidden', 403);
        }

        $playerId = (int) $this->dispatcher->getParam('authUserId');

        $groupIds = $this->playerGroupIds($playerId);
        if (empty($groupIds)) {
            return $this->json(['stages' => []]);
        }

        $taskIds = $this->taskIdsForGroups($groupIds);
        if (empty($taskIds)) {
            return $this->json(['stages' => []]);
        }

        $tasks = Task::find([
            'conditions' => 'status = :status: AND id IN ({taskIds:array})',
            'bind'       => ['status' => 'published', 'taskIds' => $taskIds],
        ]);

        $taskMap = [];
        $publishedTaskIds = [];
        $coachIds = [];
        foreach ($tasks as $task) {
            $taskMap[(int) $task->id] = $task;
            $publishedTaskIds[] = (int) $task->id;
            $coachIds[] = (int) $task->coach_id;
        }
        if (empty($publishedTaskIds)) {
            return $this->json(['stages' => []]);
        }

        $coachMap = $this->coachNameMap(array_values(array_unique($coachIds)));

        $stages = TaskStage::find([
            'conditions' => 'status = :status: AND task_id IN ({taskIds:array}) '
                . 'AND position_id IS NOT NULL AND solution_pgn IS NOT NULL',
            'bind' => ['status' => 'published', 'taskIds' => $publishedTaskIds],
        ]);
        if (count($stages) === 0) {
            return $this->json(['stages' => []]);
        }

        $stageIds = [];
        foreach ($stages as $stage) {
            $stageIds[] = (int) $stage->id;
        }

        $progressMap = $this->progressMap($playerId, $stageIds);

        $now = new DateTimeImmutable();
        $entries = [];
        foreach ($stages as $stage) {
            $progress = $progressMap[(int) $stage->id] ?? null;
            if ($progress !== null) {
                $nextReview = new DateTimeImmutable((string) $progress->next_review_at);
                if ($nextReview > $now) {
                    continue;
                }
            }
            $entries[] = ['stage' => $stage, 'progress' => $progress];
        }

        usort($entries, static function (array $a, array $b): int {
            if ($a['progress'] === null && $b['progress'] === null) {
                return (int) $a['stage']->id <=> (int) $b['stage']->id;
            }
            if ($a['progress'] === null) {
                return -1;
            }
            if ($b['progress'] === null) {
                return 1;
            }
            return strcmp((string) $a['progress']->next_review_at, (string) $b['progress']->next_review_at);
        });

        $result = [];
        foreach ($entries as $entry) {
            $stage = $entry['stage'];
            $position = $stage->position;
            if ($position === false) {
                continue;
            }
            $task = $taskMap[(int) $stage->task_id] ?? null;
            if ($task === null) {
                continue;
            }

            $result[] = [
                'id'           => (int) $stage->id,
                'title'        => $stage->title,
                'sortOrder'    => (int) $stage->sort_order,
                'solutionPgn'  => (string) $stage->solution_pgn,
                'task'         => [
                    'id'        => (int) $task->id,
                    'title'     => $task->title,
                    'coachName' => $coachMap[(int) $task->coach_id] ?? '',
                ],
                'position'     => $this->mapPositionData($position),
                'progress'     => $this->mapProgressData($entry['progress']),
            ];
        }

        return $this->json(['stages' => $result]);
    }

    private function playerGroupIds(int $playerId): array
    {
        $rows = GroupPlayers::find([
            'conditions' => 'player_id = :playerId:',
            'bind'       => ['playerId' => $playerId],
        ]);
        $ids = [];
        foreach ($rows as $row) {
            $ids[] = (int) $row->group_id;
        }
        return array_values(array_unique($ids));
    }

    private function taskIdsForGroups(array $groupIds): array
    {
        $rows = TaskGroup::find([
            'conditions' => 'group_id IN ({groupIds:array})',
            'bind'       => ['groupIds' => $groupIds],
        ]);
        $ids = [];
        foreach ($rows as $row) {
            $ids[] = (int) $row->task_id;
        }
        return array_values(array_unique($ids));
    }

    private function coachNameMap(array $coachIds): array
    {
        if (empty($coachIds)) {
            return [];
        }
        $coaches = User::find([
            'conditions' => 'id IN ({coachIds:array})',
            'bind'       => ['coachIds' => $coachIds],
        ]);
        $map = [];
        foreach ($coaches as $coach) {
            $map[(int) $coach->id] = (string) $coach->full_name;
        }
        return $map;
    }

    private function progressMap(int $playerId, array $stageIds): array
    {
        if (empty($stageIds)) {
            return [];
        }
        $rows = UserStageProgress::find([
            'conditions' => 'user_id = :userId: AND task_stage_id IN ({stageIds:array})',
            'bind'       => ['userId' => $playerId, 'stageIds' => $stageIds],
        ]);
        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->task_stage_id] = $row;
        }
        return $map;
    }

    private function mapPositionData(\ChessAcademy\Models\Position $position): array
    {
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

        return [
            'id'         => (int) $position->id,
            'fen'        => (string) $position->fen,
            'firstMove'  => $firstMove,
            'moves'      => $moves,
            'opening'    => $position->opening !== null
                ? (static fn (string $v): string => ($pos = mb_strpos($v, ' ')) !== false ? mb_substr($v, $pos + 1) : $v)($position->opening)
                : '',
            'themeTags'  => $themeTags,
            'difficulty' => $position->difficulty !== null ? (int) $position->difficulty : null,
        ];
    }

    private function mapProgressData(?UserStageProgress $progress): ?array
    {
        if ($progress === null) {
            return null;
        }
        return [
            'repetitions'    => (int) $progress->repetitions,
            'intervalDays'   => (int) $progress->interval_days,
            'lastResult'     => $progress->last_result !== null ? (string) $progress->last_result : null,
            'lastReviewedAt' => $progress->last_reviewed_at !== null ? (string) $progress->last_reviewed_at : null,
            'nextReviewAt'   => (string) $progress->next_review_at,
            'attemptsTotal'  => (int) $progress->attempts_total,
        ];
    }

    private function playerHasAccessToTask(int $playerId, int $taskId): bool
    {
        $taskGroups = TaskGroup::find([
            'conditions' => 'task_id = :taskId:',
            'bind' => ['taskId' => $taskId],
        ]);

        $groupIds = [];
        foreach ($taskGroups as $tg) {
            $groupIds[] = (int) $tg->group_id;
        }
        if (empty($groupIds)) {
            return false;
        }

        $membership = GroupPlayers::findFirst([
            'conditions' => 'player_id = :playerId: AND group_id IN ({groupIds:array})',
            'bind' => ['playerId' => $playerId, 'groupIds' => $groupIds],
        ]);

        return $membership !== null;
    }
}
