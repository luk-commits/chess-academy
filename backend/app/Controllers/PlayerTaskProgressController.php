<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Services\PlayerAccessService;
use ChessAcademy\Services\ProgressPresenter;
use DateTimeImmutable;
use Phalcon\Http\Response;
use RuntimeException;

class PlayerTaskProgressController extends AbstractController
{
    private const MAX_ATTEMPTS_PER_STAGE = 10000;
    private const MAX_ERRORS_PER_STAGE = 10000;
    private const MAX_TIME_MS = 24 * 60 * 60 * 1000;
    private const MAX_MOVE_TIMES_COUNT = 10000;
    private const MAX_PLY = 10000;
    private const MAX_TIME_MS_LIFETIME = 1000 * 60 * 60 * 24 * 365;

    public function startAction(): Response
    {
        return $this->runTaskAction(function (int $playerId, int $taskId): Response {
            $task = Task::findFirst($taskId);
            if ($task === null || $task->status !== 'published') {
                return $this->error('Task not found', 404);
            }

            $progress = $this->getOrCreateTaskProgress($playerId, $taskId);
            $now = new DateTimeImmutable();
            $isFresh = $progress->status === 'new' || $progress->status === 'archived';

            if ($isFresh) {
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

            return $this->saveTaskProgress($progress);
        });
    }

    public function interruptAction(): Response
    {
        return $this->runTaskAction(function (int $playerId, int $taskId): Response {
            $progress = $this->findTaskProgress($playerId, $taskId);
            if ($progress === null) return $this->error('Task progress not found', 404);
            if ($progress->status !== 'in_progress') return $this->error('Task is not in progress', 422);

            $now = (new DateTimeImmutable())->format('c');
            $progress->status = 'interrupted';
            $progress->interrupted_at = $now;
            $progress->last_activity_at = $now;

            return $this->saveTaskProgress($progress);
        });
    }

    public function resumeAction(): Response
    {
        return $this->runTaskAction(function (int $playerId, int $taskId): Response {
            $progress = $this->findTaskProgress($playerId, $taskId);
            if ($progress === null) return $this->error('Task progress not found', 404);
            if ($progress->status !== 'interrupted' && $progress->status !== 'in_progress') {
                return $this->error('Cannot resume task in status: ' . $progress->status, 422);
            }

            $progress->status = 'in_progress';
            $progress->interrupted_at = null;
            $progress->last_activity_at = (new DateTimeImmutable())->format('c');

            return $this->saveTaskProgress($progress);
        });
    }

    public function resetAction(): Response
    {
        return $this->runTaskAction(function (int $playerId, int $taskId): Response {
            $progress = $this->findTaskProgress($playerId, $taskId);
            if ($progress !== null) {
                $this->resetTaskProgressFields($progress);
                $progress->save();
            }
            $this->resetStageProgressForTask($playerId, $taskId);
            return $this->json(['ok' => true]);
        });
    }

    public function restoreAction(): Response
    {
        return $this->runTaskAction(function (int $playerId, int $taskId): Response {
            $progress = $this->findTaskProgress($playerId, $taskId);
            if ($progress === null) return $this->error('Task progress not found', 404);

            $this->resetTaskProgressFields($progress);
            $progress->save();
            $this->resetStageProgressForTask($playerId, $taskId);

            return $this->json(['ok' => true]);
        });
    }

    public function archiveAction(): Response
    {
        return $this->runTaskAction(function (int $playerId, int $taskId): Response {
            $progress = $this->findTaskProgress($playerId, $taskId);
            if ($progress === null) return $this->error('Task progress not found', 404);
            if ($progress->status !== 'completed') return $this->error('Only completed tasks can be archived', 422);

            $now = (new DateTimeImmutable())->format('c');
            $progress->status = 'archived';
            $progress->archived_at = $now;

            return $this->saveTaskProgress($progress);
        });
    }

    public function completeStageAction(): Response
    {
        if ($err = $this->requireRole('PLAYER')) return $err;

        $taskId = (int) $this->dispatcher->getParam('taskId');
        $stageId = (int) $this->dispatcher->getParam('stageId');
        if ($taskId <= 0 || $stageId <= 0) return $this->error('Invalid ids', 400);

        $playerId = $this->authUserId();
        try {
            (new PlayerAccessService())->assertPlayerHasAccess($playerId, $taskId);
        } catch (RuntimeException) {
            return $this->error('Forbidden', 403);
        }

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null || (int) $stage->task_id !== $taskId || $stage->status !== 'published') {
            return $this->error('Stage not found', 404);
        }

        $body = $this->jsonInput();
        $attemptsTotal = $this->intInRange($body['attemptsTotal'] ?? 0, 0, self::MAX_ATTEMPTS_PER_STAGE);
        $errorsTotal = $this->intInRange($body['errorsTotal'] ?? 0, 0, self::MAX_ERRORS_PER_STAGE);
        $thinkingTimeMs = $this->intInRange($body['thinkingTimeMs'] ?? 0, 0, self::MAX_TIME_MS);

        $normalizedMoveTimes = [];
        $moveTimes = $body['moveTimesMs'] ?? [];
        if (is_array($moveTimes)) {
            $slicedMoveTimes = array_slice($moveTimes, 0, self::MAX_MOVE_TIMES_COUNT);
            $numericMoveTimes = array_filter($slicedMoveTimes, 'is_numeric');
            $normalizedMoveTimes = array_map(
                fn (mixed $value): int => $this->intInRange($value, 0, self::MAX_TIME_MS),
                array_values($numericMoveTimes)
            );
        }

        $firstErrorAtPly = null;
        if (array_key_exists('firstErrorAtPly', $body) && $body['firstErrorAtPly'] !== null) {
            $firstErrorAtPly = $this->intInRange($body['firstErrorAtPly'], 0, self::MAX_PLY);
        }

        $sp = $this->getOrCreateStageProgress($playerId, $taskId, $stageId);
        $sp->status = 'completed';
        $sp->attempts_total = $attemptsTotal;
        $sp->errors_total = $errorsTotal;
        $sp->wrong_moves = json_encode($body['wrongMoves'] ?? [], JSON_UNESCAPED_UNICODE);
        $sp->thinking_time_ms = $thinkingTimeMs;
        $sp->completed_at = (new DateTimeImmutable())->format('c');

        if (count($normalizedMoveTimes) > 0) {
            $sp->avg_move_time_ms = (int) round(array_sum($normalizedMoveTimes) / count($normalizedMoveTimes));
            $sp->longest_move_time_ms = (int) max($normalizedMoveTimes);
        }
        $sp->first_error_at_ply = $firstErrorAtPly;

        if ($sp->save() === false) return $this->error('Failed to save stage progress', 500);

        $nextStageId = $this->findNextPublishedStageId($taskId, $stageId);

        $now = new DateTimeImmutable();
        $tp = $this->getOrCreateTaskProgress($playerId, $taskId);
        $tp->status = $nextStageId !== null ? 'in_progress' : 'completed';
        $tp->current_stage_id = $nextStageId;
        $tp->last_activity_at = $now->format('c');
        if ($nextStageId === null) {
            $tp->completed_at = $now->format('c');
        }
        $taskTotalTimeMs = max(0, (int) $tp->total_time_ms) + $thinkingTimeMs;
        $taskAttemptsTotal = max(0, (int) $tp->attempts_total) + $attemptsTotal;
        $taskErrorsTotal = max(0, (int) $tp->errors_total) + $errorsTotal;

        $tp->total_time_ms = min($taskTotalTimeMs, self::MAX_TIME_MS_LIFETIME, PHP_INT_MAX);
        $tp->attempts_total = min($taskAttemptsTotal, PHP_INT_MAX);
        $tp->errors_total = min($taskErrorsTotal, PHP_INT_MAX);

        if ($tp->save() === false) return $this->error('Failed to save task progress', 500);

        return $this->json([
            'stageProgress' => ProgressPresenter::stageProgress($sp),
            'taskProgress'  => ProgressPresenter::taskProgress($tp),
        ]);
    }

