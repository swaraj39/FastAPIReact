// ============================================================
// Central HTTP layer for talking to the FastAPI backend.
//
// Uses axios. The base URL comes from the VITE_API_BASE_URL env var
// (see frontend/.env). The frontend calls the backend directly in both
// dev and production, so the backend CORS settings must allow this
// origin (see app/core/config.py CORS_ORIGINS).
//
// A request interceptor attaches the Bearer token; a response
// interceptor normalizes FastAPI error bodies into thrown ApiErrors.
// ============================================================

import axios, { AxiosError } from 'axios'
import type {
  CartItem,
  CartItemCreate,
  DashboardInfo,
  FavoriteResponse,
  Forgot,
  Order,
  OrderCreate,
  PaginatedProducts,
  Product,
  ProductInput,
  ProfileUpdate,
  RegisterInput,
  Token,
  User,
  UserWithProducts,
} from './types'
import { jwtDecode } from "jwt-decode"
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
// The access JWT and its longer-lived refresh token are both stored in
// localStorage so the user stays logged in across page reloads and tab
// closes. (For tighter security you would use httpOnly cookies.)
const TOKEN_KEY = 'token'
const REFRESH_KEY = 'refresh_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// ---- Axios instance -----------------------------------------------------
// Vite exposes env vars prefixed with VITE_ at build time.
//   production build:   VITE_API_BASE_URL=https://api.example.com
//   development:        unset -> "/api" (hits the Vite dev proxy)
const BASE_URL = import.meta.env.VITE_API_BASE_URL

const http = axios.create({
  baseURL: BASE_URL,
})
const isTokenExpired = (token: string) => {
  const decoded = jwtDecode(token)

  if (!decoded.exp) {
    return true
  }

  return decoded.exp * 1000 <= Date.now()
}

