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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(151,149,255,0.22),_transparent_28%),linear-gradient(180deg,_rgba(14,24,41,0.98),_rgba(11,19,33,1))] px-4 py-10 font-body text-on-surface antialiased">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(88,80,255,0.94),rgba(113,110,255,0.84))] p-8 text-white shadow-[0_28px_60px_rgba(74,64,224,0.24)] lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-white/70">CampusPrint</p>
              <h1 className="mt-6 font-headline text-5xl font-extrabold leading-[1.05]">
                Student access, powered by Google.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/80">
                Sign in with your Google account to continue to your student dashboard, place printing requests,
                and track service availability.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <ShieldCheck size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="font-headline text-lg font-bold">One secure sign-in</p>
                  <p className="text-sm text-white/75">Use the same Google account flow people expect on modern websites.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full rounded-[2rem] border border-white/10 bg-[#0c1423]/88 p-6 shadow-[0_24px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-8">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Back
            </button>

            <div className="mt-6 rounded-[1.75rem] bg-gradient-to-r from-primary to-indigo-500 p-6 text-white shadow-[0_20px_40px_rgba(74,64,224,0.20)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">CampusPrint</p>
              <h2 className="mt-2 font-headline text-3xl font-extrabold">Student Login</h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Continue with Google to open your student dashboard and manage print orders.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-200">Sign in to continue</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use your Google account to access printing services, cart, and your order flow.
              </p>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200/20 bg-white px-5 py-4 font-headline text-base font-bold text-slate-900 shadow-[0_10px_24px_rgba(255,255,255,0.08)] transition hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
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
                {isSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Secure access</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-white/4 p-5 text-sm text-slate-400">
              <p>The Google sign-in button will open the standard account chooser you see on most websites.</p>
              <p>After sign-in, you'll return directly to the student dashboard at /home.</p>
              <p>If access fails, confirm Google provider is enabled in Supabase and `http://localhost:5173` is in the allowed redirect settings.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

