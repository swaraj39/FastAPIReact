// ============================================================
// Central HTTP layer for talking to the FastAPI backend.
//
// A single `request` helper handles: JSON serialization, the Bearer
// token header, and turning error responses into thrown ApiErrors so
// pages can show friendly messages. All endpoints are typed.
// ============================================================

import type {
  DashboardInfo,
  Forgot,
  PaginatedProducts,
  Product,
  ProductInput,
  ProfileUpdate,
  RegisterInput,
  Token,
  User,
  UserWithProducts,
} from './types'

// Thrown whenever the backend returns a non-2xx response. `status` is
// the HTTP code (401, 403, 404, 409...) and `detail` is the message.
export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

// ---- Token persistence -------------------------------------------------
// The JWT is stored in localStorage so the user stays logged in across
// page reloads. (For tighter security you would use httpOnly cookies.)
const TOKEN_KEY = 'token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ---- Generic fetch wrapper ---------------------------------------------
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  // Build headers. OAuth2 login sends URLSearchParams (form-encoded);
  // every other request sends JSON.
  const headers: Record<string, string> = {
    ...(options.body instanceof URLSearchParams
      ? { 'Content-Type': 'application/x-www-form-urlencoded' }
      : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  }

  // Attach the JWT: `Authorization: Bearer <token>`. The backend's
  // OAuth2PasswordBearer dependency reads it on protected routes.
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })

  if (!res.ok) {
    // Parse the error body. FastAPI returns `{"detail": "..."}` or a
    // list of validation errors, so we normalize both into one message.
    let detail = res.statusText
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail))
        detail = body.detail.map((e: { msg: string }) => e.msg).join(', ')
    } catch {
      /* response had no JSON body - keep the status text */
    }
    throw new ApiError(res.status, detail)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// ---- Endpoint methods ---------------------------------------------------
export const api = {
  // POST /auth/login (form data). Stores the token on success.
  async login(username: string, password: string): Promise<Token> {
    const body = new URLSearchParams()
    body.set('username', username)
    body.set('password', password)
    const token = await request<Token>('/auth/login', { method: 'POST', body })
    setToken(token.access_token)
    return token
  },

  // POST /auth/register - sends User + Profile fields together; the
  // backend splits them into the users and profiles tables (one-to-one).
  register(data: RegisterInput): Promise<User> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(data) })
  },

  // GET /user/profile - returns the logged-in user (+ profile).
  getProfile(): Promise<User> {
    return request('/user/profile')
  },


  forgotpassword(data: Forgot): Promise<String> {
    return request('/user/forgot', { method: 'POST', body: JSON.stringify(data)})
  },
  // PUT /user/update - update account + profile fields in one call.
  updateProfile(data: ProfileUpdate): Promise<User> {
    return request('/user/update', { method: 'PUT', body: JSON.stringify(data) })
  },

  // GET /user/dashboard
  getDashboard(): Promise<DashboardInfo> {
    return request('/user/dashboard')
  },

  // GET /products?owner_id=...&page=...&limit=... - one page of products,
  // each with its nested `owner` (many-to-one, eager-loaded server-side).
  listProducts(
    ownerId?: number,
    page = 1,
    limit = 5,
  ): Promise<PaginatedProducts> {
    const params = new URLSearchParams()
    if (ownerId !== undefined) params.set('owner_id', String(ownerId))
    params.set('page', String(page))
    params.set('limit', String(limit))
    return request(`/products?${params.toString()}`)
  },

  // POST /products - create a product owned by the current user.
  createProduct(data: ProductInput): Promise<Product> {
    return request('/products', { method: 'POST', body: JSON.stringify(data) })
  },

  // PUT /products/:id
  updateProduct(id: number, data: Partial<ProductInput>): Promise<Product> {
    return request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // DELETE /products/:id
  deleteProduct(id: number): Promise<{ message: string }> {
    return request(`/products/${id}`, { method: 'DELETE' })
  },

  // GET /admin/users - list all users (admin only).
  adminUsers(): Promise<User[]> {
    return request('/admin/users')
  },

  // GET /admin/users/:id - ONE-TO-MANY: a single user WITH all their
  // products, eager-loaded via selectinload on the backend.
  adminUserDetail(id: number): Promise<UserWithProducts> {
    return request(`/admin/users/${id}`)
  },

  // DELETE /admin/users/:id
  adminDeleteUser(id: number): Promise<{ message: string }> {
    return request(`/admin/users/${id}`, { method: 'DELETE' })
  },


}
