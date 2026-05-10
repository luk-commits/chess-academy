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
