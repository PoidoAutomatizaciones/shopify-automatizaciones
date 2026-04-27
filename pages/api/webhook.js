import crypto from 'crypto'
import { createServiceClient } from '../../lib/supabase'

export const config = {
  api: {
    bodyParser: false,
  },
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
  if (!secret || secret === 'REEMPLAZAR_CON_TU_SECRET_DE_SHOPIFY') return true // skip in dev
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64')
  return hash === hmacHeader
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rawBody = await getRawBody(req)
    const hmacHeader = req.headers['x-shopify-hmac-sha256'] || ''
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET

    if (!verifyShopifyWebhook(rawBody, hmacHeader, secret)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const order = JSON.parse(rawBody.toString())
    const lineItems = order.line_items || []

    if (lineItems.length === 0) {
      return res.status(200).json({ message: 'No items to process' })
    }

    const supabase = createServiceClient()

    const rows = lineItems.map((item) => ({
      order_id: String(order.id || order.order_number || ''),
      sku: item.sku || item.variant_id?.toString() || 'SIN-SKU',
      producto: item.name || item.title || '',
      cantidad: item.quantity || 1,
      precio_unitario: parseFloat(item.price) || 0,
      total: (parseFloat(item.price) || 0) * (item.quantity || 1),
    }))

    const { error } = await supabase.from('ventas').insert(rows)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'DB insert failed', detail: error.message })
    }

    return res.status(200).json({ success: true, inserted: rows.length })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}
