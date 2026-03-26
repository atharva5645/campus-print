import React, { useEffect, useMemo, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getServices } from '../api/adminApi'
import BottomNav from '../components/BottomNav'
import { signOut } from '../lib/auth'
import { getLocalServices, syncLocalServices } from '../lib/localServices'

function HomePage() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [pageError, setPageError] = useState('')

  async function loadServices() {
    try {
      const serviceData = await getServices()
      setServices(serviceData)
      syncLocalServices(serviceData)
      setPageError('')
    } catch (error) {
      setServices(getLocalServices())
      setPageError('Using locally saved services for now. Admin changes on this device will still appear here.')
    }
  }

  async function handleLogout() {
    try {
      await signOut()
    } catch (error) {
      console.error(error)
    } finally {
      navigate('/', { replace: true })
    }
  }

  useEffect(() => {
    loadServices()

    const handleRefresh = () => {
      loadServices()
    }

    const intervalId = window.setInterval(() => {
      loadServices()
    }, 8000)

    window.addEventListener('focus', handleRefresh)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [])

  const visibleServices = useMemo(
    () => services.filter((service) => service.enabled),
    [services]
  )

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-slate-900 dark:to-slate-800 flex justify-between items-center w-full px-6 py-4 rounded-b-[3rem] shadow-[0_20px_40px_rgba(32,48,68,0.06)] z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 overflow-hidden">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw1S-FQWyvNAw_-yaZ2TlKx9xJaIEZANZOt5VZvry3gf9U0kPEv07JuN8OF65rgbyEe2uDDl3ZfpMtygzm5nFWyOGgNAAiKQ2TqpYi039HQo0LFrxcQiGn5y0pelpfpWVWDOcF948AXOWrjFFd-A9zlaUgR6D6HVyuJqaGfx1LP8t0HzFAgFAyHS4v4z53mN-HldCz2QwrfeLRgtfL-T3-iSFsNgpLDAaHcxMF_c3lfuLM8nuLp1_XtDZ5UPnOsqli-KGOSMwudeI"
            />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white dark:text-indigo-100 font-headline">
            CampusPrint
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 active:scale-95 duration-200"
          >
            <LogOut size={16} strokeWidth={2} />
            Logout
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings', { state: { from: '/home' } })}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <main className="px-6 mt-8 space-y-8">
        {/* Greeting Section */}
        <section className="space-y-2">
          <h1 className="text-[2.5rem] leading-tight font-headline font-bold tracking-tight text-on-surface">
            Good Morning, Alex 👋
          </h1>
          <p className="text-on-surface-variant text-sm max-w-xs">
            Ready to organize your academic materials today?
          </p>
        </section>

        {/* Search Bar */}
        <section>
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined" style={{ color: 'var(--clr-outline)' }}>
                search
              </span>
            </div>
            <input
              className="w-full h-14 pl-14 pr-6 border-none rounded-xl shadow-[0_10px_30px_rgba(32,48,68,0.04)] focus:ring-2 focus:ring-indigo-500/20 transition-all"
              style={{ background: 'var(--clr-surface-container-lowest)' }}
              placeholder="Search for books, forms, or records..."
              type="text"
            />
          </div>
        </section>

        {/* Featured Banner (Bento Style) */}
        <section className="grid grid-cols-1 gap-4">
          <div
            className="relative overflow-hidden rounded-xl h-48 flex flex-col justify-end p-6 group"
            style={{ background: 'var(--clr-primary)' }}
          >
            <div className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-110">
              <img
                alt="Campus Library"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOmLbNJLQP01jyISWSIxZoW7eyTE-VQsrmvsI-gClqLyIpIpKv0Xq9v8xYMTmeoeXM4nY0vFV_MVruQANkIV6irv_qF8aY1U_UgsUCVS6ZWWo0Wa0E1IfFTN8y9RErpXjcf6MzXHJHUN_Ua2Ex_7Ua5R4ay6txUGXpNbD6Lo6_2NAV8B4f9YgQHcrgOhVJmaqy1-6upeZ6FudYEYcadr42HkJCIdoe-VLhb_EojsRX3_j7OfIyMtVKCbzA-DezRYuIH0v4sLjjhzg"
              />
            </div>
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(74,64,224,0.9), transparent)' }}
            />
            <div className="relative z-10">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                style={{ background: 'var(--clr-tertiary-container)', color: 'var(--clr-on-tertiary-container)' }}
              >
                New Feature
              </span>
              <h2 className="text-white text-xl font-bold font-headline mt-2">
                Instant Lab Manuals
              </h2>
              <p className="text-white/80 text-sm">Download and print in one tap.</p>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold" style={{ color: 'var(--clr-on-surface)' }}>
              Main Services
            </h3>
            <button className="text-sm font-semibold" style={{ color: 'var(--clr-primary)' }} onClick={() => navigate('/order')}>
              View All
            </button>
          </div>
          {pageError && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
              {pageError}
            </div>
          )}
          {visibleServices.length === 0 ? (
            <div
              className="rounded-xl p-6 text-sm"
              style={{ background: 'var(--clr-surface-container-lowest)', color: 'var(--clr-on-surface-variant)' }}
            >
              No active services are available right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {visibleServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => navigate('/order')}
                  className="p-5 rounded-xl shadow-[0_10px_30px_rgba(32,48,68,0.03)] flex flex-col items-start gap-4 hover:opacity-90 transition-all active:scale-95 cursor-pointer text-left"
                  style={{ background: 'var(--clr-surface-container-lowest)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: service.background || 'var(--clr-surface-container-low)', color: service.color || 'var(--clr-primary)' }}
                  >
                    <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                  </div>
                  <div>
                    <span className="font-bold block" style={{ color: 'var(--clr-on-surface)' }}>
                      {service.name}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--clr-on-surface-variant)' }}>
                      Available now
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Quick Summary Card */}
        <section className="pb-10">
          <div className="rounded-xl p-6 flex items-center gap-6" style={{ background: 'var(--clr-surface-container-low)' }}>
            <div className="flex-1 space-y-1">
              <h4 className="text-lg font-bold" style={{ color: 'var(--clr-on-surface)' }}>
                Current Status
              </h4>
              <p className="text-xs" style={{ color: 'var(--clr-on-surface-variant)' }}>
                You have 2 pending orders ready for pickup at the Main Library Hub.
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ border: '4px solid var(--clr-primary)', borderTopColor: 'transparent' }}
            >
              <span className="text-[10px] font-bold" style={{ color: 'var(--clr-primary)' }}>85%</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <BottomNav />
      </div>
    </div>
  )
}

export default HomePage
