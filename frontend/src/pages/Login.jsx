import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Smart Inventory</h1>
        <p className="sub">Sign in to the management system</p>
        {error && <div className="error">{error}</div>}
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ height: 18 }} />
        <button className="btn full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
          Demo: admin / admin123 &nbsp;•&nbsp; staff / staff123
        </p>
      </form>
    </div>
  )
}
