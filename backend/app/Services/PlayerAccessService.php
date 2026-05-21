<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

use ChessAcademy\Models\GroupPlayers;
use ChessAcademy\Models\TaskGroup;
use RuntimeException;

class PlayerAccessService
{
    /**
     * @return int[]
     */
    public function playerGroupIds(int $playerId): array
    {
        return self::pluckUniqueInt(
            GroupPlayers::find([
                'conditions' => 'player_id = :playerId:',
                'bind'       => ['playerId' => $playerId],
            ]),
            'group_id'
        );
    }

    /**
     * @param int[] $groupIds
     * @return int[]
     */
    public function taskIdsForGroups(array $groupIds): array
    {
        if (empty($groupIds)) {
            return [];
        }
        return self::pluckUniqueInt(
            TaskGroup::find([
                'conditions' => 'group_id IN ({groupIds:array})',
                'bind'       => ['groupIds' => $groupIds],
            ]),
            'task_id'
        );
    }

    public function playerHasAccessToTask(int $playerId, int $taskId): bool
    {
        $groupIds = self::pluckUniqueInt(
            TaskGroup::find([
                'conditions' => 'task_id = :taskId:',
                'bind'       => ['taskId' => $taskId],
            ]),
            'group_id'
        );
        if (empty($groupIds)) {
            return false;
        }

        return GroupPlayers::findFirst([
            'conditions' => 'player_id = :playerId: AND group_id IN ({groupIds:array})',
            'bind'       => ['playerId' => $playerId, 'groupIds' => $groupIds],
        ]) !== null;
    }

    public function assertPlayerHasAccess(int $playerId, int $taskId): void
    {
        if (!$this->playerHasAccessToTask($playerId, $taskId)) {
            throw new RuntimeException('Forbidden');
        }
    }

    /**
     * @return int[]
     */
    private static function pluckUniqueInt(iterable $rows, string $field): array
    {
        $ids = [];
        foreach ($rows as $row) {
            $ids[] = (int) $row->{$field};
        }
        return array_values(array_unique($ids));
    }
}
