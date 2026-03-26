import React, { useEffect, useState } from 'react'
import { ArrowLeft, Bell, BookOpenText, CircleHelp, LogOut, MoonStar, SunMedium } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { signOut } from '../lib/auth'

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex h-7 w-12 cursor-pointer items-center">
      <input checked={checked} className="peer sr-only" type="checkbox" onChange={onChange} />
      <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-primary" />
      <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
    </label>
  )
}

function SettingRow({ icon: Icon, title, subtitle, action = null, onClick, clickable = false }) {
  const Wrapper = clickable ? 'button' : 'div'

  return (
    <Wrapper
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-[1.35rem] bg-surface-container-lowest p-4 shadow-[0_10px_30px_rgba(32,48,68,0.05)] ${
        clickable ? 'text-left transition hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon size={20} strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-headline text-[1rem] font-bold text-on-surface">{title}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      </div>
      {action}
    </Wrapper>
  )
}

function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return document.documentElement.classList.contains('dark')
  })

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

  const returnPath = location.state?.from || '/home'
  const returnLabel = returnPath === '/admin' ? 'Back to Admin' : 'Back to Home'

  async function handleLogout() {
    localStorage.removeItem('selectedRole')

    try {
      await signOut()
    } catch (error) {
      console.error(error)
    } finally {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.18),_transparent_32%),_var(--clr-surface)] font-body text-on-surface antialiased">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition active:scale-95"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Settings</p>
              <h1 className="font-headline text-[2rem] font-extrabold tracking-tight text-on-surface">Preferences</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(returnPath)}
            className="rounded-full bg-primary px-5 py-3 font-headline text-sm font-bold text-white shadow-[0_10px_20px_rgba(74,64,224,0.25)] transition active:scale-95"
          >
            {returnLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/30 bg-gradient-to-r from-primary to-indigo-500 p-6 text-white shadow-[0_24px_48px_rgba(74,64,224,0.20)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Settings</p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline text-3xl font-extrabold">Manage your CampusPrint app</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Keep the student app simple: switch appearance, review how the flow works, and sign out whenever you need.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/12 px-5 py-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-white/65">Current mode</p>
              <p className="mt-2 font-headline text-lg font-bold">Alex</p>
              <p className="text-sm text-white/80">Student dashboard</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Preferences</p>
                <h2 className="font-headline text-2xl font-bold text-on-surface">App options</h2>
              </div>
              <div className="space-y-4">
                <SettingRow
                  icon={Bell}
                  title="Notifications"
                  subtitle="Receive alerts about print status, cart updates, and important service changes."
                  action={<Toggle checked={notificationsEnabled} onChange={() => setNotificationsEnabled((v) => !v)} />}
                />
                <SettingRow
                  icon={isDark ? MoonStar : SunMedium}
                  title={isDark ? 'Dark mode' : 'Light mode'}
                  subtitle="Change the look of the app instantly and keep the preference saved on this device."
                  action={<Toggle checked={isDark} onChange={() => setIsDark((v) => !v)} />}
                />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Guide</p>
                <h2 className="font-headline text-2xl font-bold text-on-surface">How to use the app</h2>
              </div>
              <div className="rounded-[1.35rem] bg-surface-container-lowest p-5 shadow-[0_10px_30px_rgba(32,48,68,0.05)]">
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookOpenText size={20} strokeWidth={1.9} />
                  </div>
                  <div>
                    <p className="font-headline text-base font-bold text-on-surface">Simple student flow</p>
                    <p className="text-sm text-on-surface-variant">Pick a service, configure the order, review cart, then checkout.</p>
                  </div>
                </div>
                <div className="space-y-4 text-sm leading-7 text-on-surface-variant">
                  <p><span className="font-semibold text-on-surface">1.</span> Start on the Home page and choose any available service.</p>
                  <p><span className="font-semibold text-on-surface">2.</span> On the Order page, set pages and quantity, then upload your document.</p>
                  <p><span className="font-semibold text-on-surface">3.</span> Tap <span className="font-semibold text-on-surface">Add to Cart</span> to save the print request.</p>
                  <p><span className="font-semibold text-on-surface">4.</span> Open the Cart page, check the total price, and use <span className="font-semibold text-on-surface">Checkout</span>.</p>
                  <p><span className="font-semibold text-on-surface">5.</span> Services disabled by admin will not appear on the student Home page.</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(32,48,68,0.06)]">
              <p className="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Session</p>
              <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface">Account actions</h3>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-4 font-headline font-bold text-white shadow-[0_10px_20px_rgba(74,64,224,0.25)] transition active:scale-95"
                >
                  <span className="material-symbols-outlined">home</span>
                  Back to student home
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-container-low px-5 py-4 font-headline font-bold text-on-surface transition active:scale-95"
                >
                  <LogOut size={18} strokeWidth={2} />
                  Logout
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-[0_20px_40px_rgba(32,48,68,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CircleHelp size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-headline text-lg font-bold text-on-surface">Help and support</p>
                  <p className="text-sm text-on-surface-variant">A quick note about this settings page</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
                <p>The light and dark mode switch applies immediately and saves the choice in your browser.</p>
                <p>Logout takes you back to the first screen so you can choose student or admin mode again.</p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <BottomNav />
      </div>
    </div>
  )
}

export default SettingsPage
