<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Position;
use ChessAcademy\Models\Task;
use ChessAcademy\Models\TaskStage;
use Phalcon\Http\Response;

class CoachStagesController extends AbstractController
{
    private const ALLOWED_STAGE_STATUSES = ['draft', 'in_progress', 'published'];

    public function showAction(): Response
    {
        $stage = $this->resolveOwnedStage();
        if ($stage instanceof Response) return $stage;

        $task = Task::findFirst((int) $stage->task_id);

        $positionFen = null;
        if ($stage->position_id !== null) {
            $position = Position::findFirst((int) $stage->position_id);
            if ($position !== null) {
                $positionFen = (string) $position->fen;
            }
        }

        return $this->json([
            'stage' => $this->serializeStage($stage, $task !== null ? (string) $task->title : null, $positionFen),
        ]);
    }

    public function updateAction(): Response
    {
        $stage = $this->resolveOwnedStage();
        if ($stage instanceof Response) return $stage;

        $payload = $this->jsonInput();

        if (array_key_exists('title', $payload)) {
            $title = trim((string) $payload['title']);
            if ($title === '') return $this->error('Tytuł etapu nie może być pusty', 422);
            $stage->title = $title;
        }

        if (array_key_exists('solutionPgn', $payload)) {
            $trimmed = is_string($payload['solutionPgn']) ? trim($payload['solutionPgn']) : '';
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
            return $this->error($this->modelErrors($stage), 422);
        }

        return $this->json(['stage' => $this->serializeStage($stage)]);
    }

    private function resolveOwnedStage(): TaskStage|Response
    {
        if ($err = $this->requireRole('COACH')) return $err;

        $stageId = $this->positiveIntParam('id', 'Invalid stage id');
        if ($stageId instanceof Response) return $stageId;

        $stage = TaskStage::findFirst($stageId);
        if ($stage === null) return $this->error('Stage not found', 404);

        $task = Task::findFirst((int) $stage->task_id);
        if ($task === null || (int) $task->coach_id !== $this->authUserId()) {
            return $this->error('Stage not found', 404);
        }

        return $stage;
    }

    private function serializeStage(TaskStage $stage, ?string $taskTitle = null, ?string $positionFen = null): array
    {
        $data = [
            'id'          => (int) $stage->id,
            'taskId'      => (int) $stage->task_id,
            'title'       => (string) $stage->title,
            'sortOrder'   => (int) $stage->sort_order,
            'status'      => (string) $stage->status,
            'solutionPgn' => $stage->solution_pgn !== null ? (string) $stage->solution_pgn : null,
            'positionId'  => $stage->position_id !== null ? (int) $stage->position_id : null,
        ];

        if ($taskTitle !== null) {
            $data['taskTitle'] = $taskTitle;
            $data['positionFen'] = $positionFen;
        }

        return $data;
    }
}
