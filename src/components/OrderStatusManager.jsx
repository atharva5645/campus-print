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
    <div className="flex flex-col gap-2.5 min-w-[230px]">
      <select
        value={status}
        onChange={(event) => onStatusChange?.(event.target.value)}
        className="w-full rounded-full border border-outline-variant bg-surface px-4 py-3 font-semibold text-on-surface transition-all hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98]"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="flex cursor-pointer items-center gap-2 text-[0.92rem] text-on-surface-variant">
        <input
          type="checkbox"
          checked={collected}
          onChange={(event) => onCollectedChange?.(event.target.checked)}
          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface transition-colors accent-primary"
        />
        Mark collected
      </label>
      <div className="text-[0.82rem] text-on-surface-variant/80">{formatTimestamp(collectedAt)}</div>
    </div>
  )
}

export default OrderStatusManager

