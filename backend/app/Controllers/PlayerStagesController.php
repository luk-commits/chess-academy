<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskStage;
use ChessAcademy\Models\User;
use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;
use ChessAcademy\Services\PlayerAccessService;
use ChessAcademy\Services\PositionPresenter;
use ChessAcademy\Services\ProgressPresenter;
use ChessAcademy\Services\SpacedRepetitionService;
use DateTimeImmutable;
use Phalcon\Http\Response;
use RuntimeException;

class PlayerStagesController extends AbstractController
{
    public function attemptAction(): Response
    {
        if ($err = $this->requireRole('PLAYER')) return $err;

        $stageId = $this->positiveIntParam('id', 'Invalid stage id');
        if ($stageId instanceof Response) return $stageId;

        $body = $this->jsonInput();
        if (!array_key_exists('passed', $body) || !is_bool($body['passed'])) {
            return $this->error("Field 'passed' must be a boolean", 400);
        }

        $playerId = $this->authUserId();

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null || $stage->status !== 'published') {
            return $this->error('Stage not found', 404);
        }

        $task = Task::findFirst((int) $stage->task_id);
        if ($task === null || $task->status !== 'published') {
            return $this->error('Stage not found', 404);
        }

        if (!(new PlayerAccessService())->playerHasAccessToTask($playerId, (int) $task->id)) {
            return $this->error('Forbidden', 403);
        }

        $stageProgress = UserTaskStageProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_stage_id = :s: AND in_repetition = :rep:',
            'bind' => ['u' => $playerId, 's' => $stageId, 'rep' => true],
        ]);
        if ($stageProgress === null) {
            return $this->error('Stage is not in your repetition list', 403);
        }

        try {
            $progress = (new SpacedRepetitionService())->recordAttempt($playerId, $stageId, (bool) $body['passed']);
        } catch (RuntimeException) {
            return $this->error('Failed to record attempt', 500);
        }

        return $this->json([
            'progress' => ['stageId' => (int) $progress->task_stage_id] + ProgressPresenter::spacedRepetition($progress),
        ]);
    }

    public function dueAction(): Response
    {
        if ($err = $this->requireRole('PLAYER')) return $err;

        $playerId = $this->authUserId();
        $access = new PlayerAccessService();

        $groupIds = $access->playerGroupIds($playerId);
        $taskIds = $access->taskIdsForGroups($groupIds);
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

        $nonArchivedTaskIds = [];
        foreach (UserTaskProgress::find([
            'conditions' => 'user_id = :userId: AND task_id IN ({taskIds:array}) AND status != :archived:',
            'bind' => ['userId' => $playerId, 'taskIds' => $publishedTaskIds, 'archived' => 'archived'],
        ]) as $utp) {
            $nonArchivedTaskIds[] = (int) $utp->task_id;
        }
        if (empty($nonArchivedTaskIds)) {
            return $this->json(['stages' => []]);
        }

        $repetitionStageIds = [];
        foreach (UserTaskStageProgress::find([
            'conditions' => 'user_id = :userId: AND in_repetition = :rep: AND task_id IN ({taskIds:array})',
            'bind' => ['userId' => $playerId, 'rep' => true, 'taskIds' => $nonArchivedTaskIds],
        ]) as $rs) {
            $repetitionStageIds[] = (int) $rs->task_stage_id;
        }
        if (empty($repetitionStageIds)) {
            return $this->json(['stages' => []]);
        }

        $stages = TaskStage::find([
            'conditions' => 'status = :status: AND id IN ({stageIds:array}) '
                . 'AND position_id IS NOT NULL AND solution_pgn IS NOT NULL',
            'bind' => ['status' => 'published', 'stageIds' => $repetitionStageIds],
        ]);
        if (count($stages) === 0) {
            return $this->json(['stages' => []]);
        }

        $stageIds = [];
        foreach ($stages as $stage) {
            $stageIds[] = (int) $stage->id;
        }

        $progressMap = $this->spacedProgressMap($playerId, $stageIds);

        $now = new DateTimeImmutable();
        $entries = [];
        foreach ($stages as $stage) {
            $progress = $progressMap[(int) $stage->id] ?? null;
            if ($progress !== null && new DateTimeImmutable((string) $progress->next_review_at) > $now) {
                continue;
            }
            $entries[] = ['stage' => $stage, 'progress' => $progress];
        }

        usort($entries, static function (array $a, array $b): int {
            if ($a['progress'] === null && $b['progress'] === null) {
                return (int) $a['stage']->id <=> (int) $b['stage']->id;
            }
            if ($a['progress'] === null) return -1;
            if ($b['progress'] === null) return 1;
            return strcmp((string) $a['progress']->next_review_at, (string) $b['progress']->next_review_at);
        });

        $result = [];
        foreach ($entries as $entry) {
            $stage = $entry['stage'];
            $position = $stage->position;
            if ($position === false) continue;
            $task = $taskMap[(int) $stage->task_id] ?? null;
            if ($task === null) continue;

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
                'position'     => PositionPresenter::present($position),
                'progress'     => $entry['progress'] !== null ? ProgressPresenter::spacedRepetition($entry['progress']) : null,
            ];
        }

        return $this->json(['stages' => $result]);
    }

    private function coachNameMap(array $coachIds): array
    {
        if (empty($coachIds)) return [];
        $map = [];
        foreach (User::find([
            'conditions' => 'id IN ({coachIds:array})',
            'bind'       => ['coachIds' => $coachIds],
        ]) as $coach) {
            $map[(int) $coach->id] = (string) $coach->full_name;
        }
        return $map;
    }

    private function spacedProgressMap(int $playerId, array $stageIds): array
    {
        if (empty($stageIds)) return [];
        $map = [];
        foreach (UserStageProgress::find([
            'conditions' => 'user_id = :userId: AND task_stage_id IN ({stageIds:array})',
            'bind'       => ['userId' => $playerId, 'stageIds' => $stageIds],
        ]) as $row) {
            $map[(int) $row->task_stage_id] = $row;
        }
        return $map;
    }
}
