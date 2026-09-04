// ============================================================
// App: top-level component with navbar and routes.
// Professional black & red theme.
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
import CartButton from './components/CartButton'
import CartPopup from './components/CartPopup'
import ForgotPassword from './pages/ForgotPassword'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import ConfirmDialog from './components/ConfirmDialog'

const CONTAINER_CLS = 'mx-auto w-full max-w-[1000px] flex-1 px-5 py-6'

const NAV_LINK_CLS =
  'inline-flex items-center gap-1 rounded px-2 py-1 text-[0.82rem] font-medium text-muted transition-colors duration-150 hover:text-ink [&.active]:bg-accent [&.active]:font-semibold [&.active]:text-white'

export default function App() {
  const { user, loading, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedout, setLoggedOut] = useState(false)
  const navigate = useNavigate()

  const closeMenu = () => setMenuOpen(false)

  function goHome() {
    setMenuOpen(false)
    navigate('/dashboard')
  }

  function setlogout() {
    setLoggedOut(true)
  }

  if (loading)
    return (
      <div className={CONTAINER_CLS}>
        <Loading label="Restoring session…" />
      </div>
    )

  return (
    <div className="flex min-h-screen flex-col">
      <LoadingOverlay />
      <CartButton />
      <CartPopup />
      <nav className="navbar">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 shadow-none hover:bg-transparent"
          onClick={goHome}
          aria-label="Go to dashboard"
        >
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded text-[0.8rem] font-bold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            F
          </span>
          <span className="text-[0.95rem] font-semibold text-ink">FastAPI</span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {user ? (
            <>
              <NavLink to="/dashboard" className={NAV_LINK_CLS}>
                <LayoutDashboard size={14} /> Dashboard
              </NavLink>
              <NavLink to="/products" className={NAV_LINK_CLS}>
                <Store size={14} /> Products
              </NavLink>
              <NavLink to="/profile" className={NAV_LINK_CLS}>
                <UserRound size={14} /> Profile
              </NavLink>
              <NavLink to="/forgot-password" className={NAV_LINK_CLS}>
                <KeyRound size={14} /> Password
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" className={NAV_LINK_CLS}>
                  <Shield size={14} /> Admin
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className={NAV_LINK_CLS}>
                <UserRound size={14} /> Sign in
              </NavLink>
              <NavLink to="/register" className={NAV_LINK_CLS}>
                Register
              </NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="hidden cursor-pointer rounded border border-line bg-transparent p-1 text-ink max-[820px]:block"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-line bg-transparent p-0 text-muted transition-colors hover:border-ink hover:text-ink"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {user && (
            <div className="flex items-center gap-1.5 border-l border-line pl-2 max-[820px]:hidden">
              <Avatar name={user.profile?.full_name ?? user.username} size="sm" />
              <span className="max-w-28 truncate text-[0.78rem] text-muted">{user.username}</span>
              <button
                className="inline-flex h-7 w-7 items-center justify-center rounded border border-transparent bg-transparent p-0 text-muted transition-colors hover:text-ink"
                onClick={setlogout}
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {menuOpen && (
          <div className="flex w-full flex-col gap-0.5 pb-1 pt-1 max-[820px]:flex lg:hidden">
            {user ? (
              <>
                <NavLink to="/dashboard" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <LayoutDashboard size={14} /> Dashboard
                </NavLink>
                <NavLink to="/products" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <Store size={14} /> Products
                </NavLink>
                <NavLink to="/profile" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <UserRound size={14} /> Profile
                </NavLink>
                <NavLink to="/forgot-password" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <KeyRound size={14} /> Password
                </NavLink>
                {user.role === 'ADMIN' && (
                  <NavLink to="/admin" onClick={closeMenu} className={NAV_LINK_CLS}>
                    <Shield size={14} /> Admin
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu} className={NAV_LINK_CLS}>
                  <UserRound size={14} /> Sign in
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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ErrorBoundary sectionLabel="Products page"><Products /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ProtectedRoute><ForgotPassword /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Admin /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <ConfirmDialog
        open={loggedout}
        title="Confirm log out?"
        message={loggedout ? `Sign out "${user?.username}"?` : ''}
        confirmLabel="Log out"
        confirmVariant="primary"
        onConfirm={() => { if (loggedout) logout(); setLoggedOut(false) }}
        onCancel={() => setLoggedOut(false)}
      />

      <footer className="footer">
        <span>© {new Date().getFullYear()} FastAPI App</span>
        <span className="opacity-30">·</span>
        <span>Authentication · Role-based access · Product management</span>
      </footer>
    </div>
  )
}
