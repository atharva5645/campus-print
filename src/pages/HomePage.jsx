import React, { useEffect, useMemo, useState } from 'react'
import { UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getServices } from '../api/adminApi'
import { getOrders } from '../api/orderApi'
import BottomNav from '../components/BottomNav'
import DeadlineReminder from '../components/DeadlineReminder'
import OrderStatusManager from '../components/OrderStatusManager'
import NotificationBell from '../components/NotificationBell'
import ServiceDocumentsSheet from '../components/ServiceDocumentsSheet'
import { addLocalCartItem } from '../lib/localCart'
import { getLocalServices, getStudentSafeServices, syncLocalServices } from '../lib/localServices'
import { getPrototypeOrders } from '../lib/prototypeData'
import { getStudentProfile } from '../lib/studentProfile'
import { supabase } from '../lib/supabase'
import { generateCode } from '../utils/generateCode'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const studyQuotes = [
  'Small progress every day builds strong results.',
  'Study with focus now so your future feels lighter later.',
  'Your consistency today becomes your confidence tomorrow.',
  'One more chapter now is one less worry before exams.',
  'Keep going. Even quiet study sessions are moving you forward.',
  'Discipline in the library becomes freedom in the results.',
]

function getRotatingStudyQuote() {
  const fallbackQuote = studyQuotes[0]

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return fallbackQuote
  }

  const lastQuote = window.localStorage.getItem('campus_print_last_quote')
  const availableQuotes = studyQuotes.filter((quote) => quote !== lastQuote)
  const pool = availableQuotes.length > 0 ? availableQuotes : studyQuotes
  const nextQuote = pool[Math.floor(Math.random() * pool.length)] || fallbackQuote

  window.localStorage.setItem('campus_print_last_quote', nextQuote)
  return nextQuote
}

function getServiceSearchTerms(service) {
  const baseTerms = [service.name, service.icon]
  const name = service.name.toLowerCase()

  if (name.includes('blue book')) {
    baseTerms.push('book', 'books', 'exam', 'answer sheet', 'record', 'records')
  }

  if (name.includes('color printing')) {
    baseTerms.push('print', 'printing', 'xerox', 'copy', 'copies', 'document', 'documents')
  }

  if (name.includes('no due')) {
    baseTerms.push('form', 'forms', 'clearance', 'certificate')
  }

  if (name.includes('lab manual')) {
    baseTerms.push('manual', 'manuals', 'record', 'records', 'lab', 'practical')
  }

  return baseTerms.join(' ').toLowerCase()
}

