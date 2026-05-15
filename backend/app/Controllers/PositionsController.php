<?php

declare(strict_types=1);

namespace ChessAcademy\Controllers;

use ChessAcademy\Models\Position;

class PositionsController extends AbstractController
{
    public function indexAction(): \Phalcon\Http\Response
    {
        $role = strtoupper((string) $this->dispatcher->getParam('authRole'));
        if ($role !== 'COACH') {
            return $this->error('Forbidden', 403);
        }

        $page = max(1, (int) $this->request->getQuery('page', 'int', 1));
        $perPage = (int) $this->request->getQuery('perPage', 'int', 12);
        $perPage = min(max($perPage, 1), 50);

        $search = trim((string) $this->request->getQuery('search', null, ''));
        if (mb_strlen($search) > 100) {
            $search = mb_substr($search, 0, 100);
        }

        $rawTags = trim((string) $this->request->getQuery('tags', null, ''));
        $tags = [];
        if ($rawTags !== '') {
            $parts = explode(',', $rawTags);
            foreach ($parts as $t) {
                $t = trim($t);
                if ($t !== '') {
                    $tags[] = $t;
                }
            }
        }

        $conditions = [];
        $bind = [];

        if ($search !== '') {
            $terms = array_values(array_filter(explode(' ', $search), static fn ($t) => trim($t) !== ''));
            if (count($terms) === 1) {
                $conditions[] = 'opening ILIKE :search:';
                $bind['search'] = '%' . $terms[0] . '%';
            } elseif (count($terms) > 1) {
                $searchClauses = [];
                foreach ($terms as $i => $term) {
                    $key = 'search_' . $i;
                    $searchClauses[] = "opening ILIKE :{$key}:";
                    $bind[$key] = '%' . $term . '%';
                }
                $conditions[] = implode(' AND ', $searchClauses);
            }
        }

        if (!empty($tags)) {
            $tagClauses = [];
            foreach ($tags as $i => $tag) {
                $key = 'tag_' . $i;
                $tagClauses[] = "jsonb_exists(theme_tags, :{$key}:)";
                $bind[$key] = $tag;
            }
            $conditions[] = implode(' AND ', $tagClauses);
        }

        $difficultyMin = $this->request->getQuery('difficultyMin', 'int');
        $difficultyMax = $this->request->getQuery('difficultyMax', 'int');

        if ($difficultyMin !== null) {
            $difficultyMin = max(0, (int) $difficultyMin);
            $conditions[] = 'difficulty >= :difficultyMin:';
            $bind['difficultyMin'] = $difficultyMin;
        }

        if ($difficultyMax !== null) {
            $difficultyMax = (int) $difficultyMax;
            $conditions[] = 'difficulty <= :difficultyMax:';
            $bind['difficultyMax'] = $difficultyMax;
        }

        $queryParams = [];
        if (!empty($conditions)) {
            $queryParams['conditions'] = implode(' AND ', $conditions);
            $queryParams['bind'] = $bind;
        }

        $total = (int) Position::count($queryParams);
        $totalPages = max(1, (int) ceil($total / $perPage));
        $page = min($page, $totalPages);

        $findParams = [
            'order' => 'popularity DESC, id DESC',
            'limit' => $perPage,
            'offset' => ($page - 1) * $perPage,
        ];

        if (isset($queryParams['conditions'])) {
            $findParams['conditions'] = $queryParams['conditions'];
            $findParams['bind'] = $queryParams['bind'];
        }

        // Fetch first 50 IDs from the same filtered query for batch selection
        $selectableIds = [];
        $idQueryParams = [
            'columns' => 'id',
            'order' => 'popularity DESC, id DESC',
            'limit' => 50,
            'offset' => 0,
        ];
        if (isset($queryParams['conditions'])) {
            $idQueryParams['conditions'] = $queryParams['conditions'];
            $idQueryParams['bind'] = $queryParams['bind'];
        }
        $idResult = Position::find($idQueryParams);
        foreach ($idResult as $row) {
            $selectableIds[] = (int) $row->id;
        }

        $items = [];
        $positions = Position::find($findParams);
        foreach ($positions as $position) {
            $themeTags = [];
            if (is_string($position->theme_tags) && $position->theme_tags !== '') {
                $decoded = json_decode($position->theme_tags, true);
                if (is_array($decoded)) {
                    $themeTags = array_values(array_filter($decoded, static fn ($item): bool => is_string($item)));
                }
            }

            $firstMove = null;
            if (is_string($position->engine_top_lines) && $position->engine_top_lines !== '') {
                $decoded = json_decode($position->engine_top_lines, true);
                if (is_array($decoded) && isset($decoded[0]['moves'][0])) {
                    $firstMove = $decoded[0]['moves'][0];
                }
            }

            $items[] = [
                'id' => (int) $position->id,
                'fen' => (string) $position->fen,
                'firstMove' => $firstMove,
                'opening' => $position->opening !== null ? (static fn(string $v): string =>
                    ($pos = mb_strpos($v, ' ')) !== false ? mb_substr($v, $pos + 1) : $v
                )($position->opening) : '',
                'themeTags' => $themeTags,
                'rating' => $position->rating !== null ? (int) $position->rating : null,
                'difficulty' => $position->difficulty !== null ? (int) $position->difficulty : null,
            ];
        }

        return $this->json([
            'items' => $items,
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => $totalPages,
            'search' => $search,
            'selectablePositionIds' => $selectableIds,
        ]);
    }
}
