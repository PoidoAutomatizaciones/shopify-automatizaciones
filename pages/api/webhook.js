import crypto from 'crypto'
import { createServiceClient } from '../../lib/supabase'

export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!secret || secret === 'REEMPLAZAR_CON_TU_SECRET_DE_SHOPIFY') return true
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
  return hash === hmacHeader
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rawBody = await getRawBody(req)
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] || ''

    if (!verifyShopifyWebhook(rawBody, hmacHeader, process.env.SHOPIFY_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const order = JSON.parse(rawBody.toString())
    const lineItems = order.line_items || []
    if (lineItems.length === 0) return res.status(200).json({ message: 'No items to process' })

    const supabase = createServiceClient()
    const orderId = String(order.id || order.order_number || '')

    const ventaRows = lineItems.map((item) => ({
      order_id: orderId,
      sku: item.sku || item.variant_id?.toString() || 'SIN-SKU',
      producto: item.name || item.title || '',
      cantidad: item.quantity || 1,
      precio_unitario: parseFloat(item.price) || 0,
      total: (parseFloat(item.price) || 0) * (item.quantity || 1),
    }))

    const { error: ventaError } = await supabase.from('ventas').insert(ventaRows)
    if (ventaError) console.error('Error ventas:', ventaError)

    const movRows = lineItems.map((item) => ({
      sku: (item.sku || item.variant_id?.toString() || 'SIN-SKU').trim().toUpperCase(),
      tipo: 'salida',
      cantidad: item.quantity || 1,
      origen: 'shopify',
      order_id: orderId,
      nota: 'Venta automatica - Orden #' + orderId,
    }))

    const { error: movError } = await supabase.from('movimientos').insert(movRows)
    if (movError) console.error('Error movimientos:', movError)

    return res.status(200).json({ success: true, inserted: ventaRows.length })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}
