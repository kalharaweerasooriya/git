import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const empty = {
  sku: '', name: '', categoryId: '', unitPrice: '', costPrice: '',
  quantity: 0, reorderLevel: 10, maxStock: 200, expiryDate: '',
}

export default function Products() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const load = (q = '') => {
    api.get('/api/products', { params: q ? { search: q } : {} })
      .then((r) => setProducts(r.data)).catch(() => {})
  }

  useEffect(() => {
    load()
    api.get('/api/categories').then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setShowModal(true) }
  const openEdit = (p) => {
    setEditing(p.id)
    setForm({
      sku: p.sku, name: p.name, categoryId: p.category?.id || '',
      unitPrice: p.unitPrice, costPrice: p.costPrice, quantity: p.quantity,
      reorderLevel: p.reorderLevel, maxStock: p.maxStock, expiryDate: p.expiryDate || '',
    })
    setError(''); setShowModal(true)
  }

  const save = async () => {
    setError('')
    const payload = { ...form, categoryId: form.categoryId || null, expiryDate: form.expiryDate || null }
    try {
      if (editing) await api.put(`/api/products/${editing}`, payload)
      else await api.post('/api/products', payload)
      setShowModal(false)
      load(search)
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try { await api.delete(`/api/products/${id}`); load(search) }
    catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div>
      <div className="flex between mb">
        <h2 className="page-title" style={{ margin: 0 }}>Product Management</h2>
        {isAdmin && <button className="btn" onClick={openCreate}>+ Add Product</button>}
      </div>

      <div className="toolbar">
        <input placeholder="Search by name or SKU…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(search)} />
        <button className="btn secondary" onClick={() => load(search)}>Search</button>
        <button className="btn secondary" onClick={() => { setSearch(''); load('') }}>Reset</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>SKU</th><th>Name</th><th>Category</th><th>Price</th>
              <th>Qty</th><th>Reorder</th><th>Status</th>{isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const status = p.quantity <= p.reorderLevel ? 'low'
                : p.quantity >= p.maxStock ? 'over' : 'ok'
              return (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category?.name || '—'}</td>
                  <td>${Number(p.unitPrice).toFixed(2)}</td>
                  <td>{p.quantity}</td>
                  <td>{p.reorderLevel}</td>
                  <td><span className={`badge ${status}`}>{status.toUpperCase()}</span></td>
                  {isAdmin && (
                    <td className="flex">
                      <button className="btn small secondary" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn small danger" onClick={() => remove(p.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              )
            })}
            {products.length === 0 && <tr><td colSpan="8" className="muted">No products found.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{editing ? 'Edit' : 'Add'} Product</h3>
            {error && <div className="error">{error}</div>}
            <div className="grid cols-2">
              <div><label>SKU</label><input value={form.sku} onChange={set('sku')} /></div>
              <div><label>Name</label><input value={form.name} onChange={set('name')} /></div>
            </div>
            <label>Category</label>
            <select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">— none —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="grid cols-2">
              <div><label>Unit Price</label><input type="number" step="0.01" value={form.unitPrice} onChange={set('unitPrice')} /></div>
              <div><label>Cost Price</label><input type="number" step="0.01" value={form.costPrice} onChange={set('costPrice')} /></div>
            </div>
            <div className="grid cols-3">
              <div><label>Quantity</label><input type="number" value={form.quantity} onChange={set('quantity')} /></div>
              <div><label>Reorder Level</label><input type="number" value={form.reorderLevel} onChange={set('reorderLevel')} /></div>
              <div><label>Max Stock</label><input type="number" value={form.maxStock} onChange={set('maxStock')} /></div>
            </div>
            <label>Expiry Date</label>
            <input type="date" value={form.expiryDate || ''} onChange={set('expiryDate')} />
            <div className="flex" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <button className="btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
