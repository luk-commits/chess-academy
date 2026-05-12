<?php

declare(strict_types=1);

namespace ChessAcademy\Tasks;

use ChessAcademy\Models\Position;
use Phalcon\Cli\Task;

class ImportTask extends Task
{
    private string $importDir;
    private string $finishedDir;
    private string $tmpDir = '/tmp/import_positions';
    private bool $dryRun = true;

    public function positionsAction(): void
    {
        $this->importDir = BASE_PATH . '/imports/positions';
        $this->finishedDir = $this->importDir . '/finished';
        $this->dryRun = !in_array('--execute', $this->dispatcher->getParams(), true);

        if (!is_dir($this->importDir)) {
            echo "Error: import directory not found: {$this->importDir}\n";
            exit(1);
        }

        if (!is_dir($this->finishedDir)) {
            mkdir($this->finishedDir, 0755, true);
        }

        if (!is_dir($this->tmpDir)) {
            mkdir($this->tmpDir, 0755, true);
        }

        if ($this->dryRun) {
            echo "DRY RUN mode — add --execute to actually insert.\n\n";
        } else {
            echo "EXECUTE mode — inserting into database.\n\n";
        }

        $this->extractArchives();

        $csvFiles = $this->findCsvFiles();
        if (empty($csvFiles)) {
            echo "No CSV files found to import.\n";
            return;
        }

        foreach ($csvFiles as $csvPath) {
            $this->importCsv($csvPath);
        }

        $this->cleanup();
    }

