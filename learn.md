# Learn This Project — From Basics to Advanced

A guided tour of this codebase: a **FastAPI + React** web app demonstrating a production-style
layered backend (API → Service → Repository → Model), JWT authentication, **role-based access
control (RBAC)**, and every major **SQL relationship type** (one-to-one, one-to-many,
many-to-many), plus a polished React frontend on top.

Read this top to bottom, or jump to a level. Each level builds on the previous one.

---

## The stack at a glance

| Layer | Technology | Where it lives |
|---|---|---|
| Backend framework | FastAPI + Uvicorn | `app/` |
| ORM | SQLAlchemy 2.0 | `app/models`, `app/db` |
| Database | PostgreSQL (dev) / SQLite (tests, easy local start) | `DATABASE_URL` in `.env` |
| Validation | Pydantic v2 | `app/schemas` |
| Auth | python-jose (JWT) + passlib/bcrypt | `app/core/security.py` |
| Frontend | React 18 + TypeScript + Vite | `frontend/` |
| Frontend routing | react-router-dom v6 | `frontend/src/App.tsx` |
| Frontend HTTP | axios | `frontend/src/api/client.ts` |
| Tests | pytest + FastAPI `TestClient` | `app/tests` |

---

## The map (open these first)

```
project root
├── .env                      # backend secrets & config (DB URL, JWT secret, CORS origins)
├── learn.md                  # you are here
├── PROJECT_BUILD_PHASES.md   # how the project was BUILT phase by phase (great companion)
├── app/                      # ===== BACKEND =====
│   ├── main.py               # entry point: app, middleware, routers, create tables
│   ├── requirements.txt      # Python dependencies
│   ├── core/                 # config, security (hash/JWT), exceptions, logging, rate limiting
│   ├── db/                   # SQLAlchemy engine + session + Base
│   ├── models/               # the database tables (SQLAlchemy models)
│   ├── schemas/              # Pydantic request/response shapes
│   ├── repositories/         # every SQL query lives here
│   ├── services/             # business logic (auth, products, cart, orders)
│   ├── api/                  # FastAPI routes + auth/RBAC dependencies
│   │   └── v1/               #   auth.py, users.py, admin.py, products.py, cart.py, orders.py
│   ├── middleware/           # request logging middleware
│   └── tests/                # pytest suite
└── frontend/                 # ===== FRONTEND =====
    ├── index.html            # HTML shell + favicon + fonts
    ├── vite.config.ts        # build config
    └── src/
        ├── main.tsx          # React entry point (router + auth + toast providers)
        ├── App.tsx           # navbar + all routes
        ├── index.css         # the whole design system (monochrome theme)
        ├── api/              # types.ts + client.ts (typed axios wrapper)
        ├── context/          # AuthContext.tsx (global login state)
        ├── components/       # Avatar, Badge, Toast, PageHeader, Skeleton, Spinner...
        └── pages/            # Login, Register, Dashboard, Products, Profile, Admin, ...
```

---

## Level 0 — Getting it running

**Backend** (from the project root, with the `venv` active):

```bash
cd app
pip install -r requirements.txt   # first time only
cd ..
# make sure .env has a DATABASE_URL you can reach
uvicorn app.main:app --reload     # runs on http://localhost:8000
```

- Open **http://localhost:8000/docs** — FastAPI generates interactive Swagger docs from your code.
- Every endpoint you'll read below is callable from that page (click "Authorize" to log in and get a JWT).

**Frontend** (in a second terminal):

```bash
cd frontend
cp .env.example .env   # first time only
npm install            # first time only
npm run dev            # runs on http://localhost:5173
```

> **CORS note:** the frontend calls the backend *directly* (no dev proxy). The backend must
> allow the browser's origin — that's `CORS_ORIGINS` in `.env` (default `http://localhost:5173`).

**First journey (10 minutes):**
1. Register a user in the UI (or via `POST /auth/register` in Swagger).
2. Create a product on the Products page.
3. Favorite it, add it to the cart, then "Approve & Checkout".
4. Watch the backend terminal — the logging middleware prints every request.

**Tests:**

```bash
pytest            # from the project root; uses SQLite (test.db), no real DB needed
```

---

## Level 1 — How one request flows through the app

Pick the simplest endpoint: `GET /` in `app/main.py`. Trivial. Now pick a realistic one:
`GET /products`. The flow is the same shape for *every* endpoint:

```
Browser/axios  →  Middleware (logging)  →  Router (app/api/v1/products.py)
                                             │  FastAPI picks the route by URL + method
                                             ▼
                                     Dependencies (auth/RBAC)
                                             ▼
                                        Service (business logic)
                                             ▼
                                       Repository (SQL query)
                                             ▼
                                          Model (table)  →  Database
                                             ▼
                                        Pydantic schema (response shape)
                                             ▼
                                     JSON back to the browser
```

**Start here:** open `app/api/v1/products.py` and find the function behind `GET /products`.
Read its signature top to bottom — you'll see the three layers as imports/dependencies:

