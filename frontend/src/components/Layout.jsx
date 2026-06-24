import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/inventory', label: 'Inventory', icon: '🏬' },
  { to: '/sales', label: 'Sales', icon: '🧾' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/ai-insights', label: 'AI Insights', icon: '🤖' },
  { to: '/analytics', label: 'Prediction & Analytics', icon: '🔮' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">Smart<span>Inventory</span></div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div />
          <div className="user">
            <span>{user?.fullName} ({user?.role})</span>
            <button className="btn small secondary" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
