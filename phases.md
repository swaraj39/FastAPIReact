# FastAPI + ReactJS — Complete Tutorial Curriculum (`phases.md`)

A step-by-step **teaching plan** for taking absolute beginners to advanced full-stack developers,
using **this repository** as the live example. Every phase = one lesson. Each lesson has a goal,
the concepts to explain, hands-on build steps, code to show, a checkpoint to verify, and exercises.

> **How to use this file (for the instructor):**
> - Teach phases strictly in order — each one builds on the previous.
> - Live-code each phase yourself first, then let students reproduce it.
> - Never skip a checkpoint. If the checkpoint fails, fix it before moving on.
> - The companion docs in this repo are gold: `PROJECT_BUILD_PHASES.md` (how it was built)
>   and `learn.md` (guided tour). Use them as instructor notes.

---

## Who this course is for

- Students who know **basic Python** (variables, functions, loops, classes) and **basic HTML/CSS/JS**.
- No prior FastAPI, SQLAlchemy, React, or TypeScript knowledge assumed.

## What students end up able to build

A production-style web app exactly like this one:

```
React (TypeScript) SPA  ──HTTP/JSON──►  FastAPI REST API  ──►  PostgreSQL
     │                                        │
     ├─ Login/Register pages                  ├─ JWT auth + roles (ADMIN/REVIEWER/USER)
     ├─ Products page (CRUD, pagination,      ├─ Layered architecture:
     │   favorites, cart, checkout)           │    Router → Service → Repository → Model
     └─ Admin dashboard                       ├─ One-to-one / one-to-many / many-to-many tables
                                              └─ Middleware, rate limiting, logging, tests
```

## Course map (8 parts · 36 phases)

| Part | Phases | Level |
|---|---|---|
| 0. Foundations | 1–4 | Absolute beginner |
| 1. FastAPI basics | 5–9 | Beginner |
| 2. Database & architecture | 10–15 | Beginner+ |
| 3. Authentication & security | 16–20 | Intermediate |
| 4. Real features (backend) | 21–26 | Intermediate+ |
| 5. React basics | 27–31 | Beginner→Intermediate |
| 6. React ↔ API integration | 32–34 | Intermediate→Advanced |
| 7. Production & capstone | 35–36 | Advanced |

---

---

# PART 0 — FOUNDATIONS

---

# PHASE 1 — Tooling Setup & Environment

**Goal:** Every student has a working machine before any code is written.

**Concepts to teach:**
- Why virtual environments exist (project-isolated dependencies, version conflicts)
- Why Node.js is needed (the React toolchain runs on Node)
- VS Code extensions: Python, Pylance, ESLint

**Steps (walk through together):**
1. Install Python 3.11+, Node.js 18+ LTS, Git, VS Code.
2. Verify installs:
   ```bash
   python --version      # 3.11+
   node --version        # v18 or v20+
   npm --version
   git --version
   ```
