import { createServiceClient } from '../../lib/supabase'

export default async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return res.status(500).json({ error: 'Missing env vars', url: !!url, key: !!key })
  }

  const supabase = createServiceClient()

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('productos').select('*').order('nombre')
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ productos: data })
    } catch (e) {
      return res.status(500).json({ error: e.message, stack: e.stack })
    }
  }

  return res.status(405).end()
}
