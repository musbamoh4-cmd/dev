const statusLabels = {
  active: 'Active',
  invited: 'Invited',
  deactivated: 'Deactivated',
}

export default function UsersTable({
  users,
  totalCount,
  filters,
  onFilterChange,
  roleOptions,
  statusOptions,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleStatus,
  onRoleChange,
  onResendInvite,
}) {
  const resultsLabel =
    users.length === totalCount
      ? `${totalCount} users`
      : `${users.length} of ${totalCount} users`

  return (
    <section className="card table-card user-table">
      <div className="user-toolbar">
        <div className="search-box">
          <span className="search-icon">Search</span>
          <input
            className="search-input"
            placeholder="Search by name, username, email, or role"
            value={filters.search}
            onChange={(event) => onFilterChange({ search: event.target.value })}
          />
        </div>
        <select
          className="input user-filter"
          value={filters.role}
          onChange={(event) => onFilterChange({ role: event.target.value })}
        >
          <option value="all">All roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          className="input user-filter"
          value={filters.status}
          onChange={(event) => onFilterChange({ status: event.target.value })}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
        <div className="user-count">{resultsLabel}</div>
      </div>

      <div className="table-head">
        <div>User</div>
        <div>Role</div>
        <div>Status</div>
        <div>Created</div>
        <div>Actions</div>
      </div>

      {users.length === 0 ? (
        <div className="empty-panel">No users match these filters yet.</div>
      ) : (
        users.map((user) => (
          <div className="table-row" key={user.id}>
            <div className="user-cell">
              <div className="avatar">{user.initials}</div>
              <div>
                <div className="user-id">{user.name}</div>
                <div className="user-sub">
                  {(user.username || 'user') + ' • ' + user.email}
                </div>
                {user.mustChangePassword && user.password ? (
                  <div className="user-sub temp-password">
                    Temp password: {user.password}
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <select
                className="input role-select"
                value={user.role}
                onChange={(event) =>
                  onRoleChange(user.id, event.target.value)
                }
                disabled={user.protected}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={`status-pill ${user.status}`}>
                {statusLabels[user.status]}
              </span>
            </div>
            <div className="muted">{user.createdAt}</div>
            <div>
              <div className="action-group">
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => onEdit(user)}
                >
                  Edit
                </button>
                {user.status === 'invited' ? (
                  <button
                    className="action-btn"
                    type="button"
                    onClick={() => onResendInvite(user)}
                  >
                    Resend Invite
                  </button>
                ) : (
                  <button
                    className="action-btn"
                    type="button"
                    onClick={() => onResetPassword(user)}
                    disabled={user.status !== 'active'}
                  >
                    Reset Password
                  </button>
                )}
                <button
                  className="action-btn"
                  type="button"
                  onClick={() => onToggleStatus(user)}
                  disabled={user.protected}
                >
                  {user.status === 'active'
                    ? 'Deactivate'
                    : user.status === 'invited'
                    ? 'Revoke Invite'
                    : 'Reactivate'}
                </button>
                <button
                  className="action-btn is-danger"
                  type="button"
                  onClick={() => onDelete(user)}
                  disabled={user.protected}
                >
                  Delete
                </button>
              </div>
              {user.lastAction ? (
                <div className="action-note">{user.lastAction}</div>
              ) : null}
            </div>
          </div>
        ))
      )}
    </section>
  )
}