3. Clone this repo, look at the top-level layout (don't read code yet).
4. Create the Python environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
5. Show what changes when the venv is active (prompt prefix, `pip` installs inside it).

**Checkpoint:** everyone can run all four version commands and activate/deactivate a venv.

**Exercises:**
- Deactivate and re-activate the venv.
- Run `pip list` inside vs outside the venv — compare output.

---

# PHASE 2 — How the Web Works: HTTP, REST & JSON

**Goal:** Students can describe a full request/response cycle before writing an API.

**Concepts to teach (use diagrams, no code):**

1. **Client–server model.** Browser = client. Our FastAPI app = server. They talk over HTTP.
2. **An HTTP request has:** method + URL + headers + optional body.
   | Method | Meaning | Example |
   |---|---|---|
   | GET | Read data | `GET /products` |
   | POST | Create data | `POST /auth/register` |
   | PUT | Update data | `PUT /user/update` |
   | DELETE | Remove data | `DELETE /products/{id}` |
3. **Status codes are the server's reply summary:**
   - `200` OK · `201` Created · `204` No Content
   - `400` Bad Request · `401` Unauthorized · `403` Forbidden · `404` Not Found · `409` Conflict · `422` Validation Error · `429` Too Many Requests
   - `500` Server Error
4. **JSON** is the common data language: `{"username": "swaraj", "role": "USER"}`.
5. **REST convention:** URLs are nouns (`/products`), methods are verbs (`DELETE /products/5`).
6. **What a full-stack app looks like:** React runs *in the browser*; FastAPI runs *on a server*;
   they only exchange JSON over HTTP. They never share memory.

**Hands-on:** open a browser DevTools → Network tab → visit any site → inspect a request
(method, status, response JSON). Then start the finished project (`uvicorn app.main:app`)
and call `GET http://localhost:8000/` in the browser — see the JSON `{"message": "..."}`.

**Checkpoint:** student can answer: "What's the difference between 401 and 403?"
(401 = who are you? not logged in. 403 = I know who you are, but you're not allowed.)

**Exercise:** In Swagger (`/docs`) of the running app, fire `GET /products?page=1&limit=5`
and identify method, query params, status code and body shape.

---

# PHASE 3 — Python for Web Dev: Type Hints & Virtual Env Habits

**Goal:** Teach the modern-Python subset FastAPI relies on.

**Concepts to teach:**
1. **Type hints** — FastAPI uses them for validation AND auto-docs:
   ```python
   def greet(name: str, times: int = 1) -> str:
       return name * times
   ```
2. **Optional / default values:**
   ```python
   def search(q: str | None = None): ...   # q is optional query param later
   ```
3. **Classes & inheritance** — every Pydantic schema and SQLAlchemy model is a class.
4. **Generators (`yield`)** — preview: our DB session dependency yields a session and closes it after.
5. **Decorators (`@something`)** — preview: `@app.get("/path")`, `@router.post(...)` are decorators.
6. **f-strings, dict/list literals, unpacking** — appear everywhere.

**Hands-on mini-lab (plain `.py` file, no frameworks):**
```python
from typing import Optional

def find_product(products: list[dict], product_id: int) -> Optional[dict]:
    for p in products:
        if p["id"] == product_id:
            return p
    return None

catalog = [{"id": 1, "name": "Keyboard", "price": 999.0}]
print(find_product(catalog, 1))    # found
print(find_product(catalog, 99))   # None
```

**Checkpoint:** student writes a typed function returning `None` for missing items.

---

# PHASE 4 — Project Tour: What We're Building

**Goal:** Give students the map before the journey.

**Walk through (read-only, no coding):**

```
project root
├── app/                      # ===== BACKEND =====
│   ├── main.py               # entry point: creates the FastAPI app
│   ├── core/                 # config, security (hash/JWT), exceptions, logging, rate limiting
│   ├── db/                   # SQLAlchemy engine + session + Base
│   ├── models/               # database tables (SQLAlchemy models)
│   ├── schemas/              # Pydantic request/response shapes
│   ├── repositories/         # every SQL query lives here
│   ├── services/             # business logic
│   ├── api/v1/               # routes: auth, users, admin, products, cart, orders, files, redis
│   ├── middleware/           # request logging middleware
│   └── tests/                # pytest suite
├── alembic/                  # DB migrations
├── frontend/
│   └── src/
│       ├── api/              # typed axios wrapper (client.ts, types.ts)
│       ├── context/          # AuthContext.tsx (global login state)
│       ├── components/       # reusable UI pieces
│       ├── pages/            # Login, Register, Dashboard, Products, Profile, Admin
│       └── App.tsx           # navbar + routes
└── requirements.txt
```

**The one-sentence mental model to repeat all course long:**

> **Routers know routing · Services know rules · Repositories know SQL · Schemas know shapes.**

Run the whole app once (instructor demo): backend on :8000, frontend on :5173, register a user,
create a product, favorite it, add to cart, checkout. Say: *"By the end you'll understand every
line involved in that journey."*

**Checkpoint:** students can name the four backend layers and what each does.

---
---

# PART 1 — FASTAPI BASICS

---

# PHASE 5 — Hello FastAPI: Routes, Path Params, Query Params

**Goal:** First running API. Learn the development loop.

**Concepts:**
- `FastAPI()` instance = the application
- Route decorators bind URL+method → function
- **Path parameters** (`/products/{id}`) identify ONE resource
- **Query parameters** (`?page=2&limit=5`) filter/slice lists
- Uvicorn = the ASGI server that actually listens on the port
- `--reload` = auto-restart on save (dev only!)
- `/docs` = free interactive Swagger UI generated FROM your code + type hints

**Build (new tiny file, e.g. `scratch/hello.py` — keep `app/main.py` untouched at first):**
```python
from fastapi import FastAPI

app = FastAPI(title="My First API")

@app.get("/")
def home():
    return {"message": "Hello FastAPI"}

# Path parameter — part of the URL path
@app.get("/hello/{name}")
def greet(name: str):
    return {"greeting": f"Hi {name}!"}

# Query parameters — after the ? in the URL
@app.get("/items")
def list_items(page: int = 1, limit: int = 10, q: str | None = None):
    return {"page": page, "limit": limit, "q": q}
```

**Run & explore:**
```bash
uvicorn scratch.hello:app --reload
# open http://localhost:8000/docs
# try: /hello/Swaraj , /items?page=3&limit=5&q=keyboard
```

**Teaching moments:**
- Type hints did the validation: `/items?page=abc` → automatic `422` error. No code written!
- Show the same route in `/docs` — parameters documented automatically.

**Checkpoint:** student adds their own `GET /bye/{name}` route and sees it in `/docs`.

**Exercise:** add a `GET /square/{n}` route returning `{"result": n*n}`. What happens with `/square/abc`? Why?

---

# PHASE 6 — Request Bodies & Pydantic Models

**Goal:** Accept structured input safely. This is THE most-used FastAPI skill.

**Concepts:**
- POST/PUT need a **body**: JSON sent by the client
- A **Pydantic model** describes the body: field names, types, required/optional, constraints
- FastAPI validates automatically → invalid data never reaches your function (422 instead)
- Extra niceties: `Field(...)` constraints, `EmailStr`, defaults, docstrings → docs

**Build (extend `scratch/hello.py`):**
```python
from pydantic import BaseModel, Field, EmailStr

class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    price: float = Field(gt=0)
    description: str | None = None      # optional

@app.post("/products", status_code=201)
def create_product(product: ProductIn):
    # 'product' is ALREADY validated & typed
    return {"created": product.name, "price": product.price}
```

**Teach by breaking it (best part):**
| Try in /docs | Result |
|---|---|
| missing `name` | 422 "field required" |
| `price: -5` | 422 "greater than 0" |
| `price: "ten"` | 422 type error |
| valid payload | 201 + echo |

Then show **response shaping** — return ONLY chosen fields:
```python
class ProductOut(BaseModel):
    name: str
    price: float

@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int):
    fake_db = {1: {"name": "Keyboard", "price": 999, "secret_internal": "x"}}
    return fake_db[product_id]     # 'secret_internal' never leaves the API
```

**Key idea to state out loud:** *"Separate input schemas from output schemas — that's how you
never leak passwords."* (This project does exactly that: `UserCreate` has a password,
`UserResponse` never includes it.)

**Checkpoint:** student builds `POST /users` accepting `{name, email}` with EmailStr, rejects bad emails with 422.

**Exercise:** add `GET /products` returning a list of `ProductOut`, seeded from an in-memory dict.

---

# PHASE 7 — Project Structure & Configuration (settings, .env, routers)

**Goal:** Graduate from one-file demos to the real project skeleton.

**Concepts:**
- **Never hardcode secrets** (DB passwords, JWT keys) → `.env` file + gitignored
- **pydantic-settings** turns env vars into a typed `settings` object
- **APIRouter** splits routes across files; prefixes + tags group them (`/auth`, `/products`…)
- Versioned APIs: everything lives under `app/api/v1`

**Files (mirror the real ones):**

`app/core/config.py` — the typed settings object:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "FastAPI App"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
```

`.env` (and explain why it's in `.gitignore`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/appdb
SECRET_KEY=some-long-random-string
CORS_ORIGINS=http://localhost:5173
```

Routers — split and mount:
```python
# app/api/v1/products.py
router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/")            # full path: /products/
def list_products(): ...
```
```python
# app/api/v1/router.py — mounts all sub-routers
api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(products.router)
```
```python
# app/main.py — single place where everything is assembled
from app.api.v1.router import api_router
app = FastAPI(title=settings.APP_NAME)
app.include_router(api_router)
```

**Show the real thing:** open this repo's `app/main.py` and `app/api/v1/router.py`.
Point out tags → they're the section headings in `/docs`.

**Checkpoint:** student adds a new `health.py` router with `GET /health` mounted in `router.py`.

**Exercise:** move Phase 5–6 scratch routes into two routers (`misc`, `demo`) with proper prefixes/tags.

---

# PHASE 8 — Error Handling Done Right

**Goal:** Consistent, clean JSON errors instead of crashes.

**Concepts:**
1. **`HTTPException`** — quick per-route errors:
   ```python
   from fastapi import HTTPException
   raise HTTPException(status_code=404, detail="Product not found")
   ```
2. **Custom exception classes** — services shouldn't import FastAPI. Raise domain errors,
   translate them centrally:
   ```python
   class ResourceNotFoundError(Exception): ...
   class DuplicateResourceError(Exception): ...
   ```
3. **Exception handlers** register once in `main.py`:
   ```python
   @app.exception_handler(ResourceNotFoundError)
   def handle_not_found(request, exc):
       return JSONResponse(status_code=404, content={"detail": str(exc)})
   ```

**Show the real implementation:** `app/core/exceptions.py` — every domain error
(`DuplicateResourceError`→409, `PermissionDeniedError`→403, …) becomes uniform JSON.
Every feature added later just raises these.

**Checkpoint:** trigger a 404 from `/docs` and show the JSON body shape `{"detail": "..."}`.

**Exercise:** add a custom `PaymentRequiredError` → 402 handler.

---

# PHASE 9 — Middleware & Logging

**Goal:** Code that runs on EVERY request — observability from day one.

**Concepts:**
- **Middleware** wraps the whole request/response cycle
- Uses: logging, timing, CORS (next phases), auth headers, compression
- **Order matters**: last-added middleware runs FIRST

**Build a timing logger (mirrors `app/middleware/request_logging.py`):**
```python
import time, logging
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("api")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        logger.info("%s %s -> %s (%.1fms)",
                    request.method, request.url.path, response.status_code, ms)
        return response

app.add_middleware(RequestLoggingMiddleware)
```

**Show the real thing:** run this project and watch the terminal print one line per request.
Open `logs/` — rotating file logs too.

**Checkpoint:** every request shows method/path/status/duration in the terminal.

**Exercise:** add the request's `User-Agent` to the log line.

---
---

# PART 2 — DATABASES & ARCHITECTURE

---

# PHASE 10 — SQL Crash Course + SQLAlchemy Engine & Sessions

**Goal:** Understand relational storage before ORM magic.

**Concepts:**
1. Tables = rows + columns; primary key identifies a row; foreign key references another table.
2. Raw SQL taste (5 minutes only):
   ```sql
   SELECT id, username FROM users WHERE id = 1;
   INSERT INTO products (name, price, owner_id) VALUES ('Keyboard', 999, 1);
   ```
3. **ORM** = Python classes ↔ tables, objects ↔ rows. You write Python; it writes SQL.
4. SQLAlchemy pieces used by this project:
   - `Engine` — connection pool to the DB (built once)
   - `Session` — one conversation/unit-of-work (one per request)
   - `Base` — parent class for all models

**Files (this repo, teach line-by-line):**

```python
# app/db/base.py
from sqlalchemy.orm import declarative_base
Base = declarative_base()

# app/db/database.py
from sqlalchemy import create_engine
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL)   # pool created once at import

# app/db/session.py
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
```

**The most important pattern in the backend — the `get_db` dependency:**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db          # route handler runs with this session...
    finally:
        db.close()        # ...always closed afterwards, even on error
```

Introduce **dependency injection** properly here (it's FastAPI's superpower):
`Depends(get_db)` tells FastAPI "call this function, give me its result".
Same mechanism will later inject the logged-in user.

**Demo:** `sqlite3 test.db ".tables"` — see the real tables this project created.

**Checkpoint:** student explains WHY sessions must close (connection leaks) and what `yield` achieves.

**Exercise:** print `engine.pool.status()` after a few requests; discuss pooling.

---

# PHASE 11 — Models: Your First Table

**Goal:** Define a table in Python, create it, insert and query rows.

**Concepts:**
- One class = one table; one attribute = one column
- Column options: `primary_key`, `index`, `nullable`, `unique`, `default`
- Enums for fixed choices (`Role`: ADMIN / REVIEWER / USER)

**Minimal model (this repo keeps `app/models/demo.py` exactly for teaching this):**
```python
class Demo(Base):
    __tablename__ = "demo"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
```

**Real model from this repo (`app/models/user.py`) — richer:**
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)          # hashed, never plain!
    role = Column(Enum(Role), default=Role.USER, nullable=False)
```

**Table creation (dev convenience):**
```python
Base.metadata.create_all(bind=engine)   # creates any missing tables
```
State clearly: *"Fine for learning; production uses Alembic migrations — Phase 25."*
Point at `main.py`'s `# noqa: F401` imports: models MUST be imported somewhere so they
register themselves on `Base.metadata`.

**Checkpoint:** student adds a `Tag` model (id, name unique), restarts, sees the table in sqlite.

**Exercise:** add a `created_at = Column(DateTime, default=datetime.utcnow)` column. When is the default evaluated?

---

# PHASE 12 — Relationships: The Heart of Relational Design

**Goal:** Master all three relationship kinds. Spend a FULL session; this pays off forever.

**Concepts (draw these on a whiteboard first):**

| Kind | Example in this app | Mechanism |
|---|---|---|
| **One-to-many** | User → Products | FK on the child (`products.owner_id`) |
| **One-to-one** | User ↔ Profile | FK + `unique=True` on child, `uselist=False` on parent side |
| **Many-to-many** | Users ↔ Products (favorites) | association table with TWO FKs |

**1) One-to-many** (`app/models/user.py` + `app/models/product.py`):
```python
class User(Base):
    products = relationship(
        "Product", back_populates="owner",
        cascade="all, delete-orphan",     # delete user → delete their products
    )

class Product(Base):
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="products")
```
Teach both sides: `owner_id` is the stored FK column; `owner`/`products` are Python conveniences.

