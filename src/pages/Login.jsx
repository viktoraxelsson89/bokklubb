import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { loginUser } from '../firebase/auth.js'
import { useAuth } from '../context/AuthContext.jsx'
import { DS, LORA, SYS } from '../styles/tokens.js'
import { Card, PrimaryBtn, LogoBadge } from '../components/ui.jsx'

const CLUB_NAME = 'Shuu of Books'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginUser(email, password)
      navigate('/')
    } catch {
      setError('Fel e-post eller lösenord')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: DS.gradientBg,
      fontFamily: SYS,
      color: DS.ink,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(env(safe-area-inset-top) + 24px) 16px calc(env(safe-area-inset-bottom) + 24px)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          marginBottom: 28,
        }}>
          <LogoBadge size={56} />
          <h1 style={{
            fontFamily: LORA,
            fontWeight: 600,
            fontSize: '1.6rem',
            margin: 0,
            color: DS.ink,
            letterSpacing: '0.01em',
          }}>{CLUB_NAME}</h1>
          <p style={{
            margin: 0,
            fontSize: '0.78rem',
            color: DS.ash,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>Bokklubb</p>
        </div>

        <Card style={{ padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field
              label="E-post"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />
            <Field
              label="Lösenord"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            {error && (
              <div style={{
                background: 'rgba(180,60,60,0.08)',
                color: '#8b3a3a',
                fontSize: '0.8rem',
                padding: '8px 12px',
                borderRadius: 12,
                outline: '1px solid rgba(180,60,60,0.18)',
              }}>{error}</div>
            )}
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <PrimaryBtn type="submit">
                {submitting ? 'Loggar in…' : 'Logga in'}
              </PrimaryBtn>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, autoComplete }) {
  const [focused, setFocused] = useState(false)
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: DS.ash,
      }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          color: DS.ink,
          background: 'rgba(255,255,255,0.7)',
          border: 'none',
          outline: focused
            ? `1.5px solid ${DS.sage}`
            : '1px solid rgba(156,153,143,0.25)',
          borderRadius: 14,
          padding: '11px 14px',
          transition: 'outline 0.15s ease, background 0.15s ease',
          boxShadow: focused ? 'none' : DS.shadowInset,
        }}
      />
    </label>
  )
}