function getDefaultDisplayName(user) {
  if (!user) return 'Student'

  const metadata = user.user_metadata || {}
  const fullName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    user.identities?.[0]?.identity_data?.full_name ||
    user.identities?.[0]?.identity_data?.name

  if (fullName && String(fullName).trim()) {
    return String(fullName).trim().split(' ')[0]
  }

  const email = user.email || metadata.email || user.identities?.[0]?.identity_data?.email
  if (email && String(email).includes('@')) {
    return String(email).split('@')[0]
  }

  return 'Student'
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

function normalizeServiceShape(service) {
  return {
    ...service,
    background: service.background || service.bg || '#eef2ff',
    color: service.color || '#4a40e0',
  }
}

function getPrintStatus(order) {
  const legacyMap = {
    processing: 'printing_in_progress',
    completed: 'ready_for_pickup',
  }

  return order.print_status || legacyMap[order.status] || order.status || 'pending'
}
function mergeServices(...serviceLists) {
  const serviceMap = new Map()

  serviceLists
    .flat()
    .filter(Boolean)
    .forEach((service) => {
      const normalizedService = normalizeServiceShape(service)
      const nameKey = String(normalizedService.name || '').trim().toLowerCase()
      const idKey = normalizedService.id ? String(normalizedService.id) : ''
      const key = nameKey || idKey

      if (!key) return

      const existingService = serviceMap.get(key)

      if (!existingService) {
        serviceMap.set(key, normalizedService)
        return
      }

      // Priority to retain id from real backend over local- mock id
      const mergedId = (existingService.id && !String(existingService.id).startsWith('local-')) 
        ? existingService.id 
        : (normalizedService.id && !String(normalizedService.id).startsWith('local-'))
          ? normalizedService.id
          : existingService.id || normalizedService.id

      const isRemoteActive = serviceLists.length > 1

      serviceMap.set(key, {
        ...existingService,
        ...normalizedService,
        id: mergedId,
        enabled: isRemoteActive && normalizedService !== undefined
          ? Boolean(normalizedService.enabled)
          : Boolean(existingService.enabled || normalizedService.enabled),
      })
    })

  return Array.from(serviceMap.values())
}

function HomePage() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [documentsByService, setDocumentsByService] = useState({})
  const [activeService, setActiveService] = useState(null)
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [studentOrders, setStudentOrders] = useState([])
  const [studentProfile, setStudentProfile] = useState(() => getStudentProfile())
  const [featuredQuote] = useState(() => getRotatingStudyQuote())

  const displayName = studentProfile.name || getDefaultDisplayName(currentUser)
  const departmentLabel = studentProfile.department || 'Student profile'

  async function loadSupabaseServices() {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, icon, enabled, color, background, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async function loadServices() {
    try {
      const [apiServices, supabaseServices] = await Promise.all([
        getServices().catch(() => []),
        loadSupabaseServices().catch(() => []),
      ])

      const mergedServices = mergeServices(apiServices, supabaseServices, getLocalServices())

      if (mergedServices.length > 0) {
        const safeServices = getStudentSafeServices(mergedServices)
        setServices(safeServices)
        syncLocalServices(safeServices)
        setPageError('')
        return
      }

      setServices(getStudentSafeServices(getLocalServices()))
      setPageError('Using locally saved prototype services for now.')
    } catch {
      setServices(getStudentSafeServices(getLocalServices()))
      setPageError('Using locally saved prototype services for now.')
    }
  }

  async function loadCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser()
      setCurrentUser(data.user || null)
    } catch {
      setCurrentUser(null)
    }
  }

  async function loadStudentOrders(userId) {
    if (!userId) {
      setStudentOrders([])
      return
    }

    try {
      const remoteOrders = await getOrders(userId)
      setStudentOrders(remoteOrders || [])
    } catch {
      setStudentOrders(getPrototypeOrders().filter((order) => order.user_id === userId))
    }
  }

  async function loadDocuments(serviceData) {
    const validServiceIds = (serviceData || [])
      .map((service) => service.id)
      .filter((id) => isUuid(id))

    if (validServiceIds.length === 0) {
      setDocumentsByService({})
      return
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, service_id, title, file_url, created_at')
        .in('service_id', validServiceIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      const groupedDocuments = (data || []).reduce((accumulator, item) => {
        if (!accumulator[item.service_id]) {
          accumulator[item.service_id] = []
        }

        accumulator[item.service_id].push(item)
        return accumulator
      }, {})

      setDocumentsByService(groupedDocuments)
    } catch {
      setDocumentsByService({})
    }
  }

  function handleOpenDocuments(service) {
    setActiveService(service)
    setIsDocumentsLoading(false)
  }

  function handleCloseDocuments() {
    setActiveService(null)
  }

  function handleAddDocumentToCart(service, document) {
    addLocalCartItem({
      id: `service-document-${document.id}-${Date.now()}`,
      uniqueCode: generateCode(),
      serviceId: service.id,
      serviceName: `${service.name} - ${document.title}`,
      pages: 1,
      quantity: 1,
      pricePerPage: 0,
      totalPrice: 0,
      printMode: 'document',
      printSides: 'single',
      paperSize: 'Digital',
      finishing: 'none',
      uploadedFiles: [
        {
          name: document.title,
          publicUrl: document.file_url,
          type: 'pdf',
        },
      ],
      isServiceDocument: true,
      documentTitle: document.title,
      documentUrl: document.file_url,
    })

    setPageError(`${document.title} was added to cart.`)
  }

  useEffect(() => {
    loadServices().then(() => {})
    loadCurrentUser()
    setStudentProfile(getStudentProfile())

    const handleRefresh = () => {
      loadServices().then(() => {})
      loadCurrentUser()
      setStudentProfile(getStudentProfile())
    }

    const intervalId = window.setInterval(() => {
      loadServices()
      loadCurrentUser()
      setStudentProfile(getStudentProfile())
    }, 8000)

    window.addEventListener('focus', handleRefresh)
    window.addEventListener('storage', handleRefresh)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
    }
  }, [])

  useEffect(() => {
    loadDocuments(services)
  }, [services])

  useEffect(() => {
    loadStudentOrders(currentUser?.id)

    const intervalId = window.setInterval(() => {
      loadStudentOrders(currentUser?.id)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [currentUser?.id])

  const visibleServices = useMemo(() => {
    const enabledServices = services.filter((service) => service.enabled)
    const query = searchQuery.trim().toLowerCase()

    if (!query) return enabledServices

    return enabledServices.filter((service) => getServiceSearchTerms(service).includes(query))
  }, [services, searchQuery])

  const pendingPickups = useMemo(
    () => studentOrders.filter((order) => getPrintStatus(order) === 'ready_for_pickup' && !order.collected),
    [studentOrders]
  )

  const recentOrders = useMemo(
    () => studentOrders.slice(0, 3),
    [studentOrders]
  )

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32">
      <header className="bg-gradient-to-br from-[var(--clr-primary)] via-[var(--clr-primary-dim)] to-[var(--clr-secondary)] flex justify-between items-center w-full px-6 py-5 rounded-b-[2.5rem] shadow-[0_20px_48px_rgba(32,48,68,0.12)] z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 overflow-hidden">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw1S-FQWyvNAw_-yaZ2TlKx9xJaIEZANZOt5VZvry3gf9U0kPEv07JuN8OF65rgbyEe2uDDl3ZfpMtygzm5nFWyOGgNAAiKQ2TqpYi039HQo0LFrxcQiGn5y0pelpfpWVWDOcF948AXOWrjFFd-A9zlaUgR6D6HVyuJqaGfx1LP8t0HzFAgFAyHS4v4z53mN-HldCz2QwrfeLRgtfL-T3-iSFsNgpLDAaHcxMF_c3lfuLM8nuLp1_XtDZ5UPnOsqli-KGOSMwudeI"
            />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white font-headline">
            CampusPrint
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell audience="student" userId={currentUser?.id} variant="dark" />
          <button
            type="button"
            onClick={() => navigate('/settings', { state: { from: '/home' } })}
            className="flex h-11 items-center gap-3 rounded-full bg-white/10 px-4 text-white transition-all hover:bg-white/20 active:scale-95 backdrop-blur-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <UserRound size={16} strokeWidth={2.2} />
            </div>
            <div className="text-left leading-tight">
              <div className="max-w-[10rem] truncate text-sm font-semibold">{displayName}</div>
              <div className="max-w-[10rem] truncate text-[11px] text-white/75">{departmentLabel}</div>
            </div>
          </button>
        </div>
      </header>

      <main className="px-6 mt-8 space-y-8">
        <section className="space-y-2 animate-fade-in-up">
          <h1 className="text-[2.5rem] leading-tight font-headline font-bold tracking-tight text-on-surface">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-on-surface-variant text-sm max-w-xs">
            Ready to organize your academic materials today?
          </p>
        </section>

        <section className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-on-surface-variant transition-colors group-focus-within:text-primary">
                search
              </span>
            </div>
            <input
              className="w-full h-14 pl-14 pr-6 border-none rounded-2xl shadow-[0_10px_30px_rgba(32,48,68,0.04)] focus:ring-2 focus:ring-primary/30 focus:shadow-[0_10px_30px_rgba(74,64,224,0.08)] transition-all bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60"
              placeholder="Search for books, forms, records, or xerox..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div
            className="relative overflow-hidden rounded-2xl h-48 flex flex-col justify-end p-6 group cursor-pointer"
            onClick={() => navigate('/order')}
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
              style={{ background: 'linear-gradient(to top, rgba(74,64,224,0.92), rgba(74,64,224,0.3), transparent)' }}
            />
            <div className="relative z-10">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md inline-block"
                style={{ background: 'var(--clr-tertiary-container)', color: 'var(--clr-on-tertiary-container)' }}
              >
                Study Motivation
              </span>
              <h2 className="text-white text-xl font-bold font-headline mt-2">
                Keep showing up for yourself.
              </h2>
              <p className="text-white/80 text-sm max-w-md">{featuredQuote}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '180ms' }}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-on-surface font-headline">
              Main Services
            </h3>
            <button
              className="text-sm font-semibold text-primary hover:underline transition-all"
              onClick={() => navigate('/order')}
            >
              View All
            </button>
          </div>
          {pageError && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300 animate-fade-in">
              {pageError}
            </div>
          )}
          {visibleServices.length === 0 ? (
            <div className="rounded-2xl p-8 text-center bg-surface-container-lowest text-on-surface-variant animate-fade-in">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3 block">
                {searchQuery ? 'search_off' : 'inventory_2'}
              </span>
              <p className="font-headline font-bold text-on-surface mb-1">
                {searchQuery ? 'No matching services' : 'No active services'}
              </p>
              <p className="text-sm">
                {searchQuery
                  ? `Nothing found for "${searchQuery}". Try a different term.`
                  : 'No active services are available right now.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {visibleServices.map((service, index) => (
                <div
                  key={service.id}
                  className="card-interactive p-5 rounded-2xl shadow-[0_8px_24px_rgba(32,48,68,0.05)] flex flex-col items-start gap-4 text-left bg-surface-container-lowest"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      background: service.background || 'var(--clr-surface-container-low)',
                      color: service.color || 'var(--clr-primary)',
                    }}
                  >
                    <span className="material-symbols-outlined text-3xl">{service.icon}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-on-surface">
                      {service.name}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {(documentsByService[service.id] || []).length > 0
                        ? `${documentsByService[service.id].length} file${documentsByService[service.id].length > 1 ? 's' : ''} available`
                        : 'Available now'}
                    </span>
                  </div>
                  <div className="mt-auto flex w-full flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDocuments(service)}
                      className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                    >
                      View Files
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/order')}
                      className="rounded-full bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container"
                    >
                      Custom Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pb-10 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <div className="rounded-2xl bg-surface-container-low p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <h4 className="text-lg font-bold text-on-surface font-headline">
                  Current Status
                </h4>
                <p className="text-xs text-on-surface-variant">
                  {pendingPickups.length > 0
                    ? `You have ${pendingPickups.length} pending pickup${pendingPickups.length > 1 ? 's' : ''} ready at the print room.`
                    : 'Your latest orders and deadlines will appear here.'}
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-4 py-3 text-center text-primary">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Pending Pickups</p>
                <p className="mt-1 text-2xl font-bold">{pendingPickups.length}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl bg-surface-container-lowest px-4 py-4 text-sm text-on-surface-variant">
                  No orders yet. Create one from Custom Order or a service file.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="rounded-2xl bg-surface-container-lowest p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <p className="font-headline text-base font-bold text-on-surface">
                            {order.services?.name || order.service_name || 'Printing Order'}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {order.quantity} qty x {order.pages} pages
                          </p>
                        </div>
                        <DeadlineReminder deadline={order.deadline} isPaid={Boolean(order.collected)} />
                      </div>
                      <div className="min-w-[220px]">
                        <OrderStatusManager
                          readOnly
                          status={getPrintStatus(order)}
                          collected={Boolean(order.collected)}
                          collectedAt={order.collected_at}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <ServiceDocumentsSheet
        isOpen={Boolean(activeService)}
        service={activeService}
        documents={activeService ? documentsByService[activeService.id] || [] : []}
        isLoading={isDocumentsLoading}
        onClose={handleCloseDocuments}
        onAddToCart={(document) => handleAddDocumentToCart(activeService, document)}
      />

      <div className="fixed bottom-0 left-0 z-50 w-full">
        <BottomNav />
      </div>
    </div>
  )
}

export default HomePage



