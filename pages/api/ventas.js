import { createServiceClient } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { desde, hasta } = req.query
  const supabase = createServiceClient()

  let query = supabase
    .from('ventas')
    .select('*')
    .order('created_at', { ascending: false })

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta + 'T23:59:59')

  const { data, error } = await query

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ ventas: data })
}
