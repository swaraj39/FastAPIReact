# Project Build Phases — FastAPI Backend + React Frontend

A step-by-step roadmap explaining how this project was built, **phase by phase, from simplest to most difficult, backend first then frontend**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Uvicorn (Python 3.13) |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL (dev), SQLite (tests) |
| Validation | Pydantic v2 + pydantic-settings |
| Auth | python-jose (JWT) + passlib/bcrypt |
| Frontend | React 18 + TypeScript + Vite |
| Routing | react-router-dom v6 |
| Testing | pytest + httpx TestClient |

---

## Architecture Overview (what you end up with)

```
frontend (React/TS)
    │  fetch("/api/...")
    ▼
FastAPI  ──►  Middleware (request logging)
    │
    ▼
API Router (app/api/v1)  ──►  Dependencies (JWT auth / roles / rate-limit)
    │
    ▼
Services (business logic)  ──►  Schemas (Pydantic request/response)
    │
    ▼
Repositories (SQL queries, eager loading)
    │
    ▼
Models (SQLAlchemy)  ──►  Database (PostgreSQL/SQLite)
```

The whole backend follows a clean **layered architecture**: API → Service → Repository → Model. Each layer has one job, which is what makes the project easy to extend.

---

# PHASE 1 — Project Setup (Foundation)

**Goal:** Create a runnable FastAPI app skeleton with a clean folder structure.

**What you learn:**
- Virtual environments and dependency management
- Environment variables (`python-dotenv` / `pydantic-settings`)
- A scalable folder layout

**Files created:**
```
.env                          # secrets, DB URL, app config
app/
  __init__.py
  main.py                     # FastAPI entry point (imports router, middleware)
  requirements.txt
```

**Steps:**
1. Create a virtual environment: `python -m venv venv` and activate it.
2. `pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose passlib bcrypt pydantic-settings python-dotenv`
3. Create `.env` with `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
4. Create `app/core/config.py` using `pydantic_settings.BaseSettings` so `.env` values become typed `settings` attributes.
5. Create `app/main.py` with a minimal `FastAPI()` app and a `GET /` test route.
6. Run: `uvicorn app.main:app --reload` → visit `http://localhost:8000/docs`.

**Verify:** `/docs` opens Swagger UI and `GET /` returns `{"message": "FastAPI JWT Authentication"}`.

---

# PHASE 2 — Database Connection & Session

**Goal:** Wire SQLAlchemy to the database and hand a DB session to every request via FastAPI dependency injection.

**What you learn:**
- SQLAlchemy `Engine`, `Session`, `declarative_base`
- FastAPI's `Depends(get_db)` pattern for clean session lifecycle

**Files created:**
```
app/db/
  base.py        # Base = declarative_base()
  database.py    # engine = create_engine(settings.DATABASE_URL)
  session.py     # SessionLocal + get_db() generator (yield session, close after)
```

**Steps:**
1. `base.py` — one shared `Base` class that every model inherits from.
2. `database.py` — build the `Engine`. Note the `check_same_thread=False` tweak for SQLite.
3. `session.py` — `SessionLocal()` factory and the `get_db()` dependency:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Verify:** import the engine without errors; `Base.metadata` is empty until Phase 3.

---

# PHASE 3 — Database Schema (Models)

**Goal:** Define every table and — most importantly — every **relationship type** with SQLAlchemy ORM.

**What you learn (this is the heart of the project):**
- **One-to-many** — `User.products` ↔ `Product.owner`
- **One-to-one** — `User.profile` ↔ `Profile.user` (via `unique=True` FK + `uselist=False`)
- **Many-to-many** — `User.favorite_products` ↔ `Product.favorited_by` (via association table)
- Cascades, foreign keys, enums, indexes

**Files created:**
```
app/models/
  role.py          # Role enum: ADMIN / REVIEWER / USER
  user.py          # User (parent of products + profile, m2m favorites)
  profile.py       # Profile (one-to-one child of User)
  product.py       # Product (many-to-one child of User, m2m favorites)
  associations.py  # user_favorites association table (m2m)
  cart.py          # CartItem (user_id + product_id + quantity)
  orders.py        # Orders (uuid PK, product + user FKs)
```

**Key concepts:**
- `user_favorites` is a plain `Table` (no class) whose two FKs form a composite primary key — this prevents favoriting the same product twice.
- One-to-one is enforced by `user_id = Column(Integer, ForeignKey("users.id"), unique=True)` on Profile plus `uselist=False` on the `User.profile` relationship.
- Cascades (`cascade="all, delete-orphan"`) on the **parent** side mean deleting a user deletes their profile, products, cart rows and orders automatically.
- Order PK is a UUID string so order ids are not guessable: `id = Column("order_id", String, primary_key=True, default=lambda: str(uuid.uuid4()))`.

**Steps:**
1. Build models one at a time, starting with `User`.
2. Import every model in `app/main.py` (they register their tables on `Base.metadata` — this is why `main.py` has the `# noqa: F401` imports).
3. Create tables: `Base.metadata.create_all(bind=engine)` at startup (dev only; production uses Alembic).

