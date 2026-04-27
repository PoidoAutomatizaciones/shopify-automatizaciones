import { createServiceClient } from '../../lib/supabase'

export default async function handler(req, res) {
  const supabase = createServiceClient()

  if (req.method === 'GET') {
    const { sku, limit = 100 } = req.query
    let query = supabase
      .from('movimientos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))
    if (sku) query = query.eq('sku', sku)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ movimientos: data })
  }

  if (req.method === 'POST') {
    const { sku, tipo, cantidad, origen = 'carga manual', nota = '', order_id = null } = req.body
    if (!sku || !tipo || !cantidad) return res.status(400).json({ error: 'Faltan campos' })
    if (!['entrada', 'salida'].includes(tipo)) return res.status(400).json({ error: 'Tipo inválido' })
    const { data, error } = await supabase
      .from('movimientos')
      .insert([{ sku: sku.trim().toUpperCase(), tipo, cantidad: Math.abs(parseInt(cantidad)), origen, nota, order_id }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ movimiento: data })
  }

  return res.status(405).end()
}
