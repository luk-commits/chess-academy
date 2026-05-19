<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use DateTimeImmutable;

class PlayerTaskProgressController extends AbstractController
{
    private function assertPlayer(): int
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'PLAYER') {
            throw new \RuntimeException('Forbidden');
        }
        return (int) $this->dispatcher->getParam('authUserId');
    }

    private function findTaskOrError(int $taskId): Task
    {
        $task = Task::findFirst($taskId);
        if ($task === null || $task->status !== 'published') {
            throw new \RuntimeException('Task not found');
        }
        return $task;
    }

    private function assertPlayerHasAccess(int $playerId, int $taskId): void
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
            throw new \RuntimeException('Forbidden');
        }
        $membership = GroupPlayers::findFirst([
            'conditions' => 'player_id = :playerId: AND group_id IN ({groupIds:array})',
            'bind' => ['playerId' => $playerId, 'groupIds' => $groupIds],
        ]);
        if ($membership === null) {
            throw new \RuntimeException('Forbidden');
        }
    }

    private function getOrCreateTaskProgress(int $playerId, int $taskId): UserTaskProgress
    {
        $progress = UserTaskProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_id = :t:',
            'bind' => ['u' => $playerId, 't' => $taskId],
        ]);
        if ($progress === null) {
            $progress = new UserTaskProgress();
            $progress->user_id = $playerId;
            $progress->task_id = $taskId;
            $progress->status = 'new';
        }
        return $progress;
    }

    private function getOrCreateStageProgress(int $playerId, int $taskId, int $stageId): UserTaskStageProgress
    {
        $progress = UserTaskStageProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_stage_id = :s:',
            'bind' => ['u' => $playerId, 's' => $stageId],
        ]);
        if ($progress === null) {
            $progress = new UserTaskStageProgress();
            $progress->user_id = $playerId;
            $progress->task_id = $taskId;
            $progress->task_stage_id = $stageId;
            $progress->status = 'new';
        }
        return $progress;
    }

    private function firstPublishedStageId(int $taskId): ?int
    {
        $stage = TaskStage::findFirst([
            'conditions' => 'task_id = :taskId: AND status = :status:',
            'bind' => ['taskId' => $taskId, 'status' => 'published'],
            'order' => 'sort_order ASC',
        ]);
        return $stage !== null ? (int) $stage->id : null;
    }

    private function jsonProgress(UserTaskProgress $p): array
    {
        return [
            'status' => (string) $p->status,
            'currentStageId' => $p->current_stage_id !== null ? (int) $p->current_stage_id : null,
            'startedAt' => $p->started_at !== null ? (string) $p->started_at : null,
            'lastActivityAt' => $p->last_activity_at !== null ? (string) $p->last_activity_at : null,
            'interruptedAt' => $p->interrupted_at !== null ? (string) $p->interrupted_at : null,
            'completedAt' => $p->completed_at !== null ? (string) $p->completed_at : null,
            'archivedAt' => $p->archived_at !== null ? (string) $p->archived_at : null,
            'totalTimeMs' => (int) $p->total_time_ms,
            'attemptsTotal' => (int) $p->attempts_total,
            'errorsTotal' => (int) $p->errors_total,
        ];
    }

    public function startAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('id');
            if ($taskId <= 0) return $this->error('Invalid task id', 400);
            $this->findTaskOrError($taskId);
            $this->assertPlayerHasAccess($playerId, $taskId);

            $now = new DateTimeImmutable();
            $progress = $this->getOrCreateTaskProgress($playerId, $taskId);

            $isNew = $progress->status === 'new' || $progress->status === 'archived';
            if ($isNew) {
                $firstStageId = $this->firstPublishedStageId($taskId);
                if ($firstStageId === null) return $this->error('No published stages', 422);
                $progress->status = 'in_progress';
                $progress->current_stage_id = $firstStageId;
                $progress->started_at = $now->format('c');
                $progress->last_activity_at = $now->format('c');
            } elseif ($progress->status === 'interrupted') {
                $progress->status = 'in_progress';
                $progress->last_activity_at = $now->format('c');
            } else {
                return $this->error('Cannot start task in status: ' . $progress->status, 422);
            }

            if ($progress->save() === false) {
                return $this->error('Failed to save progress', 500);
            }

            return $this->json(['taskProgress' => $this->jsonProgress($progress)]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function interruptAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('id');
            if ($taskId <= 0) return $this->error('Invalid task id', 400);
            $this->assertPlayerHasAccess($playerId, $taskId);

            $progress = UserTaskProgress::findFirst([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            if ($progress === null) return $this->error('Task progress not found', 404);
            if ($progress->status !== 'in_progress') return $this->error('Task is not in progress', 422);

            $now = new DateTimeImmutable();
            $progress->status = 'interrupted';
            $progress->interrupted_at = $now->format('c');
            $progress->last_activity_at = $now->format('c');

            if ($progress->save() === false) {
                return $this->error('Failed to save progress', 500);
            }

            return $this->json(['taskProgress' => $this->jsonProgress($progress)]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function resumeAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('id');
            if ($taskId <= 0) return $this->error('Invalid task id', 400);
            $this->assertPlayerHasAccess($playerId, $taskId);

            $progress = UserTaskProgress::findFirst([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            if ($progress === null) return $this->error('Task progress not found', 404);
            if ($progress->status !== 'interrupted' && $progress->status !== 'in_progress') {
                return $this->error('Cannot resume task in status: ' . $progress->status, 422);
            }

            $now = new DateTimeImmutable();
            $progress->status = 'in_progress';
            $progress->interrupted_at = null;
            $progress->last_activity_at = $now->format('c');

            if ($progress->save() === false) {
                return $this->error('Failed to save progress', 500);
            }

            return $this->json(['taskProgress' => $this->jsonProgress($progress)]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function resetAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('id');
            if ($taskId <= 0) return $this->error('Invalid task id', 400);
            $this->assertPlayerHasAccess($playerId, $taskId);

            // Reset task progress
            $progress = UserTaskProgress::findFirst([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            if ($progress !== null) {
                $progress->status = 'new';
                $progress->current_stage_id = null;
                $progress->started_at = null;
                $progress->last_activity_at = null;
                $progress->interrupted_at = null;
                $progress->completed_at = null;
                $progress->archived_at = null;
                $progress->total_time_ms = 0;
                $progress->attempts_total = 0;
                $progress->errors_total = 0;
                $progress->save();
            }

            // Reset all stage progress for this task and clear repetition flags
            $stageProgresses = UserTaskStageProgress::find([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            foreach ($stageProgresses as $sp) {
                $sp->status = 'new';
                $sp->attempts_total = 0;
                $sp->errors_total = 0;
                $sp->wrong_moves = '[]';
                $sp->thinking_time_ms = 0;
                $sp->avg_move_time_ms = 0;
                $sp->longest_move_time_ms = 0;
                $sp->first_error_at_ply = null;
                $sp->completed_at = null;
                $sp->in_repetition = false;
                $sp->added_to_repetition_at = null;
                $sp->save();
            }

            return $this->json(['ok' => true]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function archiveAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('id');
            if ($taskId <= 0) return $this->error('Invalid task id', 400);
            $this->assertPlayerHasAccess($playerId, $taskId);

            $progress = UserTaskProgress::findFirst([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            if ($progress === null) return $this->error('Task progress not found', 404);
            if ($progress->status !== 'completed') return $this->error('Only completed tasks can be archived', 422);

            $now = new DateTimeImmutable();
            $progress->status = 'archived';
            $progress->archived_at = $now->format('c');

            if ($progress->save() === false) {
                return $this->error('Failed to save progress', 500);
            }

            return $this->json(['taskProgress' => $this->jsonProgress($progress)]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function restoreAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('id');
            if ($taskId <= 0) return $this->error('Invalid task id', 400);
            $this->assertPlayerHasAccess($playerId, $taskId);

            // Restore = reset task progress and stage progress to 'new'
            $progress = UserTaskProgress::findFirst([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            if ($progress === null) return $this->error('Task progress not found', 404);

            $progress->status = 'new';
            $progress->current_stage_id = null;
            $progress->started_at = null;
            $progress->last_activity_at = null;
            $progress->interrupted_at = null;
            $progress->completed_at = null;
            $progress->archived_at = null;
            $progress->total_time_ms = 0;
            $progress->attempts_total = 0;
            $progress->errors_total = 0;
            $progress->save();

            // Reset stage progress + clear repetitions
            $stageProgresses = UserTaskStageProgress::find([
                'conditions' => 'user_id = :u: AND task_id = :t:',
                'bind' => ['u' => $playerId, 't' => $taskId],
            ]);
            foreach ($stageProgresses as $sp) {
                $sp->status = 'new';
                $sp->attempts_total = 0;
                $sp->errors_total = 0;
                $sp->wrong_moves = '[]';
                $sp->thinking_time_ms = 0;
                $sp->avg_move_time_ms = 0;
                $sp->longest_move_time_ms = 0;
                $sp->first_error_at_ply = null;
                $sp->completed_at = null;
                $sp->in_repetition = false;
                $sp->added_to_repetition_at = null;
                $sp->save();
            }

            return $this->json(['ok' => true]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function completeStageAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $taskId = (int) $this->dispatcher->getParam('taskId');
            $stageId = (int) $this->dispatcher->getParam('stageId');
            if ($taskId <= 0 || $stageId <= 0) return $this->error('Invalid ids', 400);
            $this->assertPlayerHasAccess($playerId, $taskId);

            $stage = TaskStage::findFirst($stageId);
            if ($stage === null || (int) $stage->task_id !== $taskId || $stage->status !== 'published') {
                return $this->error('Stage not found', 404);
            }

            $body = $this->jsonInput();

            // Save stage progress
            $sp = $this->getOrCreateStageProgress($playerId, $taskId, $stageId);
            $sp->status = 'completed';
            $sp->attempts_total = (int) ($body['attemptsTotal'] ?? 0);
            $sp->errors_total = (int) ($body['errorsTotal'] ?? 0);
            $sp->wrong_moves = json_encode($body['wrongMoves'] ?? [], JSON_UNESCAPED_UNICODE);
            $sp->thinking_time_ms = (int) ($body['thinkingTimeMs'] ?? 0);
            $sp->completed_at = (new DateTimeImmutable())->format('c');

            $moveTimes = $body['moveTimesMs'] ?? [];
            if (is_array($moveTimes) && count($moveTimes) > 0) {
                $sp->avg_move_time_ms = (int) round(array_sum($moveTimes) / count($moveTimes));
                $sp->longest_move_time_ms = (int) max($moveTimes);
            }
            $sp->first_error_at_ply = isset($body['firstErrorAtPly']) && $body['firstErrorAtPly'] !== null
                ? (int) $body['firstErrorAtPly'] : null;

            if ($sp->save() === false) {
                return $this->error('Failed to save stage progress', 500);
            }

            // Find next published stage
            $allStages = TaskStage::find([
                'conditions' => 'task_id = :taskId: AND status = :status:',
                'bind' => ['taskId' => $taskId, 'status' => 'published'],
                'order' => 'sort_order ASC',
            ]);
            $foundCurrent = false;
            $nextStageId = null;
            foreach ($allStages as $s) {
                if ($foundCurrent) {
                    $nextStageId = (int) $s->id;
                    break;
                }
                if ((int) $s->id === $stageId) {
                    $foundCurrent = true;
                }
            }

            $now = new DateTimeImmutable();
            $tp = $this->getOrCreateTaskProgress($playerId, $taskId);
            $tp->status = $nextStageId !== null ? 'in_progress' : 'completed';
            $tp->current_stage_id = $nextStageId;
            $tp->last_activity_at = $now->format('c');
            if ($nextStageId === null) {
                $tp->completed_at = $now->format('c');
            }
            $tp->total_time_ms = (int) $tp->total_time_ms + (int) ($body['thinkingTimeMs'] ?? 0);
            $tp->attempts_total = (int) $tp->attempts_total + (int) ($body['attemptsTotal'] ?? 0);
            $tp->errors_total = (int) $tp->errors_total + (int) ($body['errorsTotal'] ?? 0);

            if ($tp->save() === false) {
                return $this->error('Failed to save task progress', 500);
            }

            return $this->json([
                'stageProgress' => [
                    'status' => (string) $sp->status,
                    'attemptsTotal' => (int) $sp->attempts_total,
                    'errorsTotal' => (int) $sp->errors_total,
                    'wrongMoves' => is_string($sp->wrong_moves) ? (json_decode($sp->wrong_moves, true) ?? []) : [],
                    'thinkingTimeMs' => (int) $sp->thinking_time_ms,
                    'avgMoveTimeMs' => (int) $sp->avg_move_time_ms,
                    'longestMoveTimeMs' => (int) $sp->longest_move_time_ms,
                    'firstErrorAtPly' => $sp->first_error_at_ply !== null ? (int) $sp->first_error_at_ply : null,
                    'completedAt' => (string) $sp->completed_at,
                ],
                'taskProgress' => $this->jsonProgress($tp),
            ]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }

    public function repetitionAction(): \Phalcon\Http\Response
    {
        try {
            $playerId = $this->assertPlayer();
            $stageId = (int) $this->dispatcher->getParam('id');
            if ($stageId <= 0) return $this->error('Invalid stage id', 400);

            $body = $this->jsonInput();
            if (!array_key_exists('enabled', $body) || !is_bool($body['enabled'])) {
                return $this->error("Field 'enabled' must be a boolean", 400);
            }
            $enabled = (bool) $body['enabled'];

            $stage = TaskStage::findFirst($stageId);
            if ($stage === null || $stage->status !== 'published') {
                return $this->error('Stage not found', 404);
            }

            $this->assertPlayerHasAccess($playerId, (int) $stage->task_id);

            // Auto-fill solution_pgn from request body if stage lacks one
            $solutionPgn = $body['solutionPgn'] ?? null;
            if ($enabled && is_string($solutionPgn) && $solutionPgn !== ''
                && ($stage->solution_pgn === null || $stage->solution_pgn === '')
            ) {
                $stage->solution_pgn = $solutionPgn;
                $stage->save();
            }

            $sp = $this->getOrCreateStageProgress($playerId, (int) $stage->task_id, $stageId);
            $sp->in_repetition = $enabled;
            if ($enabled) {
                $sp->added_to_repetition_at = (new DateTimeImmutable())->format('c');
            } else {
                $sp->added_to_repetition_at = null;
            }

            if ($sp->save() === false) {
                return $this->error('Failed to save stage progress', 500);
            }

            return $this->json([
                'stageProgress' => [
                    'status' => (string) $sp->status,
                    'inRepetition' => (bool) $sp->in_repetition,
                    'addedToRepetitionAt' => $sp->added_to_repetition_at !== null ? (string) $sp->added_to_repetition_at : null,
                ],
            ]);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), $e->getMessage() === 'Forbidden' ? 403 : 404);
        }
    }
}
