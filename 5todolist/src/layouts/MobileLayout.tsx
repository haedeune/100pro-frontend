import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  ArrowUpCircle,
  CalendarDays,
  House,
  UserCircle2,
} from 'lucide-react'

const navItems = [
  { to: '/home', label: '투두', icon: House },
  { to: '/schedule', label: '캘린더', icon: CalendarDays },
  { to: '/compose', label: '등록', icon: ArrowUpCircle, isCenter: true },
  { to: '/archive', label: '보관함', icon: Archive },
  { to: '/mypage', label: '마이', icon: UserCircle2 },
]

function NavItemIcon({ Icon, center }: { Icon: LucideIcon; center?: boolean }) {
  return <Icon size={center ? 26 : 19} strokeWidth={center ? 2.2 : 1.9} />
}

export function MobileLayout() {
  const { pathname } = useLocation()
  const isSplash = pathname === '/splash'
  const isLogin = pathname === '/login'

  return (
    <div className="mobile-shell">
      <main className={`mobile-main${isSplash ? ' splash-main' : ''}${isLogin ? ' login-main' : ''}`}>
        <Outlet />
      </main>
      {isSplash ? null : (
        <nav className="mobile-nav" aria-label="하단 네비게이션">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={`${item.label} 화면으로 이동`}
              className={({ isActive }) =>
                `mobile-nav-item${item.isCenter ? ' mobile-nav-item-center' : ''}${isActive ? ' is-active' : ''}`
              }
            >
              <span className="mobile-nav-icon">
                <NavItemIcon Icon={item.icon} center={item.isCenter} />
              </span>
              <span className="mobile-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