**2) One-to-one** (`profile.py`):
```python
class Profile(Base):
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)  # ← makes it 1:1
    user = relationship("User", back_populates="profile")

class User(Base):
    profile = relationship("Profile", back_populates="user", uselist=False)  # ← object, not list
```

**3) Many-to-many** (`associations.py`) — no model class, just a link table:
```python
user_favorites = Table(
    "user_favorites", Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),      # composite PK
    Column("product_id", ForeignKey("products.id"), primary_key=True),# → no duplicates!
)
# On both parents:
favorite_products = relationship("Product", secondary=user_favorites, back_populates="favorited_by")
```

**Usage demo:**
```python
user.favorite_products.append(product)   # inserts a row into user_favorites
user.favorite_products.remove(product)   # deletes that row
db.commit()
```

**Why composite PK matters:** trying to favorite twice violates the PK → naturally impossible.

**Checkpoint:** given "students ↔ courses (enrollments)", students draw tables/FKs and pick the kind. Answer: many-to-many via `enrollments`.

**Exercise (homework):** design `Post ↔ Comment` (1:N) and `Post ↔ Tag` (M:N) models on paper, then code them.

---

# PHASE 13 — The Layered Architecture (Service + Repository)

**Goal:** Introduce the pattern this entire codebase follows. THE architectural lesson.

**Concepts:**
- **Repository** = all SQL for one entity. Zero business rules. Swappable DB layer.
- **Service** = business rules + orchestration. Zero SQL.
- **Router** = HTTP plumbing only: parse input → call service → return schema.

First repository (`app/repositories/user_repository.py` pattern):
```python
class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def create(self, user: User) -> User:
        self.db.add(user); self.db.commit(); self.db.refresh(user)
        return user
```

First service (`auth_service.register_user` idea):
```python
def register_user(db, data: UserCreate) -> User:
    if user_repo.get_by_username(data.username):
        raise DuplicateResourceError("Username already taken")     # rule lives HERE
    if user_repo.get_by_email(data.email):
        raise DuplicateResourceError("Email already registered")
    user = User(username=data.username, email=data.email,
                password=hash_password(data.password))
    user.profile = Profile(...)        # one-to-one filled automatically
    return user_repo.create(user)      # one commit saves BOTH tables
```

Router stays thin:
```python
@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return auth_service.register_user(db, data)
```

**Why bother? (anticipate the classic student question)**
- Change PostgreSQL → MySQL: only repositories change.
- New rule "ban offensive usernames": only service changes.
- Tests can fake the service/repository easily.

**Checkpoint:** trace `POST /auth/register` through all layers on the whiteboard, naming each file.

**Exercise:** implement `ProductRepository.get_by_id` and `product_service.get_product_or_404`, then use them in a new route.

---

# PHASE 14 — Response Schemas for Nested Data

**Goal:** Return related objects without leaking secrets or creating infinite loops.

**Concepts:**
- `from_attributes=True` lets Pydantic read straight off SQLAlchemy objects
- **Nested schemas mirror the relationships** from Phase 12
- Summarize parents to avoid cycles: Product shows `OwnerSummary(id, username)` — NOT the full User (which would show its products, which would show owners…)

From this repo (`app/schemas/product.py`):
```python
class OwnerSummary(BaseModel):
    id: int
    username: str

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    price: float
    owner: OwnerSummary            # nested many-to-one
```

And `UserResponse` nests `profile` (one-to-one) but NEVER `password`.

