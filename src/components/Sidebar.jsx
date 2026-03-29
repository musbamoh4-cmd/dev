import { NavLink } from 'react-router-dom'
import {
  BrandIcon,
  IconGrid,
  IconInventory,
  IconInbound,
  IconOutbound,
  IconReports,
  IconUser,
  IconSignOut,
} from './icons'

const navItems = [
  { label: 'Dashboard', icon: IconGrid, path: '/', roles: ['Admin', 'Staff'] },
  { label: 'Inventory', icon: IconInventory, path: '/inventory', roles: ['Admin', 'Staff'] },
  { label: 'Inbound (GRN)', icon: IconInbound, path: '/inbound', roles: ['Admin', 'Staff'] },
  { label: 'Outbound (STV)', icon: IconOutbound, path: '/outbound', roles: ['Admin', 'Staff'] },
  { label: 'Financial Reports', icon: IconReports, path: '/reports', roles: ['Admin'] },
  { label: 'User Management', icon: IconUser, path: '/users', roles: ['Admin'] },
]

function NavItem({ label, icon: Icon, path }) {
  return (
    <NavLink
      to={path}
      end={path === '/'}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          {Icon ? (
            <span className="nav-ico">
              <Icon />
            </span>
          ) : null}
          <span className="nav-label">{label}</span>
          {isActive ? <span className="nav-arrow">›</span> : null}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ onSignOut, user, collapsed, onToggle }) {
  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-icon">
          <BrandIcon />
        </div>
        <div>
          <div className="brand-title">AutoSpare Hub</div>
          <div className="brand-sub">Management Suite</div>
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggle}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="nav">
        {navItems
          .filter((item) => item.roles?.includes(user?.role || 'Admin'))
          .map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        <button
          className="nav-item nav-signout"
          type="button"
          onClick={handleSignOut}
          aria-label="Sign Out"
        >
          <span className="nav-ico">
            <IconSignOut />
          </span>
          <span className="nav-label">Sign Out</span>
        </button>
      </nav>

      <div className="support">
        <div className="support-title">Contact & Support</div>
        <div className="support-item">autosparehub.com</div>
        <div className="support-item">@AutoSpareHub</div>
      </div>

      <div className="user-card">
        <div className="user-name">{user?.name || 'admin'}</div>
        <div className="user-role">{user?.role || 'Admin'}</div>
      </div>

      <button
        className="signout"
        type="button"
        onClick={handleSignOut}
        aria-label="Sign Out"
      >
        <span className="nav-ico">
          <IconSignOut />
        </span>
        <span className="signout-label">Sign Out</span>
      </button>
    </aside>
  )
}