**Verify:** the `test.db` / PostgreSQL DB now contains `users`, `profiles`, `products`, `user_favorites`, `cart_items`, `orders` tables.

---

# PHASE 4 — Pydantic Schemas (Validation + Serialization)

**Goal:** Define request payloads and response shapes so the API only accepts valid data and never leaks sensitive fields (like passwords).

**What you learn:**
- Pydantic `BaseModel`, `EmailStr`, `Optional`, `Field`, `ConfigDict(from_attributes=True)`
- Nested schemas (register body carries a `profile` object inside a `user`)
- Using schemas to control what the API returns

**Files created:**
```
app/schemas/
  auth.py        # Token (access_token, token_type)
  user.py        # UserCreate, ProfileCreate, UserResponse, UserUpdate, Forgot...
  product.py     # ProductCreate, ProductUpdate, ProductResponse, PaginatedProducts
  cart.py        # CartItemCreate / Update / Response
  order.py       # OrderCreate / Response
```

**Key concepts:**
- `UserResponse` includes the nested `profile` (one-to-one) but **never** the password.
- `ProductResponse` includes a nested `owner` (many-to-one) using `OwnerSummary` (id + username only) to avoid a circular `User → Product → User` response.
- `PaginatedProducts` wraps `items` + `total` + `page` + `pages` for the frontend page controls.
- `from_attributes=True` lets Pydantic serialize SQLAlchemy objects directly.

**Verify:** hitting an endpoint with a bad email returns a 422 validation error from Pydantic, not a crash.

---

# PHASE 5 — Security Foundations (Password Hashing + JWT)

**Goal:** The two primitives every protected endpoint depends on.

**What you learn:**
- Bcrypt one-way hashing via passlib
- JWT creation and verification with python-jose
- `exp` claims and `SECRET_KEY` signing

**Files created:**
```
app/core/security.py
```

**Functions:**
- `hash_password(password)` — bcrypt hash (never store plain text).
- `verify_password(plain, hashed)` — compare a login attempt against the stored hash.
- `create_access_token(data)` — sign a JWT with `{"sub": username, "role": role, "exp": now+30min}`.
- `verify_access_token(token)` — decode + validate; returns the payload or `None`.

**Verify (sanity, not via API yet):**
```python
h = hash_password("secret123")          # $2b$12$...
verify_password("secret123", h)         # True
t = create_access_token({"sub": "a"})   # eyJhbGciOi...
verify_access_token(t)["sub"]           # "a"
```

---

# PHASE 6 — Authentication (Register + Login)

**Goal:** Turn the security primitives into working endpoints.

**What you learn:**
- The **Service layer** (business logic) vs **Repository layer** (SQL)
- Creating a User + its one-to-one Profile in a single transaction
- `OAuth2PasswordRequestForm` (login sends form data, not JSON)

**Files created:**
```
app/repositories/user_repository.py   # get_by_username, get_by_email, create, delete
app/services/auth_service.py          # register_user, authenticate_user
app/api/v1/auth.py                    # POST /auth/register, POST /auth/login
app/schemas/auth.py                   # Token
app/api/v1/router.py                  # api_router that mounts all sub-routers
```

**Steps:**
1. `UserRepository` — first repository; wraps every User query.
2. `auth_service.register_user`:
   - Reject duplicate username/email (raise `DuplicateResourceError` → 409).
   - Build `User(username, email, password=hash_password(...))`.
   - Attach `user.profile = Profile(...)` — the one-to-one relationship fills in `user_id` on insert.
   - One `commit()` saves both rows.
3. `auth_service.authenticate_user`:
   - Look up user, `verify_password`.
   - Build token payload `{"sub": username, "role": role.value}`.
   - Return `Token(access_token=..., token_type="bearer")`.
4. `auth.py` router with `prefix="/auth"`.
5. Register the router in `router.py`, which is mounted in `main.py`.

**Verify:** POST `/auth/register` returns 201 with the user + profile; POST `/auth/login` returns a token; duplicate register returns 409.

---

# PHASE 7 — CRUD (Users & Profiles)

**Goal:** Plain CRUD that only works for the logged-in user.

**What you learn:**
- The **dependency injection** pattern for the current user
- Updating two tables (users + profiles) in one request
- A small "forgot password" flow

**Files created:**
```
app/api/v1/users.py      # GET /user/profile, PUT /user/update, GET /user/dashboard, POST /user/forgot
app/services/user_service.py
```

**Key logic in `user_service.update_profile`:**
- A `PROFILE_FIELDS` tuple decides which flattened fields belong to the Profile table.
- Changing username/email first checks the value isn't taken by someone else (409).
- If a user has no profile yet, one is created on the fly.

**Verify:** update the profile with the Bearer token; check the nested `profile` in the response.

---

# PHASE 8 — JWT Auth Dependency + RBAC

**Goal:** Enforce authentication and roles across all protected routes.

**What you learn:**
- `OAuth2PasswordBearer` — reads the `Authorization: Bearer <token>` header
- A reusable **dependency** `get_current_user` that decodes the JWT and loads the User
- A **dependency factory** `require_role(*roles)` that returns a role-checking dependency
- `403` vs `401` semantics

