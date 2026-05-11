<?php

declare(strict_types=1);

namespace ChessAcademy\Tests\E2E;

use PHPUnit\Framework\TestCase;

final class AuthFlowTest extends TestCase
{
    private string $baseUrl;

    protected function setUp(): void
    {
        $this->baseUrl = rtrim(getenv('API_BASE_URL') ?: 'http://web', '/');
    }

    public function testRegisterAndLogin(): void
    {
        $email = 'e2e_' . bin2hex(random_bytes(4)) . '@chess.local';

        $register = $this->request('POST', '/api/register', [
            'email' => $email,
            'password' => 'Secret123!',
            'fullName' => 'E2E User',
            'role' => 'PLAYER',
        ]);
        $this->assertSame(201, $register['status']);
        $this->assertTrue($register['body']['ok']);

        $login = $this->request('POST', '/api/login', [
            'email' => $email,
            'password' => 'Secret123!',
        ]);
        $this->assertSame(200, $login['status']);
        $this->assertSame($email, $login['body']['user']['email']);
        $this->assertSame('E2E User', $login['body']['user']['fullName']);
    }

    public function testLoginWithInvalidCredentialsReturns401(): void
    {
        $response = $this->request('POST', '/api/login', [
            'email' => 'nonexistent@chess.local',
            'password' => 'wrong',
        ]);
        $this->assertSame(401, $response['status']);
        $this->assertSame('Invalid credentials', $response['body']['error']);
    }

    public function testRegisterWithMissingFieldsReturns422(): void
    {
        $response = $this->request('POST', '/api/register', [
            'email' => 'incomplete@chess.local',
        ]);
        $this->assertSame(422, $response['status']);
        $this->assertStringContainsString('required', $response['body']['error']);
    }

    private function request(string $method, string $path, ?array $data = null): array
    {
        $url = $this->baseUrl . $path;
        $ch = curl_init($url);

        $jsonBody = $data !== null ? json_encode($data, JSON_THROW_ON_ERROR) : null;

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
        ]);

        if ($jsonBody !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
        }

        $raw = curl_exec($ch);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $body = $raw !== false ? substr((string) $raw, $headerSize) : '';

        curl_close($ch);

        return [
            'status' => $statusCode,
            'body' => json_decode($body, true) ?? [],
        ];
    }
}
