<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

class TaskTitleGeneratorService
{
    private const DEFAULT_TITLE = 'Zadanie z pozycjami';

    /**
     * @var array<string, string>
     */
    private const TAG_LABELS = [
        'fork' => 'widelec',
        'pin' => 'zwiazanie',
        'skewer' => 'szpila',
        'discoveredattack' => 'atak odkryty',
        'doublecheck' => 'podwojny szach',
        'sacrifice' => 'poswiecenie',
        'clearance' => 'czyszczenie linii',
        'interference' => 'interferencja',
        'deflection' => 'odciagniecie figury',
        'xrayattack' => 'atak rentgenowski',
        'zugzwang' => 'zugzwang',
        'hangingpiece' => 'wiszaca figura',
        'trappedpiece' => 'uwieziona figura',
        'mate' => 'mat',
        'matein1' => 'mat w 1',
        'matein2' => 'mat w 2',
        'matein3' => 'mat w 3',
        'endgame' => 'koncowka',
        'opening' => 'debiut',
        'middlegame' => 'gra srodkowa',
        'advantage' => 'przewaga',
        'initiative' => 'inicjatywa',
        'space' => 'przestrzen',
        'kingsafety' => 'bezpieczenstwo krola',
        'pawnstructure' => 'struktura pionowa',
        'passedpawn' => 'wolny pion',
        'rookendgame' => 'koncowka wiezowa',
        'bishopendgame' => 'koncowka goncowa',
        'knightendgame' => 'koncowka skoczkowa',
        'queenendgame' => 'koncowka hetmanska',
    ];

    /**
     * @param array<int, array{fen?: string, opening?: string, themeTags?: array<int, string>}> $positions
     */
    public function generateTaskTitle(array $positions, string $openingName = ''): string
    {
        if ($positions === []) {
            return self::DEFAULT_TITLE;
        }

        $analysis = $this->analyzePositions($positions);

        if ($openingName !== '') {
            $analysis['opening'] = ['name' => $openingName, 'count' => count($positions), 'ratio' => 1.0];
            $analysis['openingFamily'] = ['name' => $openingName, 'count' => count($positions), 'ratio' => 1.0];
        }

        $title = $this->composeTitle($analysis);

        return $this->sanitizeTitle($title);
    }

    /**
     * @param array<int, array{fen?: string, opening?: string, themeTags?: array<int, string>}> $positions
     * @return array<int, string>
     */
    public function generateSeparateTitles(array $positions): array
    {
        $titles = [];
        foreach ($positions as $position) {
            $titles[] = $this->generateTaskTitle([$position]);
        }

        return $titles;
    }

    /**
     * @param array<int, array{fen?: string, opening?: string, themeTags?: array<int, string>}> $positions
     * @return array<string, mixed>
     */
    private function analyzePositions(array $positions): array
    {
        $openingCounts = [];
        $openingFamilyCounts = [];
        $phaseCounts = [];
        $materialCounts = [];
        $themeCounts = [];
        $signature = [];

        foreach ($positions as $position) {
            $openingRaw = trim((string) ($position['opening'] ?? ''));
            $openingName = $this->normalizeOpeningName($openingRaw);
            if ($openingName !== '') {
                $openingCounts[$openingName] = ($openingCounts[$openingName] ?? 0) + 1;
                $family = $this->openingFamily($openingName);
                if ($family !== '') {
                    $openingFamilyCounts[$family] = ($openingFamilyCounts[$family] ?? 0) + 1;
                }
                $signature[] = 'o:' . $openingName;
            }

            $fen = trim((string) ($position['fen'] ?? ''));
            if ($fen !== '') {
                $phase = $this->detectPhase($fen);
                $material = $this->detectMaterialProfile($fen);
                $phaseCounts[$phase] = ($phaseCounts[$phase] ?? 0) + 1;
                $materialCounts[$material] = ($materialCounts[$material] ?? 0) + 1;
                $signature[] = 'p:' . $phase;
                $signature[] = 'm:' . $material;
            }

            $tags = $position['themeTags'] ?? [];
            if (is_array($tags)) {
                foreach ($tags as $tag) {
                    $label = $this->labelForTag((string) $tag);
                    if ($label === '') {
                        continue;
                    }
                    $themeCounts[$label] = ($themeCounts[$label] ?? 0) + 1;
                    $signature[] = 't:' . $label;
                }
            }
        }

        sort($signature);

        return [
            'positionsCount' => count($positions),
            'opening' => $this->dominant($openingCounts, count($positions)),
            'openingFamily' => $this->dominant($openingFamilyCounts, count($positions)),
            'phase' => $this->dominant($phaseCounts, count($positions)),
            'material' => $this->dominant($materialCounts, count($positions)),
            'theme' => $this->dominant($themeCounts, count($positions)),
            'signature' => implode('|', $signature),
        ];
    }

