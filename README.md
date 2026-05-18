# Chess Academy

> Profesjonalna platforma trenerska Trener-Zawodnik

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Monorepo: Phalcon PHP API + React/Vite/MUI frontend + PostgreSQL.

## Stack

- **Backend**: PHP 8.3, Phalcon 5.x, firebase/php-jwt
- **Frontend**: React 19, TypeScript, Vite 8, MUI 9
- **DB**: PostgreSQL 16
- **Infra**: Docker Compose (Nginx + PHP-FPM)

## Szybki start

```bash
docker compose up --build
```

Po starcie:

| Serwis       | URL                          |
|------------- |------------------------------|
| Frontend     | http://localhost:5173        |
| API (proxy)  | http://localhost:8080        |
| PostgreSQL   | localhost:5432               |

## Konta demo

| Email               | Hasło       | Rola   | Domyślny widok               |
|---------------------|-------------|--------|------------------------------|
| coach@chess.local   | password123 | COACH  | `/home/coach/positions`      |
| player@chess.local  | password123 | PLAYER | `/home/player/tasks`         |

## Architektura

```
chess/
├── backend/          # Phalcon 5 API (app/, public/, migrations/)
│   ├── app/
│   │   ├── Controllers/   # ChessAcademy\Controllers
│   │   ├── Models/        # AbstractModel → *Model → *
│   │   └── Config/        # Router, services
│   ├── migrations/        # SQL inicjalizowane przy starcie
│   └── tests/             # PHPUnit (Unit/Integration/Feature/E2E)
├── frontend/         # React + Vite + MUI
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── views/
│   │   └── services/      # api.ts — HttpOnly cookie auth
│   └── tests/             # Vitest (unit/component/feature) + Playwright E2E
├── docker/
│   ├── nginx/        # proxy Nginx
│   └── php/          # Dockerfile + entrypoint
├── manage/           # Skrypty pomocnicze (model.sh)
├── AGENTS.md         # Konwencje developerskie
└── docker-compose.yml
```

## API Endpointy

| Metoda | Ścieżka         | Opis                                 |
|--------|-----------------|--------------------------------------|
| POST   | `/api/login`    | Logowanie, ustawia HttpOnly cookie   |
| POST   | `/api/logout`   | Wygaszenie sesji                     |
| GET    | `/api/me`       | Aktualny użytkownik                  |

## Testy

### Backend

```bash
docker compose exec backend php vendor/bin/phpunit
docker compose exec backend php vendor/bin/phpunit --testsuite="Backend Unit Tests"
docker compose exec backend php vendor/bin/phpunit --testsuite="Backend Integration Tests"
```

### Frontend — Vitest (unit/component/feature)

```bash
docker compose exec frontend npm run test:unit       # same unit
docker compose exec frontend npm run test:component  # same component
docker compose exec frontend npm run test:feature    # same feature
docker compose exec frontend npm run test:all        # wszystkie Vitest
```

### Frontend — Playwright (E2E)

```bash
docker compose exec frontend npx playwright test                    # wszystkie
docker compose exec frontend npx playwright test tests/E2E/auth/login.spec.ts
```

Wymaga działającego dev servera (port 5173).

## Model bazy danych

Każda tabela ma dwa pliki modelu:

- `*Model.php` — auto-generowany przez `bash manage/model.sh`, nie edytować
- `*.php` — ręczny, zawiera relacje i logikę biznesową

Relacje (`belongsTo`, `hasMany`) dodawaj w pliku `*.php`, nigdy w `*Model.php`.

## Zmienne środowiskowe

Kluczowe zmienne (zdefiniowane w `docker-compose.yml`):

| Zmienna         | Domyślna wartość               |
|-----------------|--------------------------------|
| `JWT_SECRET`    | `change_me_in_production_super_secret_key` |
| `CORS_ORIGIN`   | `http://localhost:5173`        |
| `DB_HOST`       | `db`                           |

## Kontrybucja

Zanim zaczniesz, przeczytaj [AGENTS.md](AGENTS.md) — zawiera pełne konwencje:
- Conventional Commits (`feat`, `fix`, `refactor`, …)
- Konwencje kodu frontend/backend
- Struktura testów
- Gotcha'e (HttpOnly cookie auth, brak `.js` w `src/`, itd.)

## Licencja

[MIT](LICENSE)
