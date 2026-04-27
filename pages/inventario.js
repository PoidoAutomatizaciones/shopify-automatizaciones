import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{
        background: '#111', border: '1px solid #2a2a2a', borderRadius: 16,
        padding: 32, width: 420, maxWidth: '90vw'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#555',
            cursor: 'pointer', fontSize: 20, lineHeight: 1
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        {label}
      </label>
      <input {...props} style={{
        width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
        borderRadius: 8, padding: '10px 14px', color: '#e0e0e0',
        fontSize: 14, fontFamily: 'JetBrains Mono', outline: 'none',
        boxSizing: 'border-box'
      }} />
    </div>
  )
}

function Btn({ children, onClick, variant = 'default', small, disabled }) {
  const styles = {
    default: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888' },
    primary: { background: '#f59e0b', border: '1px solid #f59e0b', color: '#000', fontWeight: 700 },
    green: { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' },
    red: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' },
    danger: { background: 'transparent', border: '1px solid #2a2a2a', color: '#555' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      borderRadius: 8, padding: small ? '5px 12px' : '9px 18px',
      cursor: disabled ? 'not-allowed' : 'pointer', fontSize: small ? 12 : 13,
      fontFamily: 'Syne', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      whiteSpace: 'nowrap'
    }}>
      {children}
    </button>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav({ active }) {
  return (
    <header style={{
      borderBottom: '1px solid #1a1a1a', padding: '0 40px', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)',
      backdropFilter: 'blur(12px)', zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 12px #f59e0b' }} />
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
          VENTAS<span style={{ color: '#f59e0b' }}>HQ</span>
        </span>
      </div>
      <nav style={{ display: 'flex', gap: 4 }}>
        {[
          { href: '/', label: 'Dashboard' },
          { href: '/inventario', label: 'Inventario' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.15s',
            background: active === href ? 'rgba(245,158,11,0.1)' : 'transparent',
            color: active === href ? '#f59e0b' : '#666',
            border: active === href ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
          }}>{label}</Link>
        ))}
      </nav>
    </header>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 32 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '8px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
          fontFamily: 'Syne', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
          background: active === t.id ? '#1e1e1e' : 'transparent',
          color: active === t.id ? '#f59e0b' : '#555',
        }}>{t.label}</button>
      ))}
    </div>
  )
}