**Files created:**
```
app/api/dependencies.py
```

**Key code:**
```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token=Depends(oauth2_scheme), db=Depends(get_db)) -> User:
    payload = verify_access_token(token)          # None if invalid/expired
    ...
    return db.query(User).filter(User.username == payload["sub"]).first()

def require_role(*roles: Role):
    def role_checker(current_user=Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(403, "Permission Denied")
        return current_user
    return role_checker
```

**Usage:**
```python
@router.get("/profile")
def profile(current_user: User = Depends(get_current_user)): ...   # any logged-in user

@router.get("/users")
def get_users(current_user: User = Depends(require_role(Role.ADMIN))): ...  # ADMIN only
```

**Verify:** call a protected route without a token → 401; call an admin route as a regular user → 403.

---

# PHASE 9 — Admin Module (RBAC in action)

**Goal:** A set of admin-only endpoints that also demonstrate the relationship kinds.

**What you learn:**
- **Eager loading** with `selectinload` to avoid the N+1 query problem
- One-to-one + one-to-many returned together

**Files created:**
```
app/api/v1/admin.py
```

**Endpoints:** `GET /admin/dashboard`, `GET /admin/users`, `GET /admin/users/{id}` (user + profile + products), `DELETE /admin/users/{id}`.

**Key repository method** (`UserRepository.get_with_details`):
```python
self.db.query(User).options(
    selectinload(User.profile),    # one-to-one
    selectinload(User.products),   # one-to-many
).filter(User.id == user_id).first()
```
Without `selectinload`, loading `user.products` would fire a new query **per user** (N+1). With it, everything loads in a handful of queries.

**Verify:** as ADMIN, `GET /admin/users/1` returns the user with a nested `products` list.

---

# PHASE 10 — Products CRUD + Pagination + Owner Permissions

**Goal:** Full CRUD for products with ownership rules.

**What you learn:**
- Pagination (`page` / `limit` / `total` / `pages`)
- Route ordering gotcha: `/favorites` must be registered **before** `/{product_id}`
- Object-level permissions (owner or ADMIN may edit/delete)

**Files created:**
```
app/repositories/product_repository.py
app/services/product_service.py
app/api/v1/products.py
app/schemas/product.py
```

**Key points:**
- `owner_id` comes from the JWT user, never from the request body.
- `can_manage_product()` raises 403 unless `product.owner_id == user.id or user.role == ADMIN`.
- `GET /products` returns `PaginatedProducts` so the frontend can render Prev/Next.
- `ProductRepository` eager-loads `owner` with `selectinload(Product.owner)` to avoid N+1 on the list.

**Verify:** create a product as user A; user B cannot edit/delete it, but an ADMIN can.

---

# PHASE 11 — Many-to-Many (Favorites)

**Goal:** Link users and products through the association table.

**What you learn:**
- Appending/removing from a `secondary` relationship
- Idempotent operations
- Stamping a transient field (`is_favorited`) so the UI gets state without persisting it

**Files created / extended:**
```
app/api/v1/products.py   # POST/DELETE /products/{id}/favorite, GET /products/favorites
app/services/product_service.py  # add_favorite, remove_favorite, stamp_favorites, list_favorites
```

**Key code:**
```python
# product_service.add_favorite
if product not in user.favorite_products:
    user.favorite_products.append(product)   # inserts a row into user_favorites
    db.commit()

# product_service.stamp_favorites — transient, not saved to DB
for product in products:
    product.is_favorited = product.id in favorite_ids
```

**Verify:** favorite a product → `GET /products/favorites` lists it; unfavorite twice is harmless.

---

# PHASE 12 — Cart (Pending Items)

**Goal:** A pending list of items the user hasn't bought yet.

**What you learn:**
- A service method that **serializes** nested relationships by hand (`_serialize`)
- Merging duplicates (same product in cart bumps quantity instead of new row)
- Ownership checks on every cart operation

**Files created:**
```
app/models/cart.py
app/repositories/cart_repository.py
app/services/cart_service.py
app/api/v1/cart.py
app/schemas/cart.py
```

**Endpoints:** `POST /cart`, `GET /cart`, `PUT /cart/{item_id}`, `DELETE /cart/{item_id}`, `POST /cart/checkout`.

**Verify:** add the same product twice → quantity becomes 2, not two rows.

---

# PHASE 13 — Orders & Checkout

**Goal:** Convert pending cart items into permanent orders.

**What you learn:**
- Cross-repository orchestration in the service layer
- Two related models: `Orders` (uuid PK) and `CartItem`
- Direct order placement (`POST /orders`) vs cart checkout

**Files created:**
```
app/models/orders.py
app/repositories/order_repository.py
app/services/order_service.py
app/api/v1/orders.py
app/schemas/order.py
```

**Checkout flow (`cart_service.checkout`):**
1. Load every cart line for the user.
2. For each line, create an `Orders` row (copy `product_id`, `user_id`, `quantity`).
3. Empty the cart (`delete_all_for_user`).
4. Return how many orders were placed.

