<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Position;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskStage;

class CoachStagesController extends AbstractController
{
    private const ALLOWED_STAGE_STATUSES = ['draft', 'in_progress', 'published'];

    public function showAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $coachId = (int) $this->dispatcher->getParam('authUserId');
        $stageId = (int) $this->dispatcher->getParam('id');
        if ($stageId <= 0) {
            return $this->error('Invalid stage id', 400);
        }

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null) {
            return $this->error('Stage not found', 404);
        }

        $task = Task::findFirst((int) $stage->task_id);
        if ($task === null || (int) $task->coach_id !== $coachId) {
            return $this->error('Stage not found', 404);
        }

        $positionFen = null;
        if ($stage->position_id !== null) {
            $position = Position::findFirst((int) $stage->position_id);
            if ($position !== null) {
                $positionFen = (string) $position->fen;
            }
        }

        return $this->json([
            'stage' => [
                'id'             => (int) $stage->id,
                'taskId'         => (int) $stage->task_id,
                'taskTitle'      => (string) $task->title,
                'title'          => (string) $stage->title,
                'sortOrder'      => (int) $stage->sort_order,
                'status'         => (string) $stage->status,
                'solutionPgn'    => $stage->solution_pgn !== null ? (string) $stage->solution_pgn : null,
                'positionId'     => $stage->position_id !== null ? (int) $stage->position_id : null,
                'positionFen'    => $positionFen,
            ],
        ]);
    }

    public function updateAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $coachId = (int) $this->dispatcher->getParam('authUserId');
        $stageId = (int) $this->dispatcher->getParam('id');
        if ($stageId <= 0) {
            return $this->error('Invalid stage id', 400);
        }

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null) {
            return $this->error('Stage not found', 404);
        }

        $task = Task::findFirst((int) $stage->task_id);
        if ($task === null || (int) $task->coach_id !== $coachId) {
            return $this->error('Stage not found', 404);
        }

        $payload = $this->jsonInput();

        if (array_key_exists('title', $payload)) {
            $title = trim((string) $payload['title']);
            if ($title === '') {
                return $this->error('Tytuł etapu nie może być pusty', 422);
            }
            $stage->title = $title;
        }

        if (array_key_exists('solutionPgn', $payload)) {
            $raw = $payload['solutionPgn'];
            $trimmed = is_string($raw) ? trim($raw) : '';
            $stage->solution_pgn = $trimmed === '' ? null : $trimmed;
        }

        if (array_key_exists('status', $payload)) {
            $status = (string) $payload['status'];
            if (!in_array($status, self::ALLOWED_STAGE_STATUSES, true)) {
                return $this->error('Nieprawidłowy status etapu', 422);
            }
            if ($status === 'published' && ($stage->solution_pgn === null || $stage->solution_pgn === '')) {
                return $this->error('Nie można opublikować etapu bez rozwiązania (PGN)', 422);
            }
            $stage->status = $status;
        }

        if ($stage->save() === false) {
            return $this->error(implode(' ', array_map(static fn ($m) => (string) $m->getMessage(), $stage->getMessages())), 422);
        }

        return $this->json([
            'stage' => [
                'id'             => (int) $stage->id,
                'taskId'         => (int) $stage->task_id,
                'title'          => (string) $stage->title,
                'sortOrder'      => (int) $stage->sort_order,
                'status'         => (string) $stage->status,
                'solutionPgn'    => $stage->solution_pgn !== null ? (string) $stage->solution_pgn : null,
                'positionId'     => $stage->position_id !== null ? (int) $stage->position_id : null,
            ],
        ]);
    }
}
