import { useEffect, useRef, useState } from 'react'

const initialForm = {
  name: '',
  category: 'Engine',
  manufacturer: '',
  uom: 'Box',
  receivedBy: '',
  receiverSignature: '',
  reorderLevel: '10',
  batchNumber: '',
  buyPrice: '',
  sellPrice: '',
  quantity: '',
}

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

const generateSku = (category, batchNumber) => {
  const cat = (category || 'GEN')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()
  const batch = (batchNumber || 'BATCH').replace(/[^A-Za-z0-9]/g, '')
  const stamp = new Date()
  const datePart = `${stamp.getFullYear()}${String(
    stamp.getMonth() + 1,
  ).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}`
  const rand = Math.floor(100 + Math.random() * 900)
  return `ASP-${cat}-${batch.slice(-4)}-${datePart}-${rand}`
}

export default function Inbound({ onRegister, existingBatches, currentUserName }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [warnings, setWarnings] = useState({})
  const [preview, setPreview] = useState(null)
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastAutoReceivedBy = useRef('')

  useEffect(() => {
    const nextName = (currentUserName || '').trim()
    if (!nextName) {
      return
    }

    setForm((prev) => {
      const shouldUpdate =
        !prev.receivedBy || prev.receivedBy === lastAutoReceivedBy.current
      if (!shouldUpdate) {
        return prev
      }
      lastAutoReceivedBy.current = nextName
      return { ...prev, receivedBy: nextName }
    })
  }, [currentUserName])

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    if (field === 'batchNumber') {
      setErrors((prev) => ({ ...prev, batchNumber: '' }))
      setWarnings((prev) => ({ ...prev, batchNumber: '' }))
    }
  }

  const handleReset = () => {
    setForm(initialForm)
    setErrors({})
    setWarnings({})
    setServerError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')

    const batchKey = form.batchNumber.trim().toLowerCase()
    if (!batchKey) {
      setErrors((prev) => ({
        ...prev,
        batchNumber: 'Batch number is required and must be unique.',
      }))
      return
    }

    if (existingBatches?.has(batchKey)) {
      setWarnings((prev) => ({
        ...prev,
        batchNumber:
          'This batch number already exists. You can proceed, but double-check for duplicates.',
      }))
    }

    if (!form.name.trim()) {
      return
    }

    const item = {
      id: generateDocId('GR'),
      sku: generateSku(form.category, form.batchNumber),
      name: form.name.trim(),
      category: form.category,
      manufacturer: form.manufacturer.trim(),
      uom: form.uom,
      receivedBy: form.receivedBy.trim(),
      receiverSignature: form.receiverSignature.trim(),
      reorderLevel: Number(form.reorderLevel || 0),
      batchNumber: form.batchNumber.trim(),
      buyPrice: Number(form.buyPrice || 0),
      sellPrice: Number(form.sellPrice || 0),
      quantity: Number(form.quantity || 0),
      createdAt: new Date().toISOString(),
    }

    setIsSubmitting(true)
    try {
      const saved = onRegister ? await onRegister(item) : item
      setPreview(saved || item)
      setForm(initialForm)
      setErrors({})
      setWarnings({})
    } catch (error) {
      setServerError(error?.message || 'Failed to register inbound stock.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    if (!preview) {
      return
    }

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>GRN Preview</title>
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
      <h1>Goods Receipt Note (GRN)</h1>
      <div class="sub">AutoSpare Hub • ${escapeHtml(formatDate(preview.createdAt))}</div>
      <div class="grid">
      <div class="row"><div class="label">GRV ID</div><div class="value">${escapeHtml(preview.id)}</div></div>
      <div class="row"><div class="label">SKU</div><div class="value">${escapeHtml(preview.sku)}</div></div>
      <div class="row"><div class="label">Batch Number</div><div class="value">${escapeHtml(preview.batchNumber)}</div></div>
      <div class="row"><div class="label">Part Name</div><div class="value">${escapeHtml(preview.name)}</div></div>
      <div class="row"><div class="label">Category</div><div class="value">${escapeHtml(preview.category)}</div></div>
      <div class="row"><div class="label">Manufacturer</div><div class="value">${escapeHtml(preview.manufacturer || '-')}</div></div>
      <div class="row"><div class="label">UOM</div><div class="value">${escapeHtml(preview.uom)}</div></div>
      <div class="row"><div class="label">Quantity</div><div class="value">${escapeHtml(preview.quantity)}</div></div>
      <div class="row"><div class="label">Reorder Level</div><div class="value">${escapeHtml(preview.reorderLevel)}</div></div>
      <div class="row"><div class="label">Buy Price</div><div class="value">${escapeHtml(formatMoney(preview.buyPrice))}</div></div>
      <div class="row"><div class="label">Sell Price</div><div class="value">${escapeHtml(formatMoney(preview.sellPrice))}</div></div>
      <div class="row"><div class="label">Received By</div><div class="value">${escapeHtml(preview.receivedBy || '-')}</div></div>
      <div class="row"><div class="label">Signature / Stamp</div><div class="value">${escapeHtml(preview.receiverSignature || '-')}</div></div>
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

  return (
    <section className="form-shell">
      <header className="form-header">
        <div>
          <h1>Inbound — Goods Receipt Note</h1>
          <p>Register new stock • Prices in Ethiopian Birr (ETB)</p>
        </div>
        <button className="ghost" type="button">
          View History
        </button>
      </header>

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-col">
            <div className="form-section">Product Identity</div>

            <label className="field">
              <span>Part name / short description</span>
              <input
                className="input"
                type="text"
                placeholder="e.g. Brake Pad Set"
                value={form.name}
                onChange={updateField('name')}
              />
            </label>

            <label className="field">
              <span>Category / class</span>
              <select
                className="input"
                value={form.category}
                onChange={updateField('category')}
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
              <span>Manufacturer</span>
              <input
                className="input"
                type="text"
                placeholder="e.g. Bosch"
                value={form.manufacturer}
                onChange={updateField('manufacturer')}
              />
            </label>

            <label className="field">
              <span>Unit of measure (UOM)</span>
              <select
                className="input"
                value={form.uom}
                onChange={updateField('uom')}
              >
                <option>Box</option>
                <option>Set</option>
                <option>Piece</option>
                <option>Pair</option>
              </select>
            </label>

            <div className="form-section">Receiving Info</div>

            <label className="field">
              <span>Receiver name</span>
              <input
                className="input"
                type="text"
                value={form.receivedBy}
                onChange={updateField('receivedBy')}
              />
            </label>

            <label className="field">
              <span>Signature / stamp</span>
              <input
                className="input"
                type="text"
                placeholder="e.g. Signed"
                value={form.receiverSignature}
                onChange={updateField('receiverSignature')}
              />
            </label>

            <label className="field">
              <span>Reorder level (min stock alert)</span>
              <input
                className="input"
                type="number"
                value={form.reorderLevel}
                onChange={updateField('reorderLevel')}
              />
            </label>
          </div>

          <div className="form-col">
            <div className="form-section">Logistics & Batch Info</div>

            <label className="field">
              <span>Batch number</span>
              <input
                className={`input${errors.batchNumber ? ' error' : ''}${
                  warnings.batchNumber ? ' warning' : ''
                }`}
                type="text"
                placeholder="e.g. BN-2024-001"
                value={form.batchNumber}
                onChange={updateField('batchNumber')}
              />
              {errors.batchNumber ? (
                <div className="field-error">{errors.batchNumber}</div>
              ) : null}
              {!errors.batchNumber && warnings.batchNumber ? (
                <div className="field-warning">{warnings.batchNumber}</div>
              ) : null}
            </label>

            <div className="form-section">Financials (ETB)</div>

            <label className="field">
              <span>Purchase / buy price (ETB)</span>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={form.buyPrice}
                onChange={updateField('buyPrice')}
              />
            </label>

            <label className="field">
              <span>Selling price (ETB)</span>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={form.sellPrice}
                onChange={updateField('sellPrice')}
              />
            </label>

            <label className="field">
              <span>Quantity received</span>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={form.quantity}
                onChange={updateField('quantity')}
              />
            </label>
          </div>
        </div>

        {serverError ? (
          <div className="form-error">{serverError}</div>
        ) : null}

        <div className="form-actions">
          <button className="ghost" type="button" onClick={handleReset}>
            Reset Form
          </button>
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : '+ Finalize GRN'}
          </button>
        </div>
      </form>

      {preview ? (
        <section className="card grn-preview">
          <div className="watermark">ORIGINAL</div>
          <div className="preview-header">
            <div>
              <div className="preview-title">GRN Preview</div>
              <div className="preview-sub">
                Generated {formatDate(preview.createdAt)}
              </div>
            </div>
            <div className="preview-actions">
              <button className="ghost" type="button" onClick={handlePrint}>
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
              <span>GRV ID</span>
              <strong>{preview.id}</strong>
            </div>
            <div className="preview-item">
              <span>SKU</span>
              <strong>{preview.sku}</strong>
            </div>
            <div className="preview-item">
              <span>Batch Number</span>
              <strong>{preview.batchNumber}</strong>
            </div>
            <div className="preview-item">
              <span>Part Name</span>
              <strong>{preview.name}</strong>
            </div>
            <div className="preview-item">
              <span>Category</span>
              <strong>{preview.category}</strong>
            </div>
            <div className="preview-item">
              <span>Manufacturer</span>
              <strong>{preview.manufacturer || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>UOM</span>
              <strong>{preview.uom}</strong>
            </div>
            <div className="preview-item">
              <span>Quantity</span>
              <strong>{preview.quantity}</strong>
            </div>
            <div className="preview-item">
              <span>Reorder Level</span>
              <strong>{preview.reorderLevel}</strong>
            </div>
            <div className="preview-item">
              <span>Buy Price</span>
              <strong>{formatMoney(preview.buyPrice)}</strong>
            </div>
            <div className="preview-item">
              <span>Sell Price</span>
              <strong>{formatMoney(preview.sellPrice)}</strong>
            </div>
            <div className="preview-item">
              <span>Received By</span>
              <strong>{preview.receivedBy || '-'}</strong>
            </div>
            <div className="preview-item">
              <span>Signature / Stamp</span>
              <strong>{preview.receiverSignature || '-'}</strong>
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



