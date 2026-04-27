import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format, subDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0
  }).format(n)
}

function groupByDay(ventas) {
  const map = {}
  ventas.forEach(v => {
    const day = v.created_at?.slice(0, 10)
    if (!day) return
    map[day] = (map[day] || 0) + (v.total || 0)
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      fecha: format(parseISO(date), 'd MMM', { locale: es }),
      total: Math.round(total)
    }))
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: 8, padding: '10px 16px'
    }}>
      <p style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
        {fmt(payload[0].value)}
      </p>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: accent ? 'rgba(245,158,11,0.07)' : '#111',
      border: `1px solid ${accent ? 'rgba(245,158,11,0.3)' : '#2a2a2a'}`,
      borderRadius: 12, padding: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <span style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {label}
      </span>
      <span style={{
        color: accent ? '#f59e0b' : '#f0f0f0',
        fontSize: 28, fontWeight: 800, lineHeight: 1,
        fontFamily: 'JetBrains Mono'
      }}>
        {value}
      </span>
      {sub && <span style={{ color: '#666', fontSize: 12 }}>{sub}</span>}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [desde, setDesde] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'))
  const [hasta, setHasta] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')

  const fetchVentas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ desde, hasta })
      const r = await fetch(`/api/ventas?${params}`)
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setVentas(data.ventas || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [desde, hasta])

  useEffect(() => { fetchVentas() }, [fetchVentas])

  const totalVendido = ventas.reduce((s, v) => s + (v.total || 0), 0)
  const totalItems = ventas.reduce((s, v) => s + (v.cantidad || 0), 0)
  const totalOrdenes = new Set(ventas.map(v => v.order_id)).size
  const chartData = groupByDay(ventas)

  const filtered = ventas.filter(v =>
    !search ||
    v.sku?.toLowerCase().includes(search.toLowerCase()) ||
    v.producto?.toLowerCase().includes(search.toLowerCase()) ||
    v.order_id?.includes(search)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '0 40px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(12px)', zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#f59e0b',
            boxShadow: '0 0 12px #f59e0b'
          }} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>
        
            VENTAS<span style={{ color: '#f59e0b' }}>HQ</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/inventario" style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', color: '#666', border: '1px solid transparent'
          }}>Inventario</Link>
          <span style={{
            fontSize: 11, color: '#555', fontFamily: 'JetBrains Mono',
            background: '#111', border: '1px solid #222',
            padding: '4px 10px', borderRadius: 6
          }}>
            WEBHOOK → /api/webhook
          </span>
          <button onClick={fetchVentas} style={{
            background: 'transparent', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '6px 16px', color: '#888',
            cursor: 'pointer', fontSize: 12, fontFamily: 'Syne',
            transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.color = '#f59e0b' }}
            onMouseLeave={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.color = '#888' }}>
            ↻ Actualizar
          </button>
        </div>
      </header>

      <main style={{ padding: '40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
            Dashboard de Ventas
          </h1>
          <p style={{ color: '#555', marginTop: 8, fontSize: 14 }}>
            Shopify → Supabase · Tiempo real
          </p>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 32,
          flexWrap: 'wrap', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {[
              { label: 'Hoy', days: 0 },
              { label: '7 días', days: 6 },
              { label: '30 días', days: 29 },
            ].map(({ label, days }) => (
              <button key={label} onClick={() => {
                setDesde(format(subDays(new Date(), days), 'yyyy-MM-dd'))
                setHasta(format(new Date(), 'yyyy-MM-dd'))
              }} style={{
                background: 'transparent', border: '1px solid #2a2a2a',
                borderRadius: 8, padding: '6px 14px', color: '#777',
                cursor: 'pointer', fontSize: 12, fontFamily: 'Syne',
                transition: 'all 0.15s'
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.color = '#f59e0b' }}
                onMouseLeave={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.color = '#777' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '16px 20px', marginBottom: 24,
            color: '#ef4444', fontSize: 14
          }}>
            ⚠ Error: {error}
          </div>
        )}

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16, marginBottom: 32
        }}>
          <StatCard label="Total vendido" value={fmt(totalVendido)} accent />
          <StatCard label="Órdenes" value={totalOrdenes} sub="pedidos únicos" />
          <StatCard label="Unidades" value={totalItems} sub="items vendidos" />
          <StatCard label="Ticket promedio"
            value={totalOrdenes ? fmt(totalVendido / totalOrdenes) : '$0'}
            sub="por orden" />
        </div>

        {/* Chart */}
        <div style={{
          background: '#111', border: '1px solid #1e1e1e',
          borderRadius: 16, padding: '28px 28px 16px', marginBottom: 32
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#888', marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Ventas por día
          </h2>
          {loading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
              Cargando...
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
              Sin datos para el período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2}
                  fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Table */}
        <div style={{
          background: '#111', border: '1px solid #1e1e1e',
          borderRadius: 16, overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Registro de ventas
              <span style={{ color: '#444', fontWeight: 400, marginLeft: 8 }}>({filtered.length})</span>
            </h2>
            <input
              placeholder="Buscar SKU, producto, orden..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 260, fontSize: 13 }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Orden', 'SKU', 'Producto', 'Cantidad', 'Precio unit.', 'Total', 'Fecha'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      color: '#444', fontSize: 11, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: '#333' }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>Cargando ventas...</span>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: '#333' }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>Sin ventas en este período</span>
                    </td>
                  </tr>
                ) : (
                  filtered.map((v, i) => (
                    <tr key={v.id} style={{
                      borderBottom: '1px solid #161616',
                      background: i % 2 === 0 ? 'transparent' : '#0d0d0d',
                      transition: 'background 0.15s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : '#0d0d0d'}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#666' }}>#{v.order_id}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          fontFamily: 'JetBrains Mono', fontSize: 12,
                          background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.15)',
                          color: '#f59e0b', padding: '2px 8px', borderRadius: 4
                        }}>
                          {v.sku}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.producto}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', color: '#ccc' }}>{v.cantidad}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'JetBrains Mono', color: '#777', fontSize: 13 }}>
                          {fmt(v.precio_unitario)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontFamily: 'JetBrains Mono', color: '#10b981', fontWeight: 600 }}>
                          {fmt(v.total)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#444', fontSize: 12, fontFamily: 'JetBrains Mono' }}>
                          {v.created_at ? format(parseISO(v.created_at), 'dd/MM/yy HH:mm') : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle = {
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  padding: '7px 12px',
  color: '#ccc',
  fontSize: 12,
  fontFamily: 'JetBrains Mono',
  outline: 'none',
}

const tdStyle = {
  padding: '13px 20px',
  fontSize: 13,
  color: '#ccc',
  verticalAlign: 'middle',
}
