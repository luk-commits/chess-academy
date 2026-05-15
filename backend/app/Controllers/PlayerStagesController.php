<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskGroup;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Services\SpacedRepetitionService;
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
