import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [payment, setPayment] = useState('CASH')
  const [recent, setRecent] = useState([])
  const [lastInvoice, setLastInvoice] = useState(null)
  const [error, setError] = useState('')
  const [selProduct, setSelProduct] = useState('')
  const [qty, setQty] = useState(1)

  const load = () => {
    api.get('/api/products').then((r) => setProducts(r.data)).catch(() => {})
    api.get('/api/sales').then((r) => setRecent(r.data)).catch(() => {})
  }
  useEffect(load, [])

  const addToCart = () => {
    if (!selProduct) return
    const p = products.find((x) => x.id === Number(selProduct))
    if (!p) return
    const existing = cart.find((c) => c.productId === p.id)
    if (existing) {
      setCart(cart.map((c) => c.productId === p.id ? { ...c, quantity: c.quantity + Number(qty) } : c))
    } else {
      setCart([...cart, { productId: p.id, name: p.name, unitPrice: Number(p.unitPrice), quantity: Number(qty) }])
    }
    setSelProduct(''); setQty(1)
  }

  const removeItem = (id) => setCart(cart.filter((c) => c.productId !== id))
  const total = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0)

  const checkout = async () => {
    setError('')
    if (cart.length === 0) { setError('Add at least one item.'); return }
    try {
      const { data } = await api.post('/api/sales', {
        paymentMethod: payment,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
      })
      setLastInvoice(data)
      setCart([])
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Checkout failed')
    }
  }

  return (
    <div>
      <h2 className="page-title">Sales Management</h2>
      <div className="grid cols-2 mb">
        <div className="card">
          <h3>New Sale</h3>
          {error && <div className="error">{error}</div>}
          <div className="flex" style={{ alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label>Product</label>
              <select value={selProduct} onChange={(e) => setSelProduct(e.target.value)}>
                <option value="">— select —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                    {p.name} (${Number(p.unitPrice).toFixed(2)}) — stock {p.quantity}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Qty</label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <button className="btn" onClick={addToCart}>Add</button>
          </div>

          <table style={{ marginTop: 16 }}>
            <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {cart.map((c) => (
                <tr key={c.productId}>
                  <td>{c.name}</td>
                  <td>${c.unitPrice.toFixed(2)}</td>
                  <td>{c.quantity}</td>
                  <td>${(c.unitPrice * c.quantity).toFixed(2)}</td>
                  <td><button className="btn small danger" onClick={() => removeItem(c.productId)}>×</button></td>
                </tr>
              ))}
              {cart.length === 0 && <tr><td colSpan="5" className="muted">Cart is empty.</td></tr>}
            </tbody>
          </table>

          <div className="flex between" style={{ marginTop: 14 }}>
            <div>
              <label>Payment</label>
              <select value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option>CASH</option><option>CARD</option><option>ONLINE</option>
              </select>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="muted">Total</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>${total.toFixed(2)}</div>
            </div>
          </div>
          <button className="btn full" style={{ marginTop: 14 }} onClick={checkout}>
            Complete Sale & Generate Invoice
          </button>
        </div>

        <div className="card">
          <h3>Invoice</h3>
          {!lastInvoice && <p className="muted">Complete a sale to see the invoice here.</p>}
          {lastInvoice && (
            <div>
              <div className="flex between"><strong>{lastInvoice.invoiceNo}</strong>
                <span className="badge ok">{lastInvoice.paymentMethod}</span></div>
              <p className="muted" style={{ margin: '4px 0 12px' }}>
                {new Date(lastInvoice.saleDate).toLocaleString()}</p>
              <table>
                <thead><tr><th>Product #</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                <tbody>
                  {lastInvoice.items?.map((it) => (
                    <tr key={it.id}>
                      <td>{it.productId}</td><td>{it.quantity}</td>
                      <td>${Number(it.unitPrice).toFixed(2)}</td>
                      <td>${Number(it.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: 10, fontSize: 18, fontWeight: 700 }}>
                Grand Total: ${Number(lastInvoice.totalAmount).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Recent Sales</h3>
        <table>
          <thead><tr><th>Invoice</th><th>Date</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead>
          <tbody>
            {recent.map((s) => (
              <tr key={s.id}>
                <td>{s.invoiceNo}</td>
                <td>{new Date(s.saleDate).toLocaleString()}</td>
                <td>{s.items?.length ?? '—'}</td>
                <td>{s.paymentMethod}</td>
                <td>${Number(s.totalAmount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