    private function extractArchives(): void
    {
        $files = scandir($this->importDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }
            $path = $this->importDir . '/' . $file;
            if (!is_file($path)) {
                continue;
            }

            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            match ($ext) {
                'zip' => $this->extractZip($path, $file),
                'zst' => $this->extractZst($path, $file),
                default => null,
            };
        }
    }

    private function extractZip(string $path, string $filename): void
    {
        echo "Extracting: {$filename}\n";
        $zip = new \ZipArchive();
        if ($zip->open($path) === true) {
            $targetDir = $this->tmpDir . '/' . pathinfo($filename, PATHINFO_FILENAME);
            $zip->extractTo($targetDir);
            $zip->close();
            $this->moveToFinished($path, $filename);
            echo "  extracted to {$targetDir}/\n";
        } else {
            echo "  ERROR: Cannot open zip\n";
        }
    }

    private function extractZst(string $path, string $filename): void
    {
        echo "Extracting: {$filename}\n";
        $outputFile = $this->tmpDir . '/' . pathinfo($filename, PATHINFO_FILENAME);

        $cmd = sprintf('zstd -d "%s" -o "%s" 2>&1', $path, $outputFile);
        exec($cmd, $output, $exitCode);

        if ($exitCode === 0) {
            $this->moveToFinished($path, $filename);
            echo "  extracted to {$outputFile}\n";
        } else {
            echo "  ERROR: zstd decompression failed: " . implode("\n", $output) . "\n";
        }
    }

    private function moveToFinished(string $path, string $filename): void
    {
        $dest = $this->finishedDir . '/' . $filename;
        rename($path, $dest);
        echo "  archive moved to finished/\n";
    }

    private function findCsvFiles(): array
    {
        $files = [];

        $directFiles = glob($this->importDir . '/*.csv');
        if ($directFiles !== false) {
            $files = $directFiles;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->tmpDir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->getExtension() === 'csv') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }

    private function importCsv(string $csvPath): void
    {
        $filename = basename($csvPath);
        echo "\n=== Processing: {$filename} ===\n";

        $userId = stripos($filename, 'lichess') !== false ? 1 : 2;
        $userEmail = $userId === 1 ? 'lichess@chess.local' : 'chess.com@chess.local';
        echo "  Import user: {$userEmail} (id={$userId})\n";

        $handle = fopen($csvPath, 'r');
        if ($handle === false) {
            echo "  ERROR: Cannot open file.\n";
            return;
        }

        $headers = fgetcsv($handle);
        if ($headers === false || empty($headers)) {
            echo "  ERROR: Empty or invalid CSV.\n";
            fclose($handle);
            return;
        }
        $headers = array_map('trim', $headers);

        $lineNum = 1;
        $countInsert = 0;
        $countSkip = 0;
        $countError = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $lineNum++;
            if (count($row) !== count($headers)) {
                echo "  [ERR]  line {$lineNum}: column count mismatch (got " . count($row) . ", expected " . count($headers) . ")\n";
                $countError++;
                continue;
            }

            $data = array_combine($headers, $row);
            if ($data === false) {
                $countError++;
                continue;
            }

            $result = $this->processRow($data, $userId, $filename, $lineNum);
            match ($result) {
                'insert' => $countInsert++,
                'skip'   => $countSkip++,
                'error'  => $countError++,
                default  => null,
            };
        }

        fclose($handle);
        echo "  Result: {$countInsert} new, {$countSkip} duplicates, {$countError} errors\n\n";
    }

    private function processRow(array $data, int $userId, string $filename, int $lineNum): string
    {
        $fen = trim($data['FEN'] ?? '');
        if ($fen === '') {
            echo "  [SKIP] {$filename}:{$lineNum} → empty FEN\n";
            return 'skip';
        }

        $otherId = trim($data['PuzzleId'] ?? '');
        $rating = !empty($data['Rating']) ? (int) $data['Rating'] : null;
        $popularity = !empty($data['Popularity']) ? (int) $data['Popularity'] : null;
        $nbPlays = !empty($data['NbPlays']) ? (int) $data['NbPlays'] : null;

        if ($this->dryRun) {
            echo "  [DRY]  {$filename}:{$lineNum} → fen={$fen} rating={$rating} user={$userId}";

            $existing = Position::findFirst([
                'conditions' => 'fen = :fen:',
                'bind' => ['fen' => $fen],
            ]);

            if ($existing) {
                echo " DUPLICATE\n";
            } else {
                echo "\n";
            }
            return 'insert';
        }

        $existing = Position::findFirst([
            'conditions' => 'fen = :fen:',
            'bind' => ['fen' => $fen],
        ]);

        if ($existing) {
            echo "  [SKIP] {$filename}:{$lineNum} → duplicate FEN: {$fen}\n";
            return 'skip';
        }

        $position = new Position();
        $position->fen = $fen;
        $position->other_id = $otherId ?: null;
        $position->difficulty = $rating;
        $position->popularity = $popularity;
        $position->times_seen = $nbPlays;
        $position->is_puzzle = true;
        $position->created_by_user_id = $userId;

        if (!empty($data['Moves'])) {
            $movesArray = preg_split('/\s+/', trim($data['Moves']));
            $position->engine_top_lines = json_encode([['moves' => $movesArray]]);
        }

        if (!empty($data['Themes'])) {
            $themes = array_map('trim', explode(' ', $data['Themes']));
            $position->theme_tags = json_encode($themes);
        }

        if (!empty($data['GameUrl'])) {
            $url = trim($data['GameUrl']);
            if (str_contains($url, 'lichess.org')) {
                $position->other_game_id = mb_substr(trim(parse_url($url, PHP_URL_PATH) ?? '', '/'), 0, 50);
            } elseif (str_contains($url, 'chess.com')) {
                $position->other_game_id = mb_substr($url, 0, 50);
            }
        }

        if (!empty($data['OpeningTags'])) {
            $position->opening = mb_substr(trim($data['OpeningTags']), 0, 255);
        }

        try {
            if ($position->save() === false) {
                $msgs = [];
                foreach ($position->getMessages() as $msg) {
                    $msgs[] = $msg->getMessage();
                }
                echo "  [ERR]  {$filename}:{$lineNum} → " . implode('; ', $msgs) . "\n";
                return 'error';
            }
            echo "  [OK]   {$filename}:{$lineNum} → id={$position->id} fen={$fen}\n";
            return 'insert';
        } catch (\Throwable $e) {
            if (str_contains($e->getMessage(), 'uq_positions_fen')) {
                echo "  [SKIP] {$filename}:{$lineNum} → duplicate FEN: {$fen}\n";
                return 'skip';
            }
            echo "  [ERR]  {$filename}:{$lineNum} → " . $e->getMessage() . "\n";
            return 'error';
        }
    }

    private function cleanup(): void
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($this->tmpDir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $item) {
            if ($item->isDir()) {
                @rmdir($item->getPathname());
            } else {
                @unlink($item->getPathname());
            }
        }
        @rmdir($this->tmpDir);
        echo "Cleanup: removed {$this->tmpDir}\n";
    }
}
