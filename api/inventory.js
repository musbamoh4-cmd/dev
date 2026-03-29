import { getSupabase } from './_supabase.js'
import { jsonHeaders, sendJson } from './_utils.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, jsonHeaders)
    res.end()
    return
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const { supabase, error } = getSupabase()
  if (error) {
    sendJson(res, 500, { error: error.message })
    return
  }

  const { data, error: dbError } = await supabase
    .from('inventory')
    .select('record, quantity, created_at')
    .order('created_at', { ascending: false })

  if (dbError) {
    sendJson(res, 500, { error: dbError.message })
    return
  }

  const items = (data || []).map((row) => ({
    ...(row.record || {}),
    quantity: Number(row.quantity || 0),
  }))

  sendJson(res, 200, { items })
}
