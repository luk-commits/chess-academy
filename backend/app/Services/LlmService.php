<?php

declare(strict_types=1);

namespace ChessAcademy\Services;

class LlmService
{
    private string $baseUrl;
    private string $model;

    private const FORBIDDEN_WORDS = '/^(analiza|przeanalizuj|zadanie|temat|kurs|lekcja|opis|lekcja)[:\s]*/iu';

    public function __construct(
        string $baseUrl = 'http://192.168.2.92:11434',
        string $model = 'bielik-11b-v3-32k:latest'
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->model = $model;
    }

    /**
     * @param array $positions Each item: ['fen' => string, 'opening' => string, 'themeTags' => string[]]
     * @return string Generated title in Polish, empty string on failure
     */
    public function generateTaskTitle(array $positions): string
    {
        if (empty($positions)) {
            return '';
        }

        $input = $this->buildInput($positions);

        if ($input === '') {
            return '';
        }

        $response = $this->callOllama($input);

        if ($response === '') {
            return '';
        }

        return $this->cleanTitle($response);
    }

    /**
     * Generate one title per position in a single API call.
     *
     * @param array $positions Each item: ['fen' => string, 'opening' => string, 'themeTags' => string[]]
     * @return string[] Array of titles, empty string for failed generations
     */
    public function generateSeparateTitles(array $positions): array
    {
        if (empty($positions)) {
            return [];
        }

        $lines = [];
        foreach ($positions as $i => $pos) {
            $input = $this->buildInput([$pos]);
            if ($input !== '') {
                $lines[] = ($i + 1) . '. ' . $input;
            }
        }

        if (empty($lines)) {
            return [];
        }

        $prompt = "Krotkie tytuly szachowe po polsku (2-4 slow), kazdy w nowej linii:\n\n"
            . implode("\n", $lines);

        $response = $this->callOllamaMulti($prompt, count($positions) * 15 + 20);

        if ($response === '') {
            return array_fill(0, count($positions), '');
        }

        $titles = explode("\n", trim($response));
        $result = [];
        foreach ($titles as $raw) {
            $result[] = $this->cleanTitle($raw);
        }

        while (count($result) < count($positions)) {
            $result[] = '';
        }

        return array_slice($result, 0, count($positions));
    }

    /**
     * @param array $positions Each item: ['fen' => string, 'opening' => string, 'themeTags' => string[]]
     * @return string Clean input string for the model
     */
    private function buildInput(array $positions): string
    {
        if (empty($positions)) {
            return '';
        }

        $allOpenings = [];
        $allTags = [];
        $materialCategories = [];

        foreach ($positions as $pos) {
            $opening = trim($pos['opening'] ?? '');
            if ($opening !== '') {
                $allOpenings[] = $opening;
            }

            $tags = $pos['themeTags'] ?? [];
            if (is_array($tags)) {
                foreach ($tags as $t) {
                    $allTags[trim($t)] = true;
                }
            }

            $fen = trim($pos['fen'] ?? '');
            if ($fen !== '') {
                $cat = $this->classifyMaterial($fen);
                if ($cat !== '') {
                    $materialCategories[$cat] = true;
                }
            }
        }

        $parts = [];

        $uniqueOpenings = array_unique($allOpenings);
        if (count($uniqueOpenings) === 1) {
            $parts[] = reset($uniqueOpenings);
        } elseif (count($uniqueOpenings) > 1) {
            $parts[] = implode(', ', $uniqueOpenings);
        }

        $commonTags = array_keys($allTags);
        $tagText = str_replace(['_', '-'], ' ', implode(', ', $commonTags));
        if ($tagText !== '') {
            $parts[] = $tagText;
        }

        $materialText = implode(', ', array_keys($materialCategories));
        if ($materialText !== '') {
            $parts[] = $materialText;
        }

        return implode(' | ', $parts);
    }