1. `db: Session = Depends(get_db)` — one DB session per request (see `app/db/session.py`).
2. `current_user = Depends(get_current_user)` — who is calling (see `app/api/dependencies.py`).
3. `product_service.list_products(...)` — the business logic.
4. It returns a Pydantic schema (`PaginatedProducts`) — FastAPI serializes it to JSON.

> **Mental model:** routers know *routing*, services know *rules*, repositories know *SQL*,
> schemas know *shapes*. One job each — this is why the project stays easy to extend.

---

## Level 2 — The data model: all four relationship kinds

This project is a mini-course in relational design. Every table lives in `app/models/`
(a SQLAlchemy model = one table). Open these files as you read:

| Relationship | Kind | Tables | Model files |
|---|---|---|---|
| User ↔ Profile | **one-to-one** | `users` → `profiles` | `user.py`, `profile.py` |
| User ↔ Product | **one-to-many** | `users` ← `products` | `user.py`, `product.py` |
| User ↔ Product (favorites) | **many-to-many** | `users` ↔ `products` via `user_favorites` | `associations.py` |
| User ↔ CartItem | **one-to-many** | `users` ← `cart_items` | `cart.py` |
| User ↔ Order | **one-to-many** | `users` ← `orders` | `orders.py` |

**One-to-one (Profile):** `profiles.user_id` has `unique=True`, so one user can have at most one
profile. On the `User` side it's `uselist=False`.

**One-to-many (Products):** `products.owner_id` is a plain foreign key to `users.id`. On the
`User` side: `products = relationship(..., cascade="all, delete-orphan")` — deleting a user
deletes their products automatically.

**Many-to-many (Favorites):** `user_favorites` is a plain association `Table` (no class) whose
two foreign keys form a **composite primary key** — that's what stops a user from favoriting
the same product twice.

**Orders vs Cart:** `orders` uses a **UUID string** as its primary key (`id = Column("order_id",
String, ...)`) so order numbers aren't guessable. Note the model is named `Orders` (plural)
because `order` is a reserved SQL keyword.

> **Try it:** `sqlite3 test.db ".tables"` and `.schema products` to see the real tables.

---

## Level 3 — Security: hashing, JWT, RBAC

Three files tell the whole story: `app/core/security.py`, `app/schemas/auth.py`,
`app/api/dependencies.py`.

1. **Passwords are never stored.** `security.hash_password()` runs bcrypt. `verify_password()`
   compares a login attempt against the stored hash. Look at `auth_service.register_user` —
   it hashes *before* saving.

2. **JWT = a signed, time-limited token.** `create_access_token()` signs a payload
   `{"sub": username, "role": role, "exp": now + 30 min}` with your `SECRET_KEY`.
   `verify_access_token()` checks the signature and expiry. The token is what the frontend
   stores in `localStorage` and sends as `Authorization: Bearer <token>`.

3. **Dependencies gate every route** (`app/api/dependencies.py`):
   - `get_current_user` — decodes the JWT, loads the user, or raises **401**.
   - `require_role(*roles)` — a *dependency factory* that returns a checker raising **403**
     unless the user's role is allowed. Example: `Depends(require_role(Role.ADMIN))`.

   That's the whole RBAC system. Add a new admin-only route and you only add one dependency.

4. **Bonus:** `app/core/rate_limiting.py` throttles a demo endpoint (`GET /products/{id}`)
   to 5 requests/minute and raises **429**. Read `app/core/exceptions.py` to see how 409/401/
   404/403 all become clean JSON via exception handlers.

---

## Level 4 — The layers: why repositories and services exist

**Repository = "how to talk to the database".** Open `app/repositories/product_repository.py`.
Every method is a SQLAlchemy query — nothing else. Notice this one:

```python
query = query.options(selectinload(Product.owner))
```

That's **eager loading**: fetch the owner in one query instead of firing one query *per product*
(the dreaded **N+1 problem**). `UserRepository.get_with_details` does the same for
`User.profile` (one-to-one) and `User.products` (one-to-many) at once.

**Service = "the rules".** Open `app/services/cart_service.py`. `add_to_cart` decides: if the
product is already in the cart, **bump the quantity** instead of adding a duplicate row.
`checkout` orchestrates *across* repositories (cart repo + order repo) in the right order.

> **The pattern:** services never write raw SQL; repositories never enforce business rules.
> If you change the database engine, only repositories change. If you change business rules,
> only services change.

---

## Level 5 — The frontend

The React app is deliberately small and layered the same way:

| Concern | File |
|---|---|
| Type definitions mirroring the API | `src/api/types.ts` |
| Typed axios wrapper + error normalization | `src/api/client.ts` |
| Global login state (context) | `src/context/AuthContext.tsx` |
| Route definitions + navbar + footer | `src/App.tsx` |
| Route guards (auth + role) | `src/components/ProtectedRoute.tsx` |
| One page per feature | `src/pages/*` |
| Reusable UI pieces | `src/components/*` |
| The whole visual theme | `src/index.css` |

**The happy path to read in order:**

