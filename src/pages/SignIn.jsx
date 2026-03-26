import { useState } from 'react'

const defaultUsers = [
  {
    id: 'admin',
    name: 'Admin',
    username: 'admin',
    password: 'Memus@7',
    role: 'Admin',
    status: 'active',
    mustChangePassword: false,
  },
]

const loadUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('app_users') || 'null')
    if (Array.isArray(stored) && stored.length > 0) {
      return stored
    }
  } catch {
    // Ignore and fallback to defaults.
  }
  return defaultUsers
}

export default function SignIn({ onSignIn }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const trimmedUser = username.trim()
    const trimmedPassword = password.trim()

    if (!trimmedUser) {
      setError('Username is required.')
      return
    }
    if (!trimmedPassword) {
      setError('Password is required.')
      return
    }

    const users = loadUsers()
    const match = users.find(
      (item) => (item.username || '').toLowerCase() === trimmedUser.toLowerCase(),
    )

    const fallbackAdmin =
      match?.username === 'admin' && trimmedPassword === 'Memus@7'
    const passwordMatches = match?.password
      ? match.password === trimmedPassword
      : fallbackAdmin

    if (!match || !passwordMatches) {
      setError('Invalid username or password.')
      return
    }

    if (match.status && match.status !== 'active') {
      setError('This account is not active.')
      return
    }

    const user = {
      id: match.id,
      name: match.name,
      username: match.username,
      role: match.role || 'Staff',
      signedInAt: new Date().toISOString(),
      mustChangePassword: Boolean(match.mustChangePassword),
    }

    if (onSignIn) {
      onSignIn(user)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">AutoSpare Hub</div>
          <div className="auth-title">Sign In</div>
          <div className="auth-sub">
            Use your account credentials to access the management suite.
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              className="input"
              type="text"
              placeholder="e.g. admin"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              className="input"
              type="password"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button className="primary auth-submit" type="submit">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          Need access? Contact your system administrator.
        </div>
      </div>
    </div>
  )
}
