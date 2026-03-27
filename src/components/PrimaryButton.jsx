import React from 'react'

function PrimaryButton({
  children,
  className = '',
  variant = 'solid',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-95'

  const solidStyle = {
    background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dim))',
    color: '#fff',
    borderRadius: 'var(--radius-pill)',
    padding: '0.75rem 1.5rem',
    border: 'none',
    boxShadow: '0 4px 16px rgba(74, 64, 224, 0.25)',
  }

  const glassStyle = {
    background: 'color-mix(in srgb, var(--clr-primary) 10%, transparent)',
    color: 'var(--clr-primary)',
    borderRadius: 'var(--radius-pill)',
    padding: '0.75rem 1.5rem',
    border: 'none',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  }

  const outlineStyle = {
    background: 'var(--clr-surface-container-lowest)',
    color: 'var(--clr-on-surface)',
    borderRadius: 'var(--radius-pill)',
    padding: '0.75rem 1.5rem',
    border: '1px solid var(--clr-outline-variant)',
  }

  const styleMap = {
    solid: solidStyle,
    glass: glassStyle,
    outline: outlineStyle,
  }

  return (
    <button
      className={`${base} ${className}`}
      style={styleMap[variant] || solidStyle}
      {...props}
    >
      {children}
    </button>
  )
}

export default PrimaryButton