    private function classifyMaterial(string $fen): string
    {
        $board = explode(' ', $fen)[0] ?? '';
        if ($board === '') {
            return '';
        }

        $counts = [];
        foreach (str_split($board) as $char) {
            if (in_array($char, ['K','Q','R','B','N','P','k','q','r','b','n','p'], true)) {
                $counts[$char] = ($counts[$char] ?? 0) + 1;
            }
        }

        $whitePawns = $counts['P'] ?? 0;
        $blackPawns = $counts['p'] ?? 0;
        $whiteHeavy = ($counts['Q'] ?? 0) + ($counts['R'] ?? 0);
        $blackHeavy = ($counts['q'] ?? 0) + ($counts['r'] ?? 0);
        $whiteLight = ($counts['B'] ?? 0) + ($counts['N'] ?? 0);
        $blackLight = ($counts['b'] ?? 0) + ($counts['n'] ?? 0);

        $totalPieces = array_sum($counts);
        $totalPawns = $whitePawns + $blackPawns;
        $totalHeavy = $whiteHeavy + $blackHeavy;
        $totalLight = $whiteLight + $blackLight;

        if ($totalPieces <= 6 && $totalPawns === 0 && $totalHeavy === 0) {
            return 'tylko lekkie figury';
        }
        if ($totalPieces <= 6 && $totalPawns === 0 && $totalHeavy > 0) {
            return 'tylko figury';
        }
        if ($totalHeavy === 0 && $totalLight === 0 && $totalPawns > 0) {
            return 'tylko piony';
        }
        if ($totalHeavy === 0 && $totalLight > 0 && $totalPawns > 0) {
            return 'lekkie figury i piony';
        }
        if ($totalPieces >= 28) {
            return 'pelny zestaw figur';
        }

        return '';
    }

    private function cleanTitle(string $raw): string
    {
        $title = trim($raw);
        $title = preg_replace('/^["\'\p{Pi}]+|["\'\p{Pf}]+$/u', '', $title);
        $title = preg_replace('/^Tytuł[:\s\->]*/iu', '', $title);
        $title = preg_replace(self::FORBIDDEN_WORDS, '', $title);
        $title = preg_replace('/^[\s\->]+/', '', $title);
        $title = preg_replace('/[.。!]+$/', '', $title);
        $title = preg_replace('/\s+/', ' ', $title);

        $parts = explode("\n", $title);
        $title = trim($parts[0]);

        if (mb_strlen($title) > 60) {
            $title = mb_substr($title, 0, 60);
            $lastSpace = mb_strrpos($title, ' ');
            if ($lastSpace > 0) {
                $title = mb_substr($title, 0, $lastSpace);
            }
        }

        $title = trim($title);
        $title = preg_replace('/^[:\s\->,;]+/', '', $title);
        $title = trim($title);

        return $title;
    }

    private function callOllamaMulti(string $message, int $numPredict): string
    {
        $payload = json_encode([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Generujesz krótkie tytuły zadań szachowych po polsku. Każdy tytuł w osobnej linii. Tylko tytuły, bez wyjaśnień.',
                ],
                [
                    'role' => 'user',
                    'content' => $message,
                ],
            ],
            'stream' => false,
            'options' => [
                'temperature' => 0.3,
                'num_predict' => $numPredict,
            ],
        ]);

        $ch = curl_init($this->baseUrl . '/api/chat');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error !== '' || $httpCode !== 200) {
            return '';
        }

        $decoded = json_decode($result, true);
        return $decoded['message']['content'] ?? '';
    }

    private function callOllama(string $message): string
    {
        $payload = json_encode([
            'model' => $this->model,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Generujesz krótki tytuł zadania szachowego po polsku (2-6 słów). Spójrz na podane otwarcie/warianty i tagi tematyczne. Zdecyduj co jest dominującym tematem (może być otwarcie, motyw taktyczny, lub kombinacja). Odpowiadasz tylko tytułem.',
                ],
                [
                    'role' => 'user',
                    'content' => $message,
                ],
            ],
            'stream' => false,
            'options' => [
                'temperature' => 0.3,
                'num_predict' => 30,
            ],
        ]);

        $ch = curl_init($this->baseUrl . '/api/chat');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 5,
        ]);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error !== '' || $httpCode !== 200) {
            return '';
        }

        $decoded = json_decode($result, true);
        return $decoded['message']['content'] ?? '';
    }
}
