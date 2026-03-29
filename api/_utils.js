export const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export const sendJson = (res, status, payload) => {
  res.writeHead(status, jsonHeaders)
  res.end(JSON.stringify(payload))
}

export const readJson = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body
  }

  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  if (!chunks.length) return null
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    return { __parseError: error }
  }
}

export const normalizeNumber = (value) => {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num : 0
}

export const createDocId = (prefix) => {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}${num}`
}

export const normalizeDocId = (prefix, value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (new RegExp(`^${prefix}\\d{6}$`).test(trimmed)) {
      return trimmed
    }
  }
  return createDocId(prefix)
}

export const createInboundRecord = (payload) => ({
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

export const createOutboundRecord = (payload, sourceItem) => ({
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
  buyPrice: normalizeNumber(payload.buyPrice ?? sourceItem?.buyPrice ?? 0),
  sellPrice: normalizeNumber(payload.sellPrice ?? sourceItem?.sellPrice ?? 0),
  quantity: normalizeNumber(payload.quantity),
  createdAt: payload.createdAt || new Date().toISOString(),
})
