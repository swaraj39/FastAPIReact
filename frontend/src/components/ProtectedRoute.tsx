// ============================================================
// ProtectedRoute: a guard wrapper around routes that need a login.
//
//  * Not logged in  -> redirect to /login (remembering where we came from)
//  * Logged in but wrong role -> redirect to /dashboard
//  * OK              -> render the wrapped page
//
// Usage in App.tsx:
//   <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Admin/></ProtectedRoute>} />
// ============================================================

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/types'

interface ProtectedRouteProps {
  children: ReactNode
  // Optional list of allowed roles, e.g. roles={['ADMIN']}.
  roles?: Role[]
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  // useLocation lets us send the attempted URL to the login page via
  // `state`, so after signing in the user lands back where they wanted.
  const location = useLocation()

  // While the initial "restore session" call is running, show a loader
  // instead of redirecting an actually-logged-in user to /login.
  if (loading) {
    return <div className="mx-auto w-full max-w-[1100px] flex-1 px-6 py-10">Loading...</div>
  }

  // Not authenticated -> send to /login.
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  // Authenticated but role not allowed -> send to a safe page.
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