1. `client.ts` — every backend call is one method (`api.login`, `api.listProducts`,
   `api.checkoutCart`, ...). A request interceptor attaches the JWT; a response interceptor
   turns backend errors into a single `ApiError` class.
2. `AuthContext.tsx` — holds `user`, `login`, `logout`, and *restores the session on reload*
   (if a token exists in `localStorage`, it calls `getProfile()` to "log back in").
3. `App.tsx` + `ProtectedRoute.tsx` — `/admin` is wrapped in
   `<ProtectedRoute roles={['ADMIN']}>`; any other page just needs a login.
4. `pages/Products.tsx` — the biggest page and the best example: it drives
   create/update/delete, pagination, favorites, the cart and orders panels, and shows
   success feedback via the `useToast()` hook.

**Design system:** everything visual is driven by CSS variables in `src/index.css`
(`--text`, `--surface`, `--border`, ...). The app is a formal **black-and-white theme** —
no colors anywhere. Changing the look of the entire app is a matter of editing those tokens.

---

## Level 6 — Advanced flows (trace these end-to-end)

1. **Favorites (many-to-many, transient data).**
   `POST /products/{id}/favorite` appends a row to `user_favorites`. Then look at
   `product_service.stamp_favorites` — it sets `is_favorited` on each product *in memory only*,
   never saved, so the API can tell the UI "this is favorited *by you*".

2. **Cart → Checkout → Orders.**
   `POST /cart` adds a pending line → `POST /cart/checkout` (`cart_service.checkout`)
   converts every line into an `Orders` row, then empties the cart, and returns how many
   orders were placed. The frontend then refreshes both panels.

3. **Pagination.**
   `GET /products?page=2&limit=5` returns `{items, total, page, pages}` (see
   `schemas/product.py`). The frontend renders Prev/Next from `pages`.

4. **Object-level permissions.**
   A user may edit/delete only their *own* products — `product_service.can_manage_product()`
   raises 403 unless `product.owner_id == user.id or user.role == ADMIN`. The UI mirrors this
   with the `canManage()` check in `Products.tsx`.

5. **Registration transaction.**
   `auth_service.register_user` creates the User *and* its one-to-one Profile in a single
   `commit()` — both or neither.

6. **Errors end-to-end.**
   Service raises `ResourceNotFoundError` → `app/core/exceptions.py` handler → JSON
   `{"detail": "..."}` → axios interceptor → thrown `ApiError` → React shows it in a black
   error block or toast.

7. **Logging.**
   `middleware/request_logging.py` times every request and writes method/path/status/duration
   to both the console and a rotating file in `logs/`.

---

## Level 7 — Exercises (in order of difficulty)

Try these to make the knowledge stick. Each is a small, safe change.

1. **Read-only:** list all routes with `uvicorn app.main:app` running and browse
   `http://localhost:8000/docs`. Find the endpoint behind every button in the UI.
2. **Add a field:** add a `nickname` column to the Profile model, expose it in the schema,
   and show it on the Profile page. (You'll touch model → schema → service/repo → frontend.)
3. **New role check:** create a route that only `REVIEWER` can call
   (`require_role(Role.REVIEWER)`), then try it as a regular user (403).
4. **New endpoint:** add `GET /user/stats` returning the user's product/order counts.
   Follow the pattern in `user_service` + `users.py` + a new schema.
5. **Query optimization:** temporarily remove `selectinload(Product.owner)` and watch the SQL
   log explode into N+1 queries, then add it back.
6. **Theme experiment:** change the `--text` token in `src/index.css` to `#1a2a6c` and watch
   the whole monochrome theme shift — then change it back.
7. **Hard:** implement product quantity in the cart (`PUT /cart/{id}` already exists on the
   backend) and add a `+`/`−` stepper in the Products page.

---

## Suggested reading order (15–30 min at a time)

| Step | Read | Outcome |
|---|---|---|
| 1 | `learn.md` Level 0 + run the app | It runs; you know the journey |
| 2 | `app/main.py`, `app/api/v1/router.py`, `app/db/session.py` | You understand the request pipeline |
| 3 | All of `app/models/` | You can name all 4 relationship kinds |
| 4 | `app/core/security.py` + `app/api/dependencies.py` | You can explain auth & RBAC |
| 5 | One full vertical slice: `products.py` → `product_service.py` → `product_repository.py` | You know the layer pattern |
| 6 | `app/services/cart_service.py` (checkout) | You know a cross-repository flow |
| 7 | `frontend/src/api/client.ts` + `context/AuthContext.tsx` + `App.tsx` | You can trace login end-to-end |
| 8 | `frontend/src/pages/Products.tsx` | You can trace the biggest UI flow |
| 9 | `app/tests/conftest.py` + `test_auth.py` | You know how the app is tested |

Then re-read `PROJECT_BUILD_PHASES.md` — it explains *why* each piece was added in the order
it was built, from a skeleton to a full product.

> **Golden rule for exploring:** every feature has exactly one path —
> URL → router → dependency → service → repository → model → schema → (frontend page).
> If you can name the path, you understand the feature.
