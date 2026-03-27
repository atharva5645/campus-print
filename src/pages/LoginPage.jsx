import React, { useEffect, useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../lib/auth'
import { supabase } from '../lib/supabase'

function LoginPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getUser()

      if (data.user) {
        navigate('/home', { replace: true })
      }
    }

    checkSession()
  }, [navigate])

  async function handleGoogleLogin() {
    try {
      setIsSubmitting(true)
      await signInWithGoogle()
    } catch (error) {
      alert(error.message || 'Google sign-in failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.18),_transparent_32%),_var(--clr-surface)] px-4 py-10 font-body text-on-surface antialiased transition-colors duration-300">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center animate-fade-in-up">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-primary-dim)] p-10 text-white shadow-[0_28px_60px_rgba(74,64,224,0.24)] lg:flex lg:flex-col lg:justify-between relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-md border border-white/20">
                <span className="material-symbols-outlined text-sm">school</span>
                CampusPrint
              </div>
              <h1 className="mt-8 font-headline text-5xl font-extrabold leading-[1.1]">
                Student access, <br />
                powered by Google.
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/80 font-medium">
                Sign in with your university Google account to open your student dashboard, request prints, and track live status.
              </p>
            </div>

            <div className="relative z-10 rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-inner">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-sm">
                  <ShieldCheck size={22} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-headline text-lg font-bold">Secure University Sign-in</p>
                  <p className="text-sm text-white/80 mt-1">One-tap authentication built for modern campus workflows.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center w-full rounded-[2rem] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0_24px_48px_rgba(32,48,68,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.3)] sm:p-10 transition-all">
            <div className="mb-8">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95"
              >
                <ArrowLeft size={16} strokeWidth={2} />
                Back
              </button>
            </div>

            <div className="mb-8 lg:hidden rounded-[1.75rem] bg-gradient-to-r from-[var(--clr-primary)] to-[var(--clr-primary-dim)] p-8 text-white shadow-[0_20px_40px_rgba(74,64,224,0.20)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70 font-bold">CampusPrint</p>
              <h2 className="mt-3 font-headline text-3xl font-extrabold leading-tight">Student Login</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                Continue with Google to open your student dashboard and manage print orders.
              </p>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Sign in</h2>
              <p className="mt-2 text-on-surface-variant leading-relaxed text-sm">
                Use your university Google account to instantly access printing services and live queue tracking.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low p-4 transition-all hover:border-primary/20">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-5 py-4 font-headline text-base font-bold text-on-surface shadow-[0_8px_16px_rgba(32,48,68,0.04)] dark:shadow-[0_8px_16px_rgba(0,0,0,0.1)] transition-all hover:bg-surface-container hover:shadow-[0_12px_24px_rgba(32,48,68,0.08)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M21.805 10.023h-9.18v3.955h5.269c-.227 1.272-.954 2.35-2.03 3.072v2.549h3.286c1.924-1.771 3.03-4.379 3.03-7.49 0-.695-.063-1.362-.18-2.086Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12.625 22c2.756 0 5.067-.91 6.756-2.46l-3.286-2.55c-.91.61-2.072.972-3.47.972-2.666 0-4.925-1.798-5.733-4.216H3.496v2.63A10.2 10.2 0 0 0 12.625 22Z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.892 13.746a6.133 6.133 0 0 1 0-3.492v-2.63H3.496a10.202 10.202 0 0 0 0 8.752l3.396-2.63Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.625 6.038c1.5 0 2.846.516 3.904 1.531l2.93-2.93C17.688 2.983 15.38 2 12.625 2a10.2 10.2 0 0 0-9.13 5.624l3.397 2.63c.808-2.419 3.067-4.216 5.733-4.216Z"
                    fill="#EA4335"
                  />
                </svg>
                {isSubmitting ? 'Authenticating...' : 'Continue with Google'}
              </button>
            </div>

            <div className="my-8 flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant/60">Notice</span>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>

            <div className="space-y-3 rounded-[1.25rem] bg-surface-container-low p-5 text-sm text-on-surface-variant leading-relaxed">
              <p>Sign in is restricted to active campus accounts.</p>
              <p>If you encounter configuration issues on `localhost:5173`, ensure the Supabase redirect URL is correctly set by the admin.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
