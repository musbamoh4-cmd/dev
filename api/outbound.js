import { getSupabase } from './_supabase.js'
import {
  createOutboundRecord,
  jsonHeaders,
  normalizeNumber,
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
      .from('outbound')
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

  const payload = body || {}
  if (payload.type === 'direct') {
    const record = createOutboundRecord(payload, null)
    if (!record.name || !record.quantity || !record.sellPrice) {
      sendJson(res, 400, { error: 'Missing required direct sale fields.' })
      return
    }
    const insertOutbound = await supabase
      .from('outbound')
      .insert({ id: record.id, record, created_at: record.createdAt })

    if (insertOutbound.error) {
      sendJson(res, 500, { error: insertOutbound.error.message })
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
    return
  }

  const itemId = payload.itemId
  const { data: inventoryRow, error: inventoryRowError } = await supabase
    .from('inventory')
    .select('record, quantity')
    .eq('id', itemId)
    .maybeSingle()

  if (inventoryRowError) {
    sendJson(res, 500, { error: inventoryRowError.message })
    return
  }

  if (!inventoryRow) {
    sendJson(res, 404, { error: 'Inventory item not found.' })
    return
  }

  const qty = normalizeNumber(payload.quantity)
  if (!qty || qty <= 0) {
    sendJson(res, 400, { error: 'Quantity must be greater than zero.' })
    return
  }

  if (qty > normalizeNumber(inventoryRow.quantity)) {
    sendJson(res, 400, { error: 'Quantity exceeds available stock.' })
    return
  }

  const nextQty = normalizeNumber(inventoryRow.quantity) - qty
  const sourceRecord = inventoryRow.record || {}
  const record = createOutboundRecord({ ...payload, quantity: qty }, sourceRecord)
  const nextInventoryRecord = { ...sourceRecord, quantity: nextQty }

  const updateInventory = await supabase
    .from('inventory')
    .update({ quantity: nextQty, record: nextInventoryRecord })
    .eq('id', itemId)

  if (updateInventory.error) {
    sendJson(res, 500, { error: updateInventory.error.message })
    return
  }

  const insertOutbound = await supabase
    .from('outbound')
    .insert({ id: record.id, record, created_at: record.createdAt })

  if (insertOutbound.error) {
    sendJson(res, 500, { error: insertOutbound.error.message })
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
