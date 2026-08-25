# Learning Feature Roadmap (`FEATURES.md`)

Features to implement **in this project**, organized by field, ordered Basic → Advanced.
Each feature tells you **what you'll learn** and **where it plugs into the current codebase**.

Difficulty legend: 🟢 Basic · 🟡 Intermediate · 🔴 Advanced

> Rule of thumb: pick ONE feature at a time, finish it end-to-end (backend + frontend + test),
> then update `PROJECT_BUILD_PHASES.md` with a new phase — same discipline as the original build.

---

# FIELD 1 — BACKEND DEVELOPMENT (FastAPI)

## 🟢 Basic

### 1.1 Product Search, Sort & Filter
- **Learn:** dynamic query building in SQLAlchemy (`filter`, `order_by`, conditional chains).
- **Where:** extend `ProductRepository.list_products` + `GET /products` query params (`?q=&sort=price&min=&max=`).

### 1.2 Soft Delete
- **Learn:** why real apps rarely hard-delete; `deleted_at IS NULL` filtering on every query.
- **Where:** add `deleted_at` to `Product` model → Alembic migration → update every repository method.

### 1.3 Health Check Endpoint
- **Learn:** liveness vs readiness probes; checking DB + Redis connectivity from one endpoint.
- **Where:** new `app/api/v1/health.py` returning status of `db` and `redis_client`.

### 1.4 Bulk Operations
- **Learn:** transactional batch inserts/updates; partial failure handling.
- **Where:** `POST /products/bulk` accepting a list of `ProductCreate`.

### 1.5 CSV Export of Orders
- **Learn:** streaming responses (`StreamingResponse`), generating files server-side.
- **Where:** `GET /orders/export` in `orders.py` using the user's order history.

## 🟡 Intermediate

### 1.6 Refresh Tokens + Logout Everywhere
- **Learn:** short-lived access vs long-lived refresh tokens; token rotation; revocation lists.
- **Where:** new table `refresh_tokens` (Alembic), extend `core/security.py` + `/auth/refresh` route.

### 1.7 Email Verification & Password Reset Tokens
- **Learn:** one-time tokens, expiry semantics, secure random generation (`secrets` module).
- **Where:** replace the fake "forgot password" flow in `user_service` with real expiring tokens.

### 1.8 Background Tasks → Celery Jobs
- **Learn:** FastAPI `BackgroundTasks` first (send welcome email), then why Celery+Redis exists
  (retries, queues, scheduling).
- **Where:** Redis already runs (`docker-compose.yml`) — add a worker container.

### 1.9 Caching Hot Endpoints with Redis
- **Learn:** cache-aside pattern, TTLs, cache invalidation on writes.
- **Where:** cache `GET /products` list for 60s in `product_service`; invalidate in `create/update/delete`.

### 1.10 WebSocket Notifications
- **Learn:** full-duplex communication; connection manager; pushing events ("order placed!").
- **Where:** new `app/api/v1/ws.py`; notify admins when an order is checked out in `cart_service.checkout`.

### 1.11 Full-Text Search (PostgreSQL)
- **Learn:** Postgres `tsvector`/`GIN` indexes vs naive `LIKE '%q%'`.
- **Where:** migration adding a generated column on `products.name/description`.

### 1.12 Audit Log Table
- **Learn:** recording WHO did WHAT WHEN without touching business logic.
- **Where:** middleware or service hook writing to an `audit_logs` table on every mutating request.

## 🔴 Advanced

### 1.13 Payments (Stripe Test Mode)
- **Learn:** external API integration, webhooks (verify signatures!), idempotency keys, never trusting the client about money.
- **Where:** replace direct `checkout` with a Stripe session; webhook endpoint confirms orders in `order_service`.

### 1.14 OAuth2 Social Login (Google/GitHub)
- **Learn:** authorization-code flow, exchanging codes, linking social identities to local users.
- **Where:** new `/auth/{provider}/login` + `/callback` routes in `auth.py`.

### 1.15 Multi-Factor Authentication (TOTP)
- **Learn:** time-based OTP (pyotp), QR provisioning, backup codes.
- **Where:** optional `totp_secret` column on `User`; second step in login flow.

### 1.16 API Versioning Strategy
- **Learn:** `/api/v1` vs `/api/v2` coexistence, deprecation headers.
- **Where:** restructure `app/api/v1` → shared services, versioned routers.

### 1.17 Distributed Rate Limiting
- **Learn:** why in-memory limits break with multiple workers; sliding window in Redis.
- **Where:** upgrade `core/rate_limiting.py` to use `redis_client` counters.

---

# FIELD 2 — FRONTEND DEVELOPMENT (React + TypeScript)

## 🟢 Basic

