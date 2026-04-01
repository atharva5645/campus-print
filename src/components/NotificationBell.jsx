import React, { useEffect, useMemo, useState } from 'react'
import { getNotifications, markNotificationsRead } from '../api/notificationApi'

function formatNotificationTime(value) {
  if (!value) return 'Just now'

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleDateString()
}

function NotificationBell({ audience = 'student', userId, variant = 'light' }) {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const isStudent = audience === 'student'
  const canLoad = audience === 'admin' || Boolean(userId)
  const isDarkVariant = variant === 'dark'

  async function loadNotifications() {
    if (!canLoad) return

    try {
      setIsLoading(true)
      const items = await getNotifications({ audience, userId, limit: 8, unreadOnly: true })
      setNotifications((items || []).filter((item) => !item.is_read))
      setErrorMessage('')
    } catch {
      setErrorMessage('Notifications are temporarily unavailable.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!canLoad) return

    loadNotifications()

    const intervalId = window.setInterval(() => {
      loadNotifications()
    }, 3000)

    const handleRefreshEvent = () => {
      loadNotifications()
    }

    window.addEventListener('campus_print_notifications_refresh', handleRefreshEvent)
    const handleStorage = () => {
      loadNotifications()
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('campus_print_notifications_refresh', handleRefreshEvent)
      window.removeEventListener('storage', handleStorage)
    }
  }, [audience, userId])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  )

  async function handleToggle() {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
  }

  async function handleClearAll() {
    if (!canLoad || notifications.length === 0) return

    setIsClearing(true)
    setErrorMessage('')

    // Optimistic UI: clear immediately
    const previous = notifications
    setNotifications([])

    try {
      await markNotificationsRead({ audience, userId })
    } catch {
      // Restore if failed
      setNotifications(previous)
      setErrorMessage('Could not clear notifications right now.')
    } finally {
      setIsClearing(false)
    }
  }

  if (!canLoad && isStudent) {
    return null
  }

  const buttonClassName = isDarkVariant
    ? 'relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:bg-white/20 active:scale-95 backdrop-blur-sm'
    : 'relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-[0_10px_30px_rgba(32,48,68,0.06)] transition-all duration-200 hover:bg-surface-container active:scale-95'

  const panelClassName = isDarkVariant
    ? 'absolute right-0 top-14 z-50 w-[20rem] overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#162033] text-white shadow-[0_24px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl'
    : 'absolute right-0 top-14 z-50 w-[20rem] overflow-hidden rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-lowest text-on-surface shadow-[0_24px_48px_rgba(32,48,68,0.14)]'

  const mutedTextClassName = isDarkVariant ? 'text-white/65' : 'text-on-surface-variant'
  const titleClassName = isDarkVariant ? 'text-white' : 'text-on-surface'
  const badgeClassName = isDarkVariant
    ? 'rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white'
    : 'rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary'
  const cardClassName = isDarkVariant ? 'rounded-2xl bg-white/5 p-3' : 'rounded-2xl bg-surface-container-low p-3'
  const ringClassName = isDarkVariant ? 'ring-2 ring-[#162033]' : 'ring-2 ring-white/80'

  return (
    <div className="relative">
      <button type="button" onClick={handleToggle} className={buttonClassName} aria-label="Notifications">
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ${ringClassName}`} />
        )}
      </button>

      {isOpen && (
        <div className={panelClassName}>
          <div className={`flex items-center justify-between border-b px-4 py-3 ${isDarkVariant ? 'border-white/10' : 'border-outline-variant/20'}`}>
            <div>
              <p className={`text-[11px] uppercase tracking-[0.2em] ${mutedTextClassName}`}>Notifications</p>
              <h3 className={`font-headline text-base font-bold ${titleClassName}`}>
                {audience === 'admin' ? 'Admin updates' : 'Your orders'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={badgeClassName}>{notifications.length}</span>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={notifications.length === 0 || isClearing}
                className={`text-xs font-semibold ${isDarkVariant ? 'text-white/80 hover:text-white' : 'text-primary hover:text-primary/80'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isClearing ? 'Clearing…' : 'Clear'}
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto px-4 py-3">
            {isLoading && notifications.length === 0 ? (
              <p className={`text-sm ${mutedTextClassName}`}>Loading notifications...</p>
            ) : errorMessage && notifications.length === 0 ? (
              <p className="text-sm text-amber-300">{errorMessage}</p>
            ) : notifications.length === 0 ? (
              <p className={`text-sm ${mutedTextClassName}`}>No notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <div key={item.id} className={cardClassName}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`font-semibold ${titleClassName}`}>{item.title}</p>
                        <p className={`mt-1 text-sm ${mutedTextClassName}`}>{item.message}</p>
                      </div>
                      {!item.is_read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className={`mt-2 text-xs ${isDarkVariant ? 'text-white/45' : 'text-on-surface-variant'}`}>
                      {formatNotificationTime(item.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