    /**
     * @param array<string, mixed> $analysis
     */
    private function composeTitle(array $analysis): string
    {
        $opening = $analysis['opening'];
        $openingFamily = $analysis['openingFamily'];
        $phase = $analysis['phase'];
        $material = $analysis['material'];
        $theme = $analysis['theme'];

        $openingName = (string) ($opening['name'] ?? '');
        $openingFamilyName = (string) ($openingFamily['name'] ?? '');
        $phaseName = (string) ($phase['name'] ?? '');
        $materialName = (string) ($material['name'] ?? '');
        $themeName = (string) ($theme['name'] ?? '');

        $openingStrong = (float) ($opening['ratio'] ?? 0.0) >= 0.80;
        $themeStrong = (float) ($theme['ratio'] ?? 0.0) >= 0.35;
        $phaseStrong = (float) ($phase['ratio'] ?? 0.0) >= 0.60;
        $materialStrong = (float) ($material['ratio'] ?? 0.0) >= 0.55;

        $pool = [];

        if ($themeName !== '') {
            $pool[] = ucfirst($themeName);
        }

        if ($openingStrong && $openingName !== '') {
            $pool[] = $this->shortOpening($openingName);
        } elseif ($openingFamilyName !== '' && ($themeStrong || $phaseStrong)) {
            $pool[] = $openingFamilyName;
        }

        if ($phaseStrong && $phaseName !== '') {
            $pool[] = $phaseName;
        }

        if ($materialStrong && $materialName !== '') {
            $pool[] = $materialName;
        }

        $pool = array_values(array_unique(array_filter($pool)));

        if ($pool === []) {
            return self::DEFAULT_TITLE;
        }

        $variant = $this->pickVariant((string) ($analysis['signature'] ?? ''), 6);

        $a = $pool[0] ?? '';
        $b = $pool[1] ?? '';

        if ($b === '') {
            $options = [
                $a,
                'Trening ' . mb_strtolower($a),
                mb_strtolower($a) . ' w praktyce',
            ];

            return $options[$variant % count($options)];
        }

        $templates = [
            '%s w %s',
            '%s i %s',
            '%s: %s',
            'Trening %s i %s',
            '%s - %s',
            '%s pod katem %s',
        ];

        $template = $templates[$variant % count($templates)];
        if (strpos($template, 'pod katem') !== false) {
            return sprintf($template, $b, mb_strtolower($a));
        }

        return sprintf($template, $a, $b);
    }

    private function sanitizeTitle(string $title): string
    {
        $title = trim($title);
        if ($title === '') {
            return self::DEFAULT_TITLE;
        }

        $title = preg_replace('/\s+/', ' ', $title) ?? $title;
        $title = preg_replace('/^[^\p{L}\d]+/u', '', $title) ?? $title;
        $title = preg_replace('/[\.;:,\-\s]+$/u', '', $title) ?? $title;

        if ($title === '') {
            return self::DEFAULT_TITLE;
        }

        if (mb_strlen($title) > 64) {
            $cut = mb_substr($title, 0, 64);
            $lastSpace = mb_strrpos($cut, ' ');
            $title = $lastSpace !== false ? mb_substr($cut, 0, $lastSpace) : $cut;
        }

        return $title !== '' ? $title : self::DEFAULT_TITLE;
    }

    private function pickVariant(string $signature, int $mod): int
    {
        if ($mod <= 0) {
            return 0;
        }

        return (int) (abs(crc32($signature)) % $mod);
    }

    private function normalizeOpeningName(string $opening): string
    {
        $opening = trim($opening);
        if ($opening === '') {
            return '';
        }

        if (preg_match('/^[A-E]\d{2,3}\s+(.+)$/', $opening, $m) === 1) {
            return trim($m[1]);
        }

        return $opening;
    }