**Verify:** add to cart → checkout → cart is empty and `GET /orders` shows the order(s).

---

# PHASE 14 — Cross-Cutting Concerns (Logging, Exceptions, Middleware, Rate Limiting)

**Goal:** Production-quality behaviors on every request.

**What you learn:**
- Structured logging to console + rotating file
- Centralized exception classes → clean JSON error bodies
- A middleware that times every request
- An in-memory rate limiter

**Files created:**
```
app/core/logging.py             # logger with RotatingFileHandler
app/core/exceptions.py          # AppException + 409/401/404/403 subclasses + handlers
app/middleware/request_logging.py  # logs method, path, status, duration (ms)
app/core/rate_limiting.py       # 5 requests / min per username -> 429
```

**Key points:**
- Services raise domain exceptions (`ResourceNotFoundError`, `PermissionDeniedError`, ...); `register_exception_handlers` turns them into consistent JSON.
- Middleware added in `main.py` runs on every request; logging is the first thing users see in the terminal.
- Rate limit is a FastAPI dependency (`Depends(check_rate_limit)`) — applied to `GET /products/{product_id}` as a demo.

**Verify:** a missing product returns `{"detail": "Product not found"}` with 404; hitting `GET /products/1` six times returns 429; the terminal shows a log line for each request.

---

# PHASE 15 — Tests (pytest)

**Goal:** Prove auth + validation work without hitting a real DB.

**What you learn:**
- FastAPI `TestClient` with dependency overrides (SQLite via `TEST_DATABASE_URL`)
- Session-scoped fixtures + auto-cleaned tables

**Files created:**
```
app/tests/
  conftest.py        # sets DATABASE_URL=sqlite:///./test.db, client fixture, clean_tables fixture
  test_auth.py       # register success, duplicate username/email, login success/wrong password
  test_users.py
```

**Key trick in `conftest.py`:** set `os.environ["DATABASE_URL"]` **before** importing `app.main`, so the app builds its engine against SQLite. The `clean_tables` autouse fixture empties all tables before each test.

**Run:** `pytest` from the project root.

---

# PHASE 16 — Frontend Setup + API Layer (React + Vite + TypeScript)

**Goal:** A Vite + React + TS app that talks to the backend cleanly.

**What you learn:**
- Vite dev-server proxy (`/api` → `http://localhost:8000`, with the `/api` prefix stripped)
- A single typed `request()` wrapper handling JSON, Bearer tokens and error normalization
- Token persistence in `localStorage`

**Files created:**
```
frontend/
  vite.config.ts           # proxy config (fixes 401 on hard page refresh)
  src/api/types.ts         # TS types mirroring the backend schemas
  src/api/client.ts        # ApiError class + `api` object with every endpoint typed
```

**Key code in `client.ts`:**
- `request<T>(path, options)` attaches `Authorization: Bearer <token>`, serializes JSON (or form for login), and turns non-2xx into a thrown `ApiError`.
- Login uses `URLSearchParams` because the backend's `OAuth2PasswordRequestForm` expects form data.
- The `/api` prefix is added internally so Vite's proxy only forwards real API calls.

**Verify:** `npm run dev` in `frontend/`, and a fetch to `/api/products` reaches FastAPI.

---

# PHASE 17 — Frontend Auth State + Routing

**Goal:** Global login state and route guards.

**What you learn:**
- React Context + hooks for global state (`AuthContext`)
- Session restore on reload (token in localStorage → `getProfile()`)
- `ProtectedRoute` guard with optional role lists
- `react-router-dom` v6 `<Routes>` structure

**Files created:**
```
frontend/src/context/AuthContext.tsx       # user, loading, login, logout
frontend/src/components/ProtectedRoute.tsx # redirect to /login or /dashboard
frontend/src/App.tsx                       # navbar + all routes
```

**Key behavior:**
- On mount, if a token exists, `api.getProfile()` restores the user; if it fails, the token is cleared.
- `ProtectedRoute` shows a loader while restoring, redirects unauthenticated users to `/login`, and enforces `roles={['ADMIN']}` for `/admin`.
- The navbar shows admin links only to admins.

**Verify:** reload the page while logged in → no flash of the login page.

---

# PHASE 18 — Frontend Pages (Backend ↔ Frontend wiring)

**Goal:** End-to-end features. Each page calls the `api` layer and renders state.

**Files created:**
```
frontend/src/pages/
  Login.tsx            # api.login() → store token → navigate to dashboard
  Register.tsx         # api.register() → login → dashboard
  Dashboard.tsx        # api.getDashboard()
  Profile.tsx          # api.getProfile() / api.updateProfile()
  ForgotPassword.tsx   # api.forgotpassword()
  Products.tsx         # list/create/edit/delete + favorites + cart + orders panels
  Admin.tsx            # adminUsers / adminUserDetail (one-to-many) / adminDeleteUser
frontend/src/components/
  Avatar.tsx, Badge.tsx, EmptyState.tsx, PageHeader.tsx,
  Skeleton.tsx, Spinner.tsx, Toast.tsx    # reusable UI pieces
```

