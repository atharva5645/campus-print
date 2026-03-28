import React from 'react'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'printing_in_progress', label: 'Printing in Progress' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'distributed', label: 'Distributed' },
]

function formatTimestamp(value) {
  if (!value) return 'Not collected yet'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Not collected yet'
  }

  return parsed.toLocaleString()
}

function OrderStatusManager({
  status,
  collected = false,
  collectedAt = null,
  readOnly = false,
  onStatusChange,
  onCollectedChange,
}) {
  if (readOnly) {
    const activeStatus = STATUS_OPTIONS.find((item) => item.value === status)?.label || 'Pending'

    return (
      <div className="space-y-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface">
        <div className="font-semibold text-on-surface">{activeStatus}</div>
        <div className="text-on-surface-variant">Collected: {collected ? 'Yes' : 'No'}</div>
        <div className="text-on-surface-variant">{formatTimestamp(collectedAt)}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '0.6rem', minWidth: '230px' }}>
      <select
        value={status}
        onChange={(event) => onStatusChange?.(event.target.value)}
        style={{
          borderRadius: '999px',
          padding: '0.75rem 1rem',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: '#fff',
          color: '#162033',
          fontWeight: 600,
        }}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.92rem', color: '#526076' }}>
        <input
          type="checkbox"
          checked={collected}
          onChange={(event) => onCollectedChange?.(event.target.checked)}
        />
        Mark collected
      </label>
      <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{formatTimestamp(collectedAt)}</div>
    </div>
  )
}

export default OrderStatusManager

