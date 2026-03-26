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

const fallbackJobs = [
  {
    id: 'JOB-2031',
    icon: 'picture_as_pdf',
    name: 'EEE Internal Record Bundle',
    meta: [
      { icon: 'person', label: 'Neha' },
      { icon: 'layers', label: '84 pages' },
      { icon: 'schedule', label: '5 min ago' },
    ],
    status: 'In Review',
    statusBg: '#eef2ff',
    statusColor: '#4a40e0',
  },
  {
    id: 'JOB-2027',
    icon: 'menu_book',
    name: 'Blue Books Restock',
    meta: [
      { icon: 'inventory_2', label: '120 units' },
      { icon: 'schedule', label: '18 min ago' },
    ],
    status: 'Completed',
    statusBg: '#e8f7ef',
    statusColor: '#006947',
  },
  {
    id: 'JOB-2019',
    icon: 'warning',
    name: 'Department Forms Batch',
    meta: [
      { icon: 'apartment', label: 'CSE Office' },
      { icon: 'schedule', label: '31 min ago' },
    ],
    status: 'Needs Attention',
    statusBg: '#fff1f4',
    statusColor: '#b41340',
  },
]

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

function AdminPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState(() => normalizeServices(getLocalServices()))
  const [stats, setStats] = useState(fallbackStats)
  const [jobs, setJobs] = useState(fallbackJobs)
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('print')
  const [enabled, setEnabled] = useState(true)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [showNameError, setShowNameError] = useState(false)
  const [isSavingService, setIsSavingService] = useState(false)
  const [pageError, setPageError] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [showFilters, setShowFilters] = useState(false)
  const [jobFilter, setJobFilter] = useState('all')
  const [showNotifications, setShowNotifications] = useState(false)

  const overviewRef = useRef(null)
  const servicesRef = useRef(null)
  const jobsRef = useRef(null)
  const inventoryRef = useRef(null)

  const mappedJobs = useMemo(
    () =>
      jobs.map((job) => {
        if (job.meta) return job

        const statusMap = {
          pending: { label: 'Pending', bg: '#eef2ff', color: '#4a40e0', icon: 'schedule' },
          in_review: { label: 'In Review', bg: '#eef2ff', color: '#4a40e0', icon: 'picture_as_pdf' },
          processing: { label: 'Processing', bg: '#e9f8ff', color: '#00628c', icon: 'print' },
          completed: { label: 'Completed', bg: '#e8f7ef', color: '#006947', icon: 'check_circle' },
          cancelled: { label: 'Cancelled', bg: '#fff1f4', color: '#b41340', icon: 'warning' },
        }

        const state = statusMap[job.status] || statusMap.pending

        return {
          rawId: job.id,
          originalStatus: job.status,
          isRemote: true,
          id: job.id.slice(0, 8).toUpperCase(),
          icon: state.icon,
          name: job.services?.name || 'Printing Order',
          meta: [
            { icon: 'layers', label: `${job.pages} pages` },
            { icon: 'inventory_2', label: `${job.quantity} set${job.quantity > 1 ? 's' : ''}` },
            { icon: 'schedule', label: 'Recently created' },
          ],
          status: state.label,
          statusBg: state.bg,
          statusColor: state.color,
        }
      }),
    [jobs]
  )

  const filteredJobs = useMemo(() => {
    if (jobFilter === 'all') return mappedJobs
    return mappedJobs.filter((job) => job.status.toLowerCase().replaceAll(' ', '_') === jobFilter)
  }, [jobFilter, mappedJobs])

  const alertItems = useMemo(
    () => [
      { title: `${stats.openAlerts} open alerts`, subtitle: 'Review warnings and maintenance notices.' },
      { title: `${mappedJobs.length} jobs in queue`, subtitle: 'Latest requests are ready for status updates.' },
      pageError
        ? { title: 'Connection issue detected', subtitle: pageError }
        : { title: 'System synced', subtitle: 'Backend and Supabase are responding normally.' },
    ],
    [mappedJobs.length, pageError, stats.openAlerts]
  )

  useEffect(() => {
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
        }
        setPageError('')
      } catch (error) {
        const localServices = normalizeServices(getLocalServices())
        setServices(localServices)
        setStats({ ...fallbackStats, services: localServices.length })
        setJobs(fallbackJobs)
        setPageError('Live admin data is temporarily unavailable. Using local service changes for now.')
      }
    }

    loadAdminData()
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

  function scrollToSection(section) {
    const map = {
      overview: overviewRef,
      services: servicesRef,
      jobs: jobsRef,
      inventory: inventoryRef,
    }

    setActiveSection(section)
    setShowNotifications(false)
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

    if (!serviceToDelete.id || String(serviceToDelete.id).startsWith('local-')) {
      setPageError('')
      return
    }

    try {
      await deleteService(serviceToDelete.id)
      setPageError('')
    } catch (error) {
      setPageError(`${error.message}. The service was removed locally on this device.`)
    }
  }

  function handleToggleService(index) {
    const service = services[index]
    if (!service) return

    const nextValue = !service.enabled
    const updatedServices = services.map((item, serviceIndex) =>
      serviceIndex === index ? { ...item, enabled: nextValue } : item
    )

    persistServices(updatedServices)

    if (!service.id || String(service.id).startsWith('local-')) {
      setPageError('')
      return
    }

    toggleService(service.id, nextValue).catch((error) => {
      const revertedServices = updatedServices.map((item, serviceIndex) =>
        serviceIndex === index ? { ...item, enabled: service.enabled } : item
      )
      persistServices(revertedServices)
      setPageError(`${error.message}. Local changes are still available on this device.`)
    })
  }

  async function handleJobStatusToggle(jobToUpdate) {
    const statusOrder = ['pending', 'in_review', 'processing', 'completed']
    const currentStatus = jobToUpdate.originalStatus || 'pending'
    const currentIndex = statusOrder.indexOf(currentStatus)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    if (!jobToUpdate.isRemote) {
      setJobs((current) =>
        current.map((job) =>
          job.id === jobToUpdate.id ? { ...job, status: nextStatus } : job
        )
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
    } catch (error) {
      setPageError(error.message)
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
            updatedService = {
              ...currentService,
              name: trimmed,
              icon: selectedIcon,
              enabled,
            }
          }
        } else {
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
          createdService = {
            id: `local-${Date.now()}`,
            name: trimmed,
            icon: selectedIcon,
            enabled,
            color: '#4a40e0',
            background: '#eef2ff',
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
                <button
                  className="admin-icon-btn admin-topbar-notif"
                  type="button"
                  aria-label="Notifications"
                  onClick={() => setShowNotifications((current) => !current)}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="admin-notif-dot" />
                </button>
              </div>
            </div>
          </header>

          <main className="admin-main-scroll">
            <div className="admin-main-inner">
              {showNotifications && (
                <section className="admin-notification-panel">
                  {alertItems.map((alert) => (
                    <div key={alert.title} className="admin-notification-item">
                      <p className="admin-notification-title">{alert.title}</p>
                      <p className="admin-notification-sub">{alert.subtitle}</p>
                    </div>
                  ))}
                </section>
              )}

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
                    <div className="admin-stat-mini-lbl">Alerts open</div>
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
                  <button className="admin-btn-ghost" type="button" onClick={() => setShowFilters((current) => !current)}>
                    <span className="material-symbols-outlined">tune</span>
                    Filter
                  </button>
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
                  {filteredJobs.map((job) => (
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
                  ))}
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
    </div>
  )
}

export default AdminPage
