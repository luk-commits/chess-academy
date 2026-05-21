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

## Production

- Live: https://chess-academy-cvuv.onrender.com
- Hosted on Render. Build uses the **root `Dockerfile`** (multi-stage: Node builds frontend → static assets, then Debian image with PHP-FPM 8.3 + Nginx serves `/var/www/frontend` and proxies `/api/*` to PHP-FPM).
- Nginx config for prod: `docker/nginx/render.conf` (separate from dev `docker/nginx/default.conf`).
- `docker-compose.yml` is **dev only** — production does not use it. Changes to dev images (frontend dev container, migrator) do not affect prod; prod-impacting changes go in the root `Dockerfile`, `docker/nginx/render.conf`, or `backend/migrations/`.
- DB on Render is a managed Postgres; `backend/migrations/*.sql` is run separately (not via the dev `migrator` service).

## Architecture

```
backend/   Phalcon PHP 8.3 API — app/Config/router.php → Controllers, JWT via HttpOnly cookies
frontend/  React 19 + Vite + TypeScript + MUI 9 — entrypoint: index.html → src/main.tsx
```

- **No Composer at repo root** — everything lives inside `backend/` and `frontend/`.
- Backend controller namespace: `ChessAcademy\Controllers` (autoload `app/` via PSR-4).
- Frontend ma jeden `tsconfig.json` z `include: ['src']`. Testy są transpilowane przez Vite (`vitest.config.ts`), więc `tsc -b` ich nie typecheckuje — nie ma osobnego tsconfig dla testów.
- Nginx proxies `/api` requests to PHP-FPM on port 9000 → router handles `/api/*`.

## Source-of-truth commands

### Frontend
 
> **Wszystkie komendy poniżej muszą być odpalane przez `docker compose exec frontend`.**

| What | Command |
|---|---|
| Dev server | `docker compose exec frontend npm run dev` |
| Typecheck (lint) | `docker compose exec frontend npx tsc -b --noEmit` (alias: `npm run lint`) |
| Vitest – wszystkie | `docker compose exec frontend npx vitest run` (albo `npm run test:all`) |
| Vitest – same unit | `docker compose exec frontend npm run test:unit` |
| Vitest – same component | `docker compose exec frontend npm run test:component` |
| Vitest – same feature | `docker compose exec frontend npm run test:feature` |
| Vitest – pojedynczy plik | `docker compose exec frontend npx vitest run tests/feature/positions/coach-positions.test.tsx` |
| Vitest – pojedynczy test (filtr nazwy) | `docker compose exec frontend npx vitest run -t "search commit" tests/feature/positions/coach-positions.test.tsx` |
| Playwright E2E (all) | `docker compose exec frontend npx playwright test` |
| Playwright pojedynczy | `docker compose exec frontend npx playwright test tests/E2E/coach/positions.spec.ts` |
| Build | `docker compose exec frontend sh -c 'tsc -b && vite build'` |

**Playwright** browsers są w obrazie Docker; zmienne `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser` i `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` są ustawione w `docker-compose.yml`. Testy wymagają działającego dev servera (baseURL `http://localhost:5173`).

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
  - E2E tests extend `ChessAcademy\Tests\Support\HttpTestCase` (`tests/Support/HttpTestCase.php`), which provides the curl client, cookie jar, `loginAsCoach()` / `loginAsPlayer()` helpers and shared fixture credentials (`COACH_ID = 3`, `PLAYER_ID = 4`). New E2E tests should extend it rather than copy the HTTP boilerplate.
- **Frontend** tests use Vitest + jsdom (`frontend/vitest.config.ts`). Globals enabled, setup file is `tests/setup.ts`.
  - Podział: `tests/unit/`, `tests/component/`, `tests/feature/`, `tests/E2E/`.
  - Vitest `include` pattern: `tests/**/*.test.{ts,tsx}` (unit/component/feature).
  - Playwright picks up `tests/**/*.spec.*` (configured via `testDir: ./tests`, katalog `tests/E2E/`).
- Demo seed data is in `backend/migrations/01_init.sql` (users id 3/4). Tests that rely on these accounts assume the DB has been migrated.

## Known gotchas

