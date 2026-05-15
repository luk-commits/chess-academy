<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use ChessAcademy\Models\UserStageProgress;
use DateTimeImmutable;
use RuntimeException;

class SpacedRepetitionService
{
    private const INITIAL_INTERVAL_DAYS = 1;
    private const SECOND_INTERVAL_DAYS  = 3;
    private const THIRD_INTERVAL_DAYS   = 6;
    private const INTERVAL_MULTIPLIER   = 2.5;
    private const LAPSE_INTERVAL_DAYS   = 1;

    public function recordAttempt(int $userId, int $stageId, bool $passed): UserStageProgress
    {
        $progress = UserStageProgress::findFirst([
            'conditions' => 'user_id = :u: AND task_stage_id = :s:',
            'bind'       => ['u' => $userId, 's' => $stageId],
        ]);

        if ($progress === null) {
            $progress = new UserStageProgress();
            $progress->user_id = $userId;
            $progress->task_stage_id = $stageId;
            $progress->repetitions = 0;
            $progress->interval_days = 0;
            $progress->attempts_total = 0;
        }

        $this->applyResult($progress, $passed);

        if ($progress->save() === false) {
            throw new RuntimeException(
                'Failed to persist user stage progress: '
                . implode('; ', array_map(static fn ($m) => (string) $m->getMessage(), $progress->getMessages()))
            );
        }

        return $progress;
    }

    private function applyResult(UserStageProgress $p, bool $passed): void
    {
        $p->attempts_total = (int) $p->attempts_total + 1;
        $p->last_result = $passed ? 'pass' : 'fail';
        $p->last_reviewed_at = (new DateTimeImmutable())->format('c');

        if (!$passed) {
            $p->repetitions = 0;
            $p->interval_days = self::LAPSE_INTERVAL_DAYS;
        } else {
            $p->interval_days = $this->nextInterval((int) $p->repetitions, (int) $p->interval_days);
            $p->repetitions = (int) $p->repetitions + 1;
        }

        $p->next_review_at = (new DateTimeImmutable("+{$p->interval_days} days"))->format('c');
    }

    private function nextInterval(int $reps, int $currentDays): int
    {
        return match (true) {
            $reps === 0 => self::INITIAL_INTERVAL_DAYS,
            $reps === 1 => self::SECOND_INTERVAL_DAYS,
            $reps === 2 => self::THIRD_INTERVAL_DAYS,
            default     => max(1, (int) round($currentDays * self::INTERVAL_MULTIPLIER)),
        };
    }
}
