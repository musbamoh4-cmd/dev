import { useEffect, useState } from 'react'

const titles = {
  add: 'Add User',
  edit: 'Edit User',
  invite: 'Invite User',
}

const primaryLabels = {
  add: 'Create User',
  edit: 'Save Changes',
  invite: 'Send Invite',
}

export default function UserModal({
  open,
  mode,
  onClose,
  onSubmit,
  existingEmails,
  existingUsernames,
  initialUser,
  roleOptions,
}) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const defaultRole =
    roleOptions.find((option) => option === 'Staff') || roleOptions[0] || 'Staff'
  const [role, setRole] = useState(defaultRole)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }
    setName(initialUser?.name || '')
    setUsername(initialUser?.username || '')
    setEmail(initialUser?.email || '')
    setRole(initialUser?.role || defaultRole)
    setPassword('')
    setError('')
  }, [open, initialUser, roleOptions, mode, defaultRole])

  if (!open) {
    return null
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedName) {
      setError('Name is required.')
      return
    }

    if (!trimmedUsername) {
      setError('Username is required.')
      return
    }

    if (!trimmedEmail) {
      setError('Email is required.')
      return
    }

    const normalizedEmail = trimmedEmail.toLowerCase()
    const existingEmail = existingEmails.includes(normalizedEmail)
    const currentEmail = initialUser?.email?.toLowerCase()

    if (existingEmail && normalizedEmail !== currentEmail) {
      setError('That email is already in use.')
      return
    }

    const normalizedUsername = trimmedUsername.toLowerCase()
    const existingUsername = existingUsernames.includes(normalizedUsername)
    const currentUsername = initialUser?.username?.toLowerCase()

    if (existingUsername && normalizedUsername !== currentUsername) {
      setError('That username is already in use.')
      return
    }

    onSubmit({
      name: trimmedName,
      username: trimmedUsername,
      email: trimmedEmail,
      role,
      password: trimmedPassword,
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{titles[mode]}</div>
            <div className="modal-sub">
              {mode === 'invite'
                ? 'Invite a new team member by email.'
                : 'Update profile details and access level.'}
            </div>
          </div>
          <button className="ghost-x" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
            />
          </label>
          <label className="field">
            <span>Username</span>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </label>
          <label className="field">
            <span>Role</span>
            <select
              className="input"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {mode === 'edit' ? (
            <label className="field">
              <span>New password (optional)</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank to keep"
              />
            </label>
          ) : (
            <div className="muted">
              A temporary 6-digit password will be generated automatically.
            </div>
          )}
          {error ? <div className="field-error">{error}</div> : null}

          <div className="modal-actions">
            <button className="ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit">
              {primaryLabels[mode]}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
