import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensureAdminDemoUser } from '../api/authApi'
import { signIn, signUp } from '../lib/auth'

const DEMO_ADMIN_EMAIL = 'admin@campusprintdemo.com'
const DEMO_ADMIN_PASSWORD = 'CampusAdmin@123'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL)
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      alert('Please enter both email and password.')
      return
    }

    try {
      setIsSubmitting(true)
      await signIn(email.trim(), password)
      navigate('/admin')
    } catch (error) {
      const isDemoLogin =
        email.trim().toLowerCase() === DEMO_ADMIN_EMAIL.toLowerCase() &&
        password === DEMO_ADMIN_PASSWORD

      if (!isDemoLogin) {
        alert(error.message || 'Admin login failed.')
        return
      }

      try {
        try {
          await ensureAdminDemoUser({
            email: DEMO_ADMIN_EMAIL,
            password: DEMO_ADMIN_PASSWORD,
          })
        } catch {
          await signUp(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
        }

        await signIn(DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)
        navigate('/admin')
      } catch (adminError) {
        alert(adminError.message || 'Admin login failed. If the backend is off, restart it and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,98,140,0.16),_transparent_34%),_var(--clr-surface)] px-4 py-10 font-body text-on-surface antialiased">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/40 bg-surface-container-lowest p-6 shadow-[0_24px_48px_rgba(32,48,68,0.10)] sm:p-8">
          <div className="rounded-[1.75rem] bg-gradient-to-r from-secondary to-sky-500 p-6 text-white shadow-[0_20px_40px_rgba(0,98,140,0.20)]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">CampusPrint</p>
            <h1 className="mt-2 font-headline text-3xl font-extrabold">Admin Login</h1>
            <p className="mt-2 text-sm text-white/80">
              Sign in to manage services, print jobs, and campus operations.
            </p>
            <p className="mt-3 text-xs text-white/75">
              Demo admin: {DEMO_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter admin email"
                className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-on-surface" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
              />
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-secondary px-5 py-4 font-headline text-base font-bold text-white shadow-[0_10px_20px_rgba(0,98,140,0.25)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Logging in...' : 'Login as Admin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