### 2.1 Dark Mode Toggle
- **Learn:** CSS custom properties as design tokens; persisting UI preference.
- **Where:** your Tailwind v4 `@theme` tokens in `src/index.css` + a toggle in the navbar.

### 2.2 Proper 404 + Error Pages
- **Learn:** catch-all routes; user-friendly failure states.
- **Where:** `App.tsx` route `path="*"` + a styled `NotFound.tsx` page.

### 2.3 Form Validation with Zod
- **Learn:** schema-first validation mirrored from backend rules; inline error messages.
- **Where:** validate Register/Login forms before calling `api.register/api.login`.

### 2.4 Reusable `<Table>` Component
- **Learn:** generic components (`<Table<T>>` in TS), composition over duplication.
- **Where:** extract the repeated list markup in `Products.tsx` and `Admin.tsx`.

## 🟡 Intermediate

### 2.5 TanStack Query (Server State)
- **Learn:** caching, refetch-on-focus, invalidation — replaces manual useEffect fetching.
- **Where:** wrap every `api.*` call in `Products.tsx` / `Dashboard.tsx`; watch boilerplate vanish.

### 2.6 Optimistic Updates (Favorites)
- **Learn:** updating UI before the server replies; rollback on failure.
- **Where:** `toggleFavorite` in `Products.tsx` currently refetches — flip instantly instead.

### 2.7 Infinite Scroll vs Pagination
- **Learn:** IntersectionObserver; cursor-based pagination on the backend too.
- **Where:** alternative browsing mode on the Products page.

### 2.8 Global State with Zustand
- **Learn:** when Context stops scaling (many re-renders); slices/selectors.
- **Where:** move cart panel state out of `Products.tsx`.

### 2.9 Internationalization (i18n)
- **Learn:** translation keys, locale switching, formatting dates/currency.
- **Where:** wrap all hardcoded strings across `pages/`.

### 2.10 Accessibility Pass
- **Learn:** keyboard navigation, ARIA roles, focus traps in modals, contrast.
- **Where:** `ConfirmDialog.tsx` (focus trap), all icon-only buttons (aria-labels).

## 🔴 Advanced

### 2.11 Real-Time UI over WebSocket
- **Learn:** subscribing to live events; reconciling server pushes with local state.
- **Where:** pair with backend 1.10 — admin sees new orders appear live.

### 2.12 E2E Tests with Playwright
- **Learn:** testing the FULL journey (register → product → checkout) like a real user.
- **Where:** new `frontend/e2e/` suite against docker-compose stack.

### 2.13 Unit Tests with Vitest + Testing Library
- **Learn:** testing hooks/components in isolation; mocking the api layer.
- **Where:** test `AuthContext` restore logic and `ProtectedRoute` redirects.

### 2.14 PWA / Offline Mode
- **Learn:** service workers, installable app, cached shell.
- **Where:** vite-plugin-pwa on the existing build.

---

# FIELD 3 — DEVOPS

## 🟢 Basic

### 3.1 One-Command Dev Environment
- **Learn:** scripting repetitive setup; entrypoint scripts waiting for DB readiness.
- **Where:** `Makefile` or npm scripts wrapping `uvicorn` + `vite` + `docker-compose up`.

### 3.2 Compose Healthchecks & depends_on
- **Learn:** container orchestration ordering; failing fast when deps are down.
- **Where:** `docker-compose.yml` — api waits for postgres + redis health.

### 3.3 Multi-Stage Docker Builds
- **Learn:** builder vs runtime stages; smaller images; layer caching for pip/npm.
- **Where:** split the single `Dockerfile`; do the same for a new `frontend/Dockerfile`.

## 🟡 Intermediate

### 3.4 CI Pipeline (GitHub Actions)
- **Learn:** pipelines as code; running lint+pytest+vite build on every push; branch protection.
- **Where:** new `.github/workflows/ci.yml` — should fail if `pytest` or `npm run build` fails.

### 3.5 Reverse Proxy with Nginx
- **Learn:** serving static SPA builds; proxying `/api` to uvicorn; gzip; security headers.
- **Where:** add `nginx.conf` + service to compose so ONE port serves everything.

### 3.6 Deploy Somewhere Real
- **Learn:** environment config in prod, managed Postgres, HTTPS termination, logs.
- **Where:** Railway/Fly.io for api+db; Vercel/Netlify for the frontend (set CORS accordingly!).

### 3.7 Structured Logging & Request IDs
- **Learn:** JSON logs; correlating one request across log lines via X-Request-ID middleware.
- **Where:** upgrade `middleware/request_logging.py`; ship logs somewhere searchable.

## 🔴 Advanced

