import http from 'node:http'
import { URL } from 'node:url'

const PORT = Number(process.env.PORT || 5174)

const state = {
  inbound: [],
  outbound: [],
  inventory: [],
}

const clients = new Set()

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin': '*',
}

const sendJson = (res, status, payload) => {
  res.writeHead(status, jsonHeaders)
  res.end(JSON.stringify(payload))
}

const readBody = async (req) => {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  if (chunks.length === 0) {
    return null
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch (error) {
    return { __parseError: error }
  }
}

const sendEvent = (res, type, payload) => {
  res.write(`event: ${type}\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

const broadcast = (type, payload) => {
  clients.forEach((client) => {
    try {
      sendEvent(client, type, payload)
    } catch (error) {
      clients.delete(client)
    }
  })
}

const normalizeNumber = (value) => {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num : 0
}

const createDocId = (prefix) => {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}${num}`
}

const normalizeDocId = (prefix, value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (new RegExp(`^${prefix}\\d{6}$`).test(trimmed)) {
      return trimmed
    }
  }
  return createDocId(prefix)
}

const createInboundRecord = (payload) => ({
  id: normalizeDocId('GR', payload.id),
  sku: payload.sku || '',
  name: (payload.name || '').trim(),
  category: payload.category || 'General',
  manufacturer: (payload.manufacturer || '').trim(),
  uom: payload.uom || 'Piece',
  receivedBy: (payload.receivedBy || '').trim(),
  receiverSignature: (payload.receiverSignature || '').trim(),
  reorderLevel: normalizeNumber(payload.reorderLevel),
  batchNumber: (payload.batchNumber || '').trim(),
  buyPrice: normalizeNumber(payload.buyPrice),
  sellPrice: normalizeNumber(payload.sellPrice),
  quantity: normalizeNumber(payload.quantity),
  createdAt: payload.createdAt || new Date().toISOString(),
})

const createOutboundRecord = (payload, sourceItem) => ({
  id: normalizeDocId('ST', payload.id),
  type: payload.type || 'inventory',
  itemId: payload.itemId || sourceItem?.id || null,
  sku: payload.sku || sourceItem?.sku || '',
  name: (payload.name || sourceItem?.name || '').trim(),
  category: payload.category || sourceItem?.category || 'General',
  manufacturer: (payload.manufacturer || sourceItem?.manufacturer || '').trim(),
  uom: payload.uom || sourceItem?.uom || 'Piece',
  batchNumber: (payload.batchNumber || sourceItem?.batchNumber || '').trim(),
  supplier: (payload.supplier || '').trim(),
  destination: (payload.destination || '').trim(),
  buyPrice: normalizeNumber(
    payload.buyPrice ?? sourceItem?.buyPrice ?? 0,
  ),
  sellPrice: normalizeNumber(
    payload.sellPrice ?? sourceItem?.sellPrice ?? 0,
  ),
  quantity: normalizeNumber(payload.quantity),
  createdAt: payload.createdAt || new Date().toISOString(),
})

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, jsonHeaders)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, sseHeaders)
    res.write('\n')
    clients.add(res)
    sendEvent(res, 'snapshot', state)

    const heartbeat = setInterval(() => {
      res.write(`: keep-alive ${Date.now()}\n\n`)
    }, 20000)

    req.on('close', () => {
      clearInterval(heartbeat)
      clients.delete(res)
    })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/inventory') {
    sendJson(res, 200, { items: state.inventory })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/inbound') {
    sendJson(res, 200, { items: state.inbound })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/outbound') {
    sendJson(res, 200, { items: state.outbound })
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/inbound') {
    const body = await readBody(req)
    if (body?.__parseError) {
      sendJson(res, 400, { error: 'Invalid JSON payload.' })
      return
    }

    const record = createInboundRecord(body || {})
    if (!record.name || !record.batchNumber) {
      sendJson(res, 400, { error: 'Name and batch number are required.' })
      return
    }

    const inventoryRecord = { ...record }
    state.inbound.unshift(record)
    state.inventory.unshift(inventoryRecord)

    broadcast('inbound', record)
    broadcast('inventory', state.inventory)

    sendJson(res, 201, { record, inventory: state.inventory })
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/outbound') {
    const body = await readBody(req)
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
      state.outbound.unshift(record)
      broadcast('outbound', record)
      sendJson(res, 201, { record, inventory: state.inventory })
      return
    }

    const itemId = payload.itemId
    const inventoryItem = state.inventory.find((item) => item.id === itemId)
    if (!inventoryItem) {
      sendJson(res, 404, { error: 'Inventory item not found.' })
      return
    }

    const qty = normalizeNumber(payload.quantity)
    if (!qty || qty <= 0) {
      sendJson(res, 400, { error: 'Quantity must be greater than zero.' })
      return
    }

    if (qty > normalizeNumber(inventoryItem.quantity)) {
      sendJson(res, 400, { error: 'Quantity exceeds available stock.' })
      return
    }

    inventoryItem.quantity = normalizeNumber(inventoryItem.quantity) - qty
    const record = createOutboundRecord({ ...payload, quantity: qty }, inventoryItem)
    state.outbound.unshift(record)

    broadcast('outbound', record)
    broadcast('inventory', state.inventory)

    sendJson(res, 201, { record, inventory: state.inventory })
    return
  }

  sendJson(res, 404, { error: 'Not found.' })
})

server.listen(PORT, () => {
  console.log(`Realtime backend running on http://localhost:${PORT}`)
})
