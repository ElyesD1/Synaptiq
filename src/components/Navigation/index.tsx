import { NavLink, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, TrendingUp } from 'lucide-react'
import { cn } from '../../utils/cn'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/games', icon: LayoutGrid, label: 'Games' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
]

export default function Navigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl border-t border-gray-100 z-50">
      <div className="flex items-center justify-around h-16 pb-safe px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all duration-200',
                isActive ? 'text-gray-900' : 'text-gray-400',
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  isActive ? 'bg-gray-900' : 'bg-transparent',
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-white' : 'text-gray-400'}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium tracking-wide',
                  isActive ? 'text-gray-900 font-semibold' : 'text-gray-400',
                )}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
