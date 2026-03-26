import React from 'react'

function MobileShell({ children, bottomNav }) {
  return (
    <div className="min-h-screen px-5 py-6" style={{ background: 'transparent' }}>
      <div
        className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col overflow-hidden"
        style={{
          borderRadius: 'var(--radius-container)',
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-ambient)',
        }}
      >
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">{children}</div>
        {bottomNav}
      </div>
    </div>
  )
}

export default MobileShell
