<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use ChessAcademy\Models\UserStageProgress;
use ChessAcademy\Models\UserTaskProgress;
use ChessAcademy\Models\UserTaskStageProgress;

class ProgressPresenter
{
    public static function taskProgress(UserTaskProgress $p): array
    {
        return [
            'status'         => (string) $p->status,
            'currentStageId' => $p->current_stage_id !== null ? (int) $p->current_stage_id : null,
            'startedAt'      => $p->started_at !== null ? (string) $p->started_at : null,
            'lastActivityAt' => $p->last_activity_at !== null ? (string) $p->last_activity_at : null,
            'interruptedAt'  => $p->interrupted_at !== null ? (string) $p->interrupted_at : null,
            'completedAt'    => $p->completed_at !== null ? (string) $p->completed_at : null,
            'archivedAt'     => $p->archived_at !== null ? (string) $p->archived_at : null,
            'totalTimeMs'    => (int) $p->total_time_ms,
            'attemptsTotal'  => (int) $p->attempts_total,
            'errorsTotal'    => (int) $p->errors_total,
        ];
    }

    public static function stageProgress(UserTaskStageProgress $p): array
    {
        $wrongMoves = [];
        if (is_string($p->wrong_moves) && $p->wrong_moves !== '') {
            $decoded = json_decode($p->wrong_moves, true);
            if (is_array($decoded)) {
                $wrongMoves = $decoded;
            }
        }

        return [
            'status'              => (string) $p->status,
            'attemptsTotal'       => (int) $p->attempts_total,
            'errorsTotal'         => (int) $p->errors_total,
            'wrongMoves'          => $wrongMoves,
            'thinkingTimeMs'      => (int) $p->thinking_time_ms,
            'avgMoveTimeMs'       => (int) $p->avg_move_time_ms,
            'longestMoveTimeMs'   => (int) $p->longest_move_time_ms,
            'firstErrorAtPly'     => $p->first_error_at_ply !== null ? (int) $p->first_error_at_ply : null,
            'completedAt'         => $p->completed_at !== null ? (string) $p->completed_at : null,
            'inRepetition'        => (bool) $p->in_repetition,
            'addedToRepetitionAt' => $p->added_to_repetition_at !== null ? (string) $p->added_to_repetition_at : null,
        ];
    }

    public static function spacedRepetition(UserStageProgress $p): array
    {
        return [
            'repetitions'    => (int) $p->repetitions,
            'intervalDays'   => (int) $p->interval_days,
            'lastResult'     => $p->last_result !== null ? (string) $p->last_result : null,
            'lastReviewedAt' => $p->last_reviewed_at !== null ? (string) $p->last_reviewed_at : null,
            'nextReviewAt'   => (string) $p->next_review_at,
            'attemptsTotal'  => (int) $p->attempts_total,
        ];
    }
}
