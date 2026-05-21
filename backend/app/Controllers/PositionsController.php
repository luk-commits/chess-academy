<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Position;
use ChessAcademy\Services\PositionPresenter;
use Phalcon\Http\Response;

class PositionsController extends AbstractController
{
    public function indexAction(): Response
    {
        if ($err = $this->requireRole('COACH')) return $err;

        $page = max(1, (int) $this->request->getQuery('page', 'int', 1));
        $perPage = min(max((int) $this->request->getQuery('perPage', 'int', 12), 1), 50);

        $search = mb_substr(trim((string) $this->request->getQuery('search', null, '')), 0, 100);

        [$conditions, $bind] = $this->buildFilters($search);

        if ($this->request->getQuery('onlyNew', 'int', 0)) {
            $this->applyOnlyNewFilter($conditions, $bind);
        }

        $queryParams = empty($conditions) ? [] : [
            'conditions' => implode(' AND ', $conditions),
            'bind'       => $bind,
        ];

        $total = (int) Position::count($queryParams);
        $totalPages = max(1, (int) ceil($total / $perPage));
        $page = min($page, $totalPages);

        $selectableIds = $this->fetchIds($queryParams, 50);

        $items = [];
        foreach (Position::find($queryParams + [
            'order'  => 'popularity DESC, id DESC',
            'limit'  => $perPage,
            'offset' => ($page - 1) * $perPage,
        ]) as $position) {
            $items[] = PositionPresenter::present($position, includeMoves: false);
        }

        return $this->json([
            'items'                 => $items,
            'page'                  => $page,
            'perPage'               => $perPage,
            'total'                 => $total,
            'totalPages'            => $totalPages,
            'search'                => $search,
            'selectablePositionIds' => $selectableIds,
        ]);
    }

    /**
     * @return array{0: array<int, string>, 1: array<string, mixed>}
     */
    private function buildFilters(string $search): array
    {
        $conditions = [];
        $bind = [];

        if ($search !== '') {
            $terms = array_values(array_filter(explode(' ', $search), static fn ($t) => trim($t) !== ''));
            if (count($terms) === 1) {
                $conditions[] = 'opening ILIKE :search:';
                $bind['search'] = '%' . $terms[0] . '%';
            } elseif (count($terms) > 1) {
                $clauses = [];
                foreach ($terms as $i => $term) {
                    $key = 'search_' . $i;
                    $clauses[] = "opening ILIKE :{$key}:";
                    $bind[$key] = '%' . $term . '%';
                }
                $conditions[] = implode(' AND ', $clauses);
            }
        }

        $tags = array_values(array_filter(array_map('trim', explode(',', (string) $this->request->getQuery('tags', null, '')))));
        if (!empty($tags)) {
            $clauses = [];
            foreach ($tags as $i => $tag) {
                $key = 'tag_' . $i;
                $clauses[] = "jsonb_exists(theme_tags, :{$key}:)";
                $bind[$key] = $tag;
            }
            $conditions[] = implode(' AND ', $clauses);
        }

        $difficultyMin = $this->request->getQuery('difficultyMin', 'int');
        if ($difficultyMin !== null) {
            $conditions[] = 'difficulty >= :difficultyMin:';
            $bind['difficultyMin'] = max(0, (int) $difficultyMin);
        }

        $difficultyMax = $this->request->getQuery('difficultyMax', 'int');
        if ($difficultyMax !== null) {
            $conditions[] = 'difficulty <= :difficultyMax:';
            $bind['difficultyMax'] = (int) $difficultyMax;
        }

        return [$conditions, $bind];
    }

    /**
     * @param array<int, string> $conditions
     * @param array<string, mixed> $bind
     */
    private function applyOnlyNewFilter(array &$conditions, array &$bind): void
    {
        $coachId = $this->authUserId();

        $excludedRows = $this->db->fetchAll(
            "SELECT DISTINCT ts.position_id
             FROM task_stages ts
             JOIN tasks t ON t.id = ts.task_id
             JOIN task_groups tg ON tg.task_id = t.id
             JOIN groups g ON g.id = tg.group_id
             WHERE g.coach_id = ?
               AND ts.position_id IS NOT NULL",
            \Phalcon\Db\Enum::FETCH_ASSOC,
            [$coachId]
        );
        if (empty($excludedRows)) return;

        $placeholders = [];
        foreach ($excludedRows as $i => $row) {
            $key = 'excluded_' . $i;
            $placeholders[] = ':' . $key . ':';
            $bind[$key] = (int) $row['position_id'];
        }
        $conditions[] = 'id NOT IN (' . implode(',', $placeholders) . ')';
    }

    /**
     * @param array<string, mixed> $queryParams
     * @return int[]
     */
    private function fetchIds(array $queryParams, int $limit): array
    {
        $ids = [];
        foreach (Position::find($queryParams + [
            'columns' => 'id',
            'order'   => 'popularity DESC, id DESC',
            'limit'   => $limit,
            'offset'  => 0,
        ]) as $row) {
            $ids[] = (int) $row->id;
        }
        return $ids;
    }
}
