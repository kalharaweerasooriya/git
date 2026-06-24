import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import '../components/chartSetup'
import api from '../api/client'

export default function Analytics() {
  const [trend, setTrend] = useState(null)
  const [restock, setRestock] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/ai/trend').then((r) => setTrend(r.data)).catch(() => {}),
      api.get('/api/ai/restock').then((r) => setRestock(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner">Running AI forecasts…</div>

  const offline = trend && trend.available === false

  // AI Prediction Chart: historical daily revenue + 7-day forecast
  const histLabels = (trend?.daily || []).map((d) => d.day)
  const fcLabels = (trend?.forecast || []).map((f) => f.day)
  const labels = [...histLabels, ...fcLabels]
  const histData = (trend?.daily || []).map((d) => d.revenue)
  const fcSeries = new Array(histData.length).fill(null)
    .concat((trend?.forecast || []).map((f) => f.predictedRevenue))
  // connect the forecast line to the last historical point
  if (histData.length > 0) fcSeries[histData.length - 1] = histData[histData.length - 1]

  const predictionChart = {
    labels,
    datasets: [
      {
        label: 'Actual Revenue',
        data: [...histData, ...new Array(fcLabels.length).fill(null)],
        borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)',
        fill: true, tension: 0.3, pointRadius: 0,
      },
      {
        label: 'AI Forecast (next 7 days)',
        data: fcSeries,
        borderColor: '#dc2626', borderDash: [6, 4], tension: 0.3, pointRadius: 0,
      },
    ],
  }

  const urgency = (u) => u === 'HIGH' ? 'low' : u === 'MEDIUM' ? 'over' : 'ok'

  return (
    <div>
      <h2 className="page-title">Prediction &amp; Analytics</h2>

      {offline && (
        <div className="card mb" style={{ borderLeft: '4px solid var(--red)' }}>
          <strong>AI service offline.</strong> Start it with <code>cd ai-service &amp;&amp; python app.py</code>
        </div>
      )}

      {trend?.messages?.length > 0 && (
        <div className="card mb">
          <h3>📈 Sales Trend Analysis</h3>
          {trend.messages.map((m, i) => <div key={i} className="insight-item">{m}</div>)}
        </div>
      )}

      <div className="card mb">
        <h3>AI Sales Forecast (Prediction Chart)</h3>
        <Line data={predictionChart} />
      </div>

      <div className="card">
        <h3>🔮 Smart Restock Predictions</h3>
        <table>
          <thead>
            <tr><th>Product</th><th>Stock</th><th>Avg Daily Demand</th>
              <th>Days to Stockout</th><th>Recommended Restock</th><th>Urgency</th></tr>
          </thead>
          <tbody>
            {restock?.predictions?.slice(0, 30).map((p) => (
              <tr key={p.productId}>
                <td>{p.name}</td>
                <td>{p.currentStock}</td>
                <td>{p.avgDailyDemand}</td>
                <td>{p.daysToStockout ?? '—'}</td>
                <td>{p.recommendedRestock}</td>
                <td><span className={`badge ${urgency(p.urgency)}`}>{p.urgency}</span></td>
              </tr>
            ))}
            {(!restock?.predictions) && <tr><td colSpan="6" className="muted">No prediction data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
