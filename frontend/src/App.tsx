// ============================================================
// App: the top-level component.
//
// Renders the navigation bar and defines ALL routes. Protected routes
// are wrapped in <ProtectedRoute> which may also require a role.
// ============================================================

import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

export default function App() {
  const { user, loading } = useAuth()

  // While AuthProvider restores the session, show a placeholder instead
  // of rendering the login page for a user who is actually logged in.
  if (loading) return <div className="container">Loading...</div>

  return (
    <div className="app">
      {/* Navbar switches links depending on auth state + role. */}
      <nav className="navbar">
        <span className="brand">FastAPI App</span>
        <div className="links">
          {user ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/products">Products</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/forgot-password">Forgot</NavLink>
              {/* Admin link only for the ADMIN role. */}
              {user.role === 'ADMIN' && <NavLink to="/admin">Admin</NavLink>}
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </div>
      </nav>

      <main className="container">
        {/* react-router v6: <Routes> matches one <Route> per URL. */}
        <Routes>
          {/* Public pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected pages (any logged-in user) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute >
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <ProtectedRoute>
                <ForgotPassword />
              </ProtectedRoute>
            }
          />

          {/* Admin-only page (role restriction lives in ProtectedRoute) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Fallbacks: unknown URLs and "/" go to the dashboard. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}
