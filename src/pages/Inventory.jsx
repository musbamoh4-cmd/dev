import { useMemo, useState } from 'react'

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export default function Inventory({ items = [] }) {
  const [query, setQuery] = useState('')

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return items
    }
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const haystack = [
        item.name,
        item.batchNumber,
        item.category,
        item.manufacturer,
        item.receivedBy,
        item.sku,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, query])

  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        const qty = Number(item.quantity || 0)
        const buy = Number(item.buyPrice || 0)
        acc.count += 1
        acc.qty += qty
        acc.value += qty * buy
        return acc
      },
      { count: 0, qty: 0, value: 0 },
    )
  }, [filteredItems])

  return (
    <section className="page-shell">
      <header className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Track stock, pricing, and suppliers.</p>
        </div>
      </header>

      <div className="inventory-controls">
        <div className="search-box">
          <span className="search-icon">Search</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search products, batch, category, GRN..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="inventory-stats">
          <div className="stat-chip">
            Showing: <strong>{totals.count}</strong> items
          </div>
          <div className="stat-chip">
            Total Qty: <strong>{totals.qty}</strong>
          </div>
          <div className="stat-chip">
            Total Value: <strong>{formatMoney(totals.value)}</strong>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card empty-panel">Inventory data will appear here.</div>
      ) : (
        <section className="card inventory-table">
          <div className="inventory-head">
            <div>Product</div>
            <div>SKU</div>
            <div>Category</div>
            <div>Manufacturer</div>
            <div>UOM</div>
            <div>Qty</div>
            <div>Buy Price</div>
            <div>Sell Price</div>
            <div>Reorder Level</div>
            <div>Batch</div>
            <div>Received By</div>
          </div>
          {filteredItems.map((item) => (
            <div className="inventory-row" key={item.id}>
              <div className="table-product">{item.name}</div>
              <div className="sku-chip">{item.sku || '-'}</div>
              <div>
                <span className="pill">{item.category}</span>
              </div>
              <div>{item.manufacturer || '-'}</div>
              <div>
                <span className="pill">{item.uom}</span>
              </div>
              <div>{item.quantity}</div>
              <div>{formatMoney(item.buyPrice)}</div>
              <div className="tone-green">{formatMoney(item.sellPrice)}</div>
              <div>{item.reorderLevel}</div>
              <div>{item.batchNumber || '-'}</div>
              <div>{item.receivedBy || '-'}</div>
            </div>
          ))}
        </section>
      )}
    </section>
  )
}
