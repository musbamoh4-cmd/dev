import { useState } from 'react'

export default function ChangePassword({ user, onComplete }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const trimmedPassword = password.trim()
    if (!trimmedPassword) {
      setError('New password is required.')
      return
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (trimmedPassword !== confirm.trim()) {
      setError('Passwords do not match.')
      return
    }

    let updatedUser = null

    try {
      const stored = JSON.parse(localStorage.getItem('app_users') || '[]')
      if (Array.isArray(stored)) {
        const next = stored.map((item) => {
          if (item.id === user?.id || item.username === user?.username) {
            updatedUser = {
              ...item,
              password: trimmedPassword,
              mustChangePassword: false,
              lastAction: 'Password updated',
            }
            return updatedUser
          }
          return item
        })
        localStorage.setItem('app_users', JSON.stringify(next))
      }
    } catch {
      // Ignore storage errors.
    }

    const fallbackUser = {
      ...user,
      mustChangePassword: false,
    }

    if (onComplete) {
      onComplete(updatedUser || fallbackUser)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">AutoSpare Hub</div>
          <div className="auth-title">Change Password</div>
          <div className="auth-sub">
            You must update your temporary password to continue.
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>New password</span>
            <input
              className="input"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input
              className="input"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary auth-submit" type="submit">
            Update Password
          </button>
        </form>

        <div className="auth-footer">
          Logged in as {user?.username || 'user'}
        </div>
      </div>
    </div>
  )
}