Also introduce the **pagination envelope** here:
```python
class PaginatedProducts(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    pages: int
```
(The frontend's Prev/Next buttons are driven entirely by `pages`.)

**Checkpoint:** hit `GET /products/1` and identify the nesting in the JSON. Ask: why doesn't the owner object include products?

---

# PHASE 15 — Pagination, Filtering & Sorting (Backend)

**Goal:** List endpoints that scale past 20 rows.

**Concepts:**
- `offset/limit` math: `offset = (page-1)*limit`; `pages = ceil(total/limit)`
- Count query for `total`; `order_by` for stable pages
- Optional filters as `None`-defaulted params
- Guard rails: clamp `limit` (e.g. max 100)

Pattern from `product_repository.list_products`:
```python
def list_products(self, *, page: int = 1, limit: int = 10, mine_for: User | None = None):
    query = self.db.query(Product).options(selectinload(Product.owner))
    if mine_for:
        query = query.filter(Product.owner_id == mine_for.id)
    total = query.count()
    items = (
        query.order_by(Product.created_at.desc())
             .offset((page - 1) * limit)
             .limit(limit)
             .all()
    )
    return items, total, max(1, math.ceil(total / limit))
```

**Checkpoint:** `GET /products?page=2&limit=5` returns correct slice + envelope. Ask: why order before offset? (unstable ordering shuffles pages)

**Exercise:** add `?q=` name search and `?max_price=` filter to the same endpoint.

---
---

# PART 3 — AUTHENTICATION & SECURITY

---

# PHASE 16 — Password Hashing (bcrypt)

**Goal:** Non-negotiable security habit #1: never store plaintext passwords.

**Concepts:**
- Hashing ≠ encryption: one-way, salted, deliberately slow
- Verify = hash the attempt and compare against stored hash
- bcrypt via passlib handles salt internally

`app/core/security.py`:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

Live demo in a REPL:
```python
h = hash_password("secret123")     # $2b$12$... (different every time!)
verify_password("secret123", h)    # True
verify_password("wrong", h)        # False
```
Ask: *"If hashing is deterministic-ish, why do two hashes of the same password differ?"* → salt.

**Checkpoint:** register via API, then inspect the `users` row — password is `$2b$...`.

**Exercise:** prove `hash_password("same")` twice gives different outputs but both verify True.

---

# PHASE 17 — Register + Login Endpoints

**Goal:** Working account creation and sign-in producing a token.

**Register** (already sketched in Phase 13 — now finish it):
- 409 on duplicate username/email
- Hash BEFORE saving
- Create User + Profile atomically (one commit)

**Login — the OAuth2 form gotcha:**
```python
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = auth_service.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user.username, "role": user.role.value})
    return Token(access_token=token, token_type="bearer")
```
Teach: login takes **form-data**, not JSON — that's the OAuth2 spec, which is why
Swagger's Authorize button works for free.

**Checkpoint:** register → login → receive `{"access_token": "...", "token_type": "bearer"}`. Wrong password → 401.

**Exercise:** paste the access_token into jwt.io — decode header/payload. Point out it's signed, NOT encrypted (don't put secrets in it!).

---

# PHASE 18 — JWT Deep Dive

**Goal:** Students can explain every part of the token they just received.

**Concepts:**
- Structure: `header.payload.signature` (base64url each)
- Claims used here: `sub` (username), `role`, `exp` (expiry)
- Signature = HMAC(payload, SECRET_KEY) → tampering breaks verification
- Server stores NO sessions — stateless auth. The token IS the credential.
- Expiry forces re-login; keep lifetimes short (~30 min)

`create_access_token` / `verify_access_token` (real logic in `app/core/security.py`):
```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
```

**Tamper demo (memorable!):** decode payload, change `"role":"USER"` to `"role":"ADMIN"`,
re-encode WITHOUT re-signing → verification fails → 401. Security lesson locked in.

**Checkpoint:** expired/tampered/garbage tokens all yield `None` → 401 downstream.

**Exercise:** set `ACCESS_TOKEN_EXPIRE_MINUTES=-1` and prove expiry rejection, then restore it.

---

# PHASE 19 — Protecting Routes: `get_current_user`

**Goal:** The reusable dependency that gates every private endpoint.

**Concepts:**
- `OAuth2PasswordBearer(tokenUrl="/auth/login")` extracts `Authorization: Bearer <t>`
- Chain dependencies: scheme → decode → load user from DB
- 401 semantics live here, ONCE

`app/api/dependencies.py`:
```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)) -> User:
    payload = verify_access_token(token)
    if not payload or "sub" not in payload:
        raise CredentialsException()                     # → 401
    user = db.query(User).filter(User.username == payload["sub"]).first()
    if not user:
        raise CredentialsException()
    return user
```

Usage — one line protects a route:
```python
@router.get("/profile")
def profile(current_user: User = Depends(get_current_user)):
    return current_user
```

**Checkpoint:** `/user/profile` without token → 401; with valid token → profile JSON.

**Exercise:** add `GET /me/ping` that returns `{"hello": current_user.username}`.

---

# PHASE 20 — RBAC: Roles with Dependency Factories

**Goal:** Role-based access control in ~8 lines.

**Concepts:**
- Role enum on the User row (ADMIN / REVIEWER / USER)
- **Dependency factory** = function that RETURNS a dependency — parameterized guards
- 401 (not authenticated) vs 403 (authenticated, not allowed)

```python
def require_role(*roles: Role):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise PermissionDeniedError()               # → 403
        return current_user
    return role_checker
```

Use:
```python
@router.get("/admin/users")
def list_users(current_user: User = Depends(require_role(Role.ADMIN))):
    ...

@router.put("/reviews/{id}")
def review(..., user: User = Depends(require_role(Role.ADMIN, Role.REVIEWER))):
    ...
```

**Show the payoff in this repo:** the whole `/admin` module (dashboard, list users, user details,
delete user) is guarded by exactly `Depends(require_role(Role.ADMIN))`. That's the entire RBAC story.

**Checkpoint:** normal USER calling `/admin/users` → 403; ADMIN → 200.

**Exercise:** create a REVIEWER-only endpoint; verify USER gets 403, ADMIN passes if allowed by your check.

---
---

# PART 4 — REAL FEATURES (BACKEND)

---

# PHASE 21 — Full CRUD + Object-Level Permissions (Products)

**Goal:** Complete feature slice: create/read/update/delete with ownership rules.

