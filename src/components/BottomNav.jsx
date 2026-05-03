import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DS } from '../styles/tokens.js'

const PRIMARY = [
  { id: 'bookshelf', label: 'Bokhylla',  to: '/',         match: p => p === '/' || p.startsWith('/books/') },
  { id: 'seasons',   label: 'Säsonger',  to: '/seasons',  match: p => p === '/seasons' },
  { id: 'members',   label: 'Medlemmar', to: '/members',  match: p => p === '/members' },
  { id: 'stats',     label: 'Statistik', to: '/stats',    match: p => p === '/stats' },
]

const SECONDARY = [
  { id: 'food',   label: 'Kokbok', to: '/kokbok' },
  { id: 'photos', label: 'Bilder', to: '/bilder' },
]

const SECONDARY_PATHS = SECONDARY.map(s => s.to)

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeInSecondary = SECONDARY_PATHS.includes(pathname)

  function go(to) {
    setDrawerOpen(false)
    navigate(to)
  }

  return (
    <>
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(18,19,18,0.4)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              background: DS.bone,
              borderRadius: '20px 20px 0 0',
              padding: '14px 16px 88px',
              boxShadow: '0 -8px 32px rgba(18,19,18,0.14)',
              position: 'relative', overflow: 'hidden',
              animation: 'bnDrawerUp 0.2s ease',
            }}
          >
            <style>{`@keyframes bnDrawerUp { from { transform: translateY(20px); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
            <div style={{ position: 'absolute', inset: 0, background: DS.sheen, pointerEvents: 'none' }} />
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(18,19,18,0.12)',
              margin: '0 auto 16px',
            }} />
            <div style={{
              fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              color: DS.ash, marginBottom: 10, position: 'relative',
            }}>Mer</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, position: 'relative' }}>
              {SECONDARY.map(({ id, label, to }) => {
                const active = pathname === to
                return (
                  <button
                    key={id}
                    onClick={() => go(to)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 14px', borderRadius: 16,
                      background: active ? 'rgba(186,209,150,0.15)' : 'rgba(18,19,18,0.04)',
                      border: active ? '1px solid rgba(186,209,150,0.35)' : '1px solid rgba(156,153,143,0.15)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.12s',
                      textAlign: 'left',
                    }}
                  >
                    {id === 'food' ? <IconFood active={active} /> : <IconPhoto active={active} />}
                    <span style={{ fontSize: '0.84rem', fontWeight: 500, color: active ? DS.ink : DS.soft }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <nav style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        height: 62, background: DS.darkBg,
        display: 'flex',
        paddingBottom: 6,
        zIndex: 100,
      }}>
        {PRIMARY.map(({ id, label, to, match }) => {
          const active = match(pathname)
          return (
            <NavBtn
              key={id}
              label={label}
              icon={iconFor(id, active)}
              active={active}
              onClick={() => go(to)}
            />
          )
        })}
        <NavBtn
          label="Mer"
          icon={<IconMoreDots c={(activeInSecondary || drawerOpen) ? DS.sage : 'rgba(244,243,241,0.42)'} />}
          active={activeInSecondary || drawerOpen}
          onClick={() => setDrawerOpen(o => !o)}
        />
      </nav>
    </>
  )
}

function NavBtn({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '6px 0 0',
        fontFamily: 'inherit',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{
        width: 34, height: 26, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(186,209,150,0.15)' : 'transparent',
        border: active ? '1px solid rgba(186,209,150,0.3)' : '1px solid transparent',
        transition: 'all 0.2s',
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: '0.62rem', fontWeight: active ? 600 : 400,
        color: active ? DS.sage : 'rgba(244,243,241,0.42)',
        letterSpacing: '0.01em', transition: 'color 0.15s',
      }}>{label}</span>
    </button>
  )
}

function iconFor(id, active) {
  switch (id) {
    case 'bookshelf': return <IconBook   active={active} />
    case 'seasons':   return <IconCal    active={active} />
    case 'members':   return <IconPeople active={active} />
    case 'stats':     return <IconChart  active={active} />
    default:          return null
  }
}

function strokeColor(active) {
  return active ? DS.sage : 'rgba(244,243,241,0.4)'
}

function IconBook({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}
function IconCal({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function IconPeople({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconChart({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
function IconFood({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? DS.sage : DS.soft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  )
}
function IconPhoto({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? DS.sage : DS.soft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}
function IconMoreDots({ c }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.8" fill={c} />
      <circle cx="12" cy="12" r="1.8" fill={c} />
      <circle cx="19" cy="12" r="1.8" fill={c} />
    </svg>
  )
}