**Key wiring in `Products.tsx` (the biggest page):**
- `api.listProducts(page, limit)` + Prev/Next buttons driven by `pages`.
- `toggleFavorite` calls `favoriteProduct`/`unfavoriteProduct` then reloads (backend re-stamps `is_favorited`).
- "Add to cart" → `api.addToCart`; "Approve & Checkout" → `api.checkoutCart` → cart empties, orders refresh.
- Edit/Delete buttons only for the owner or ADMIN (`canManage`).

**Verify (full journey):**
1. Register → land on dashboard.
2. Create a product → see it listed with your username as owner.
3. Favorite it → heart toggles; filter "My favorites" shows it.
4. Add to cart → checkout → order appears in "My Orders".
5. As ADMIN, open `/admin` → view users → click "Products" → see each user's products.

---

# PHASE 19 — Frontend Design System (Formal Black & White UI)

**Goal:** Convert the whole frontend from the blue accent theme to a formal, monochrome (black / white / gray) design system and add professional polish.

**What you learn:**
- Using CSS custom properties (design tokens) so a full re-theme is a matter of editing one file
- Grayscale hierarchy instead of color coding (e.g. role badges: ADMIN = solid black block, REVIEWER = outlined, USER = muted gray)
- Serif display headings + sans-serif body for a formal, institutional look
- Progressive enhancement with the existing unused design-system components

**Files changed (frontend only):**
```
frontend/src/index.css              # full rewrite: monochrome tokens, buttons, forms,
                                    # badges, footer, stat cards, toasts, skeletons
frontend/index.html                 # black favicon, formal title + description
frontend/src/components/Avatar.tsx  # grayscale palette instead of colored
frontend/src/components/Badge.tsx   # black/white role variants
frontend/src/App.tsx                # navbar icons, user avatar + sign-out, footer
frontend/src/pages/Login.tsx        # icon inputs, formal subtitle
frontend/src/pages/Register.tsx     # icon inputs, formal subtitle
frontend/src/pages/ForgotPassword.tsx  # renamed "Change password", icons
frontend/src/pages/Dashboard.tsx    # PageHeader, stat cards, avatar, quick actions
frontend/src/pages/Products.tsx     # PageHeader, toasts, skeletons, empty states, icons
frontend/src/pages/Profile.tsx      # PageHeader + toast feedback
frontend/src/pages/Admin.tsx        # PageHeader, avatars, badges, empty states
```

**Key design decisions:**
- All colors removed; the palette is `#111` / whites / grays only. Errors invert to a solid black block for an unmistakable, formal signal.
- Headings use a serif stack (Georgia), body keeps Inter — classic formal pairing.
- The navbar gained a monogram brand mark, per-link icons, the signed-in user's avatar + sign-out button, and the app now has a footer.
- Success feedback moved to the existing (previously unused) toast system; loading states use skeletons; empty lists use the EmptyState component.
- `PROJECT_BUILD_PHASES.md` and behavior untouched: all CRUD / cart / orders / favorites / RBAC logic is identical.

**Verify:** `npm run build` in `frontend/` passes (tsc + vite); login/register pages render the monochrome theme; dashboard shows stat cards; products page shows toasts, skeletons and empty states.

---

# PHASE 20 — Frontend CSS → Tailwind CSS

**Goal:** Replace the hand-written design-system stylesheet with Tailwind CSS, keeping the exact same formal monochrome look.

**What you learn:**
- Tailwind CSS v4 setup with the `@tailwindcss/vite` plugin (no `tailwind.config` file, no PostCSS config)
- Defining design tokens in `@theme` so they become utilities (`--color-ink` → `text-ink`/`bg-ink`, `--font-serif` → `font-serif`, `--shadow-nav` → `shadow-nav`)
- Custom animations via `--animate-*` + `@keyframes` (spin, shimmer, toast-in, page-in)
- Element-level defaults (headings, labels, inputs, buttons) via `@layer base` with `@apply`
- Arbitrary variants for the old media queries (`max-[820px]:` ≈ `@media (max-width: 820px)`, `max-[640px]:` for lists) and pseudo-class tricks like `peer-focus:` for the icon-in-input pattern

**Files changed (frontend only):**
```
frontend/package.json          # + tailwindcss, @tailwindcss/vite
frontend/vite.config.ts        # + tailwindcss() plugin
frontend/src/index.css         # rewritten: @import tailwindcss, @theme tokens,
                               #   @layer base element defaults, .skeleton shimmer
frontend/src/components/App.tsx|Badge|Avatar|Toast|EmptyState|Spinner|PageHeader|ProtectedRoute
frontend/src/pages/Login|Register|ForgotPassword|Dashboard|Profile|Admin|Products
```

**Key decisions:**
- The palette/typography/shadow tokens moved 1:1 into `@theme` (canvas, surface, line, ink, muted, accent, serif headings, mono prices).
- Nearly every `.class` became inline Tailwind utilities; the only classes left in CSS are `.skeleton` (needs a `::after` shimmer pseudo-element) plus the tiny `.error`/`.success`/`.panel`/`.row` helpers reused across many pages.
- The old `@media (max-width: 820px)` navbar collapse became `max-[820px]:` variants; the 640px list collapse became `max-[640px]:`.
- `index.css` shrank from ~600 lines of raw CSS to ~200 lines of Tailwind (tokens + base + 5 component classes).