// Exchange the stored refresh token for a fresh access token. Skips the
// expiry check for auth calls so refreshing never recurses into itself.
http.interceptors.request.use(async (config) => {
  const isAuthCall =
    config.url?.includes('/auth/refresh') ||
    config.url?.includes('/auth/login')
  let accessToken = getToken()

  if (accessToken && isTokenExpired(accessToken) && !isAuthCall) {
    const refresh = getRefreshToken()
    if (!refresh) {
      clearToken()
      accessToken = null
    } else {
      try {
        // The backend /auth/refresh expects the refresh token in the JSON
        // body (RefreshTokenRequest schema) and returns a new access token.
        const { data } = await http.post<{ access_token: string }>(
          '/auth/refresh',
          { refresh_token: refresh },
        )
        setToken(data.access_token)
        accessToken = data.access_token
      } catch {
        // Refresh failed (invalid/expired) -> the session is over.
        clearToken()
        accessToken = null
      }
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Normalize FastAPI error responses into a single ApiError. FastAPI
// returns `{"detail": "..."}` or a list of validation errors.
http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0
    let detail = error.response?.statusText ?? error.message
    const body = error.response?.data as
      | { detail?: string | Array<{ msg: string }> }
      | undefined
    if (typeof body?.detail === 'string') detail = body.detail
    else if (Array.isArray(body?.detail))
      detail = body.detail.map((e: { msg: string }) => e.msg).join(', ')

    return Promise.reject(new ApiError(status, detail))
  },
)

// ---- Endpoint methods ---------------------------------------------------
export const api = {
  // POST /auth/login (form data). Stores both tokens on success.
  async login(username: string, password: string): Promise<Token> {
    // OAuth2PasswordRequestForm expects URL-encoded form fields; axios
    // auto-sets the form content-type for URLSearchParams bodies.
    const params = new URLSearchParams()
    params.set('username', username)
    params.set('password', password)
    const { data } = await http.post<Token>('/auth/login', params)
    const loginData = data as Token & { refresh_token?: string }
    setToken(loginData.access_token)
    if (loginData.refresh_token) setRefreshToken(loginData.refresh_token)
    return data
  },

  // POST /auth/register - sends User + Profile fields together; the
  // backend splits them into the users and profiles tables (one-to-one).
  register(data: RegisterInput): Promise<User> {
    return http.post('/auth/register', data).then((r) => r.data)
  },

  // GET /user/profile - returns the logged-in user (+ profile).
  getProfile(): Promise<User> {
    return http.get('/user/profile').then((r) => r.data)
  },

  forgotpassword(data: Forgot): Promise<String> {
    return http.post('/user/forgot', data).then((r) => r.data)
  },

  // PUT /user/update - update account + profile fields in one call.
  updateProfile(data: ProfileUpdate): Promise<User> {
    return http.put('/user/update', data).then((r) => r.data)
  },

  // GET /user/dashboard
  getDashboard(): Promise<DashboardInfo> {
    return http.get('/user/dashboard').then((r) => r.data)
  },

  // GET /products?owner_id=...&page=...&limit=... - one page of products,
  // each with its nested `owner` (many-to-one, eager-loaded server-side).
  listProducts(
    ownerId?: number,
    page = 1,
    limit = 5,
  ): Promise<PaginatedProducts> {
    return http
      .get('/products', { params: { owner_id: ownerId, page, limit } })
      .then((r) => r.data)
  },

  // POST /products - create a product owned by the current user.
  createProduct(data: ProductInput): Promise<Product> {
    return http.post('/products', data).then((r) => r.data)
  },

  // PUT /products/:id
  updateProduct(id: number, data: Partial<ProductInput>): Promise<Product> {
    return http.put(`/products/${id}`, data).then((r) => r.data)
  },

  // DELETE /products/:id
  deleteProduct(id: number): Promise<{ message: string }> {
    return http.delete(`/products/${id}`).then((r) => r.data)
  },

  buyproduct(data: OrderCreate): Promise<{ message: string }> {
    return http.post('/orders', data).then((r) => r.data)
  },

  // ---- Cart (pending items, approved via checkout -> orders) -------

  // POST /cart - add an item to the current user's cart.
  addToCart(data: CartItemCreate): Promise<CartItem> {
    return http.post('/cart', data).then((r) => r.data)
  },

  // GET /cart - every line currently in the user's cart.
  listCart(): Promise<CartItem[]> {
    return http.get('/cart').then((r) => r.data)
  },

  // PUT /cart/:id - change the quantity of a cart line.
  updateCartItem(id: number, quantity: number): Promise<CartItem> {
    return http.put(`/cart/${id}`, { quantity }).then((r) => r.data)
  },

  // DELETE /cart/:id - remove a line from the cart.
  removeCartItem(id: number): Promise<void> {
    return http.delete(`/cart/${id}`).then(() => undefined)
  },

  // POST /cart/checkout - approve: convert every cart line into an order
  // and empty the cart.
  checkoutCart(): Promise<{ message: string; orders: number }> {
    return http.post('/cart/checkout').then((r) => r.data)
  },

  // GET /orders - every order placed by the logged-in user.
  listOrders(): Promise<Order[]> {
    return http.get('/orders').then((r) => r.data)
  },

  // ---- MANY-TO-MANY favorites ----------------------------------------

  // GET /products/favorites - one page of the current user's favorites.
  listFavorites(page = 1, limit = 5): Promise<PaginatedProducts> {
    return http
      .get('/products/favorites', { params: { page, limit } })
      .then((r) => r.data)
  },

  // POST /products/:id/favorite - add a link row (user <-> product).
  favoriteProduct(id: number): Promise<FavoriteResponse> {
    return http.post(`/products/${id}/favorite`).then((r) => r.data)
  },

  // DELETE /products/:id/favorite - remove the link row.
  unfavoriteProduct(id: number): Promise<FavoriteResponse> {
    return http.delete(`/products/${id}/favorite`).then((r) => r.data)
  },

  // GET /admin/users - list all users (admin only).
  adminUsers(): Promise<User[]> {
    return http.get('/admin/users').then((r) => r.data)
  },

  // GET /admin/users/:id - ONE-TO-MANY: a single user WITH all their
  // products, eager-loaded via selectinload on the backend.
  adminUserDetail(id: number): Promise<UserWithProducts> {
    return http.get(`/admin/users/${id}`).then((r) => r.data)
  },

  // DELETE /admin/users/:id
  adminDeleteUser(id: number): Promise<{ message: string }> {
    return http.delete(`/admin/users/${id}`).then((r) => r.data)
  },
}