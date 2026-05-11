# ChessAcademy

Profesjonalna platforma trenerska Trener-Zawodnik. Monorepo: Phalcon PHP API + React/Vite/MUI frontend + PostgreSQL.

## Stack

- **Backend**: PHP 8.3, Phalcon 5.x, firebase/php-jwt
- **Frontend**: React 18, TypeScript, Vite, MUI 6
- **DB**: PostgreSQL 16
- **Infra**: Docker Compose (Nginx + PHP-FPM)

## Uruchomienie

```bash
docker compose up --build
```

Po starcie:

- Frontend: http://localhost:5173
- API: http://localhost:8080
- Postgres: localhost:5432 (user: `chess`, db: `chess_academy`)

## Konta demo

| Email                 | Hasło         | Rola   |
| --------------------- | ------------- | ------ |
| coach@chess.local     | password123   | COACH  |
| player@chess.local    | password123   | PLAYER |

## Endpointy

- `POST /api/login` - logowanie, ustawia HttpOnly cookie `chess_session`
- `POST /api/logout` - wygaszenie sesji
- `GET  /api/me` - aktualnie zalogowany użytkownik (wymaga ciasteczka)

## Testy

Aby uruchomić testy w środowisku Docker, możesz użyć następujących komend:

### Backend (Phalcon API)
Uruchomienie testu jednostkowego dla konkretnej klasy:
\`\`\`bash
docker compose exec backend composer test -- tests/Unit/JwtServiceTest.php
\`\`\`

### Frontend (React/Playwright)
\`\`\`bash
# Uruchomienie testu dla formularza rejestracji dla E2E z Playwright
docker compose exec frontend npx playwright test tests/register.spec.ts
\`\`\`

## Struktura

```
chess/
├── backend/          # Phalcon API (app/, public/, migrations/)
├── frontend/         # React + Vite + MUI
├── docker/
│   ├── nginx/        # konfig Nginx
│   └── php/          # Dockerfile + entrypoint dla PHP-FPM z Phalconem
└── docker-compose.yml
```
