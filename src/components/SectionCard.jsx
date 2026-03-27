import React from 'react'

function SectionCard({ children, className = '', style = {} }) {
  return (
    <section
      className={`bg-surface-container-lowest dark:bg-surface-container shadow-[0_4px_16px_rgba(32,48,68,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] ${className}`}
      style={{
        borderRadius: 'var(--radius-card)',
        padding: '1.25rem',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

export default SectionCard