- **No `.js` files belong in `frontend/src/`** — source is `.tsx`/`.ts` only. Vite resolves `.js` before `.tsx`, so any stray emitted `.js` will shadow the real source and silently serve stale code. `tsconfig.json` has `"noEmit": true` to prevent `tsc -b` from regenerating them; if you spot any in `src/`, delete them.
- Auth uses **HttpOnly cookies** (`chess_session` + `chess_refresh`). The frontend **never reads tokens from JS**. API calls use `credentials: 'include'`. Do not switch to localStorage bearer tokens.
- Backend `JWT_SECRET` defaults to a dev value set in `docker-compose.yml`. E2E tests that issue tokens internally (PHPUnit tests) use their own hardcoded secret — changing one without the other will break those tests.
- `migrator` service runs raw `.sql` files from `backend/migrations/` on every `docker compose up`. The init insert (`01_init.sql`) uses `ON CONFLICT (id) DO NOTHING`, so restarting with a populated DB volume is safe.
- Frontend `VITE_PROXY_API_TARGET` (default `http://web`) is the container-to-container API URL. When running Playwright from the host (not in Docker), set `VITE_API_URL` or ensure the proxy is reachable at `http://localhost:8080`.
- Backend CORS allows only `CORS_ORIGIN` (default `http://localhost:5173`). Direct API calls from other origins or Postman will fail; use `http://localhost:8080` through the Nginx proxy (which adds no CORS header, so browser calls must go through the Vite proxy).
- **`exactOptionalPropertyTypes: true`** in `frontend/tsconfig.json`. Stricter than plain `strict`: a prop typed `foo?: string` does **not** accept an explicit `undefined` — write `foo?: string | undefined` if `undefined` must be passed explicitly. TypeScript errors with "Type 'undefined' is not assignable to type 'string'" even for optional props.

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

## Backend services convention

`app/Services/` holds two kinds of stateless classes — keep them separate:

| Suffix | Purpose | DB? | Examples |
|---|---|---|---|
| `*Presenter` | Map a model (or set of fields) into the JSON shape returned by controllers. Pure functions, easy to unit-test. | No | `PositionPresenter`, `ProgressPresenter` |
| `*Service` | Domain logic that reads/writes the DB or external systems. | Yes | `JwtService`, `SpacedRepetitionService`, `PlayerAccessService`, `LlmService` |

Controllers should stay thin: validate input, delegate to a service for logic, hand the result to a presenter for the response. Helpers shared across controllers (role checks, id-param parsing, model-error formatting) live in `AbstractController`.

## Migration helper

```bash
# Generate Phalcon models from DB tables (run from repo root, NOT inside container):
bash manage/model.sh
```

This helper wraps `phalcon model` DevTools with proper namespacing and post-processing (extends `AbstractModel`). The script uses `docker compose run` internally, so it must be run from the host/repo root. It regenerates all models listed at the bottom of `manage/model.sh` — add new tables there to include them.

## Frontend conventions

### Routing and roles

Two user roles with separate URL trees, guarded by `RequireAuth`:

| Role | Default redirect after login | URL prefix |
|---|---|---|
| COACH | `/home/coach/positions` | `/home/coach/…` |
| PLAYER | `/home/player/tasks` | `/home/player/…` |

Full route map is in `frontend/src/App.tsx`. Catch-all `*` redirects to `/login`.

### API service layer

All HTTP calls go through `frontend/src/services/api.ts` → `apiRequest<TResponse>(path, options)`. Features:
- Sends `credentials: 'include'` on every request (HttpOnly cookie auth).
- On **401**: automatically calls `POST /api/refresh` once, then retries the original request. Throws `ExpiredSessionError` if refresh also fails.
- On non-2xx: throws `ApiError` with `status` and backend error message.
- **Never write bare `fetch()` calls** — always go through `apiRequest` or a service in `src/services/`.

Async data fetching in components uses `useAsyncResource(fetcher, deps)` (`src/hooks/useAsyncResource.ts`), which returns `{ data, loading, error }`.

### SelfStated components

`src/components/SelfStated/` contains input wrappers that **own their state locally** and only call `onCommit` on semantically meaningful events (blur, slider release, explicit commit via ref). All are wrapped in `memo`.

| Component | Commit trigger |
|---|---|
| `SelfStatedText` | `onBlur` |
| `SelfStatedSlider` | `onChangeCommitted` (mouse/touch release) |
| `SelfStatedCheckbox` | `onChange` |
| `SelfStatedSwitch` | `onChange` |
| `SelfStatedTagFilter` | imperative `ref.current.commit()` / `clear()` / `resetSelection()` |

**Rule:** if a parent only needs a value when the user finishes interacting (not on every keystroke/drag), use a SelfStated component instead of lifting state. Pair with `memo` on the parent's stable child components and `useCallback` on all callbacks passed as props — otherwise `memo` is bypassed.