// ─── Sección Productos ────────────────────────────────────────────────────────
function SeccionProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ sku: '', nombre: '', stock_inicial: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/productos')
    const data = await r.json()
    setProductos(data.productos || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProductos() }, [fetchProductos])

  const guardar = async () => {
    if (!form.sku || !form.nombre) return setError('SKU y nombre son obligatorios')
    setSaving(true)
    setError(null)
    const r = await fetch('/api/productos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await r.json()
    if (data.error) { setError(data.error); setSaving(false); return }
    setModal(false)
    setForm({ sku: '', nombre: '', stock_inicial: '' })
    fetchProductos()
    setSaving(false)
  }

  const eliminar = async (sku) => {
    if (!confirm('¿Eliminar producto ' + sku + '? Esto no borra los movimientos.')) return
    await fetch('/api/productos?sku=' + sku, { method: 'DELETE' })
    fetchProductos()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <p style={{ color: '#555', fontSize: 14 }}>Cargá tus productos con SKU, nombre y stock inicial.</p>
        <Btn variant="primary" onClick={() => setModal(true)}>+ Nuevo producto</Btn>
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['SKU', 'Nombre', 'Stock inicial', ''].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#444', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: '#333', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Cargando...</td></tr>
            ) : productos.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: '#333', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Sin productos. Agregá uno arriba.</td></tr>
            ) : productos.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #161616', background: i % 2 === 0 ? 'transparent' : '#0d0d0d' }}>
                <td style={{ padding: '13px 20px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4 }}>{p.sku}</span>
                </td>
                <td style={{ padding: '13px 20px', color: '#ccc', fontSize: 13 }}>{p.nombre}</td>
                <td style={{ padding: '13px 20px', fontFamily: 'JetBrains Mono', color: '#777' }}>{p.stock_inicial}</td>
                <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                  <Btn small variant="danger" onClick={() => eliminar(p.sku)}>Eliminar</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Nuevo producto" onClose={() => setModal(false)}>
          <Field label="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="ej: REMERA-XL-NEGRO" />
          <Field label="Nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="ej: Remera XL Negro" />
          <Field label="Stock inicial" type="number" value={form.stock_inicial} onChange={e => setForm(f => ({ ...f, stock_inicial: e.target.value }))} placeholder="0" />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Sección Stock ────────────────────────────────────────────────────────────
function SeccionStock() {
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { sku, nombre, tipo }
  const [cantidad, setCantidad] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchStock = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/stock')
    const data = await r.json()
    setStock(data.stock || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchStock() }, [fetchStock])

  const abrirModal = (item, tipo) => {
    setModal({ sku: item.sku, nombre: item.nombre, tipo })
    setCantidad('')
    setNota('')
  }

  const registrar = async () => {
    if (!cantidad || parseInt(cantidad) <= 0) return
    setSaving(true)
    await fetch('/api/movimientos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: modal.sku, tipo: modal.tipo, cantidad: parseInt(cantidad), nota, origen: 'carga manual' })
    })
    setSaving(false)
    setModal(null)
    fetchStock()
  }

  const stockColor = (n) => {
    if (n <= 0) return '#ef4444'
    if (n <= 5) return '#f59e0b'
    return '#10b981'
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#555', fontSize: 14 }}>Stock en tiempo real. Las ventas de Shopify se descuentan automáticamente.</p>
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['SKU', 'Producto', 'Stock inicial', 'Movimientos', 'Stock actual', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#444', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#333', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Cargando...</td></tr>
            ) : stock.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#333', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Sin productos. Cargalos en la pestaña Productos.</td></tr>
            ) : stock.map((item, i) => (
              <tr key={item.sku} style={{ borderBottom: '1px solid #161616', background: i % 2 === 0 ? 'transparent' : '#0d0d0d' }}>
                <td style={{ padding: '13px 20px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4 }}>{item.sku}</span>
                </td>
                <td style={{ padding: '13px 20px', color: '#ccc', fontSize: 13 }}>{item.nombre}</td>
                <td style={{ padding: '13px 20px', fontFamily: 'JetBrains Mono', color: '#555' }}>{item.stock_inicial}</td>
                <td style={{ padding: '13px 20px', fontFamily: 'JetBrains Mono', color: item.movimientos_netos >= 0 ? '#10b981' : '#ef4444', fontSize: 13 }}>
                  {item.movimientos_netos > 0 ? '+' : ''}{item.movimientos_netos}
                </td>
                <td style={{ padding: '13px 20px' }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 16,
                    color: stockColor(item.stock_disponible)
                  }}>
                    {item.stock_disponible}
                  </span>
                </td>
                <td style={{ padding: '13px 20px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn small variant="green" onClick={() => abrirModal(item, 'entrada')}>+ Agregar</Btn>
                    <Btn small variant="red" onClick={() => abrirModal(item, 'salida')}>− Quitar</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title={modal.tipo === 'entrada' ? `Agregar stock — ${modal.nombre}` : `Quitar stock — ${modal.nombre}`}
          onClose={() => setModal(null)}
        >
          <Field
            label="Cantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="ej: 10"
          />
          <Field
            label="Nota (opcional)"
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder={modal.tipo === 'entrada' ? 'ej: Compra a proveedor' : 'ej: Ajuste de inventario'}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variant={modal.tipo === 'entrada' ? 'green' : 'red'} onClick={registrar} disabled={saving || !cantidad}>
              {saving ? 'Guardando...' : modal.tipo === 'entrada' ? 'Agregar stock' : 'Quitar stock'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Sección Movimientos ──────────────────────────────────────────────────────
function SeccionMovimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/movimientos?limit=200')
      .then(r => r.json())
      .then(data => { setMovimientos(data.movimientos || []); setLoading(false) })
  }, [])

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#555', fontSize: 14 }}>Historial completo de entradas y salidas de stock.</p>
      </div>

      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
              {['Fecha', 'SKU', 'Tipo', 'Cantidad', 'Origen', 'Orden', 'Nota'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', color: '#444', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#333', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Cargando...</td></tr>
            ) : movimientos.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#333', fontFamily: 'JetBrains Mono', fontSize: 13 }}>Sin movimientos todavía.</td></tr>
            ) : movimientos.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: '1px solid #161616', background: i % 2 === 0 ? 'transparent' : '#0d0d0d' }}>
                <td style={{ padding: '11px 20px', color: '#555', fontSize: 12, fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap' }}>
                  {m.created_at ? format(parseISO(m.created_at), 'dd/MM/yy HH:mm') : '—'}
                </td>
                <td style={{ padding: '11px 20px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: 4 }}>{m.sku}</span>
                </td>
                <td style={{ padding: '11px 20px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: m.tipo === 'entrada' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: m.tipo === 'entrada' ? '#10b981' : '#ef4444',
                    border: m.tipo === 'entrada' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {m.tipo === 'entrada' ? '↑ entrada' : '↓ salida'}
                  </span>
                </td>
                <td style={{ padding: '11px 20px', fontFamily: 'JetBrains Mono', color: '#ccc' }}>{m.cantidad}</td>
                <td style={{ padding: '11px 20px' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 4,
                    background: m.origen === 'shopify' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                    color: m.origen === 'shopify' ? '#818cf8' : '#555',
                    border: m.origen === 'shopify' ? '1px solid rgba(99,102,241,0.2)' : '1px solid #1e1e1e',
                    fontFamily: 'JetBrains Mono'
                  }}>
                    {m.origen}
                  </span>
                </td>
                <td style={{ padding: '11px 20px', color: '#444', fontSize: 12, fontFamily: 'JetBrains Mono' }}>
                  {m.order_id ? '#' + m.order_id : '—'}
                </td>
                <td style={{ padding: '11px 20px', color: '#555', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.nota || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Inventario() {
  const [tab, setTab] = useState('stock')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Nav active="/inventario" />
      <main style={{ padding: '40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>Inventario</h1>
          <p style={{ color: '#555', marginTop: 8, fontSize: 14 }}>Gestioná tu depósito en tiempo real</p>
        </div>

        <Tabs
          tabs={[
            { id: 'stock', label: 'Stock actual' },
            { id: 'productos', label: 'Productos' },
            { id: 'movimientos', label: 'Movimientos' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'stock' && <SeccionStock />}
        {tab === 'productos' && <SeccionProductos />}
        {tab === 'movimientos' && <SeccionMovimientos />}
      </main>
    </div>
  )
}
