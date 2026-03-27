import React from 'react'

function MobileShell({ children, bottomNav }) {
  return (
    <div className="min-h-screen px-5 py-6" style={{ background: 'transparent' }}>
      <div
        className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col overflow-hidden bg-surface-container-lowest/70 dark:bg-surface-container/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(32,48,68,0.06)]"
        style={{
          borderRadius: 'var(--radius-container)',
        }}
      >
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">{children}</div>
        {bottomNav}
      </div>
    </div>
  )
}

export default MobileShell
