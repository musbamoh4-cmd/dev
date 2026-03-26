import { IconPlus } from './icons'

export default function PageHeader({ onAdd, onInvite }) {
  return (
    <header className="page-header">
      <div>
        <h1>User Management</h1>
        <p>Manage staff access, roles, and audit trails.</p>
      </div>
      <div className="header-actions">
        <button className="ghost" onClick={onInvite} type="button">
          Invite User
        </button>
        <button className="primary" onClick={onAdd} type="button">
          <span className="nav-ico">
            <IconPlus />
          </span>
          Add User
        </button>
      </div>
    </header>
  )
}