    private function openingFamily(string $opening): string
    {
        if ($opening === '') {
            return '';
        }

        if (stripos($opening, 'Defense') !== false || stripos($opening, 'Defence') !== false) {
            $firstWord = explode(' ', $opening)[0] ?? '';
            return trim($firstWord . ' Defense');
        }

        $chunks = preg_split('/[:\-]/', $opening);
        $left = trim((string) ($chunks[0] ?? $opening));
        if ($left === '') {
            return $opening;
        }

        $words = preg_split('/\s+/', $left);
        if (count($words) >= 2) {
            return $words[0] . ' ' . $words[1];
        }

        return $left;
    }

    private function shortOpening(string $opening): string
    {
        $opening = trim($opening);
        if ($opening === '') {
            return '';
        }

        $opening = str_replace('Opening', '', $opening);
        $opening = str_replace('Defense', 'Defense', $opening);
        $opening = preg_replace('/\s+/', ' ', trim($opening)) ?? $opening;

        return $opening;
    }

    private function labelForTag(string $rawTag): string
    {
        $tag = strtolower(trim($rawTag));
        if ($tag === '') {
            return '';
        }

        $normalized = preg_replace('/[^a-z0-9]/', '', $tag) ?? $tag;
        if (isset(self::TAG_LABELS[$normalized])) {
            return self::TAG_LABELS[$normalized];
        }

        if (strpos($normalized, 'mate') !== false) {
            return 'mat';
        }
        if (strpos($normalized, 'fork') !== false) {
            return 'widelec';
        }
        if (strpos($normalized, 'pin') !== false) {
            return 'zwiazanie';
        }
        if (strpos($normalized, 'endgame') !== false) {
            return 'koncowka';
        }
        if (strpos($normalized, 'opening') !== false) {
            return 'debiut';
        }
        if (strpos($normalized, 'sac') !== false) {
            return 'poswiecenie';
        }
        if (strpos($normalized, 'attack') !== false) {
            return 'atak';
        }

        return '';
    }

    private function detectPhase(string $fen): string
    {
        $board = explode(' ', $fen)[0] ?? '';
        if ($board === '') {
            return 'gra srodkowa';
        }

        $pawns = 0;
        $major = 0;
        $minor = 0;

        foreach (str_split($board) as $char) {
            if ($char === 'P' || $char === 'p') {
                $pawns++;
                continue;
            }

            if (in_array($char, ['Q', 'q', 'R', 'r'], true)) {
                $major++;
                continue;
            }

            if (in_array($char, ['B', 'b', 'N', 'n'], true)) {
                $minor++;
            }
        }

        if ($pawns <= 6 && ($major + $minor) <= 6) {
            return 'koncowka';
        }
        if ($pawns >= 12 && ($major + $minor) >= 10) {
            return 'debiut';
        }

        return 'gra srodkowa';
    }

    private function detectMaterialProfile(string $fen): string
    {
        $board = explode(' ', $fen)[0] ?? '';
        if ($board === '') {
            return 'profil mieszany';
        }

        $pawns = 0;
        $major = 0;
        $minor = 0;

        foreach (str_split($board) as $char) {
            if ($char === 'P' || $char === 'p') {
                $pawns++;
                continue;
            }
            if (in_array($char, ['Q', 'q', 'R', 'r'], true)) {
                $major++;
                continue;
            }
            if (in_array($char, ['B', 'b', 'N', 'n'], true)) {
                $minor++;
            }
        }

        if ($pawns > 0 && $major === 0 && $minor === 0) {
            return 'koncowka pionowa';
        }
        if ($pawns === 0 && $major === 0 && $minor > 0) {
            return 'koncowka lekkich figur';
        }
        if ($pawns > 0 && $major > 0 && $minor === 0) {
            return 'koncowka ciezkich figur';
        }
        if ($major > 0 && $minor > 0) {
            return 'pelna walka figur';
        }

        return 'profil mieszany';
    }

    /**
     * @param array<string, int> $counts
     * @return array{name: string, count: int, ratio: float}
     */
    private function dominant(array $counts, int $total): array
    {
        if ($counts === [] || $total <= 0) {
            return ['name' => '', 'count' => 0, 'ratio' => 0.0];
        }

        arsort($counts);
        $name = (string) array_key_first($counts);
        $count = (int) ($counts[$name] ?? 0);

        return [
            'name' => $name,
            'count' => $count,
            'ratio' => $count / $total,
        ];
    }
}
