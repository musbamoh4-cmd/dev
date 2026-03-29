import { getSupabase } from './_supabase.js'
import {
  createInboundRecord,
  jsonHeaders,
  readJson,
  sendJson,
} from './_utils.js'

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, jsonHeaders)
    res.end()
    return
  }

  const { supabase, error } = getSupabase()
  if (error) {
    sendJson(res, 500, { error: error.message })
    return
  }

  if (req.method === 'GET') {
    const { data, error: dbError } = await supabase
      .from('inbound')
      .select('record, created_at')
      .order('created_at', { ascending: false })
    if (dbError) {
      sendJson(res, 500, { error: dbError.message })
      return
    }
    const items = (data || []).map((row) => row.record)
    sendJson(res, 200, { items })
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const body = await readJson(req)
  if (body?.__parseError) {
    sendJson(res, 400, { error: 'Invalid JSON payload.' })
    return
  }

  const record = createInboundRecord(body || {})
  if (!record.name || !record.batchNumber) {
    sendJson(res, 400, { error: 'Name and batch number are required.' })
    return
  }

  const insertInbound = await supabase
    .from('inbound')
    .insert({
      id: record.id,
      record,
      created_at: record.createdAt,
    })

  if (insertInbound.error) {
    sendJson(res, 500, { error: insertInbound.error.message })
    return
  }

  const insertInventory = await supabase
    .from('inventory')
    .insert({
      id: record.id,
      record,
      quantity: record.quantity,
      created_at: record.createdAt,
    })

  if (insertInventory.error) {
    sendJson(res, 500, { error: insertInventory.error.message })
    return
  }

  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('inventory')
    .select('record, quantity, created_at')
    .order('created_at', { ascending: false })

  if (inventoryError) {
    sendJson(res, 500, { error: inventoryError.message })
    return
  }

  const inventory = (inventoryRows || []).map((row) => ({
    ...(row.record || {}),
    quantity: Number(row.quantity || 0),
  }))

  sendJson(res, 201, { record, inventory })
}
