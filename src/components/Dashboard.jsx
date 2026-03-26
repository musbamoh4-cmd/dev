import {
  IconArrowDown,
  IconArrowUp,
  IconCube,
  IconPulse,
  IconDownloadCircle,
  IconUploadCircle,
  IconMoney,
  IconClock,
  IconAlert,
  IconTrend,
  IconBox,
} from './icons'

const formatMoney = (value) =>
  `ETB ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDate = (value) =>
  new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function Dashboard({
  summary,
  status = 'offline',
  lastUpdated,
  recentInbound = [],
  recentOutbound = [],
  user,
}) {
  const safeSummary = {
    totalProducts: 0,
    activeBatches: 0,
    totalGrns: 0,
    totalStvs: 0,
    investment: 0,
    revenue: 0,
    projectedProfit: 0,
    margin: 0,
    realizedRevenue: 0,
    realizedProfit: 0,
    realizedMargin: 0,
    ...summary,
  }

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })

  const lastSyncLabel = lastUpdated
    ? formatDate(lastUpdated)
    : 'Not synced yet'
  const statusTone = status === 'live' ? 'live' : 'offline'
  const statusLabel =
    status === 'live' ? 'Live feed' : status === 'connecting' ? 'Connecting' : 'Offline'

  const kpis = [
    {
      label: 'Total Products',
      value: safeSummary.totalProducts,
      tone: 'blue',
      icon: IconCube,
    },
    {
      label: 'Active Batches',
      value: safeSummary.activeBatches,
      tone: 'purple',
      icon: IconPulse,
    },
    {
      label: 'Total GRNs',
      value: safeSummary.totalGrns,
      tone: 'green',
      icon: IconDownloadCircle,
    },
    {
      label: 'Total STVs',
      value: safeSummary.totalStvs,
      tone: 'amber',
      icon: IconUploadCircle,
    },
  ]

  const finance = [
    {
      label: 'Inventory Investment',
      value: formatMoney(safeSummary.investment),
      note: 'Total purchase cost',
      tone: 'amber',
    },
    {
      label: 'Potential Revenue',
      value: formatMoney(safeSummary.revenue),
      note: 'At selling price',
      tone: 'green',
    },
    {
      label: 'Projected Profit',
      value: formatMoney(safeSummary.projectedProfit),
      note: `${safeSummary.margin.toFixed(1)}% margin`,
      tone: 'blue',
    },
    {
      label: 'Realized Revenue',
      value: formatMoney(safeSummary.realizedRevenue),
      note: 'From STVs',
      tone: 'purple',
    },
    {
      label: 'Realized Profit',
      value: formatMoney(safeSummary.realizedProfit),
      note: `${safeSummary.realizedMargin.toFixed(1)}% margin`,
      tone: 'pink',
    },
  ]

  const statusCards = [
    { label: 'Near Expiry', value: '0', tone: 'sun', icon: IconClock },
    { label: 'Expired', value: '0', tone: 'rose', icon: IconAlert },
    { label: 'Slow Moving', value: '0', tone: 'violet', icon: IconTrend },
    { label: 'Low Stock', value: '0', tone: 'sky', icon: IconBox },
  ]

  const recentGrns = recentInbound.slice(0, 3)
  const recentStvs = recentOutbound.slice(0, 3)

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Executive Dashboard</h1>
          <p>
            Welcome back, <span className="accent">{user?.name || 'admin'}</span> • {todayLabel}
          </p>
        </div>
        <div className="header-actions">
          <div className="sync-status">
            <span className={`sync-badge ${statusTone}`}>{statusLabel}</span>
            <span className="sync-time">Last sync: {lastSyncLabel}</span>
          </div>
          <button className="primary">
            <span className="nav-ico">
              <IconArrowDown />
            </span>
            New GRN
          </button>
          <button className="ghost">
            <span className="nav-ico">
              <IconArrowUp />
            </span>
            New STV
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <article className="card kpi-card" key={kpi.label}>
            <div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
            </div>
            <div className={`kpi-icon tone-${kpi.tone}`}>
              <kpi.icon />
            </div>
          </article>
        ))}
      </div>

      <div className="section-title">
        <span className="section-ico">
          <IconMoney />
        </span>
        Financial Overview
      </div>

      <div className="finance-grid">
        {finance.map((item) => (
          <article className="card stat-card" key={item.label}>
            <div className="stat-label">{item.label}</div>
            <div className={`stat-value tone-${item.tone}`}>{item.value}</div>
            <div className="stat-note">{item.note}</div>
          </article>
        ))}
      </div>

      <div className="status-grid">
        {statusCards.map((statusItem) => (
          <article
            className={`card status-card tone-${statusItem.tone}`}
            key={statusItem.label}
          >
            <div className="status-ico">
              <statusItem.icon />
            </div>
            <div>
              <div className="status-value">{statusItem.value}</div>
              <div className="status-label">{statusItem.label}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="recent-grid">
        <article className="card recent-card">
          <div className="recent-head">
            <div className="recent-title">
              <span className="section-ico">
                <IconDownloadCircle />
              </span>
              Recent GRNs
            </div>
            <button className="link">View All →</button>
          </div>
          {recentGrns.length === 0 ? (
            <div className="empty">No GRNs yet</div>
          ) : (
            <div className="recent-list">
              {recentGrns.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div>
                    <div className="recent-name">{item.name}</div>
                    <div className="recent-meta">
                      Batch {item.batchNumber || '-'} • Qty {item.quantity}
                    </div>
                  </div>
                  <div className="recent-date">{formatDate(item.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="card recent-card">
          <div className="recent-head">
            <div className="recent-title">
              <span className="section-ico">
                <IconUploadCircle />
              </span>
              Recent STVs
            </div>
            <button className="link">View All →</button>
          </div>
          {recentStvs.length === 0 ? (
            <div className="empty">No STVs yet</div>
          ) : (
            <div className="recent-list">
              {recentStvs.map((item) => (
                <div className="recent-item" key={item.id}>
                  <div>
                    <div className="recent-name">{item.name}</div>
                    <div className="recent-meta">
                      Qty {item.quantity} • {item.destination || 'Dispatch'}
                    </div>
                  </div>
                  <div className="recent-date">{formatDate(item.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      <section className="card table-card" aria-hidden="true" />
    </section>
  )
}