**Verify:** `npm run build` in `frontend/` passes (tsc + vite); the login/register/dashboard/products/admin pages still render the identical monochrome design (checked by screenshotting the running dev server and comparing rendered colors to the token values).

**Responsive regression fixes (same phase):**
- The old `.container` was a plain block; adding `display: flex` to its Tailwind equivalent turned every page into a row flex container whose child refused to shrink — horizontal overflow at narrow widths. Removed the stray `flex` (the `.app` shell still owns the column layout via `flex-1`).
- The old `.stat-value { word-break: break-word }` became `break-words` (`overflow-wrap: break-word`), which does **not** reduce a flex item's automatic minimum size, so long emails forced stat cards wider than their grid track. Fixed with `min-w-0` on every text-holding flex item + `break-words` on long values (emails, usernames). Note `break-anywhere` does **not** exist in Tailwind v4 (silently dropped) — don't use it.
- Verified with a real browser over the DevTools protocol: no horizontal overflow at 320–1280px on any page; the hamburger menu toggles to a column under 820px; product list items stack under 640px; the admin grid collapses to one column under 820px.

---

# PHASE 21 — Confirmation Dialog (replaces window.confirm)

**Goal:** Replace the browser's native `window.confirm()` with an in-app modal for destructive actions.

**What you learn:**
- A controlled modal component (`open` prop + `onConfirm`/`onCancel` callbacks) that renders nothing when closed
- Overlay + dialog card, Escape-to-cancel, backdrop-click-to-cancel, and body scroll locking while open
- Accessibility basics: `role="dialog"`, `aria-modal`, labelled/described-by, `autoFocus` on the safe (Cancel) button

**Files created / changed (frontend only):**
```
frontend/src/components/ConfirmDialog.tsx  # new: text + Cancel + Confirm (optional danger variant)
frontend/src/pages/Admin.tsx               # delete user now opens the dialog (was window.confirm)
frontend/src/pages/Products.tsx            # delete product now opens the dialog (was window.confirm)
```

**Verify:** click Delete on a user/product -> modal shows the message; Cancel/Escape/backdrop close it without deleting; Confirm runs the delete and the list refreshes.

---

# PHASE 22 — Production Deployment (Render + Supabase)

**Goal:** Deploy the backend API to Render as a Docker service, backed by Supabase cloud Postgres.

**What you learn:**
- Multi-stage Docker builds for small, secure production images
- RenderBlueprint (`render.yaml`) for infrastructure-as-code
- Health check endpoints for platform liveness probes
- Running Alembic migrations automatically on deploy
- `.gitignore` hardening to keep secrets out of version control

**Pre-requisites (done in earlier stages):**
- Supabase Postgres database with `DATABASE_URL` working locally
- Multi-stage `Dockerfile` + `docker-entrypoint.sh` (migrations + gunicorn)
- `docker-compose.yml` already removed the local Postgres service

**Files changed / created:**
```
.gitignore              # expanded: .env, venv/, __pycache__/, logs/, uploads/, test.db, IDE files
app/main.py             # added GET /health endpoint (200 OK for Render liveness probe)
render.yaml             # new: Render Blueprint defining the web service
```

**Steps:**

1. **Harden `.gitignore`** — the original file only ignored `/node_modules`. Added `.env` (contains Supabase password + JWT secret), `venv/`, `__pycache__/`, `*.pyc`, `logs/`, `uploads/`, `test.db`, `.pytest_cache/`, `.idea/`, `.vscode/`, `Thumbs.db`, `.DS_Store`.

2. **Add health check endpoint** in `app/main.py`:
   ```python
   @app.get("/health")
   def health():
       return {"status": "ok"}
   ```
   Render pings this path to decide if the service is alive. Returns 200 when the process is up.

3. **Create `render.yaml`** at the repo root:
   ```yaml
   services:
     - type: web
       name: fastapi-jwt-rbac
       runtime: image           # build from Dockerfile
       image:
         url:                   # empty = build from repo Dockerfile
       envVars:
         - key: DATABASE_URL
           sync: false          # paste in Render dashboard (sensitive)
         - key: SECRET_KEY
           generateValue: true  # Render generates a random 64-char hex
         - key: ENVIRONMENT
           value: prod          # hides /docs, /redoc, /openapi.json
         - key: REDIS_URL
           sync: false          # set later when adding managed Redis
         - key: CORS_ORIGINS
           sync: false          # set after frontend is deployed
         - key: ALGORITHM
           value: HS256
         - key: ACCESS_TOKEN_EXPIRE_MINUTES
           value: "30"
         - key: LOG_DIR
           value: logs
       healthCheckPath: /health
       autoDeploy: true         # redeploy on every push to main
   ```

