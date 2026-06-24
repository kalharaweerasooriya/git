import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import '../components/chartSetup'
import api from '../api/client'

function Stat({ icon, value, label }) {
  return (
    <div className="card stat">
      <div className="icon">{icon}</div>
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [performance, setPerformance] = useState([])
  const [alerts, setAlerts] = useState(null)

  useEffect(() => {
    api.get('/api/reports/summary').then((r) => setSummary(r.data)).catch(() => {})
    api.get('/api/reports/daily?days=30').then((r) => setDaily(r.data)).catch(() => {})
    api.get('/api/reports/product-performance').then((r) => setPerformance(r.data)).catch(() => {})
    api.get('/api/ai/alerts').then((r) => setAlerts(r.data)).catch(() => {})
  }, [])

  const money = (v) => '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const trendData = {
    labels: daily.map((d) => d.date),
    datasets: [{
      label: 'Daily Revenue',
      data: daily.map((d) => d.total),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,.12)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }],
  }

  const topProducts = performance.slice(0, 8)
  const perfData = {
    labels: topProducts.map((p) => p.name),
    datasets: [{
      label: 'Units Sold',
      data: topProducts.map((p) => p.unitsSold),
      backgroundColor: '#16a34a',
    }],
  }

  return (
    <div>
      <h2 className="page-title">Dashboard</h2>

      <div className="grid cols-4 mb">
        <Stat icon="📦" value={summary?.totalProducts ?? '—'} label="Total Products" />
        <Stat icon="⚠️" value={summary?.lowStockCount ?? '—'} label="Low Stock Items" />
        <Stat icon="💰" value={money(summary?.todayRevenue)} label="Today's Revenue" />
        <Stat icon="🧾" value={summary?.todayTransactions ?? '—'} label="Today's Sales" />
      </div>

      <div className="grid cols-2 mb">
        <div className="card">
          <h3>Sales Trend (last 30 days)</h3>
          <Line data={trendData} options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <h3>Top Products (units sold)</h3>
          <Bar data={perfData} options={{ plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="card">
        <h3>Active Alerts {alerts?.total != null && `(${alerts.total})`}</h3>
        {!alerts?.available && <p className="muted">AI service offline — start the Flask service to see alerts.</p>}
        {alerts?.alerts?.slice(0, 6).map((a, i) => (
          <div key={i} className="flex between" style={{ padding: '8px 0', borderBottom: '1px solid #eef2f7' }}>
            <span>{a.message}</span>
            <span className={`badge ${a.severity}`}>{a.type}</span>
          </div>
        ))}
        {alerts?.available && alerts.total === 0 && <p className="muted">No active alerts. 🎉</p>}
      </div>
    </div>
  )
}
