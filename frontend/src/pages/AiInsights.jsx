import { useEffect, useState } from 'react'
import { Doughnut, Bar } from 'react-chartjs-2'
import '../components/chartSetup'
import api from '../api/client'

function Stat({ value, label, color }) {
  return (
    <div className="card stat">
      <div className="value" style={{ color }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export default function AiInsights() {
  const [insights, setInsights] = useState(null)
  const [movement, setMovement] = useState(null)
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/ai/insights').then((r) => setInsights(r.data)).catch(() => {}),
      api.get('/api/ai/movement').then((r) => setMovement(r.data)).catch(() => {}),
      api.get('/api/ai/alerts').then((r) => setAlerts(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const offline = insights && insights.available === false
  const stats = insights?.stats || {}

  // Product Performance Chart — fast movers by units
  const fast = movement?.topFast || []
  const perfChart = {
    labels: fast.map((p) => p.name),
    datasets: [{ label: 'Units sold', data: fast.map((p) => p.unitsSold), backgroundColor: '#16a34a' }],
  }

  const movementChart = {
    labels: ['Fast', 'Slow', 'Dead'],
    datasets: [{
      data: [movement?.counts?.FAST || 0, movement?.counts?.SLOW || 0, movement?.counts?.DEAD || 0],
      backgroundColor: ['#16a34a', '#d97706', '#94a3b8'],
    }],
  }

  if (loading) return <div className="spinner">Loading AI insights…</div>

  return (
    <div>
      <h2 className="page-title">AI Insights Dashboard</h2>

      {offline && (
        <div className="card mb" style={{ borderLeft: '4px solid var(--red)' }}>
          <strong>AI service offline.</strong> Start the Flask service: <code>cd ai-service && python app.py</code>
        </div>
      )}

      <div className="grid cols-4 mb">
        <Stat value={stats.urgentRestock ?? '—'} label="Urgent Restocks" color="var(--red)" />
        <Stat value={stats.fastMovers ?? '—'} label="Fast Movers" color="var(--green)" />
        <Stat value={stats.deadStock ?? '—'} label="Dead Stock" color="var(--muted)" />
        <Stat value={stats.activeAlerts ?? '—'} label="Active Alerts" color="var(--amber)" />
      </div>

      <div className="card mb">
        <h3>🤖 AI-Generated Business Insights</h3>
        {(!insights?.headlines || insights.headlines.length === 0) && !offline &&
          <p className="muted">No critical insights right now.</p>}
        {insights?.headlines?.map((h, i) => (
          <div key={i} className="insight-item">{h}</div>
        ))}
      </div>

      <div className="grid cols-2 mb">
        <div className="card">
          <h3>Product Movement Distribution</h3>
          <Doughnut data={movementChart} />
        </div>
        <div className="card">
          <h3>Product Performance (top fast movers)</h3>
          <Bar data={perfChart} options={{ plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="card">
        <h3>Intelligent Alerts ({alerts?.total ?? 0})</h3>
        <table>
          <thead><tr><th>Type</th><th>Product</th><th>Message</th><th>Severity</th></tr></thead>
          <tbody>
            {alerts?.alerts?.map((a, i) => (
              <tr key={i}>
                <td>{a.type}</td><td>{a.product}</td><td>{a.message}</td>
                <td><span className={`badge ${a.severity}`}>{a.severity}</span></td>
              </tr>
            ))}
            {(!alerts?.alerts || alerts.alerts.length === 0) &&
              <tr><td colSpan="4" className="muted">No alerts.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
