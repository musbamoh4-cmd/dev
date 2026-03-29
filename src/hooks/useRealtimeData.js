import { useEffect, useMemo, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

const buildUrl = (path) => `${API_BASE}${path}`

const STORAGE_KEYS = {
  inventory: 'autospareInventory',
  inbound: 'autospareInbound',
  outbound: 'autospareOutbound',
}

const loadStored = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch (error) {
    return fallback
  }
}

const persistStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

const normalizeNumber = (value) => {
  const num = Number(value || 0)
  return Number.isFinite(num) ? num : 0
}

const createDocId = (prefix) =>
  `${prefix}${String(Math.floor(100000 + Math.random() * 900000))}`

const normalizeDocId = (prefix, value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (new RegExp(`^${prefix}\\d{6}$`).test(trimmed)) {
      return trimmed
    }
  }
  return createDocId(prefix)
}

const fetchJson = async (path, options) => {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error || 'Request failed.'
    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }
  return payload
}

const shouldFallback = (error) => {
  if (!error) return false
  if (error instanceof TypeError) return true
  const message = error?.message || ''
  if (/fetch/i.test(message)) return true
  const status = error?.status
  return status === 404 || status === 405 || status === 501
}

export default function useRealtimeData() {
  const [inventory, setInventory] = useState([])
  const [inbound, setInbound] = useState([])
  const [outbound, setOutbound] = useState([])
  const [status, setStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(null)

  const updateTimestamp = () => setLastUpdated(new Date())

  useEffect(() => {
    let cancelled = false

    const loadInitial = async () => {
      try {
        const [inv, inb, out] = await Promise.all([
          fetchJson('/api/inventory'),
          fetchJson('/api/inbound'),
          fetchJson('/api/outbound'),
        ])
        if (cancelled) return
        setInventory(inv.items || [])
        setInbound(inb.items || [])
        setOutbound(out.items || [])
        setStatus('live')
        updateTimestamp()
      } catch (error) {
        if (!cancelled) {
          setStatus('offline')
          setInventory(loadStored(STORAGE_KEYS.inventory))
          setInbound(loadStored(STORAGE_KEYS.inbound))
          setOutbound(loadStored(STORAGE_KEYS.outbound))
        }
      }
    }

    loadInitial()

    const shouldEnableRealtime =
      !import.meta.env.PROD || (API_BASE && API_BASE.length > 0)
    let source
    if (shouldEnableRealtime) {
      source = new EventSource(buildUrl('/events'))
      source.addEventListener('open', () => {
        if (!cancelled) {
          setStatus('live')
        }
      })

      source.addEventListener('error', () => {
        if (!cancelled) {
          setStatus('offline')
        }
      })

      source.addEventListener('snapshot', (event) => {
        if (cancelled) return
        try {
          const payload = JSON.parse(event.data || '{}')
          setInventory(payload.inventory || [])
          setInbound(payload.inbound || [])
          setOutbound(payload.outbound || [])
          updateTimestamp()
        } catch (error) {
          // Ignore malformed snapshots.
        }
      })

      source.addEventListener('inventory', (event) => {
        if (cancelled) return
        try {
          setInventory(JSON.parse(event.data || '[]'))
          updateTimestamp()
        } catch (error) {
          // Ignore malformed payloads.
        }
      })

      source.addEventListener('inbound', (event) => {
        if (cancelled) return
        try {
          const record = JSON.parse(event.data || '{}')
          setInbound((prev) => [
            record,
            ...prev.filter((item) => item.id !== record.id),
          ])
          updateTimestamp()
        } catch (error) {
          // Ignore malformed payloads.
        }
      })

      source.addEventListener('outbound', (event) => {
        if (cancelled) return
        try {
          const record = JSON.parse(event.data || '{}')
          setOutbound((prev) => [
            record,
            ...prev.filter((item) => item.id !== record.id),
          ])
          updateTimestamp()
        } catch (error) {
          // Ignore malformed payloads.
        }
      })
    }

    return () => {
      cancelled = true
      if (source) {
        source.close()
      }
    }
  }, [])

  useEffect(() => {
    persistStored(STORAGE_KEYS.inventory, inventory)
    persistStored(STORAGE_KEYS.inbound, inbound)
    persistStored(STORAGE_KEYS.outbound, outbound)
  }, [inventory, inbound, outbound])

  const registerInbound = async (payload) => {
    try {
      const result = await fetchJson('/api/inbound', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const record = result.record
      if (result.inventory) {
        setInventory(result.inventory)
      } else if (record) {
        setInventory((prev) => [
          record,
          ...prev.filter((item) => item.id !== record.id),
        ])
      }
      if (record) {
        setInbound((prev) => [
          record,
          ...prev.filter((item) => item.id !== record.id),
        ])
      }
      updateTimestamp()
      return result.record
    } catch (error) {
      if (shouldFallback(error)) {
        const record = {
          ...payload,
          createdAt: payload.createdAt || new Date().toISOString(),
        }
        setStatus('offline')
        setInventory((prev) => [
          record,
          ...prev.filter((item) => item.id !== record.id),
        ])
        setInbound((prev) => [
          record,
          ...prev.filter((item) => item.id !== record.id),
        ])
        updateTimestamp()
        return record
      }
      throw error
    }
  }

  const registerOutbound = async (payload) => {
    try {
      const result = await fetchJson('/api/outbound', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const record = result.record
      if (result.inventory) {
        setInventory(result.inventory)
      }
      if (record) {
        setOutbound((prev) => [record, ...prev.filter((item) => item.id !== record.id)])
      }
      updateTimestamp()
      return result.record
    } catch (error) {
      if (shouldFallback(error)) {
        const sourceItem =
          payload?.type === 'inventory'
            ? inventory.find((item) => item.id === payload?.itemId)
            : null
        const record = {
          id: normalizeDocId('ST', payload?.id),
          type: payload?.type || 'inventory',
          itemId: payload?.itemId || sourceItem?.id || null,
          sku: payload?.sku || sourceItem?.sku || '',
          name: (payload?.name || sourceItem?.name || '').trim(),
          category: payload?.category || sourceItem?.category || 'General',
          manufacturer: (payload?.manufacturer || sourceItem?.manufacturer || '').trim(),
          uom: payload?.uom || sourceItem?.uom || 'Piece',
          batchNumber: (payload?.batchNumber || sourceItem?.batchNumber || '').trim(),
          supplier: (payload?.supplier || '').trim(),
          destination: (payload?.destination || '').trim(),
          buyPrice: normalizeNumber(payload?.buyPrice ?? sourceItem?.buyPrice ?? 0),
          sellPrice: normalizeNumber(payload?.sellPrice ?? sourceItem?.sellPrice ?? 0),
          quantity: normalizeNumber(payload?.quantity),
          createdAt: payload?.createdAt || new Date().toISOString(),
        }
        setStatus('offline')
        setOutbound((prev) => [record, ...prev.filter((item) => item.id !== record.id)])
        if (record.type !== 'direct' && sourceItem) {
          const nextQty = Math.max(
            0,
            normalizeNumber(sourceItem.quantity) - normalizeNumber(record.quantity),
          )
          setInventory((prev) =>
            prev.map((item) =>
              item.id === sourceItem.id ? { ...item, quantity: nextQty } : item,
            ),
          )
        }
        updateTimestamp()
        return record
      }
      throw error
    }
  }

  return useMemo(
    () => ({
      inventory,
      inbound,
      outbound,
      status,
      lastUpdated,
      registerInbound,
      registerOutbound,
    }),
    [inventory, inbound, outbound, status, lastUpdated],
  )
}
