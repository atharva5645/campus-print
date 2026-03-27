import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminPage.css'
import {
  createService,
  deleteService,
  getAdminStats,
  getRecentJobs,
  getServices,
  toggleService,
  updateService,
} from '../api/adminApi'
import { getLocalServices, saveLocalServices, syncLocalServices } from '../lib/localServices'
import { updateOrderStatus } from '../api/orderApi'
import NotificationBell from '../components/NotificationBell'
import ServiceDocumentsModal from '../components/ServiceDocumentsModal'
import { supabase } from '../lib/supabase'
import {
  clearCompletedPrototypeOrders,
  getPrototypeOrders,
  getPrototypeStats,
  updatePrototypeOrderStatus,
} from '../lib/prototypeData'

const fallbackStats = {
  todayJobs: 128,
  services: getLocalServices().length,
  openAlerts: 2,
}

const iconOptions = ['print', 'description', 'menu_book', 'science', 'inventory_2']

function Toggle({ checked, onChange }) {
  return (
    <label className="admin-toggle">
      <input checked={checked} type="checkbox" onChange={onChange} />
      <span className="admin-toggle-track" />
    </label>
  )
}

function normalizeServices(services) {
  return services.map((service) => ({
    ...service,
    bg: service.background || service.bg,
    color: service.color,
  }))
}

function mapSupabaseService(service) {
  return {
    ...service,
    bg: service.background || service.bg,
    color: service.color || '#4a40e0',
  }
}

