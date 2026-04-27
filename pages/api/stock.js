import { createServiceClient } from '../../lib/supabase'

export default async function handler(req, res) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('stock_actual')
    .select('*')
    .order('nombre')

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ stock: data })
}