### 3.8 Monitoring: Prometheus + Grafana
- **Learn:** RED metrics (rate/errors/duration); dashboards; alerting rules.
- **Where:** expose `/metrics` via prometheus-fastapi-instrumentator; scrape in compose.

### 3.9 Infrastructure as Code (Terraform)
- **Learn:** declarative cloud resources; state files; plan/apply workflow.
- **Where:** provision the deployed infra (VM/db/bucket) from `.tf` files.

### 3.10 Zero-Downtime Deploys
- **Learn:** migrations must be backward-compatible; rolling/blue-green releases behind a proxy.
- **Where:** practice by deploying while traffic hits the old version.

---

# FIELD 4 — DATABASE & DATA

## 🟢 Basic
- **4.1 Seed Script / Factories** 🟢 — repeatable demo data (`python -m app.seed` with Faker). *Learn: fixtures for dev/demo.*
- **4.2 Index Audit** 🟢 — run `EXPLAIN ANALYZE` on hot queries; add missing indexes via Alembic. *Learn: reading query plans.*
- **4.3 Timestamps Everywhere** 🟢 — `created_at/updated_at` mixin on all models. *Learn: DRY model patterns.*

## 🟡 Intermediate
- **4.4 Connection Pool Tuning** 🟡 — pool size, overflow, `pool_pre_ping`; simulate exhaustion. *Learn: engine internals.*
- **4.5 Data Integrity Constraints** 🟡 — CHECK constraints (quantity > 0), DB-level uniqueness beyond ORM. *Learn: defense in depth.*
- **4.6 Backup & Restore Drill** 🟡 — `pg_dump` cron in compose; restore into a fresh container. *Learn: disaster recovery.*

## 🔴 Advanced
- **4.7 Read Replica Simulation** 🔴 — second Postgres; route reads/writes differently. *Learn: horizontal scaling patterns.*
- **4.8 Slow Query Hunt** 🔴 — enable SQLAlchemy `echo`, find N+1s you missed, fix with `selectinload/joinedload`. *Learn: ORM performance profiling.*

---

# FIELD 5 — SECURITY

- **5.1 Security Headers Middleware** 🟢 — CSP, X-Frame-Options, HSTS stub. *Where: new middleware next to `request_logging.py`.*
- **5.2 Dependency Scanning** 🟢 — `pip-audit` + `npm audit` in CI. *Learn: supply-chain hygiene.*
- **5.3 Attack Demo Lab** 🟡 — deliberately attempt SQLi (SQLAlchemy parametrization saves you), XSS via product names (show escaping), path traversal on `/files/{name}` then FIX it. *Learn: threats by experiencing them safely.*
- **5.4 Secrets Management** 🟡 — move `.env` out of images; compose secrets / cloud secret managers. *Learn: config separation.*
- **5.5 Account Hardening** 🔴 — login throttling per IP+account, breached-password checks, session invalidation on password change. *Learn: realistic auth hardening.*

---

# FIELD 6 — TESTING & QUALITY

- **6.1 Expand pytest Coverage** 🟢 — `test_products.py`, `test_cart_checkout_flow.py` (full journey test). *Where: follow `conftest.py` patterns.*
- **6.2 Contract Tests** 🟡 — assert response schemas match `frontend/src/api/types.ts` expectations (catch drift early). *Learn: frontend/backend contracts.*
- **6.3 Load Testing** 🟡 — k6 or Locust script hammering `/products`; watch your rate limiter and pool behave. *Learn: performance under pressure.*
- **6.4 Mutation Testing** 🔴 — run mutmut on `services/` to see if tests actually assert behavior. *Learn: measuring test quality.*

---

# FIELD 7 — BONUS: AI FEATURES (trendy resume points)

- **7.1 AI Product Descriptions** 🟡 — call an LLM API from `product_service` to auto-draft descriptions. *Learn: external API + prompt design + cost control.*
- **7.2 Semantic Search** 🔴 — embed product text into vectors (pgvector), similarity search endpoint. *Learn: vector databases.*
- **7.3 Support Chatbot** 🔴 — WebSocket bot answering questions about YOUR api docs. *Learn: RAG basics.*

---

# SUGGESTED LEARNING PATHS

| If you want to become a… | Do these in order |
|---|---|
| **Backend Engineer** | 1.1 → 1.6 → 1.8 → 1.9 → 4.2 → 5.3 → 1.13 |
| **Frontend Engineer** | 2.1 → 2.3 → 2.5 → 2.6 → 2.13 → 2.12 |
| **DevOps Engineer** | 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.8 |
| **Full-Stack (balanced)** | 1.6 + 2.5 (auth upgrade) → 1.9 + 2.6 (caching pair) → 3.4 (CI) → 3.6 (deploy) |

Each completed feature = one new phase appended to `PROJECT_BUILD_PHASES.md`.
