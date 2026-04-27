import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data, error } = await supabase.from('productos').select('*')
    if (error) return res.status(500).json({ supabase_error: error.message, code: error.code })
    return res.status(200).json({ productos: data })
  } catch (e) {
    return res.status(500).json({ catch_error: e.message, cause: e.cause?.message })
  }
}