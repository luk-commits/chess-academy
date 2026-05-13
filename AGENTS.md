# AGENTS.md

> **IMPORTANT: This file is automatically loaded into the model's context at the beginning of every task.**
> **Always read it in its entirety before executing any commands — it contains the source-of-truth for commands, architecture, and project rules.**
> **All project commands and tasks must be executed within a Docker container; do not run commands directly on the local host machine.**

## Quick start

```bash
docker compose up --build       # everything: DB + migrations + backend API + frontend dev
```

- Frontend: http://localhost:5173
- API (via Nginx proxy): http://localhost:8080
- Demo accounts: `coach@chess.local` / `player@chess.local` — both password `password123`

## Architecture

```
backend/   Phalcon PHP 8.3 API — app/Config/router.php → Controllers, JWT via HttpOnly cookies
frontend/  React 19 + Vite + TypeScript + MUI 6 — entrypoint: index.html → src/main.tsx
```

- **No Composer at repo root** — everything lives inside `backend/` and `frontend/`.
- Backend controller namespace: `ChessAcademy\Controllers` (autoload `app/` via PSR-4).
- Frontend `tsconfig.json` `include` covers only `src/`; tests use their own config.
- Nginx proxies `/api` requests to PHP-FPM on port 9000 → router handles `/api/*`.

## Source-of-truth commands

### Frontend

| What | Command (inside `frontend/` or via docker compose exec) |
|---|---|
| Dev server | `npm run dev` |
| Typecheck (lint) | `tsc -b --noEmit` (aliased: `npm run lint`) |
| Vitest (all unit+integration) | `npx vitest run` |
| Vitest watch | `npx vitest` |
| Vitest single file | `npx vitest run tests/unit/authService.test.ts` |
| Playwright E2E (all) | `npx playwright test` |
| Playwright single spec | `npx playwright test tests/E2E/login.spec.ts` |
| Build | `tsc -b && vite build` |

**Playwright** browsers are provided by the Docker image; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser` and `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`. Tests require the dev server running (baseURL `http://localhost:5173`).

### Backend

| What | Command (docker compose exec) |
|---|---|
| All suites | `docker compose exec backend php vendor/bin/phpunit` |
| Single suite | `… --testsuite="Backend Unit Tests"` (Unit / Integration / Feature / E2E) |
| Single file | `docker compose exec backend php vendor/bin/phpunit tests/Unit/JwtServiceTest.php` |
| CLI console | `docker compose exec backend php cli.php` |
| Import positions | `docker compose exec backend php cli.php import positions` (dry-run default; add `--execute` to commit) |
| DevTools `phalcon` | `docker compose exec backend phalcon` (installed globally in image) |

### Run from repo root

```bash
# Frontend tests (dev server dev container):
docker compose exec frontend npx vitest run
docker compose exec frontend npx playwright test tests/E2E/login.spec.ts

# Backend tests:
docker compose exec backend php vendor/bin/phpunit
```

## Testing conventions

- **Backend** test suites defined in `backend/phpunit.xml`: Unit, Integration, Feature, E2E.
  - Integration/E2E tests hit the real DB (PostgreSQL `db` host); must run inside the `chess_backend` container or on a network that can resolve `db`.
- **Frontend** unit/integration tests use Vitest + jsdom (`frontend/vitest.config.ts`). Globals enabled, setup file is `tests/setup.ts`.
  - Vitest `include` pattern: `tests/**/*.test.{ts,tsx}`
  - Playwright picks up `tests/**/*.spec.*` (configured via `testDir: ./tests`).
- Demo seed data is in `backend/migrations/01_init.sql` (users id 3/4). Tests that rely on these accounts assume the DB has been migrated.

## Known gotchas

- **No `.js` files belong in `frontend/src/`** — source is `.tsx`/`.ts` only. Vite resolves `.js` before `.tsx`, so any stray emitted `.js` will shadow the real source and silently serve stale code. `tsconfig.json` has `"noEmit": true` to prevent `tsc -b` from regenerating them; if you spot any in `src/`, delete them.
- Auth uses **HttpOnly cookies** (`chess_session` + `chess_refresh`). The frontend **never reads tokens from JS**. API calls use `credentials: 'include'`. Do not switch to localStorage bearer tokens.
- Backend `JWT_SECRET` defaults to a dev value set in `docker-compose.yml`. E2E tests that issue tokens internally (PHPUnit tests) use their own hardcoded secret — changing one without the other will break those tests.
- `migrator` service runs raw `.sql` files from `backend/migrations/` on every `docker compose up`. The init insert (`01_init.sql`) has no `ON CONFLICT` clause; restarting with a populated DB volume will fail on duplicate keys. Drop the `db_data` volume or drop the seed rows before re-running.
- Frontend `VITE_PROXY_API_TARGET` (default `http://web`) is the container-to-container API URL. When running Playwright from the host (not in Docker), set `VITE_API_URL` or ensure the proxy is reachable at `http://localhost:8080`.
- Backend CORS allows only `CORS_ORIGIN` (default `http://localhost:5173`). Direct API calls from other origins or Postman will fail; use `http://localhost:8080` through the Nginx proxy (which adds no CORS header, so browser calls must go through the Vite proxy).

## Git conventions

All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes nor adds |
| `chore` | Tooling, deps, CI, repo maintenance |
| `docs` | Documentation only |
| `test` | Adding/improving tests |
| `style` | Formatting, linting (no logic change) |

Scope is optional but encouraged (e.g. `backend`, `frontend`, `migration`).

## Backend model convention

Each DB table has two model files. The inheritance chain is:

```
\Phalcon\Mvc\Model
    └── AbstractModel          (backend/app/Models/AbstractModel.php)
            └── *Model.php     (e.g. GroupModel.php)
                    └── *.php  (e.g. Group.php)
```

| File | Purpose |
|---|---|
| `*Model.php` (e.g. `GroupModel.php`) | **Auto-generated** by `model.sh` — column properties, `setSource()`. **Will be overwritten.** Do not put custom code here. |
| `*.php` (e.g. `Group.php`) | **Hand-written** — extends `*Model`, contains relationships, business logic, validation. **Permanent.** Put all custom code here. |

Relationships (belongsTo, hasMany, hasManyToMany) must go in the consumer class (`Group.php`, `User.php`, `Task.php`), never in `*Model.php`. The `model.sh` script strips auto-generated relationships from `*Model.php` to prevent duplicates.

## Migration helper

```bash
# Generate a Phalcon model from DB table (inside container):
bash manage/model.sh
```

This helper wraps `phalcon model` DevTools with proper namespacing and post-processing (extends `AbstractModel`).
