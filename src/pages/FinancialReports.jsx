import { useMemo } from 'react'

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatPercent = (value) =>
  `${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`

export default function FinancialReports({ inventory = [], outbound = [] }) {
  const metrics = useMemo(() => {
    let investment = 0
    let potentialRevenue = 0
    let totalQty = 0

    inventory.forEach((item) => {
      const qty = Number(item.quantity || 0)
      const buy = Number(item.buyPrice || 0)
      const sell = Number(item.sellPrice || 0)
      totalQty += qty
      investment += qty * buy
      potentialRevenue += qty * sell
    })

    const projectedProfit = potentialRevenue - investment
    const projectedMargin = investment > 0 ? (projectedProfit / investment) * 100 : 0
    const wac = totalQty > 0 ? investment / totalQty : 0

    let realizedRevenue = 0
    let realizedCogs = 0

    outbound.forEach((item) => {
      const qty = Number(item.quantity || 0)
      realizedRevenue += qty * Number(item.sellPrice || 0)
      realizedCogs += qty * Number(item.buyPrice || 0)
    })

    const realizedProfit = realizedRevenue - realizedCogs
    const realizedMargin = realizedRevenue > 0 ? (realizedProfit / realizedRevenue) * 100 : 0

    return {
      investment,
      potentialRevenue,
      projectedProfit,
      projectedMargin,
      wac,
      realizedRevenue,
      realizedProfit,
      realizedMargin,
    }
  }, [inventory, outbound])

  const performance = useMemo(() => {
    const map = new Map()

    outbound.forEach((item) => {
      const key = item.name || item.sku || 'Unknown'
      const entry = map.get(key) || {
        name: key,
        category: item.category || 'General',
        qty: 0,
        revenue: 0,
        cogs: 0,
      }
      const qty = Number(item.quantity || 0)
      entry.qty += qty
      entry.revenue += qty * Number(item.sellPrice || 0)
      entry.cogs += qty * Number(item.buyPrice || 0)
      map.set(key, entry)
    })

    const list = Array.from(map.values()).map((entry) => {
      const profit = entry.revenue - entry.cogs
      const margin = entry.revenue > 0 ? (profit / entry.revenue) * 100 : 0
      return { ...entry, profit, margin }
    })

    list.sort((a, b) => b.margin - a.margin)
    return list
  }, [outbound])

  const best = performance[0]
  const worst = performance.length > 1 ? performance[performance.length - 1] : null

  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: '2-digit',
    year: '2-digit',
  })

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <h1>Financial Reports</h1>
          <p>
            Admin-only financial analytics • Weighted Average Cost • Margin
            Analysis
          </p>
        </div>
      </header>

      <div className="reports-kpis">
        <article className="card report-kpi tone-amber">
          <div>
            <div className="kpi-label">Inventory Investment</div>
            <div className="kpi-value">{formatMoney(metrics.investment)}</div>
            <div className="kpi-note">Total purchase cost (WAC)</div>
          </div>
          <div className="kpi-badge">$</div>
        </article>
        <article className="card report-kpi tone-green">
          <div>
            <div className="kpi-label">Potential Revenue</div>
            <div className="kpi-value">{formatMoney(metrics.potentialRevenue)}</div>
            <div className="kpi-note">At current selling prices</div>
          </div>
          <div className="kpi-badge">↗</div>
        </article>
        <article className="card report-kpi tone-blue">
          <div>
            <div className="kpi-label">Projected Gross Profit</div>
            <div className="kpi-value">{formatMoney(metrics.projectedProfit)}</div>
            <div className="kpi-note">
              {formatPercent(metrics.projectedMargin)} gross margin
            </div>
          </div>
          <div className="kpi-badge">➚</div>
        </article>
        <article className="card report-kpi tone-purple">
          <div>
            <div className="kpi-label">Weighted Avg Cost</div>
            <div className="kpi-value">{formatMoney(metrics.wac)}</div>
            <div className="kpi-note">Per unit across all batches</div>
          </div>
          <div className="kpi-badge">≋</div>
        </article>
        <article className="card report-kpi tone-pink">
          <div>
            <div className="kpi-label">Realized Revenue</div>
            <div className="kpi-value">{formatMoney(metrics.realizedRevenue)}</div>
            <div className="kpi-note">From completed STVs</div>
          </div>
          <div className="kpi-badge">$</div>
        </article>
        <article className="card report-kpi tone-rose">
          <div>
            <div className="kpi-label">Realized Profit</div>
            <div className="kpi-value">{formatMoney(metrics.realizedProfit)}</div>
            <div className="kpi-note">
              {formatPercent(metrics.realizedMargin)} realized margin
            </div>
          </div>
          <div className="kpi-badge">↘</div>
        </article>
      </div>

      <section className="card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <span className="section-ico">▮</span>
            Monthly Revenue vs COGS
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-dot revenue" /> Revenue
            </span>
            <span className="legend-item">
              <span className="legend-dot cogs" /> COGS
            </span>
          </div>
        </div>
        <div className="chart-area">
          <div className="bar-group">
            <div className="bar revenue h-140" />
            <div className="bar cogs h-120" />
            <div className="bar-label">{monthLabel}</div>
            <div className="bar-note">{formatMoney(metrics.realizedProfit)}</div>
          </div>
        </div>
      </section>

      <div className="performance-grid">
        <article className="card performance-card best">
          <div className="performance-title">
            <span className="performance-ico">★</span>
            Best Performing Products
          </div>
          {best ? (
            <div className="performance-body">
              <div>
                <div className="product-name">{best.name}</div>
                <div className="product-sub">
                  {best.category} • {best.qty} units sold
                </div>
              </div>
              <div className="performance-metric positive">
                {formatPercent(best.margin)}
              </div>
              <div className="performance-sub">
                {formatMoney(best.revenue)} rev
              </div>
            </div>
          ) : (
            <div className="muted">No outbound records yet.</div>
          )}
        </article>
        <article className="card performance-card worst">
          <div className="performance-title">
            <span className="performance-ico">↘</span>
            Worst Performing Products
          </div>
          {worst ? (
            <div className="performance-body">
              <div>
                <div className="product-name">{worst.name}</div>
                <div className="product-sub">
                  {worst.category} • {worst.qty} units sold
                </div>
              </div>
              <div className="performance-metric negative">
                {formatPercent(worst.margin)}
              </div>
              <div className="performance-sub">
                {formatMoney(worst.revenue)} rev
              </div>
            </div>
          ) : (
            <div className="muted">No outbound records yet.</div>
          )}
        </article>
      </div>

      <section className="card report-table">
        <div className="table-title">Inventory Valuation Detail</div>
        <div className="report-table-head">
          <div>Product</div>
          <div>Category</div>
          <div>UOM</div>
          <div>Qty on Hand</div>
          <div>Buy Price (WAC)</div>
          <div>Sell Price</div>
          <div>Investment Value</div>
          <div>Selling Value</div>
          <div>Margin</div>
        </div>
        {inventory.length === 0 ? (
          <div className="report-table-row">
            <div className="muted">No inventory data yet.</div>
          </div>
        ) : (
          inventory.map((item) => {
            const qty = Number(item.quantity || 0)
            const buy = Number(item.buyPrice || 0)
            const sell = Number(item.sellPrice || 0)
            const investmentValue = qty * buy
            const sellingValue = qty * sell
            const margin = buy > 0 ? ((sell - buy) / buy) * 100 : 0

            return (
              <div className="report-table-row" key={item.id}>
                <div className="table-product">
                  <div className="product-name">{item.name}</div>
                </div>
                <div>
                  <span className="pill">{item.category}</span>
                </div>
                <div>
                  <span className="pill">{item.uom}</span>
                </div>
                <div>{qty}</div>
                <div>{formatMoney(buy)}</div>
                <div className="tone-green">{formatMoney(sell)}</div>
                <div className="tone-amber">{formatMoney(investmentValue)}</div>
                <div className="tone-green">{formatMoney(sellingValue)}</div>
                <div className={margin < 0 ? 'tone-rose' : 'tone-green'}>
                  {formatPercent(margin)}
                </div>
              </div>
            )
          })
        )}
      </section>
    </section>
  )
}
