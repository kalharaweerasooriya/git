import { useEffect, useState } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import '../components/chartSetup'
import api from '../api/client'

export default function Reports() {
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [stock, setStock] = useState([])
  const [tab, setTab] = useState('daily')

  useEffect(() => {
    api.get('/api/reports/daily?days=30').then((r) => setDaily(r.data)).catch(() => {})
    api.get('/api/reports/monthly').then((r) => setMonthly(r.data)).catch(() => {})
    api.get('/api/reports/stock').then((r) => setStock(r.data)).catch(() => {})
  }, [])

  const dailyChart = {
    labels: daily.map((d) => d.date),
    datasets: [{
      label: 'Daily Sales ($)', data: daily.map((d) => d.total),
      borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.12)', fill: true, tension: 0.3, pointRadius: 0,
    }],
  }

  // Revenue Analysis Chart
  const monthlyChart = {
    labels: monthly.map((m) => m.month),
    datasets: [{
      label: 'Monthly Revenue ($)', data: monthly.map((m) => m.total),
      backgroundColor: '#7c3aed',
    }],
  }

  return (
    <div>
      <h2 className="page-title">Reports</h2>

      <div className="toolbar">
        <button className={`btn ${tab === 'daily' ? '' : 'secondary'}`} onClick={() => setTab('daily')}>Daily Sales</button>
        <button className={`btn ${tab === 'monthly' ? '' : 'secondary'}`} onClick={() => setTab('monthly')}>Monthly Revenue</button>
        <button className={`btn ${tab === 'stock' ? '' : 'secondary'}`} onClick={() => setTab('stock')}>Stock Report</button>
      </div>

      {tab === 'daily' && (
        <>
          <div className="card mb"><h3>Daily Sales Report (last 30 days)</h3>
            <Line data={dailyChart} options={{ plugins: { legend: { display: false } } }} /></div>
          <div className="card"><h3>Details</h3>
            <table><thead><tr><th>Date</th><th>Transactions</th><th>Revenue</th></tr></thead>
              <tbody>{daily.map((d, i) => (
                <tr key={i}><td>{d.date}</td><td>{d.transactions}</td><td>${Number(d.total).toFixed(2)}</td></tr>
              ))}</tbody></table>
          </div>
        </>
      )}

      {tab === 'monthly' && (
        <>
          <div className="card mb"><h3>Revenue Analysis (monthly)</h3>
            <Bar data={monthlyChart} options={{ plugins: { legend: { display: false } } }} /></div>
          <div className="card"><h3>Monthly Sales Report</h3>
            <table><thead><tr><th>Month</th><th>Transactions</th><th>Revenue</th></tr></thead>
              <tbody>{monthly.map((m, i) => (
                <tr key={i}><td>{m.month}</td><td>{m.transactions}</td><td>${Number(m.total).toFixed(2)}</td></tr>
              ))}</tbody></table>
          </div>
        </>
      )}

      {tab === 'stock' && (
        <div className="card"><h3>Product Stock Report</h3>
          <table><thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Reorder</th><th>Max</th><th>Status</th></tr></thead>
            <tbody>{stock.map((s) => (
              <tr key={s.productId}>
                <td>{s.sku}</td><td>{s.name}</td><td>{s.quantity}</td>
                <td>{s.reorderLevel}</td><td>{s.maxStock}</td>
                <td><span className={`badge ${s.status === 'LOW' ? 'low' : s.status === 'OVER' ? 'over' : 'ok'}`}>{s.status}</span></td>
              </tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  )
}
