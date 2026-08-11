// ============================================================
// TypeScript types that mirror the backend Pydantic schemas.
// The API client uses these so that every endpoint call is fully
// typed - a compile error appears if the shape drifts from the UI.
// ============================================================

// The Role enum matches app/models/role.py (Role.ADMIN/REVIEWER/USER).
export type Role = 'ADMIN' | 'REVIEWER' | 'USER'

// One-to-one: each User has ONE Profile (mirrors ProfileResponse).
export interface Profile {
  id: number
  full_name: string | null
  phone: string | null
  bio: string | null
  location: string | null
  age: number | null
  date_of_birth: string | null
}

// User mirrors UserResponse: includes the nested one-to-one profile.
export interface User {
  id: number
  username: string
  email: string
  role: Role
  profile: Profile | null
}

// The nested profile payload sent during registration (ProfileCreate).
// Optional fields are omitted when empty so the backend gets clean JSON.
export interface RegisterInput {
  username: string
  email: string
  password: string
  profile: {
    full_name: string
    phone?: string
    bio?: string
    location?: string
    age?: number
    date_of_birth?: string
  }
}


export interface Forgot {
  username?: string
  password?: string
}
// Flattened body for /user/update (UserUpdate): account + profile fields.
export interface ProfileUpdate {
  username?: string
  email?: string
  full_name?: string
  phone?: string
  bio?: string
  location?: string
  age?: number
  date_of_birth?: string
}

// Login response (Token schema): a JWT plus its token type.
export interface Token {
  access_token: string
  token_type: string
}

// MANY-TO-ONE: the small owner summary nested inside a Product
// (mirrors OwnerSummary - only id + username, never email/password).
export interface OwnerSummary {
  id: number
  username: string
}

// Product mirrors ProductResponse: the many-to-one `owner` object is
// included because the backend eager-loads it with selectinload.
export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  owner_id: number
  owner: OwnerSummary | null
}

// Payload for creating/updating a product.
export interface ProductInput {
  name: string
  description?: string | null
  price: number
}

// GET /products response: one page of products plus metadata so the
// frontend can render Prev/Next controls (mirrors PaginatedProducts).
export interface PaginatedProducts {
  items: Product[]
  total: number
  page: number
  limit: number
  pages: number
}

// ONE-TO-MANY: the compact product list attached to a user detail
// response (mirrors ProductSummary - deliberately NO nested owner).
export interface ProductSummary {
  id: number
  name: string
  description: string | null
  price: number
  owner_id: number
}

// UserWithProductsResponse: a user WITH their list of products.
// The backend eager-loads both `profile` and `products` via selectinload.
export interface UserWithProducts extends User {
  products: ProductSummary[]
}

export interface DashboardInfo {
  message: string
  role: Role
}