**Concepts:**
- `owner_id` comes from the TOKEN, never the request body (clients can't lie about ownership)
- **Object-level permission:** owner OR admin may modify
- Update = load → mutate fields from schema → commit

```python
def can_manage_product(product: Product, user: User) -> None:
    if product.owner_id != user.id and user.role != Role.ADMIN:
        raise PermissionDeniedError()      # → 403
```

Routes: `POST /products`, `GET /products` (paginated, public), `GET /products/{id}`,
`PUT /products/{id}`, `DELETE /products/{id}` — each thin, delegating to service.

**Route-order gotcha worth 5 minutes:** static segments before dynamic ones —
`/products/favorites` MUST be declared before `/products/{product_id}`,
otherwise "favorites" is captured as an id.

**Checkpoint (matrix drill):** user A edits A's product ✓ · B edits A's ✗ 403 · admin edits A's ✓.

**Exercise:** implement archive (`PATCH /products/{id}/archive`) following the same permission rule.

---

# PHASE 22 — Many-to-Many Feature: Favorites (+ Transient Fields)

**Goal:** Apply Phase 12's M:N in a real feature; introduce computed-per-user state.

**Endpoints:** `POST /products/{id}/favorite`, `DELETE /products/{id}/favorite`,
`GET /products/favorites`.

**Idempotency** (safe to click twice):
```python
if product not in user.favorite_products:
    user.favorite_products.append(product)
    db.commit()
```

**Transient stamping — clever trick in this repo:**
```python
def stamp_favorites(products: list[Product], user: User) -> None:
    ids = {p.id for p in user.favorite_products}
    for p in products:
        p.is_favorited = p.id in ids      # in-memory ONLY, never persisted
```
`is_favorited` exists in the response schema but NOT the table: "favorited **by you**"
is per-viewer state, not world state.

**Checkpoint:** favorite → heart true in JSON; unfavorite twice → still 200 (no error).

**Exercise:** add `is_owner` transient stamp the same way.

---

# PHASE 23 — Cart → Checkout → Orders (Multi-Table Flow)

**Goal:** A realistic transactional workflow crossing three tables.

**Design discussion first (do this with students):**
- CartItem = pending intent (user_id, product_id, quantity)
- Order = completed fact (UUID PK so ids aren't guessable/enumerable)
- Same product twice in cart → bump quantity (merge), don't duplicate

Checkout orchestration (`cart_service.checkout`):
```python
def checkout(db: Session, user: User) -> int:
    items = cart_repo.all_for_user(db, user.id)
    count = 0
    for line in items:
        order_repo.create_from_cart_line(db, line)   # copy product/user/qty into Orders
        count += 1
    cart_repo.delete_all_for_user(db, user.id)       # then clear the cart
    return count
```

Teach: **service coordinates multiple repositories** — repos don't know about each other.
Mention UUID PKs: `default=lambda: str(uuid.uuid4())`.

**Checkpoint:** add 2 lines → checkout → cart empty + 2 orders listed. Add same product twice → quantity merged.

**Exercise:** block checkout when a product went out of stock; return 409 listing offending products.

---

# PHASE 24 — CORS Explained (Finally Connecting a Browser)

**Goal:** Demystify the error every beginner hits: blocked by CORS policy.

**Concepts:**
- Browsers enforce same-origin policy; cross-origin XHR needs server PERMISSION headers
- **Preflight**: browser sends OPTIONS first; server must answer with Access-Control-*
- CORS is a *browser* rule — Postman/curl never complain

`main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,   # ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Note the comment in `main.py`: CORS added LAST → runs FIRST, so preflight answers before anything else.

**Demo:** temporarily remove it → run the frontend → console explodes with the famous red error → restore → works. Unforgettable.

**Checkpoint:** student can explain why the backend, not the frontend, fixes CORS.

---

# PHASE 25 — File Uploads & Redis (Two Quick Wins)

**Goal:** Two small independent features; variety + confidence.

**File upload** (`app/api/v1/file.py`):
```python
@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):   # stream in 1 MB chunks
            buffer.write(chunk)
    return {"filename": file.filename}
```
Teach: `async` + chunked reads = big files without eating RAM. Discuss validating
extensions/sizes before trusting `file.filename`.

**Redis** (`app/core/redis.py` + `app/api/v1/redis.py`): a connectivity endpoint that
writes a key and reads it back. Discuss what Redis is FOR here: caching hot reads,
rate-limit counters (next phase), sessions.

**Checkpoint:** upload a file → appears in `uploads/`; `GET /redis/test-redis` echoes the value.

**Exercise:** serve uploaded files back via `GET /files/{name}` (with path-traversal protection!).

---

# PHASE 26 — Rate Limiting, Alembic Migrations & Tests

**Goal:** Three production-grade practices in one session.

**1) Rate limiting** (`app/core/rate_limiting.py`): in-memory counter per username →
429 Too Many Requests past N/min. Applied as a plain dependency on `GET /products/{id}`.
Demo: hammer refresh 6× in Swagger → 429. Mention Redis-backed limits for multi-process prod.

**2) Alembic migrations** — replace `create_all`:
```bash
alembic revision --autogenerate -m "add nickname to profiles"
alembic upgrade head
alembic downgrade -1
```
Show this repo's trick: `alembic.ini` leaves the URL EMPTY; `env.py` imports the app's own
`settings` — single source of truth for config. Workflow: edit model → autogenerate → REVIEW the script → upgrade.

**3) pytest suite** (`app/tests/`):
- `conftest.py` sets `DATABASE_URL` to SQLite **before importing `app.main`** → whole app tested against a throwaway file DB
- `TestClient(app)` calls routes without a server; dependency overrides swap `get_db`
- autouse fixture wipes tables between tests → isolation

```bash
pytest -v
```

**Checkpoint:** green test run; one migration applied and reverted cleanly; 6th rapid request → 429.

**Exercise:** write `test_products.py` covering: create requires auth (401), non-owner delete (403), owner delete (200).

---
---

# PART 5 — REACT BASICS

---

# PHASE 27 — Modern JavaScript/TypeScript Essentials

**Goal:** The JS subset React demands, with TS safety from day one.

**Concepts (rapid-fire with REPL examples):**
- `const/let`, arrow functions, template literals
- Destructuring: `const { user, loading } = props`
- Spread: `setItems([...items, newItem])`
- Array ops: `map` (rendering!), `filter`, `find`
- `async/await` + `fetch` — promise chains made readable
- **TS interfaces** = compile-time contracts:
  ```ts
  interface Product {
    id: number;
    name: string;
    price: number;
    owner: { id: number; username: string };
  }
  ```
- Generics taste: `useState<Product[]>([])`, `request<Product[]>(...)`

**Checkpoint:** student maps a real API response (`GET /products` JSON) to a TS interface on paper.

---

# PHASE 28 — React Fundamentals: Components, Props, State

**Goal:** Think in components. Build UI as functions of state.

**Concepts:**
- Component = function returning JSX; PascalCase; one job per component
- Props flow DOWN; children can't mutate parents
- `useState` — state changes trigger re-render:
  ```tsx
  const [count, setCount] = useState(0);
  <button onClick={() => setCount(count + 1)}>{count}</button>
  ```
- Rendering lists needs stable `key`s
- Conditional rendering: `{loading ? <Spinner/> : <List/>}`
- Events, controlled inputs:
  ```tsx
  const [name, setName] = useState("");
  <input value={name} onChange={(e) => setName(e.target.value)} />
  ```

**Lab (before touching the real frontend):** a counter + a todo list in one file.

**Checkpoint:** student adds/removes todos with keys and controlled inputs, no warnings in console.

---

# PHASE 29 — Vite Project Setup + TypeScript

**Goal:** Stand up the real frontend shell (mirrors `frontend/`).

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install && npm run dev     # http://localhost:5173
```

Tour the scaffold: `index.html`, `src/main.tsx` (root render), `App.tsx`, `vite.config.ts`,
`tsconfig`. Explain HMR (edit → instant update, no reload).

Add the deps this project uses:
```bash
npm install axios react-router-dom jwt-decode lucide-react
npm install tailwindcss @tailwindcss/vite
```
Wire Tailwind v4 (plugin style — no config file):
```ts
// vite.config.ts
plugins: [react(), tailwindcss()],
// src/index.css starts with:  @import "tailwindcss";
```

**Checkpoint:** dev server up; a `<h1 className="text-3xl font-bold">` renders styled.

---

# PHASE 30 — Hooks Deep Dive: useEffect & Data Fetching

**Goal:** Side effects done right — fetch, cleanup, dependency arrays.

**Concepts:**
- `useEffect(fn, deps)` runs AFTER render; deps decide WHEN
- Empty array = mount-once (fetch initial data)
- **Cleanup functions** cancel stale work
- The race condition: two searches, slow one returns last → wrong results (fix: cleanup flag)
- Loading/error/data triad — every fetch component has all three states

```tsx
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;
  api.listProducts()
    .then((data) => !cancelled && setProducts(data.items))
    .catch((e) => !cancelled && setError(e.message))
    .finally(() => !cancelled && setLoading(false));
  return () => { cancelled = true; };
}, []);
```

**Checkpoint:** student articulates what `[deps]` values cause a re-run and why cleanup exists.

**Exercise:** add a search box whose value is in the dep array; observe refetch per keystroke (then debounce it).

---

# PHASE 31 — Routing: Multi-Page Feel in One Page

**Goal:** react-router-dom v6 structure identical to `App.tsx`.

```tsx
<BrowserRouter>
  <Navbar />
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/products" element={<Products />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

Concepts: `<Link>` vs `<a>` (SPA navigation, no reload), `useNavigate()` for programmatic
redirects after login, `useParams()` for dynamic segments, 404 catch-all.

**Checkpoint:** navigate between three pages; browser Back works; no full reloads (keep console log alive to prove it).

---
---

# PART 6 — REACT ↔ API INTEGRATION

---

# PHASE 32 — The Typed API Client Layer

**Goal:** ONE file owns every network call. Pages never touch axios directly.

Look at the real `frontend/src/api/client.ts` — teach its three jobs:

1. **Central request wrapper** — base URL, JSON encoding, Bearer token injection,
   error normalization into one `ApiError` class:
   ```ts
   export class ApiError extends Error {
     constructor(public status: number, message: string) { super(message); }
   }
   ```
2. **Endpoint methods** — one typed method per backend route:
   ```ts
   login(username, password)      // NOTE: URLSearchParams — backend expects FORM data (OAuth2)!
   listProducts(page, limit)      // GET /products?page=&limit=
   createProduct(body)            // POST /products
   addToCart(productId)           // POST /cart
   checkoutCart()                 // POST /cart/checkout
   ```
3. **Token persistence** — store on login, attach every call, strip on logout/401.

Types in `types.ts` mirror backend schemas 1:1 (`Product`, `PaginatedProducts`, `User`…).
When the backend changes, ONE file updates.

**Checkpoint:** student traces `api.login()` → form-data POST → token saved → subsequent calls carry `Authorization`.

**Exercise:** add `api.getUserStats()` wired to a new backend endpoint (full-stack vertical slice!).

---

# PHASE 33 — Global Auth State: Context + Protected Routes

**Goal:** Login state available everywhere; guards that redirect.

**AuthContext** (real file: `frontend/src/context/AuthContext.tsx`):
```tsx
interface AuthCtx {
  user: User | null;
  loading: boolean;              // session restore in progress
  login: (u: string, p: string) => Promise<void>;
  logout: () => void;
}
```
- Provider holds state; `useAuth()` hook consumes it anywhere
- **Session restore on refresh:** token in localStorage → `getProfile()` → user restored.
  This kills the "logged-out flash" on F5. While `loading`, render a spinner, not the page.
- Failed restore → clear token silently.

**ProtectedRoute** (real file: `components/ProtectedRoute.tsx`):
```tsx
function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
// usage: <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><Admin/></ProtectedRoute>} />
```

**Security framing (important):** frontend guards are UX, not security — the BACKEND enforces
(Phase 19/20). Direct API calls without a token still fail with 401. Frontend hiding ≠ protection.

**Checkpoint:** hard-refresh while logged in → no login flash; visiting `/admin` as USER → bounced.

**Exercise:** redirect back to `state.from` after successful login.

---

# PHASE 34 — Building the Real Pages (Full Stack Wiring)

**Goal:** Rebuild this app's screens end-to-end. The longest phase — split over 2–3 sessions.

**Session A — Auth pages:**
- `Login.tsx`: form → `api.login()` → context → navigate to dashboard; show ApiError message inline
- `Register.tsx`: extra fields incl. nested profile; on success auto-login
- Navbar reflects `useAuth()`: links, avatar, Sign out; admin link visible only to admins

**Session B — Dashboard & Profile:**
- `Dashboard.tsx`: stat cards from `api.getDashboard()` (counts of products/orders)
- `Profile.tsx`: load → edit → save via `api.updateProfile()`; success toast

**Session C — Products (the big one, mirrors `pages/Products.tsx`):**
- List + Prev/Next driven by `pages` from `PaginatedProducts`
- Create/edit forms; Delete gated by `canManage()` (owner or admin) + ConfirmDialog
- Favorite toggle → optimistic UI → refetch to re-stamp `is_favorited`
- Cart panel: add / quantity / remove / **Approve & Checkout** → cart empties, orders panel refreshes
- Toasts for success, skeletons while loading, EmptyState for zero results

**Checkpoint (the full journey from Phase 4, now understood):**
register → dashboard → create product → favorite → add to cart → checkout → order appears →
admin account views users & their products. Every step traced to a file.

**Exercise:** add a "My Orders" filter view reusing existing endpoints.

---
---

# PART 7 — PRODUCTION & CAPSTONE

---

# PHASE 35 — Docker & Deployment Prep

**Goal:** Containerize both halves; talk production honestly.

**Concepts:**
- Image = frozen app + runtime; container = running image; compose = multi-container wiring
- Backend Dockerfile: slim python base, install reqs, `uvicorn app.main:app --host 0.0.0.0`
- Compose services: `api`, `db` (postgres), `redis`; env vars injected — no secrets baked in
- Frontend build → static assets served by nginx; nginx proxies `/api` → api container
  (or keep separate origins with CORS configured)
- Production checklist: Alembic migrate on deploy, strong SECRET_KEY, short token expiry,
  HTTPS everywhere, disable `--reload`, structured logs shipped somewhere, real rate limiting (Redis)

**Checkpoint:** `docker-compose up` → healthy stack; register/login work against Postgres-in-Docker.

---

# PHASE 36 — Capstone Projects & Where To Go Next

**Goal:** Prove mastery independently.

**Capstone options (each reuses the full stack learned):**
1. **Library system** — books (CRUD), members, loans (cart-like flow), librarian role (RBAC)
2. **Blog platform** — posts + comments (1:N), tags (M:N), drafts→publish (checkout-like state change)
3. **Expense tracker** — groups (M:N membership), shared expenses, monthly report page

Requirements: JWT auth, ≥2 roles, ≥1 of EACH relationship kind, pagination, tests for auth,
typed API client, one protected admin screen, README with setup steps.

**Further study map:**
- Backend: WebSockets, background tasks/Celery, OAuth social login, refresh tokens,
  GraphQL, query performance/indexing
- Frontend: TanStack Query (server-state), Zustand/Redux, form libraries (react-hook-form + zod),
  Playwright E2E, accessibility
- DevOps: CI pipelines, staging environments, monitoring/alerting, secrets managers

---
---

# APPENDIX — Instructor Cheat Sheets

## A. Session pacing suggestion (≈ 18 sessions × 2h)

| Sessions | Phases | Theme |
|---|---|---|
| 1 | 1–4 | Setup, HTTP, tour |
| 2–3 | 5–9 | FastAPI basics |
| 4–6 | 10–15 | DB, relationships, architecture, pagination |
| 7–9 | 16–20 | Auth & RBAC |
| 10–11 | 21–26 | Features, infra, tests |
| 12–14 | 27–31 | React fundamentals |
| 15–17 | 32–34 | Integration & pages |
| 18 | 35–36 | Docker, capstone kickoff |

## B. Common student errors → instant diagnosis

| Symptom | Likely cause | Fix |
|---|---|---|
| 422 on every POST | Body doesn't match Pydantic schema | Compare field names/types in `/docs` |
| 401 despite "being logged in" | Token not attached / expired | Check Authorization header; re-login |
| 403 on admin route | Role mismatch | Log the token's `role` claim (jwt.io) |
| CORS red wall in console | Origin not allowed | `CORS_ORIGINS` in backend `.env` |
| `ModuleNotFoundError: app` | Ran uvicorn from wrong dir | Run from project root: `uvicorn app.main:app` |
| Login always 401 | Sent JSON, endpoint expects FORM | Use `URLSearchParams` (OAuth2 form) |
| Infinite useEffect loop | Object/array literal in deps | Memoize or depend on primitives |
| React key warning | Index as key on reorderable list | Use stable unique id |
| Tables missing | Model never imported | Import in `main.py` (see `# noqa: F401`) |
| "favorites" treated as id | Route order bug | Static routes before `/{param}` |

## C. Glossary (hand out day one)

ORM · ASGI/Uvicorn · Dependency Injection · Migration · JWT · Claim · Salt/Bcrypt ·
RBAC · CORS/Preflight · N+1 / Eager loading · Transient field · Idempotent ·
SPA · HMR · Hook · Controlled component · Context · Route guard · Optimistic UI ·
Container/Image/Compose · Reverse proxy

## D. Grading rubric for the capstone

| Area | Weight |
|---|---|
| Correct relationship modeling + migrations | 20% |
| Auth + RBAC enforced server-side | 20% |
| Layered architecture respected | 15% |
| Tests cover critical paths | 15% |
| Typed API client + guarded frontend routes | 15% |
| Runs from clean clone via README | 15% |
