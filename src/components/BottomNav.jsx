import React from 'react'
import { Home, Printer, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Services', to: '/order', icon: Printer },
  { label: 'Cart', to: '/cart', icon: ShoppingCart },
]

function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-20 px-3 py-3"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition-all duration-200"
              style={({ isActive }) =>
                isActive
                  ? {
                      background:
                        'linear-gradient(135deg, var(--primary), var(--primary-container))',
                      color: 'var(--on-primary)',
                      boxShadow: '0 6px 20px rgba(74, 64, 224, 0.28)',
                    }
                  : {
                      color: 'var(--on-surface-variant)',
                      background: 'transparent',
                    }
              }
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