4. **Verify Docker build locally:**
   ```
   docker build -t fastapi-test .
   docker run -d --name fastapi-test-run -p 8000:8000 --env-file .env fastapi-test
   curl http://localhost:8000/health       # → {"status":"ok"}
   curl http://localhost:8000/docs         # → Swagger UI (dev mode; disabled in prod)
   ```
   Clean up: `docker stop fastapi-test-run && docker rm fastapi-test-run`

5. **Deploy on Render:**
   - Push the repo to GitHub (with the updated `.gitignore` — make sure `.env` is NOT tracked).
   - In Render dashboard: **New → Web Service → Connect GitHub repo**.
   - Render auto-detects the `Dockerfile`. Set env vars:
     - `DATABASE_URL` — paste your Supabase session-pooler URL
     - `SECRET_KEY` — paste your existing key (or let Render generate one)
     - `ENVIRONMENT` — `prod`
   - Deploy. Render builds the image → runs `docker-entrypoint.sh` → applies migrations → starts gunicorn.
   - Note the generated URL (e.g. `https://fastapi-jwt-rbac.onrender.com`).

6. **Verify the live deployment:**
   - `GET /health` → `{"status":"ok"}`
   - `GET /docs` → 404 (docs disabled in prod)
   - `POST /auth/register` → 201 with user + profile
   - `POST /auth/login` → token returned

**Key decisions:**
- **2 gunicorn workers** — Render free tier has 512 MB RAM; 2 workers fit comfortably. Scale to 4 on a paid plan.
- **`ENVIRONMENT=prod`** — disables Swagger/ReDoc/OpenAPI so attackers don't get a full API map.
- **`SECRET_KEY` generated by Render** — one less secret to manage; Render encrypts env vars at rest.
- **`autoDeploy: true`** — every push to `main` triggers a rebuild + migration + restart.

**Verify:** the live URL returns `{"status":"ok"}` on `/health`, and `POST /auth/register` + `POST /auth/login` work end-to-end against the Supabase database.

---

# PHASE 23 — Frontend Deployment (Vercel)

**Goal:** Deploy the React SPA to Vercel, pointing directly at the Render backend via CORS.