async function findSupabaseServiceByName(name) {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, icon, enabled, color, background, created_at, updated_at')
    .eq('name', name)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

async function createSupabaseService(payload) {
  const { data, error } = await supabase
    .from('services')
    .insert({
      name: payload.name,
      icon: payload.icon,
      enabled: payload.enabled,
      color: payload.color || '#4a40e0',
      background: payload.background || '#eef2ff',
    })
    .select('id, name, icon, enabled, color, background, created_at, updated_at')
    .single()

  if (error) throw error
  return data
}

async function updateSupabaseService(id, payload) {
  const { data, error } = await supabase
    .from('services')
    .update({
      name: payload.name,
      icon: payload.icon,
      enabled: payload.enabled,
      color: payload.color,
      background: payload.background,
    })
    .eq('id', id)
    .select('id, name, icon, enabled, color, background, created_at, updated_at')
    .single()

  if (error) throw error
  return data
}

async function deleteSupabaseService(id) {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw error
}

function mapJobs(jobs) {
  return jobs.map((job) => {
    if (job.meta) return job

    const statusMap = {
      pending: { label: 'Pending', bg: '#eef2ff', color: '#4a40e0', icon: 'schedule' },
      in_review: { label: 'In Review', bg: '#eef2ff', color: '#4a40e0', icon: 'picture_as_pdf' },
      processing: { label: 'Processing', bg: '#e9f8ff', color: '#00628c', icon: 'print' },
      completed: { label: 'Completed', bg: '#e8f7ef', color: '#006947', icon: 'check_circle' },
      cancelled: { label: 'Cancelled', bg: '#fff1f4', color: '#b41340', icon: 'warning' },
    }

    const state = statusMap[job.status] || statusMap.pending
    const isPrototype = String(job.id || '').startsWith('proto-order-')

    return {
      rawId: job.id,
      originalStatus: job.status,
      isRemote: !isPrototype,
      id: isPrototype ? `PROTO-${String(job.id).slice(-4).toUpperCase()}` : job.id.slice(0, 8).toUpperCase(),
      icon: state.icon,
      name: job.services?.name || job.service_name || 'Printing Order',
      meta: [
        { icon: 'person', label: job.student_name || 'CampusPrint Student' },
        { icon: 'layers', label: `${job.pages} pages` },
        { icon: 'inventory_2', label: `${job.quantity} set${job.quantity > 1 ? 's' : ''}` },
      ],
      status: state.label,
      statusBg: state.bg,
      statusColor: state.color,
    }
  })
}

function AdminPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState(() => normalizeServices(getLocalServices()))
  const [stats, setStats] = useState(fallbackStats)
  const [jobs, setJobs] = useState(() => getPrototypeOrders())
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('print')
  const [enabled, setEnabled] = useState(true)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [showNameError, setShowNameError] = useState(false)
  const [isSavingService, setIsSavingService] = useState(false)
  const [pageError, setPageError] = useState('')
  const [documentModal, setDocumentModal] = useState({
    open: false,
    mode: 'upload',
    service: null,
  })
  const [activeSection, setActiveSection] = useState('overview')
  const [showFilters, setShowFilters] = useState(false)
  const [jobFilter, setJobFilter] = useState('all')

  const overviewRef = useRef(null)
  const servicesRef = useRef(null)
  const jobsRef = useRef(null)
  const inventoryRef = useRef(null)

  const mappedJobs = useMemo(() => mapJobs(jobs), [jobs])

  const filteredJobs = useMemo(() => {
    if (jobFilter === 'all') return mappedJobs
    return mappedJobs.filter((job) => job.status.toLowerCase().replaceAll(' ', '_') === jobFilter)
  }, [jobFilter, mappedJobs])

  useEffect(() => {
    function loadPrototypeState() {
      const prototypeJobs = getPrototypeOrders()
      const prototypeStats = getPrototypeStats()

      setJobs(prototypeJobs)
      setStats((current) => ({
        ...current,
        todayJobs: prototypeStats.todayJobs,
        openAlerts: prototypeStats.openAlerts,
      }))
    }

    async function loadAdminData() {
      try {
        const [serviceData, statsData, recentJobs] = await Promise.all([
          getServices(),
          getAdminStats(),
          getRecentJobs(),
        ])

        setServices(normalizeServices(serviceData))
        syncLocalServices(serviceData)
        setStats(statsData)
        if (recentJobs.length > 0) {
          setJobs(recentJobs)
        } else {
          loadPrototypeState()
        }
        setPageError('')
      } catch {
        const localServices = normalizeServices(getLocalServices())
        const prototypeStats = getPrototypeStats()
        const prototypeJobs = getPrototypeOrders()

        setServices(localServices)
        setStats({
          todayJobs: prototypeStats.todayJobs,
          services: localServices.length,
          openAlerts: prototypeStats.openAlerts,
        })
        setJobs(prototypeJobs)
        setPageError('Prototype mode is active. New student orders will appear here even while the backend is offline.')
      }
    }

    loadAdminData()

    const handleStorage = () => {
      const prototypeJobs = getPrototypeOrders()
      const prototypeStats = getPrototypeStats()
      setJobs(prototypeJobs)
      setStats((current) => ({
        ...current,
        todayJobs: prototypeStats.todayJobs,
        openAlerts: prototypeStats.openAlerts,
      }))
    }

    const intervalId = window.setInterval(handleStorage, 3000)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  function persistServices(nextServices) {
    setServices(nextServices)
    saveLocalServices(
      nextServices.map((item) => ({
        ...item,
        background: item.background || item.bg,
      }))
    )
    setStats((current) => ({
      ...current,
      services: nextServices.length,
    }))
  }

  function openOverlay() {
    setEditingServiceId(null)
    setServiceName('')
    setSelectedIcon('print')
    setEnabled(true)
    setShowNameError(false)
    setIsOverlayOpen(true)
  }

  function closeOverlay() {
    setIsOverlayOpen(false)
    setEditingServiceId(null)
    setServiceName('')
    setSelectedIcon('print')
    setEnabled(true)
    setShowNameError(false)
  }

  async function ensureServiceHasCloudId(service, overrides = {}) {
    if (!service) return null

    const payload = {
      name: overrides.name ?? service.name,
      icon: overrides.icon ?? service.icon ?? 'print',
      enabled: overrides.enabled ?? Boolean(service.enabled),
      color: overrides.color ?? service.color ?? '#4a40e0',
      background: overrides.background ?? service.background ?? service.bg ?? '#eef2ff',
    }

    if (service.id && !String(service.id).startsWith('local-')) {
      const updatedService = await updateSupabaseService(service.id, payload)
      return mapSupabaseService(updatedService)
    }

    const existingService = await findSupabaseServiceByName(payload.name)

    if (existingService) {
      const updatedExistingService = await updateSupabaseService(existingService.id, payload)
      return mapSupabaseService(updatedExistingService)
    }

    const createdService = await createSupabaseService(payload)
    return mapSupabaseService(createdService)
  }

  function replaceServiceLocally(previousService, nextService) {
    const nextServices = services.map((item) =>
      (item.id || item.name) === (previousService.id || previousService.name)
        ? { ...nextService, isNew: previousService.isNew }
        : item
    )

    persistServices(nextServices)
    return nextServices
  }

  async function openDocumentModal(mode, service) {
    try {
      let targetService = service

      if (service?.id && String(service.id).startsWith('local-')) {
        targetService = await ensureServiceHasCloudId(service)
        replaceServiceLocally(service, targetService)
        setPageError('The selected service was synced to Supabase so document management can work.')
      } else {
        setPageError('')
      }

      setDocumentModal({
        open: true,
        mode,
        service: targetService,
      })
    } catch (error) {
      setPageError(error.message || 'This service could not be synced to Supabase yet.')
    }
  }

  function closeDocumentModal() {
    setDocumentModal({
      open: false,
      mode: 'upload',
      service: null,
    })
  }

  function scrollToSection(section) {
    const map = {
      overview: overviewRef,
      services: servicesRef,
      jobs: jobsRef,
      inventory: inventoryRef,
    }

    setActiveSection(section)
    if (section === 'settings') {
      navigate('/settings')
      return
    }

    map[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleEditService(service) {
    setEditingServiceId(service.id || service.name)
    setServiceName(service.name)
    setSelectedIcon(service.icon || 'print')
    setEnabled(Boolean(service.enabled))
    setShowNameError(false)
    setIsOverlayOpen(true)
  }

  async function handleDeleteService(serviceToDelete) {
    const confirmed = window.confirm(`Delete "${serviceToDelete.name}"?`)
    if (!confirmed) return

    const nextServices = services.filter((service) => service !== serviceToDelete)
    persistServices(nextServices)

    try {
      if (!serviceToDelete.id || String(serviceToDelete.id).startsWith('local-')) {
        const existingService = await findSupabaseServiceByName(serviceToDelete.name)
        if (existingService?.id) {
          await deleteSupabaseService(existingService.id)
        }
      } else {
        try {
          await deleteService(serviceToDelete.id)
        } catch {
          await deleteSupabaseService(serviceToDelete.id)
        }
      }

      setPageError('')
    } catch (error) {
      setPageError(`${error.message}. The service was removed locally on this device.`)
    }
  }

  async function handleToggleService(index) {
    const service = services[index]
    if (!service) return

    const nextValue = !service.enabled
    const updatedServices = services.map((item, serviceIndex) =>
      serviceIndex === index ? { ...item, enabled: nextValue } : item
    )

    persistServices(updatedServices)

    try {
      const syncedService = await ensureServiceHasCloudId(service, { enabled: nextValue })
      replaceServiceLocally(service, syncedService)
      setPageError('')
    } catch (error) {
      const revertedServices = updatedServices.map((item, serviceIndex) =>
        serviceIndex === index ? { ...item, enabled: service.enabled } : item
      )
      persistServices(revertedServices)
      setPageError(`${error.message}. Local changes are still available on this device.`)
    }
  }

  async function handleJobStatusToggle(jobToUpdate) {
    const statusOrder = ['pending', 'in_review', 'processing', 'completed']
    const currentStatus = jobToUpdate.originalStatus || 'pending'
    const currentIndex = statusOrder.indexOf(currentStatus)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    if (!jobToUpdate.isRemote) {
      const updated = updatePrototypeOrderStatus(jobToUpdate.rawId, nextStatus)
      const prototypeJobs = getPrototypeOrders()
      const prototypeStats = getPrototypeStats()
      setJobs(prototypeJobs)
      setStats((current) => ({
        ...current,
        todayJobs: prototypeStats.todayJobs,
        openAlerts: prototypeStats.openAlerts,
      }))
      setPageError(
        updated?.status === 'completed'
          ? 'Student notified: the order is ready to take.'
          : ''
      )
      return
    }

    try {
      await updateOrderStatus(jobToUpdate.rawId, nextStatus)
      setJobs((current) =>
        current.map((job) =>
          job.id === jobToUpdate.rawId ? { ...job, status: nextStatus } : job
        )
      )
      setPageError('')
    } catch {
      const updated = updatePrototypeOrderStatus(jobToUpdate.rawId, nextStatus)
      const prototypeJobs = getPrototypeOrders()
      const prototypeStats = getPrototypeStats()
      if (updated) {
        setJobs(prototypeJobs)
        setStats((current) => ({
          ...current,
          todayJobs: prototypeStats.todayJobs,
          openAlerts: prototypeStats.openAlerts,
        }))
        setPageError(
          updated.status === 'completed'
            ? 'Student notified: the order is ready to take.'
            : 'Order updated in prototype mode.'
        )
      }
    }
  }

  async function handleSaveService() {
    const trimmed = serviceName.trim()
    if (!trimmed) {
      setShowNameError(true)
      return
    }

    try {
      setIsSavingService(true)

        if (editingServiceId) {
          const currentService = services.find((service) => (service.id || service.name) === editingServiceId)
          if (!currentService) {
            closeOverlay()
            return
          }

          let updatedService
          try {
            if (currentService.id && !String(currentService.id).startsWith('local-')) {
              try {
                updatedService = await updateService(currentService.id, {
                  name: trimmed,
                  icon: selectedIcon,
                  enabled,
                  color: currentService.color || '#4a40e0',
                  background: currentService.background || currentService.bg || '#eef2ff',
                })
              } catch {
                updatedService = await updateSupabaseService(currentService.id, {
                  name: trimmed,
                  icon: selectedIcon,
                  enabled,
                  color: currentService.color || '#4a40e0',
                  background: currentService.background || currentService.bg || '#eef2ff',
                })
              }
            } else {
              updatedService = await ensureServiceHasCloudId(currentService, {
                name: trimmed,
                icon: selectedIcon,
                enabled,
                color: currentService.color || '#4a40e0',
                background: currentService.background || currentService.bg || '#eef2ff',
              })
            }
          } catch {
            updatedService = {
              ...currentService,
              name: trimmed,
              icon: selectedIcon,
              enabled,
            }
          }

        const nextServices = services.map((item) =>
          (item.id || item.name) === editingServiceId
            ? {
                ...item,
                ...updatedService,
                bg: updatedService.background || updatedService.bg || item.bg,
                color: updatedService.color || item.color,
              }
            : { ...item, isNew: false }
        )

        persistServices(nextServices)
        } else {
          let createdService

          try {
            createdService = await createService({
            name: trimmed,
            icon: selectedIcon,
            enabled,
              color: '#4a40e0',
              background: '#eef2ff',
            })
          } catch {
            try {
              createdService = await createSupabaseService({
                name: trimmed,
                icon: selectedIcon,
                enabled,
                color: '#4a40e0',
                background: '#eef2ff',
              })
            } catch {
              createdService = {
                id: `local-${Date.now()}`,
                name: trimmed,
                icon: selectedIcon,
                enabled,
                color: '#4a40e0',
                background: '#eef2ff',
              }
            }
          }

        const nextServices = [
          { ...createdService, bg: createdService.background, color: createdService.color, isNew: true },
          ...services.map((item) => ({ ...item, isNew: false })),
        ]

        persistServices(nextServices)
      }

      closeOverlay()
      setPageError('')
    } finally {
      setIsSavingService(false)
    }
  }

  function handleClearCompletedOrders() {
    const completedCount = getPrototypeOrders().filter((order) => order.status === 'completed').length

    if (completedCount === 0) {
      setPageError('There are no completed prototype orders to clear right now.')
      return
    }

    const confirmed = window.confirm(`Clear ${completedCount} completed order${completedCount > 1 ? 's' : ''}?`)
    if (!confirmed) return

    const remainingOrders = clearCompletedPrototypeOrders()
    const prototypeStats = getPrototypeStats()

    setJobs(remainingOrders)
    setStats((current) => ({
      ...current,
      todayJobs: prototypeStats.todayJobs,
      openAlerts: prototypeStats.openAlerts,
    }))
    setPageError('Completed prototype orders were cleared.')
  }

  return (
    <div className="admin-page">
      <div className="admin-app-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-icon">
              <span className="material-symbols-outlined">print</span>
            </div>
            <div>
              <div className="admin-sidebar-logo-text">CampusPrint</div>
              <div className="admin-sidebar-logo-sub">Admin Dashboard</div>
            </div>
          </div>

          <nav className="admin-sidebar-nav">
            <button className={`admin-nav-item${activeSection === 'overview' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('overview')}>
              <span className="material-symbols-outlined">dashboard</span>
              Overview
            </button>
            <button className={`admin-nav-item${activeSection === 'jobs' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('jobs')}>
              <span className="material-symbols-outlined">print</span>
              Print Jobs
              <span className="admin-nav-badge">{filteredJobs.length}</span>
            </button>
            <button className={`admin-nav-item${activeSection === 'inventory' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('inventory')}>
              <span className="material-symbols-outlined">inventory_2</span>
              Inventory
            </button>
            <button className={`admin-nav-item${activeSection === 'settings' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('settings')}>
              <span className="material-symbols-outlined">settings</span>
              Settings
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-sidebar-user">
              <img alt="Admin avatar" src="https://i.pravatar.cc/80?img=12" />
              <div>
                <div className="admin-sidebar-user-name">Akhil</div>
                <div className="admin-sidebar-user-role">System Admin</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="admin-page-content">
          <header className="admin-mobile-header">
            <div className="admin-mobile-header-brand">
              <span className="material-symbols-outlined">print</span>
              <div>
                <div className="admin-mobile-header-brand-name">CampusPrint</div>
                <div className="admin-mobile-header-brand-sub">Dashboard</div>
              </div>
            </div>
            <img className="admin-mobile-header-avatar" alt="Admin avatar" src="https://i.pravatar.cc/80?img=12" />
          </header>

          <header className="admin-topbar">
            <div className="admin-topbar-inner">
              <div>
                <div className="admin-topbar-title">Operations Overview</div>
                <div className="admin-topbar-sub">Monitor print requests, services, and system health.</div>
              </div>
              <div className="admin-topbar-actions">
                <NotificationBell audience="admin" />
              </div>
            </div>
          </header>

          <main className="admin-main-scroll">
            <div className="admin-main-inner">
              <section ref={overviewRef} className="admin-hero-grid">
                <div className="admin-hero-main">
                  <h2>Everything in the print room is moving on time.</h2>
                  <p>Live status across services, queue activity, and supply health for the day shift.</p>
                  <span className="material-symbols-outlined admin-hero-bg-icon">stacked_bar_chart</span>
                </div>
                <div className="admin-hero-stat">
                  <div className="admin-hero-stat-label">Today&apos;s Jobs</div>
                  <div className="admin-hero-stat-value">{stats.todayJobs}</div>
                  <div className="admin-hero-stat-sub">{mappedJobs.length} recent jobs loaded</div>
                </div>
              </section>

              <section className="admin-stat-row">
                <div className="admin-stat-mini">
                  <div className="admin-stat-mini-icon" style={{ background: '#e8f7ef' }}>
                    <span className="material-symbols-outlined" style={{ color: '#006947' }}>check_circle</span>
                  </div>
                  <div>
                    <div className="admin-stat-mini-val">94%</div>
                    <div className="admin-stat-mini-lbl">Success rate</div>
                  </div>
                </div>
                <div className="admin-stat-mini">
                  <div className="admin-stat-mini-icon" style={{ background: '#eef2ff' }}>
                    <span className="material-symbols-outlined" style={{ color: '#4a40e0' }}>schedule</span>
                  </div>
                  <div>
                    <div className="admin-stat-mini-val">18m</div>
                    <div className="admin-stat-mini-lbl">Avg turnaround</div>
                  </div>
                </div>
                <div className="admin-stat-mini">
                  <div className="admin-stat-mini-icon" style={{ background: '#fff1f4' }}>
                    <span className="material-symbols-outlined" style={{ color: '#b41340' }}>warning</span>
                  </div>
                  <div>
                    <div className="admin-stat-mini-val">{stats.openAlerts}</div>
                    <div className="admin-stat-mini-lbl">Open jobs</div>
                  </div>
                </div>
              </section>

              {pageError && (
                <section className="admin-section-header" style={{ marginBottom: 0 }}>
                  <div className="admin-section-title" style={{ color: '#9a6700', fontSize: '0.95rem' }}>
                    {pageError}
                  </div>
                </section>
              )}

              <section ref={servicesRef}>
                <div className="admin-section-header">
                  <div>
                    <div className="admin-section-label">Services</div>
                    <div className="admin-section-title">Available print services</div>
                  </div>
                  <button className="admin-btn-primary" type="button" onClick={openOverlay}>
                    <span className="material-symbols-outlined">add</span>
                    Add service
                  </button>
                </div>
                <div className="admin-services-grid">
                  {services.length === 0 ? (
                    <div className="admin-svc-card" style={{ gridColumn: '1 / -1', justifyContent: 'flex-start' }}>
                      <div className="admin-svc-card-left">
                        <div className="admin-svc-icon" style={{ background: '#eef2ff', color: '#4a40e0' }}>
                          <span className="material-symbols-outlined">cloud_off</span>
                        </div>
                        <div className="admin-svc-name">No services available yet. Add one to get started.</div>
                      </div>
                    </div>
                  ) : (
                    services.map((service, index) => (
                      <div
                        key={`${service.id || service.name}-${index}`}
                        className={`admin-svc-card${service.isNew ? ' admin-card-new' : ''}`}
                      >
                        <div className="admin-svc-card-main">
                          <div className="admin-svc-card-left">
                            <div className="admin-svc-icon" style={{ background: service.bg, color: service.color }}>
                              <span className="material-symbols-outlined">{service.icon}</span>
                            </div>
                            <div className="admin-svc-name">{service.name}</div>
                          </div>
                          <div className="admin-svc-actions">
                            <button type="button" className="admin-svc-action-btn" onClick={() => handleEditService(service)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-svc-action-btn"
                              onClick={() => openDocumentModal('upload', service)}
                            >
                              Upload Document
                            </button>
                            <button
                              type="button"
                              className="admin-svc-action-btn"
                              onClick={() => openDocumentModal('view', service)}
                            >
                              View Documents
                            </button>
                            <button
                              type="button"
                              className="admin-svc-action-btn admin-svc-action-btn-delete"
                              onClick={() => handleDeleteService(service)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <Toggle checked={service.enabled} onChange={() => handleToggleService(index)} />
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section ref={jobsRef}>
                <div className="admin-section-header">
                  <div>
                    <div className="admin-section-label">Queue</div>
                    <div className="admin-section-title">Recent print jobs</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="admin-btn-ghost" type="button" onClick={handleClearCompletedOrders}>
                      <span className="material-symbols-outlined">delete_sweep</span>
                      Clear Completed
                    </button>
                    <button className="admin-btn-ghost" type="button" onClick={() => setShowFilters((current) => !current)}>
                      <span className="material-symbols-outlined">tune</span>
                      Filter
                    </button>
                  </div>
                </div>
                {showFilters && (
                  <div className="admin-filter-row">
                    {[
                      ['all', 'All'],
                      ['pending', 'Pending'],
                      ['in_review', 'In Review'],
                      ['processing', 'Processing'],
                      ['completed', 'Completed'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`admin-filter-chip${jobFilter === value ? ' active' : ''}`}
                        onClick={() => setJobFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="admin-jobs-list">
                  {filteredJobs.length === 0 ? (
                    <div className="admin-job-card">
                      <div className="admin-job-left">
                        <div className="admin-job-icon">
                          <span className="material-symbols-outlined">inbox</span>
                        </div>
                        <div>
                          <div className="admin-job-name">No print jobs yet</div>
                          <div className="admin-job-meta">
                            <span>
                              <span className="material-symbols-outlined">schedule</span>
                              New student orders will appear here
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <div key={job.id} className="admin-job-card">
                        <div className="admin-job-left">
                          <div className="admin-job-icon">
                            <span className="material-symbols-outlined">{job.icon}</span>
                          </div>
                          <div>
                            <span className="admin-job-id">{job.id}</span>
                            <div className="admin-job-name">{job.name}</div>
                            <div className="admin-job-meta">
                              {job.meta.map((item) => (
                                <span key={`${job.id}-${item.label}`}>
                                  <span className="material-symbols-outlined">{item.icon}</span>
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          className="admin-status-badge"
                          type="button"
                          style={{ background: job.statusBg, color: job.statusColor }}
                          onClick={() => handleJobStatusToggle(job)}
                        >
                          <span className="admin-badge-dot" style={{ background: job.statusColor }} />
                          {job.status}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section ref={inventoryRef} className="admin-bento-row">
                <div className="admin-bento-inventory">
                  <h3>Paper inventory</h3>
                  <div className="admin-progress-bar">
                    <div className="admin-progress-fill" style={{ width: '72%' }} />
                  </div>
                  <div className="admin-progress-labels">
                    <span>72% stock available</span>
                    <button type="button" className="admin-inline-link" onClick={() => scrollToSection('settings')}>
                      Reorder soon
                    </button>
                  </div>
                  <span className="material-symbols-outlined admin-bento-bg-icon">inventory</span>
                </div>
                <div className="admin-bento-health">
                  <div>
                    <h3>Machine health</h3>
                    <p>All active printers are connected. One laminator is waiting for maintenance.</p>
                  </div>
                  <div className="admin-health-status">
                    <span className="admin-badge-dot" style={{ background: '#69f6b8' }} />
                    Stable
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      <nav className="admin-bottom-nav">
        <button className={`admin-bnav-item${activeSection === 'overview' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('overview')}>
          <span className="material-symbols-outlined">home</span>
          Home
        </button>
        <button className={`admin-bnav-item${activeSection === 'jobs' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('jobs')}>
          <span className="material-symbols-outlined">print</span>
          Jobs
        </button>
        <button className="admin-bnav-item" type="button" onClick={openOverlay}>
          <span className="material-symbols-outlined">add_circle</span>
          Add
        </button>
        <button className={`admin-bnav-item${activeSection === 'inventory' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('inventory')}>
          <span className="material-symbols-outlined">inventory_2</span>
          Stock
        </button>
        <button className={`admin-bnav-item${activeSection === 'settings' ? ' active' : ''}`} type="button" onClick={() => scrollToSection('settings')}>
          <span className="material-symbols-outlined">person</span>
          Profile
        </button>
      </nav>

      <div
        className={`admin-overlay${isOverlayOpen ? ' open' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeOverlay()
        }}
      >
        <div className="admin-sheet">
          <div className="admin-section-header" style={{ marginBottom: '1rem' }}>
            <div>
              <div className="admin-section-label">Create</div>
              <div className="admin-section-title">{editingServiceId ? 'Edit service' : 'Add a new service'}</div>
            </div>
            <button className="admin-icon-btn" type="button" aria-label="Close modal" onClick={closeOverlay}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="admin-modal-input-wrap">
            <label className="admin-modal-input-label" htmlFor="svc-name-input">
              Service name <span>*</span>
            </label>
            <span className="material-symbols-outlined admin-modal-input-icon">edit</span>
            <input
              id="svc-name-input"
              className="admin-service-name-input"
              type="text"
              placeholder="Enter a service name"
              value={serviceName}
              onChange={(event) => {
                setServiceName(event.target.value)
                if (showNameError && event.target.value.trim()) setShowNameError(false)
              }}
            />
            {showNameError && <div className="admin-input-error">Please enter a service name.</div>}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div className="admin-modal-input-label">Choose an icon</div>
            <div className="admin-icon-row">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  className={`admin-ico-btn${selectedIcon === icon ? ' active' : ''}`}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-modal-toggle-row">
            <div>
              <div className="admin-section-title" style={{ fontSize: '.95rem' }}>Enable now</div>
              <div className="admin-topbar-sub">Service will appear as active immediately</div>
            </div>
            <Toggle checked={enabled} onChange={() => setEnabled((current) => !current)} />
          </div>

          <button
            className="admin-btn-primary"
            type="button"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleSaveService}
            disabled={isSavingService}
          >
            <span className="material-symbols-outlined">check</span>
            {isSavingService ? 'Saving...' : editingServiceId ? 'Update service' : 'Save service'}
          </button>
        </div>
      </div>

      <ServiceDocumentsModal
        isOpen={documentModal.open}
        mode={documentModal.mode}
        service={documentModal.service}
        onClose={closeDocumentModal}
      />
    </div>
  )
}

export default AdminPage
