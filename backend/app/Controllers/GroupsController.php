<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Group;
use Phalcon\Http\Response;

class GroupsController extends AbstractController
{
    public function indexAction(): Response
    {
        if ($err = $this->requireRole('COACH')) return $err;

        $coachId = $this->authUserId();

        $individuals = [];
        foreach (Group::find([
            'conditions' => 'coach_id = :coachId: AND is_individual = true',
            'bind' => ['coachId' => $coachId],
        ]) as $group) {
            foreach ($group->getPlayers() as $player) {
                $individuals[] = [
                    'groupId'    => (int) $group->id,
                    'playerId'   => (int) $player->id,
                    'playerName' => (string) $player->full_name,
                ];
            }
        }

        $classes = [];
        foreach (Group::find([
            'conditions' => 'coach_id = :coachId: AND is_individual = false',
            'bind' => ['coachId' => $coachId],
        ]) as $group) {
            $classes[] = [
                'groupId' => (int) $group->id,
                'name'    => (string) $group->name,
            ];
        }

        return $this->json(['individuals' => $individuals, 'classes' => $classes]);
    }
}
