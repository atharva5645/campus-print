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
    <nav className="glass-surface sticky bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-primary to-primary-dim text-white shadow-[0_6px_20px_rgba(74,64,224,0.28)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
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
