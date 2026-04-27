import { createServiceClient } from '../../lib/supabase'

export default async function handler(req, res) {
  const supabase = createServiceClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ productos: data })
  }

  if (req.method === 'POST') {
    const { sku, nombre, stock_inicial } = req.body
    if (!sku || !nombre) return res.status(400).json({ error: 'SKU y nombre son requeridos' })
    const { data, error } = await supabase
      .from('productos')
      .insert([{ sku: sku.trim().toUpperCase(), nombre: nombre.trim(), stock_inicial: parseInt(stock_inicial) || 0 }])
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ producto: data })
  }

  if (req.method === 'DELETE') {
    const { sku } = req.query
    const { error } = await supabase.from('productos').delete().eq('sku', sku)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).end()
}