**What you learn:**
- Vercel's zero-config React/Vite deployment
- Cross-origin API calls (frontend on Vercel, backend on Render)
- SPA routing via `vercel.json` rewrites
- Environment variables at build time (Vite's `VITE_*` prefix)

**Architecture (after this phase):**
```
browser → Vercel (React SPA)  →  fetch("https://api.onrender.com/...")
                    ↓                          ↓
             Static files served        Render (FastAPI)
             by Vercel CDN             with Supabase Postgres
```

No nginx. The frontend calls the backend URL directly. CORS handles cross-origin.

**Pre-requisites:**
- Backend deployed on Render (Phase 22) with a known URL
- Backend `CORS_ORIGINS` updated to include the Vercel URL

**Files changed / created:**
```
frontend/.env.production   # VITE_API_BASE_URL now points to Render URL
frontend/vercel.json       # SPA rewrite + asset caching headers
```

**Steps:**

1. **Update `frontend/.env.production`:**
   ```env
   VITE_API_BASE_URL=https://fastapi-jwt-rbac.onrender.com
   ```
   This tells axios to call the Render backend directly. The old `/api` value was for the nginx proxy (Docker/VPS path).

2. **Create `frontend/vercel.json`:**
   ```json
   {
     "rewrites": [
       {
         "source": "/((?!assets/).*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```
   - The rewrite sends every non-asset path to `index.html` so react-router handles client-side routing.
   - Hashed build assets (`/assets/index-*.js`, `/assets/index-*.css`) get immutable caching.

3. **Update backend CORS on Render:**
   In the Render dashboard → env vars → `CORS_ORIGINS`:
   ```
   https://your-app.vercel.app
   ```
   This tells FastAPI to allow requests from the Vercel origin.

4. **Deploy on Vercel:**
   - Push to GitHub.
   - In Vercel dashboard: **New Project → Import GitHub repo**.
   - Framework: **Vite** (auto-detected).
   - Root directory: `frontend/`.
   - Build command: `npm run build` (auto-detected).
   - Output directory: `dist` (auto-detected).
   - Environment variable: `VITE_API_BASE_URL` = `https://fastapi-jwt-rbac.onrender.com`
   - Deploy.

5. **Verify end-to-end:**
   - Visit `https://your-app.vercel.app` → React app loads.
   - Register a new account → 201 → redirected to dashboard.
   - Login → token stored in localStorage → dashboard shows data.
   - Products page loads from the Render backend.
   - Admin page (if user has ADMIN role) shows user list.

**Key decisions:**
- **Vercel over Netlify** — better Vite integration, faster builds, generous free tier.
- **Direct backend URL** — no nginx proxy; simpler architecture, CORS handles cross-origin.
- **`VITE_API_BASE_URL` in Vercel dashboard** — keeps the secret out of git; the `.env.production` file is a fallback for local testing.
- **Asset caching** — hashed filenames get `immutable` headers so repeat visits are instant.

**Verify:** the live Vercel URL loads the React app, register/login works, products load from the Render backend, and no CORS errors appear in the browser console.

---

# PHASE 24 — Dark / Light Mode (Context API + CSS Custom Properties)

**Goal:** Add a toggleable dark/light theme that persists across sessions, using React Context API and CSS custom properties wired into the existing Tailwind v4 design tokens.

**What you learn:**
- React Context + hooks for global theme state (`ThemeContext`)
- CSS custom properties (`:root` / `.dark` selector) so all Tailwind utilities adapt automatically
- Tailwind v4's `@custom-variant` directive for class-based `dark:` prefix support
- `localStorage` persistence + OS `prefers-color-scheme` detection
- Smooth transitions between themes

**Files created / changed (frontend only):**
```
frontend/src/context/ThemeContext.tsx   # NEW: theme state, toggle/setTheme, localStorage + OS detection
frontend/src/index.css                 # CSS variables on :root + .dark, @custom-variant dark, smooth body transition
frontend/src/main.tsx                  # wrapped app in <ThemeProvider>
frontend/src/App.tsx                   # Sun/Moon toggle button in navbar + useTheme hook
frontend/src/components/Badge.tsx      # fixed hardcoded bg-white → bg-surface for dark mode
```

**How it works:**
1. **ThemeContext** holds `theme` (`'light'` | `'dark'`), `toggleTheme()`, and `setTheme()`. On mount it reads from `localStorage`; if nothing is stored it checks `matchMedia('(prefers-color-scheme: dark)')`.
2. **CSS variables** — `:root` defines light-mode values, `.dark` overrides them. The `@theme` block references these variables so every Tailwind utility (`bg-surface`, `text-ink`, `border-line`, etc.) adapts automatically without changing any component code.
3. **`@custom-variant dark`** — enables the `dark:` Tailwind prefix for explicit overrides when needed (e.g. `dark:shadow-md`).
4. **Persistence** — the selected theme is saved to `localStorage('theme')` and restored on reload.
5. **OS listener** — a `matchMedia('change')` listener updates the theme when the OS preference changes, but only if the user hasn't manually set a preference.

**Verify:** `npm run build` in `frontend/` passes (tsc + vite); clicking the Moon/Sun icon in the navbar toggles between light and dark modes; refreshing the page preserves the choice; on first visit the OS preference is respected.

---

# PHASE 25 — CartContext (Global Cart State)

**Goal:** Share cart state across all pages (navbar badge, products page, future checkout page) via React Context.

**What you learn:**
- Extracting page-local state into a global context provider
- Derived values (`cartCount`, `cartTotal`) computed from context state
- Auto-fetching data on mount + clearing on logout
- Thin wrapper pattern: context handles API + state, page handles UI side effects (toasts, product list refresh)

**Problem solved:**
- Cart state was local `useState` in `Products.tsx` — the floating `CartButton` independently fetched cart count, so they could get out of sync.
- No way for other pages (future checkout, etc.) to access cart data.

**Files created / changed (frontend only):**
```
frontend/src/context/CartContext.tsx    # NEW: CartProvider + useCart hook
frontend/src/main.tsx                  # +<CartProvider> in provider tree (inside AuthProvider)
frontend/src/components/CartButton.tsx  # simplified: uses useCart() instead of own API call
frontend/src/pages/Products.tsx         # local cart state replaced with useCart() hook
frontend/src/App.tsx                    # removed unused ShoppingCart import
```

**Context shape:**
```tsx
interface CartContextValue {
  cart: CartItem[]
  loading: boolean
  error: string
  cartCount: number          // derived: cart.length
  cartTotal: number          // derived: sum of price * quantity
  loadCart: () => Promise<void>
  addToCart: (productId: number) => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  checkout: () => Promise<{ orders: number }>
  clearError: () => void
}
```

**Provider tree (after):**
```
ThemeProvider → AuthProvider → CartProvider → ToastProvider → App
```

**Key decisions:**
- `CartProvider` sits inside `AuthProvider` so it can read `user` state and auto-fetch/clear the cart.
- `cartOpen` (panel visibility) stays as local state in `Products.tsx` — it's UI state, not shared data.
- Context methods throw on error so the calling page can handle toasts/product-list refresh; the context itself only stores the error string for display.
- `CartButton` now reads `cartCount` from context — always in sync with the cart panel.

**Verify:** `npx tsc --noEmit` passes; `npx vite build` succeeds; adding/removing/updating cart items on the Products page immediately updates the CartButton badge count; checkout empties the cart and updates the badge.

---

## Suggested Learning Order (if rebuilding)

1. Setup → 2. DB connection → 3. Schema → 4. Schemas → 5. Security → 6. Auth → 7. CRUD → 8. JWT/RBAC → 9. Admin → 10. Products → 11. Favorites → 12. Cart → 13. Orders → 14. Cross-cutting → 15. Tests → 16. Frontend setup → 17. Frontend auth/routing → 18. Frontend pages → 19. Design system → 20. Tailwind CSS → 21. Confirmation dialog → 22. Backend deployment → 23. Frontend deployment → 24. Dark/Light mode → 25. CartContext (global cart state).

Each phase builds on the previous one, and each phase is independently testable before moving on.