<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;

class GroupsController extends AbstractController
{
    public function indexAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $coachId = (int) $this->dispatcher->getParam('authUserId');

        $individuals = [];
        $individualGroups = Group::find([
            'conditions' => 'coach_id = :coachId: AND is_individual = true',
            'bind' => ['coachId' => $coachId],
        ]);

        foreach ($individualGroups as $group) {
            $players = $group->getPlayers();
            foreach ($players as $player) {
                $individuals[] = [
                    'groupId' => (int) $group->id,
                    'playerId' => (int) $player->id,
                    'playerName' => (string) $player->full_name,
                ];
            }
        }

        $classList = [];
        $classGroups = Group::find([
            'conditions' => 'coach_id = :coachId: AND is_individual = false',
            'bind' => ['coachId' => $coachId],
        ]);

        foreach ($classGroups as $group) {
            $classList[] = [
                'groupId' => (int) $group->id,
                'name' => (string) $group->name,
            ];
        }

        return $this->json([
            'individuals' => $individuals,
            'classes' => $classList,
        ]);
    }
}
