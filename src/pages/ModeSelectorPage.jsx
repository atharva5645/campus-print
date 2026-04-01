import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/adminAuthApi'

function ModeSelectorPage() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('jcerprint@gmail.com')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    if (isDark) {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  async function handleAdminLogin(event) {
    event?.preventDefault()
    setAdminLoading(true)
    setAdminError('')
    try {
      await adminLogin(adminEmail, adminPassword)
      localStorage.setItem('adminAuthed', 'true')
      navigate('/admin')
    } catch (error) {
      setAdminError(error.message || 'Invalid credentials')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full p-8 flex justify-center md:justify-start md:flex-row z-10">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: 'var(--clr-primary)' }}
          >
            <span className="material-symbols-outlined text-white text-2xl">print</span>
          </div>
          <span className="text-xl font-headline font-extrabold tracking-tighter text-on-surface">
            CampusPrint
          </span>
        </div>

        <div className="flex items-center ml-auto">
          <button
            onClick={() => setIsDark(!isDark)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 border focus:outline-none focus:ring-4 focus:ring-primary/20 bg-surface-container-high border-outline-variant/20"
            aria-label="Toggle theme"
          >
            {!isDark ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <span
                    className="material-symbols-outlined text-sm text-yellow-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    light_mode
                  </span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Light
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Dark
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm bg-primary-dim"
                >
                  <span
                    className="material-symbols-outlined text-sm text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    dark_mode
                  </span>
                </div>
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full flex flex-col items-center space-y-12 animate-fade-in-up">
        {/* Welcome Text */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-headline font-extrabold text-primary tracking-tight leading-tight">
            Welcome to CampusPrint
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl font-body font-medium max-w-lg mx-auto leading-relaxed">
            Choose your access mode to continue.
          </p>
        </div>

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4">
          {/* Student Mode Card */}
          <button
            onClick={() => navigate('/login')}
            className="card-primary group relative flex flex-col items-center text-center p-10 shadow-[0_20px_48px_rgba(74,64,224,0.2)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 text-white overflow-hidden cursor-pointer"
            style={{ borderRadius: '3rem' }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="mb-8 w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-4xl">school</span>
            </div>
            <h2 className="text-2xl font-headline font-bold mb-3">Student Mode</h2>
            <p className="text-white/80 font-body leading-relaxed max-w-[240px]">
              Order services and manage your print jobs.
            </p>
            <div className="mt-8 flex items-center gap-2 font-semibold text-sm uppercase tracking-widest text-white/90 group-hover:gap-4 transition-all duration-300">
              Get Started <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </button>

          {/* Admin Mode Card */}
          <button
            onClick={() => setShowAdminLogin(true)}
            className="card-secondary group relative flex flex-col items-center text-center p-10 shadow-[0_20px_48px_rgba(0,98,140,0.2)] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 text-white overflow-hidden cursor-pointer"
            style={{ borderRadius: '3rem' }}
          >
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:bg-white/15 transition-all duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="mb-8 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
            </div>
            <h2 className="text-2xl font-headline font-bold mb-3">Admin Mode</h2>
            <p className="text-white/80 font-body leading-relaxed max-w-[240px]">
              Manage services, print jobs, and campus settings.
            </p>
            <div className="mt-8 flex items-center gap-2 font-semibold text-sm uppercase tracking-widest text-white/90 group-hover:gap-4 transition-all duration-300">
              Login Now <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </button>
        </div>

        {/* Image Banner */}
        <div className="w-full max-w-2xl px-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="relative h-64 w-full overflow-hidden shadow-2xl" style={{ borderRadius: '3rem' }}>
            <img
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYitjPuLlrNfi6pm5qlUKrvCPoZX1s094umVDiD1sPFW1gjBO-p5tw2r0fAZRUxJdnFJV1ecAACrowUfUmLu6ftaaCu73YYADcwcjh7O9sf8_qTcdkJtW_i8M-7nOklTyY5PS1ZqSypcEKbQWDeRtAMUtSutgsfQx8wNdDZj-64HYwYb2O3JZ52-LyfwruXsLuHiPCjYXzjcAE2oAzGidwIqeb5Jarc55w8m_qyqaV-Vf90zskQ8PUFSC6EPHLyIrHlTw1nV_dDeQ"
              alt="Modern university library"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-8">
              <p className="text-white/90 font-body text-sm italic">
                &ldquo;Empowering the next generation of researchers with seamless campus-wide logistics.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
        <div className="h-px w-16 bg-outline-variant" />
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">copyright</span>
          <span className="text-xs font-headline font-bold tracking-widest uppercase">CampusPrint 2026</span>
        </div>
      </footer>

      {/* Background Blobs */}
      <div className="fixed -z-10 top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="blob-primary absolute top-[10%] left-[5%] w-96 h-96 rounded-full blur-[120px] opacity-60 dark:opacity-30" />
        <div className="blob-secondary absolute bottom-[10%] right-[5%] w-[30rem] h-[30rem] rounded-full blur-[150px] opacity-50 dark:opacity-20" />
      </div>

      {showAdminLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-2xl text-on-surface">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Admin Login</p>
                <h3 className="text-2xl font-headline font-bold mt-1">CampusPrint Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false)
                  setAdminError('')
                  setAdminPassword('')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface shadow hover:bg-surface-container-high"
                aria-label="Close admin login"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAdminLogin}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface" htmlFor="admin-email">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-on-surface" htmlFor="admin-password">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-2xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-on-surface outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {adminError && (
                <div className="rounded-xl bg-error-container/20 px-4 py-3 text-sm text-error">
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(74,64,224,0.25)] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adminLoading ? 'Signing in…' : 'Login as Admin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModeSelectorPage
