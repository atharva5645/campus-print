import React from 'react'

function SectionCard({ children, className = '', style = {} }) {
  return (
    <section
      className={className}
      style={{
        borderRadius: 'var(--radius-card)',
        background: 'var(--surface-container-lowest)',
        boxShadow: 'var(--shadow-subtle)',
        padding: '1.25rem',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

export default SectionCard
