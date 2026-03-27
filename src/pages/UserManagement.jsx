import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import UsersTable from '../components/UsersTable'
import RolePermissions from '../components/RolePermissions'
import UserModal from '../components/UserModal'
import ConfirmDialog from '../components/ConfirmDialog'

const ROLE_OPTIONS = ['Admin', 'Staff']
const STATUS_OPTIONS = ['active', 'invited', 'deactivated']

const initialUsers = [
  {
    id: 'admin',
    name: 'Admin',
    username: 'admin',
    email: 'admin@autosparehub.com',
    role: 'Admin',
    status: 'active',
    createdAt: '3/12/2026',
    lastAction: 'Current session',
    protected: true,
    password: 'Memus@7',
    mustChangePassword: false,
  },
  {
    id: 'admin-dfeleke',
    name: 'dfeleke',
    username: 'dfeleke',
    email: 'dfeleke@autosparehub.com',
    role: 'Admin',
    status: 'active',
    createdAt: '3/27/2026',
    lastAction: 'Seeded admin',
    protected: true,
    password: 'Dave@12',
    mustChangePassword: false,
  },
]

const formatDate = () =>
  new Date().toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })

const createId = () => `user-${Math.random().toString(36).slice(2, 8)}`

const ensureSeedUsers = (users) => {
  const existing = new Set(
    users.map((user) => (user.username || '').toLowerCase()),
  )
  const missing = initialUsers.filter(
    (user) => !existing.has(user.username.toLowerCase()),
  )
  return missing.length ? [...users, ...missing] : users
}

const getInitials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  const first = parts[0][0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}

const stampAction = (label) => `${label} on ${formatDate()}`

const createTempPassword = () =>
  String(Math.floor(100000 + Math.random() * 900000))

export default function UserManagement() {
  const [users, setUsers] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('app_users') || 'null')
      if (Array.isArray(stored) && stored.length > 0) {
        return ensureSeedUsers(stored)
      }
    } catch {
      // Ignore storage errors and fallback to defaults.
    }
    return initialUsers
  })
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
  })
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [generatedCredential, setGeneratedCredential] = useState(null)

  const filteredUsers = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.username || '').toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search)

      const matchesRole =
        filters.role === 'all' || user.role === filters.role

      const matchesStatus =
        filters.status === 'all' || user.status === filters.status

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, filters])

  const existingEmails = useMemo(
    () => users.map((user) => user.email.toLowerCase()),
    [users],
  )

  const existingUsernames = useMemo(
    () => users.map((user) => (user.username || '').toLowerCase()),
    [users],
  )

  useEffect(() => {
    try {
      localStorage.setItem('app_users', JSON.stringify(users))
    } catch {
      // Ignore storage errors.
    }
  }, [users])

  const handleFilterChange = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleAddUser = () => {
    setModal({ mode: 'add', user: null })
  }

  const handleInviteUser = () => {
    setModal({ mode: 'invite', user: null })
  }

  const handleEditUser = (user) => {
    setModal({ mode: 'edit', user })
  }

  const handleModalSubmit = (payload) => {
    if (!modal) return

    if (modal.mode === 'edit') {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === modal.user.id
            ? {
                ...user,
                name: payload.name,
                username: payload.username,
                email: payload.email,
                role: payload.role,
                initials: getInitials(payload.name),
                lastAction: stampAction('Profile updated'),
                password: payload.password ? payload.password : user.password,
              }
            : user,
        ),
      )
      setModal(null)
      return
    }

    const status = modal.mode === 'invite' ? 'invited' : 'active'
    const lastAction =
      modal.mode === 'invite'
        ? stampAction('Invite sent')
        : stampAction('User created')

    const tempPassword = createTempPassword()

    const newUser = {
      id: createId(),
      name: payload.name,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      status,
      createdAt: formatDate(),
      lastAction,
      initials: getInitials(payload.name),
      protected: false,
      password: tempPassword,
      mustChangePassword: true,
    }

    setUsers((prev) => [newUser, ...prev])
    setGeneratedCredential({
      name: newUser.name,
      username: newUser.username,
      password: tempPassword,
    })
    setModal(null)
  }

  const handleRoleChange = (id, role) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? { ...user, role, lastAction: stampAction(`Role set to ${role}`) }
          : user,
      ),
    )
  }

  const handleResetPassword = (user) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? { ...item, lastAction: stampAction('Password reset sent') }
          : item,
      ),
    )
  }

  const handleResendInvite = (user) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? { ...item, lastAction: stampAction('Invite resent') }
          : item,
      ),
    )
  }

  const handleToggleStatus = (user) => {
    if (user.status === 'active') {
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: 'deactivated',
                lastAction: stampAction('User deactivated'),
              }
            : item,
        ),
      )
      return
    }

    if (user.status === 'invited') {
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? {
                ...item,
                status: 'deactivated',
                lastAction: stampAction('Invite revoked'),
              }
            : item,
        ),
      )
      return
    }

    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status: 'active',
              lastAction: stampAction('User reactivated'),
            }
          : item,
      ),
    )
  }

  const handleDeleteRequest = (user) => {
    setConfirm({
      user,
      title: `Delete ${user.name}?`,
      description: 'This permanently removes the user and access history.',
      confirmLabel: 'Delete user',
    })
  }

  const handleDeleteConfirm = () => {
    if (!confirm) return
    setUsers((prev) => prev.filter((user) => user.id !== confirm.user.id))
    setConfirm(null)
  }

  const filteredWithInitials = filteredUsers.map((user) => ({
    ...user,
    initials: user.initials || getInitials(user.name || 'User'),
  }))

  return (
    <section className="user-management">
      <PageHeader onAdd={handleAddUser} onInvite={handleInviteUser} />
      {generatedCredential ? (
        <div className="card info-card">
          <div className="info-title">Temporary login created</div>
          <div className="muted">
            User: {generatedCredential.name} ({generatedCredential.username})
          </div>
          <div className="stat-value">Password: {generatedCredential.password}</div>
          <button
            className="ghost"
            type="button"
            onClick={() => setGeneratedCredential(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
      <UsersTable
        users={filteredWithInitials}
        totalCount={users.length}
        filters={filters}
        onFilterChange={handleFilterChange}
        roleOptions={ROLE_OPTIONS}
        statusOptions={STATUS_OPTIONS}
        onEdit={handleEditUser}
        onDelete={handleDeleteRequest}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
        onRoleChange={handleRoleChange}
        onResendInvite={handleResendInvite}
      />
      <RolePermissions />

      <UserModal
        open={Boolean(modal)}
        mode={modal?.mode}
        onClose={() => setModal(null)}
        onSubmit={handleModalSubmit}
        existingEmails={existingEmails}
        existingUsernames={existingUsernames}
        initialUser={modal?.user}
        roleOptions={ROLE_OPTIONS}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        onConfirm={handleDeleteConfirm}
        onClose={() => setConfirm(null)}
      />
    </section>
  )
}
