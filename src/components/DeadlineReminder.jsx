import React, { useEffect, useMemo, useState } from 'react'

function getCountdown(deadline) {
  if (!deadline) {
    return { expired: false, label: 'No deadline set' }
  }

  const deadlineTime = new Date(deadline).getTime()
  if (Number.isNaN(deadlineTime)) {
    return { expired: false, label: 'No deadline set' }
  }

  const remainingMs = deadlineTime - Date.now()
  if (remainingMs <= 0) {
    return { expired: true, label: 'Expired' }
  }

  const totalMinutes = Math.ceil(remainingMs / 60000)
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return {
      expired: false,
      label: `${hours}h ${minutes}m left`,
    }
  }

  return {
    expired: false,
    label: `${totalMinutes} min left`,
  }
}

function formatDeadline(deadline) {
  const parsed = new Date(deadline)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DeadlineReminder({ deadline, isPaid = false, className = '' }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!deadline) return undefined

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [deadline])

  const countdown = useMemo(() => getCountdown(deadline), [deadline, now])
  const deadlineLabel = useMemo(() => formatDeadline(deadline), [deadline])

  if (!deadline) {
    return null
  }

  const toneClasses = countdown.expired
    ? 'bg-error-container/20 text-error'
    : isPaid
    ? 'bg-tertiary-container/30 text-on-tertiary-container'
    : 'bg-amber-500/10 text-amber-700'

  return (
    <div className={`rounded-2xl px-3 py-2 text-sm ${toneClasses} ${className}`.trim()}>
      <p className="font-semibold">{countdown.label}</p>
      {!countdown.expired && !isPaid && <p>Upload payment before expiry</p>}
      {countdown.expired && <p>Expired</p>}
      {deadlineLabel && <p className="text-xs opacity-80">Expires at {deadlineLabel}</p>}
    </div>
  )
}

export default DeadlineReminder