    public function repetitionAction(): Response
    {
        if ($err = $this->requireRole('PLAYER')) return $err;

        $stageId = $this->positiveIntParam('id', 'Invalid stage id');
        if ($stageId instanceof Response) return $stageId;

        $body = $this->jsonInput();
        if (!array_key_exists('enabled', $body) || !is_bool($body['enabled'])) {
            return $this->error("Field 'enabled' must be a boolean", 400);
        }
        $enabled = (bool) $body['enabled'];

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null || $stage->status !== 'published') {
            return $this->error('Stage not found', 404);
        }

        $playerId = $this->authUserId();
        try {
            (new PlayerAccessService())->assertPlayerHasAccess($playerId, (int) $stage->task_id);
        } catch (RuntimeException) {
            return $this->error('Forbidden', 403);
        }

        $sp = $this->getOrCreateStageProgress($playerId, (int) $stage->task_id, $stageId);
        $sp->in_repetition = $enabled;
        $sp->added_to_repetition_at = $enabled ? (new DateTimeImmutable())->format('c') : null;

        if ($sp->save() === false) return $this->error('Failed to save stage progress', 500);

        return $this->json([
            'stageProgress' => [
                'status'              => (string) $sp->status,
                'inRepetition'        => (bool) $sp->in_repetition,
                'addedToRepetitionAt' => $sp->added_to_repetition_at !== null ? (string) $sp->added_to_repetition_at : null,
            ],
        ]);
    }

    /**
     * Common boilerplate for task-scoped actions: role check, id param, access check.
     */
    private function runTaskAction(callable $handler): Response
    {
        if ($err = $this->requireRole('PLAYER')) return $err;

        $taskId = $this->positiveIntParam('id', 'Invalid task id');
        if ($taskId instanceof Response) return $taskId;

        $playerId = $this->authUserId();
        try {
            (new PlayerAccessService())->assertPlayerHasAccess($playerId, $taskId);
        } catch (RuntimeException) {
            return $this->error('Forbidden', 403);
        }

        return $handler($playerId, $taskId);
    }

    private function findTaskProgress(int $playerId, int $taskId): ?UserTaskProgress
    {
        $progress = UserTaskProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_id = :t:',
            'bind' => ['u' => $playerId, 't' => $taskId],
        ]);
        return $progress instanceof UserTaskProgress ? $progress : null;
    }

    private function getOrCreateTaskProgress(int $playerId, int $taskId): UserTaskProgress
    {
        $progress = $this->findTaskProgress($playerId, $taskId);
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

    private function findNextPublishedStageId(int $taskId, int $currentStageId): ?int
    {
        $found = false;
        foreach (TaskStage::find([
            'conditions' => 'task_id = :taskId: AND status = :status:',
            'bind' => ['taskId' => $taskId, 'status' => 'published'],
            'order' => 'sort_order ASC',
        ]) as $s) {
            if ($found) return (int) $s->id;
            if ((int) $s->id === $currentStageId) $found = true;
        }
        return null;
    }

    private function saveTaskProgress(UserTaskProgress $progress): Response
    {
        if ($progress->save() === false) {
            return $this->error('Failed to save progress', 500);
        }
        return $this->json(['taskProgress' => ProgressPresenter::taskProgress($progress)]);
    }

    private function resetTaskProgressFields(UserTaskProgress $progress): void
    {
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
    }

    private function resetStageProgressForTask(int $playerId, int $taskId): void
    {
        foreach (UserTaskStageProgress::find([
            'conditions' => 'user_id = :u: AND task_id = :t:',
            'bind' => ['u' => $playerId, 't' => $taskId],
        ]) as $sp) {
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
    }
}
