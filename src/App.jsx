import { useMemo, useState } from 'react'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import UserManagement from './pages/UserManagement'
import Inventory from './pages/Inventory'
import Inbound from './pages/Inbound'
import Outbound from './pages/Outbound'
import FinancialReports from './pages/FinancialReports'
import SignIn from './pages/SignIn'
import ChangePassword from './pages/ChangePassword'
import useRealtimeData from './hooks/useRealtimeData'

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || 'null')
    } catch {
      return null
    }
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const {
    inventory: inventoryItems,
    inbound: inboundItems,
    outbound: outboundItems,
    status,
    lastUpdated,
    registerInbound,
    registerOutbound,
  } = useRealtimeData()

  const summary = useMemo(() => {
    const productSet = new Set()
    const batchSet = new Set()
    let investment = 0
    let revenue = 0
    let realizedRevenue = 0
    let realizedCogs = 0

    inventoryItems.forEach((item) => {
      if (item.name) {
        productSet.add(item.name.trim().toLowerCase())
      }
      if (item.batchNumber) {
        batchSet.add(item.batchNumber.trim().toLowerCase())
      }
      investment += Number(item.buyPrice || 0) * Number(item.quantity || 0)
      revenue += Number(item.sellPrice || 0) * Number(item.quantity || 0)
    })

    outboundItems.forEach((item) => {
      const qty = Number(item.quantity || 0)
      realizedRevenue += Number(item.sellPrice || 0) * qty
      realizedCogs += Number(item.buyPrice || 0) * qty
    })

    const projectedProfit = revenue - investment
    const margin = investment > 0 ? (projectedProfit / investment) * 100 : 0
    const realizedProfit = realizedRevenue - realizedCogs
    const realizedMargin =
      realizedRevenue > 0 ? (realizedProfit / realizedRevenue) * 100 : 0

    return {
      totalProducts: productSet.size,
      activeBatches: batchSet.size,
      totalGrns: inboundItems.length,
      totalStvs: outboundItems.length,
      investment,
      revenue,
      projectedProfit,
      margin,
      realizedRevenue,
      realizedProfit,
      realizedMargin,
    }
  }, [inventoryItems, inboundItems, outboundItems])

  const existingBatches = useMemo(
    () =>
      new Set(
        inventoryItems
          .map((item) => item.batchNumber?.trim().toLowerCase())
          .filter(Boolean),
      ),
    [inventoryItems],
  )

  const handleSignIn = (nextUser) => {
    if (!nextUser) return
    localStorage.setItem('auth_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const handlePasswordUpdated = (nextUser) => {
    if (!nextUser) return
    localStorage.setItem('auth_user', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const handleSignOut = () => {
    try {
      localStorage.removeItem('auth_user')
      sessionStorage.clear()
    } catch (error) {
      // Ignore storage errors and still redirect.
    }
    setUser(null)
    window.location.assign('/')
  }

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />
  }

  if (user.mustChangePassword) {
    return <ChangePassword user={user} onComplete={handlePasswordUpdated} />
  }

  return (
    <div className={`app${sidebarCollapsed ? ' collapsed' : ''}`}>
      <Sidebar
        user={user}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                summary={summary}
                status={status}
                lastUpdated={lastUpdated}
                recentInbound={inboundItems}
                recentOutbound={outboundItems}
                user={user}
              />
            }
          />
          <Route
            path="/inventory"
            element={<Inventory items={inventoryItems} />}
          />
          <Route
            path="/inbound"
            element={
              <Inbound
                onRegister={registerInbound}
                existingBatches={existingBatches}
                currentUserName={user?.name}
                history={inboundItems}
              />
            }
          />
          <Route
            path="/outbound"
            element={
              <Outbound
                items={inventoryItems}
                history={outboundItems}
                onDispatch={registerOutbound}
              />
            }
          />
          <Route
            path="/reports"
            element={
              user?.role === 'Admin' ? (
                <FinancialReports
                  inventory={inventoryItems}
                  outbound={outboundItems}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/users"
            element={
              user?.role === 'Admin' ? <UserManagement /> : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

