// ============================================================
// App: the top-level component.
//
// Renders the navigation bar and defines ALL routes. Protected routes
// are wrapped in <ProtectedRoute> which may also require a role.
// ============================================================

import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { KeyRound, LayoutDashboard, LogOut, Menu, Moon, Shield, Store, Sun, UserRound, X } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Avatar from './components/Avatar'
import Loading from './components/Spinner'
import LoadingOverlay from './components/LoadingOverlay'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

// Shared page-shell layout (the old `.container` class, as utilities).
// Note: deliberately NOT `flex` — the container is a plain block that
// fills the flex-column `.app` shell (flex-1 grows it vertically).
const CONTAINER_CLS = 'mx-auto w-full max-w-[1100px] flex-1 px-6 py-10'

// Navbar link styling (the old `.links a` rules, as utilities).
const NAV_LINK_CLS =
  'inline-flex items-center gap-[0.4rem] rounded-md px-3 py-[0.4rem] text-[0.92rem] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink [&.active]:bg-ink [&.active]:font-semibold [&.active]:text-white max-[820px]:px-[0.9rem] max-[820px]:py-[0.6rem]'

export default function App() {
  const { user, loading, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  // Close the mobile menu after a link is tapped.
  const closeMenu = () => setMenuOpen(false)

  // Brand button: return to the dashboard from anywhere.
  function goHome() {
    setMenuOpen(false)
    navigate('/dashboard')
  }
  // While AuthProvider restores the session, show a placeholder instead
  // of rendering the login page for a user who is actually logged in.
  if (loading)
    return (
      <div className={CONTAINER_CLS}>
        <Loading label="Restoring session…" />
      </div>
    )

  return (
    <div className="flex min-h-screen flex-col">
      <LoadingOverlay />
      {/* Navbar switches links depending on auth state + role. */}
      <nav className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-[0.7rem] shadow-nav max-[820px]:px-5 max-[820px]:py-3">
        <button
          type="button"
          className="-mx-[0.4rem] -my-[0.2rem] inline-flex cursor-pointer items-center rounded-md border-none bg-transparent p-[0.2rem_0.4rem] shadow-none hover:bg-surface-2 hover:shadow-none"
          onClick={goHome}
          aria-label="Go to dashboard"
        >
          <span className="inline-flex items-center gap-[0.6rem] whitespace-nowrap text-[1.05rem] font-bold tracking-[0.01em] text-ink">
            <span
              className="inline-flex h-[1.7rem] w-[1.7rem] shrink-0 items-center justify-center rounded-[0.35rem] bg-ink font-serif text-[0.95rem] font-bold "
              aria-hidden="true"
            >
              F
            </span>
            FastAPI App
          </span>
        </button>

        {/* Desktop nav links — hidden on mobile. */}
        <div className="hidden items-center gap-1 max-[820px]:hidden lg:flex">
          {user ? (
            <>
              <NavLink to="/dashboard" className={NAV_LINK_CLS}>
                <LayoutDashboard size={16} aria-hidden="true" /> Dashboard
              </NavLink>
              <NavLink to="/products" className={NAV_LINK_CLS}>
                <Store size={16} aria-hidden="true" /> Products
              </NavLink>
              <NavLink to="/profile" className={NAV_LINK_CLS}>
                <UserRound size={16} aria-hidden="true" /> Profile
              </NavLink>
              <NavLink to="/forgot-password" className={NAV_LINK_CLS}>
                <KeyRound size={16} aria-hidden="true" /> Password
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" className={NAV_LINK_CLS}>
                  <Shield size={16} aria-hidden="true" /> Admin
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className={NAV_LINK_CLS}>
                <UserRound size={16} aria-hidden="true" /> Sign in
              </NavLink>
              <NavLink to="/register" className={NAV_LINK_CLS}>
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* Right side: hamburger (mobile) + theme toggle + user actions. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden cursor-pointer rounded-md border border-line bg-transparent p-[0.4rem_0.55rem] text-[1.15rem] leading-none text-ink max-[820px]:block"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-transparent p-0 text-muted transition-colors duration-150 hover:border-ink hover:bg-surface-2 hover:text-ink hover:shadow-none"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && (
            <div className="flex items-center gap-2 border-l border-line pl-4 max-[820px]:border-l-0 max-[820px]:pl-0">
              <Avatar name={user.profile?.full_name ?? user.username} size="sm" />
              <span className="max-w-40 truncate text-[0.9rem] font-semibold text-ink" title={user.username}>
                {user.username}
              </span>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-muted transition-colors duration-150 hover:border-ink hover:bg-ink hover:text-white hover:shadow-none"
                onClick={logout}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile nav links — collapsible dropdown below the navbar. */}
        {menuOpen && (
          <div className="flex w-full flex-col gap-[0.15rem] pb-1 pt-2 max-[820px]:flex max-[820px]:order-3 lg:hidden">
            {user ? (
              <>
                <NavLink to="/dashboard" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <LayoutDashboard size={16} aria-hidden="true" /> Dashboard
                </NavLink>
                <NavLink to="/products" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <Store size={16} aria-hidden="true" /> Products
                </NavLink>
                <NavLink to="/profile" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <UserRound size={16} aria-hidden="true" /> Profile
                </NavLink>
                <NavLink to="/forgot-password" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <KeyRound size={16} aria-hidden="true" /> Password
                </NavLink>
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin" onClick={closeMenu} className={NAV_LINK_CLS}>
                    <Shield size={16} aria-hidden="true" /> Admin
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <UserRound size={16} aria-hidden="true" /> Sign in
                </NavLink>
                <NavLink to="/register" onClick={closeMenu} className={NAV_LINK_CLS}>
                  Register
                </NavLink>
              </>
            )}
          </div>
        )}
      </nav>

      <main className={CONTAINER_CLS}>
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
              <ProtectedRoute>
                <ErrorBoundary sectionLabel="Products page">
                  <Products />
                </ErrorBoundary>
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

      <footer className="mt-10 flex flex-wrap items-center justify-center gap-[0.6rem] border-t border-line bg-surface px-6 py-5 text-center text-[0.83rem] text-muted">
        <span>© {new Date().getFullYear()} FastAPI App</span>
        <span className="text-line-strong" aria-hidden="true">
          ·
        </span>
        <span>Authentication · Role-based access · Product management</span>
      </footer>
    </div>
  )
}
