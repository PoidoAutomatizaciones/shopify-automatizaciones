export default async function handler(req, res) {
  return res.status(200).json({ ok: true, url: process.env.NEXT_PUBLIC_SUPABASE_URL })
}
