import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [modal, setModal] = useState(null) // product being adjusted
  const [form, setForm] = useState({ type: 'IN', changeQty: 0, reason: '' })
  const [error, setError] = useState('')

  const load = () => {
    api.get('/api/products').then((r) => setProducts(r.data)).catch(() => {})
    api.get('/api/inventory/low-stock').then((r) => setLowStock(r.data)).catch(() => {})
  }
  useEffect(load, [])

  const openAdjust = (p) => { setModal(p); setForm({ type: 'IN', changeQty: 0, reason: '' }); setError('') }

  const submit = async () => {
    setError('')
    try {
      await api.post(`/api/inventory/${modal.id}/adjust`, {
        type: form.type,
        changeQty: Number(form.changeQty),
        reason: form.reason,
      })
      setModal(null)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Adjustment failed')
    }
  }

  return (
    <div>
      <h2 className="page-title">Inventory Management</h2>

      {lowStock.length > 0 && (
        <div className="card mb" style={{ borderLeft: '4px solid var(--red)' }}>
          <h3 style={{ color: 'var(--red)' }}>⚠️ Low Stock Alerts ({lowStock.length})</h3>
          <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
            {lowStock.map((p) => (
              <span key={p.id} className="badge low">{p.name}: {p.quantity}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Current Stock</h3>
        <table>
          <thead>
            <tr><th>SKU</th><th>Product</th><th>On Hand</th><th>Reorder</th><th>Max</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const status = p.quantity <= p.reorderLevel ? 'low'
                : p.quantity >= p.maxStock ? 'over' : 'ok'
              return (
                <tr key={p.id}>
                  <td>{p.sku}</td><td>{p.name}</td><td>{p.quantity}</td>
                  <td>{p.reorderLevel}</td><td>{p.maxStock}</td>
                  <td><span className={`badge ${status}`}>{status.toUpperCase()}</span></td>
                  <td><button className="btn small" onClick={() => openAdjust(p)}>Adjust</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18 }}>Adjust Stock — {modal.name}</h3>
            <p className="muted">Current on hand: {modal.quantity}</p>
            {error && <div className="error">{error}</div>}
            <label>Movement Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="IN">Stock In (add)</option>
              <option value="OUT">Stock Out (remove)</option>
              <option value="ADJUST">Adjustment</option>
            </select>
            <label>Quantity</label>
            <input type="number" value={form.changeQty}
              onChange={(e) => setForm({ ...form, changeQty: e.target.value })} />
            <label>Reason</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g. Supplier delivery" />
            <div className="flex" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn" onClick={submit}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
