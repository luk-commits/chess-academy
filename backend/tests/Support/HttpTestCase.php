<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\Support;

use Phalcon\Mvc\ModelInterface;
use PHPUnit\Framework\TestCase;

/**
 * Base class for E2E HTTP tests. Provides a curl-based client with cookie jar,
 * a login helper, and a few shared assertions/utilities.
 */
abstract class HttpTestCase extends TestCase
{
    protected const COACH_EMAIL = 'coach@chess.local';
    protected const COACH_PASSWORD = 'password123';
    protected const COACH_ID = 3;
    protected const PLAYER_EMAIL = 'player@chess.local';
    protected const PLAYER_PASSWORD = 'password123';
    protected const PLAYER_ID = 4;

    protected string $baseUrl;
    protected string $cookieJar;

    protected function setUp(): void
    {
        $this->baseUrl = rtrim(getenv('API_BASE_URL') ?: 'http://web', '/');
        $this->cookieJar = tempnam(sys_get_temp_dir(), 'cj_');
    }

    protected function tearDown(): void
    {
        if (isset($this->cookieJar) && is_file($this->cookieJar)) {
            unlink($this->cookieJar);
        }
    }

    /**
     * @return array{status: int, body: array<mixed>}
     */
    protected function request(string $method, string $path, ?array $data = null): array
    {
        $ch = curl_init($this->baseUrl . $path);
        $jsonBody = $data !== null ? json_encode($data, JSON_THROW_ON_ERROR) : null;

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER         => true,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_COOKIEJAR      => $this->cookieJar,
            CURLOPT_COOKIEFILE     => $this->cookieJar,
        ]);

        if ($jsonBody !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
        }

        $raw = curl_exec($ch);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = $raw !== false ? substr((string) $raw, $headerSize) : '';
        curl_close($ch);

        return [
            'status' => $statusCode,
            'body'   => json_decode($body, true) ?? [],
        ];
    }

    protected function loginAs(string $email, string $password): void
    {
        if (is_file($this->cookieJar)) {
            file_put_contents($this->cookieJar, '');
        }
        $login = $this->request('POST', '/api/login', ['email' => $email, 'password' => $password]);
        $this->assertSame(200, $login['status'], 'login failed: ' . json_encode($login['body']));
    }

    protected function loginAsPlayer(): void
    {
        $this->loginAs(self::PLAYER_EMAIL, self::PLAYER_PASSWORD);
    }

    protected function loginAsCoach(): void
    {
        $this->loginAs(self::COACH_EMAIL, self::COACH_PASSWORD);
    }

    protected function modelErrors(ModelInterface $model): string
    {
        return implode('; ', array_map(static fn ($msg) => (string) $msg->getMessage(), $model->getMessages()));
    }

    protected function assertSavedOk(ModelInterface $model): void
    {
        $this->assertTrue($model->save(), $this->modelErrors($model));
    }
}
