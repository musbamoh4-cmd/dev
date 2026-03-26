import { useMemo, useState } from 'react'

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (value) =>
  new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const generateDocId = (prefix) =>
  `${prefix}${String(Math.floor(100000 + Math.random() * 900000))}`

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const initialDirectForm = {
  name: '',
  category: 'Engine',
  brand: '',
  supplier: '',
  buyPrice: '',
  sellPrice: '',
  quantity: '',
  destination: '',
}

export default function Outbound({ items = [], onDispatch }) {
  const [saleType, setSaleType] = useState('Inventory')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [dispatchQty, setDispatchQty] = useState('')
  const [destination, setDestination] = useState('')
  const [directForm, setDirectForm] = useState(initialDirectForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preview, setPreview] = useState(null)

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      const haystack = [
        item.name,
        item.batchNumber,
        item.category,
        item.manufacturer,
        item.sku,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, search])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  )

  const transactionPreview = useMemo(() => {
    if (saleType === 'Inventory') {
      if (!selectedItem) return null
      const qty = Number(dispatchQty || 0)
      const revenue = qty * Number(selectedItem.sellPrice || 0)
      const cogs = qty * Number(selectedItem.buyPrice || 0)
      return {
        name: selectedItem.name,
        category: selectedItem.category,
        batchNumber: selectedItem.batchNumber,
        qty,
        revenue,
        cogs,
        profit: revenue - cogs,
        destination,
        available: Number(selectedItem.quantity || 0),
      }
    }

    const qty = Number(directForm.quantity || 0)
    const revenue = qty * Number(directForm.sellPrice || 0)
    const cogs = qty * Number(directForm.buyPrice || 0)
    if (!directForm.name.trim()) return null
    return {
      name: directForm.name.trim(),
      category: directForm.category,
      qty,
      revenue,
      cogs,
      profit: revenue - cogs,
      destination: directForm.destination,
    }
  }, [saleType, selectedItem, dispatchQty, destination, directForm])

  const handleSaleTypeChange = (event) => {
    setSaleType(event.target.value)
    setError('')
  }

  const handleReset = () => {
    setSearch('')
    setSelectedId('')
    setDispatchQty('')
    setDestination('')
    setDirectForm(initialDirectForm)
    setError('')
  }

  const buildFallbackRecord = (payload, sourceItem) => ({
    id: payload.id || generateDocId('ST'),
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
    buyPrice: Number(payload.buyPrice ?? sourceItem?.buyPrice ?? 0),
    sellPrice: Number(payload.sellPrice ?? sourceItem?.sellPrice ?? 0),
    quantity: Number(payload.quantity || 0),
    createdAt: payload.createdAt || new Date().toISOString(),
  })

  const handlePrint = (data = preview) => {
    if (!data) {
      return
    }

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>STV Preview</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #0f172a; background: #fff; }
  .page { padding: 18mm; }
  .card { border: 1px solid #d0d7e2; border-radius: 12px; padding: 24px; position: relative; min-height: 240mm; }
  .watermark { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
  .watermark span { font-size: 72px; font-weight: 700; letter-spacing: 6px; color: rgba(15, 23, 42, 0.08); transform: rotate(-12deg); }
  h1 { margin: 0 0 6px; font-size: 24px; }
  .sub { color: #475569; margin-bottom: 20px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; }
  .row { display: grid; gap: 4px; }
  .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
  .value { font-size: 14px; font-weight: 600; }
  .footer { margin-top: 18px; font-size: 12px; color: #64748b; }
  .approval { margin-top: 28px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .line { border-bottom: 1px solid #cbd5e1; height: 28px; }
  .line-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
  <div class="page">
    <section class="card">
      <div class="watermark"><span>ORIGINAL</span></div>
      <h1>Stock Transfer Voucher (STV)</h1>
      <div class="sub">AutoSpare Hub • ${escapeHtml(formatDate(data.createdAt))}</div>
      <div class="grid">
        <div class="row"><div class="label">STV ID</div><div class="value">${escapeHtml(data.id)}</div></div>
        <div class="row"><div class="label">Type</div><div class="value">${escapeHtml(data.type || '-')}</div></div>
        <div class="row"><div class="label">SKU</div><div class="value">${escapeHtml(data.sku || '-')}</div></div>
        <div class="row"><div class="label">Batch Number</div><div class="value">${escapeHtml(data.batchNumber || '-')}</div></div>
        <div class="row"><div class="label">Part Name</div><div class="value">${escapeHtml(data.name || '-')}</div></div>
        <div class="row"><div class="label">Category</div><div class="value">${escapeHtml(data.category || '-')}</div></div>
        <div class="row"><div class="label">Manufacturer</div><div class="value">${escapeHtml(data.manufacturer || '-')}</div></div>
        <div class="row"><div class="label">UOM</div><div class="value">${escapeHtml(data.uom || '-')}</div></div>
        <div class="row"><div class="label">Quantity</div><div class="value">${escapeHtml(Number(data.quantity || 0))}</div></div>
        <div class="row"><div class="label">Destination</div><div class="value">${escapeHtml(data.destination || '-')}</div></div>
        <div class="row"><div class="label">Supplier</div><div class="value">${escapeHtml(data.supplier || '-')}</div></div>
        <div class="row"><div class="label">Sell Price</div><div class="value">${escapeHtml(formatMoney(data.sellPrice))}</div></div>
      </div>
      <div class="approval">
        <div>
          <div class="line"></div>
          <div class="line-label">Approved By</div>
        </div>
        <div>
          <div class="line"></div>
          <div class="line-label">Signature</div>
        </div>
        <div>
          <div class="line"></div>
          <div class="line-label">Date</div>
        </div>
      </div>
      <div class="footer">Document generated by AutoSpare Hub</div>
    </section>
  </div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      return
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (saleType === 'Inventory') {
      if (!selectedItem) {
        setError('Select a batch from inventory before dispatching.')
        return
      }

      const qty = Number(dispatchQty || 0)
      if (!qty || qty <= 0) {
        setError('Enter a dispatch quantity greater than zero.')
        return
      }

      if (qty > Number(selectedItem.quantity || 0)) {
        setError('Dispatch quantity exceeds available stock.')
        return
      }

      setIsSubmitting(true)
      try {
        const payload = {
          type: 'inventory',
          itemId: selectedItem.id,
          quantity: qty,
          destination,
        }
        const saved = onDispatch ? await onDispatch(payload) : null
        const record = saved || buildFallbackRecord(payload, selectedItem)
        setPreview(record)
        handlePrint(record)
        handleReset()
      } catch (submitError) {
        setError(submitError?.message || 'Failed to dispatch inventory.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (!directForm.name.trim()) {
      setError('Product name is required for direct sales.')
      return
    }

    const qty = Number(directForm.quantity || 0)
    if (!qty || qty <= 0) {
      setError('Quantity must be greater than zero.')
      return
    }

    if (!Number(directForm.sellPrice || 0)) {
      setError('Selling price is required for direct sales.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        type: 'direct',
        name: directForm.name.trim(),
        category: directForm.category,
        manufacturer: directForm.brand.trim(),
        supplier: directForm.supplier.trim(),
        buyPrice: Number(directForm.buyPrice || 0),
        sellPrice: Number(directForm.sellPrice || 0),
        quantity: qty,
        destination: directForm.destination.trim(),
      }
      const saved = onDispatch ? await onDispatch(payload) : null
      const record = saved || buildFallbackRecord(payload, null)
      setPreview(record)
      handlePrint(record)
      handleReset()
    } catch (submitError) {
      setError(submitError?.message || 'Failed to save direct sale.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="form-shell">
      <header className="form-header">
        <div>
          <h1>Outbound — Stock Transfer Voucher</h1>
          <p>Dispatch stock • Prices in Ethiopian Birr (ETB)</p>
        </div>
        <button className="ghost" type="button">
          View History
        </button>
      </header>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-col">
          <div className="form-section">Search & Select Batch</div>

          <label className="field">
            <span>Search</span>
            <input
              className="input"
              type="text"
              placeholder="Search by product name, batch no, category, GRN..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Sale type</span>
            <select
              className="input"
              value={saleType}
              onChange={handleSaleTypeChange}
            >
              <option>Inventory</option>
              <option>Direct Purchase</option>
            </select>
          </label>

          {saleType === 'Inventory' ? (
            <>
              <div className="batch-list">
                {filteredItems.length === 0 ? (
                  <div className="batch-empty">No inventory matches.</div>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`batch-item${
                        item.id === selectedId ? ' active' : ''
                      }`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="batch-title">{item.name}</div>
                      <div className="batch-meta">
                        <span>Batch {item.batchNumber || '-'}</span>
                        <span>Qty {item.quantity}</span>
                        <span>{item.category}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="form-section">Dispatch Details</div>

              <label className="field">
                <span>Dispatch quantity</span>
                <input
                  className="input"
                  type="number"
                  placeholder="Sale quantity"
                  value={dispatchQty}
                  onChange={(event) => setDispatchQty(event.target.value)}
                />
              </label>

              <label className="field">
                <span>Destination</span>
                <input
                  className="input"
                  type="text"
                  placeholder="Buyer name, branch, delivery point..."
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <div className="form-section">Direct Sale Details</div>

              <div className="direct-grid">
                <label className="field">
                  <span>Product name</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Air Filter"
                    value={directForm.name}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <select
                    className="input"
                    value={directForm.category}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option>Engine</option>
                    <option>Fuel & Air System</option>
                    <option>Cooling System</option>
                    <option>Electrical & Ignition</option>
                    <option>Transmission & Drivetrain</option>
                    <option>Brake System</option>
                    <option>Suspension & Steering</option>
                    <option>Body Parts</option>
                    <option>Interior Parts</option>
                    <option>Filters & Service Parts</option>
                    <option>Wheels</option>
                    <option>Accessories and others</option>
                  </select>
                </label>

                <label className="field">
                  <span>Brand</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. Bosch"
                    value={directForm.brand}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        brand: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Supplier name</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. AutoHub Imports"
                    value={directForm.supplier}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        supplier: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Purchase price (ETB)</span>
                  <input
                    className="input"
                    type="number"
                    placeholder="0.00"
                    value={directForm.buyPrice}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        buyPrice: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Selling price (ETB)</span>
                  <input
                    className="input"
                    type="number"
                    placeholder="0.00"
                    value={directForm.sellPrice}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        sellPrice: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Quantity</span>
                  <input
                    className="input"
                    type="number"
                    placeholder="0"
                    value={directForm.quantity}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>Destination</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="Buyer name, branch, delivery point..."
                    value={directForm.destination}
                    onChange={(event) =>
                      setDirectForm((prev) => ({
                        ...prev,
                        destination: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </>
          )}
        </div>

        <div className="form-col">
          <div className="form-section">Transaction Preview</div>
          <div className="preview-panel">
            {transactionPreview ? (
              <div className="preview-stack">
                <div className="preview-title">{transactionPreview.name}</div>
                <div className="preview-meta">
                  {transactionPreview.category} • Qty {transactionPreview.qty || 0}
                </div>
                {transactionPreview.batchNumber ? (
                  <div className="preview-meta">
                    Batch {transactionPreview.batchNumber} • Avl {transactionPreview.available}
                  </div>
                ) : null}
                <div className="preview-metric">
                  Revenue <strong>{formatMoney(transactionPreview.revenue)}</strong>
                </div>
                <div className="preview-metric">
                  COGS <strong>{formatMoney(transactionPreview.cogs)}</strong>
                </div>
                <div className="preview-metric">
                  Profit <strong>{formatMoney(transactionPreview.profit)}</strong>
                </div>
                <div className="preview-meta">
                  Destination {transactionPreview.destination || '-'}
                </div>
              </div>
            ) : (
              'Select a batch and enter quantity to preview'
            )}
          </div>

          {error ? <div className="form-error">{error}</div> : null}
        </div>

        <div className="form-actions">
          <button className="ghost" type="button" onClick={handleReset}>
            Reset
          </button>
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Finalize STV'}
          </button>
        </div>
      </form>

      {preview ? (
        <section className="card grn-preview">
          <div className="watermark">ORIGINAL</div>
          <div className="preview-header">
            <div>
              <div className="preview-title">STV Preview</div>
              <div className="preview-sub">
                Generated {formatDate(preview.createdAt)}
              </div>
            </div>
            <div className="preview-actions">
              <button
                className="ghost"
                type="button"
                onClick={() => handlePrint(preview)}
              >
                Print
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
          </div>

          <div className="preview-grid">
            <div className="preview-item">
              <span>STV ID</span>
              <strong>{preview.id}</strong>
            </div>
            <div className="preview-item">
              <span>Type</span>
              <strong>{preview.type || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>SKU</span>
              <strong>{preview.sku || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Batch Number</span>
              <strong>{preview.batchNumber || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Part Name</span>
              <strong>{preview.name || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Category</span>
              <strong>{preview.category || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Manufacturer</span>
              <strong>{preview.manufacturer || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>UOM</span>
              <strong>{preview.uom || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Quantity</span>
              <strong>{preview.quantity || 0}</strong>
            </div>
            <div className="preview-item">
              <span>Destination</span>
              <strong>{preview.destination || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Supplier</span>
              <strong>{preview.supplier || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Buy Price</span>
              <strong>{formatMoney(preview.buyPrice)}</strong>
            </div>
            <div className="preview-item">
              <span>Sell Price</span>
              <strong>{formatMoney(preview.sellPrice)}</strong>
            </div>
          </div>

          <div className="preview-approval">
            <div>
              <div className="preview-line" />
              <span>Approved By</span>
            </div>
            <div>
              <div className="preview-line" />
              <span>Signature</span>
            </div>
            <div>
              <div className="preview-line" />
              <span>Date</span>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  )
}
