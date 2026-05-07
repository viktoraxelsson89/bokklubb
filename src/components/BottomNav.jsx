import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DS } from '../styles/tokens.js'

const NAV_ITEMS = [
  { id: 'bookshelf', label: 'Bokhylla',  to: '/',         match: p => p === '/' || p.startsWith('/books/') },
  { id: 'seasons',   label: 'Säsonger',  to: '/seasons',  match: p => p === '/seasons' },
  { id: 'tips',      label: 'Tips',      to: '/tips',     match: p => p === '/tips' },
  { id: 'members',   label: 'Klubben',   to: '/members',  match: p => p === '/members' },
  { id: 'stats',     label: 'Statistik', to: '/stats',    match: p => p === '/stats' },
  { id: 'planning',  label: 'Planering', to: '/planning', match: p => p === '/planning' },
  { id: 'mer',       label: 'Mer',       to: null,        match: p => p === '/kokbok' || p.startsWith('/recipes') || p === '/bilder' },
]

const MER_ITEMS = [
  { id: 'food',   label: 'Kokbok', to: '/kokbok' },
  { id: 'photos', label: 'Bilder', to: '/bilder' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [merOpen, setMerOpen] = useState(false)

  function handleNavClick(item) {
    if (item.id === 'mer') {
      setMerOpen(o => !o)
    } else {
      setMerOpen(false)
      navigate(item.to)
    }
  }

  function handleMerItemClick(to) {
    setMerOpen(false)
    navigate(to)
  }

  return (
    <>
      {merOpen && (
        <div
          onClick={() => setMerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
      )}

      <nav style={{
        background: DS.darkBg,
        display: 'flex',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'relative',
        zIndex: 92,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}>
        {merOpen && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            background: '#1e1d1c',
            borderRadius: '16px 0 0 0',
            padding: '6px 0 8px',
            boxShadow: '-4px -4px 20px rgba(18,19,18,0.35)',
            minWidth: 148,
          }}>
            {MER_ITEMS.map(item => (
              <MerItemButton
                key={item.id}
                label={item.label}
                icon={iconFor(item.id, false)}
                onClick={() => handleMerItemClick(item.to)}
              />
            ))}
          </div>
        )}

        {NAV_ITEMS.map(item => {
          const active = item.id === 'mer' ? (merOpen || item.match(pathname)) : item.match(pathname)
          return (
            <NavBtn
              key={item.id}
              label={item.label}
              icon={iconFor(item.id, active)}
              active={active}
              onClick={() => handleNavClick(item)}
            />
          )
        })}
      </nav>
    </>
  )
}

function NavBtn({ label, icon, active, onClick }) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '8px 2px',
        minHeight: 62,
        fontFamily: 'inherit',
        transition: 'background 0.12s ease, transform 0.12s ease',
        minWidth: 0,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transform: pressed ? 'scale(0.96)' : 'none',
      }}
    >
      <div style={{
        width: 34, height: 26, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: pressed
          ? 'rgba(244,243,241,0.1)'
          : active ? 'rgba(186,209,150,0.15)' : 'transparent',
        border: active ? '1px solid rgba(186,209,150,0.3)' : '1px solid transparent',
        transition: 'background 0.12s ease, border-color 0.15s ease',
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: '0.6rem', fontWeight: active ? 600 : 400,
        color: active ? DS.sage : 'rgba(244,243,241,0.42)',
        letterSpacing: '0.01em', transition: 'color 0.15s',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '100%', padding: '0 2px',
      }}>{label}</span>
    </button>
  )
}

function MerItemButton({ label, icon, onClick }) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onBlur={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: 44,
        padding: '11px 18px',
        background: pressed ? 'rgba(244,243,241,0.08)' : 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'rgba(244,243,241,0.85)',
        fontSize: '0.82rem',
        fontFamily: 'inherit',
        textAlign: 'left',
        transition: 'background 0.12s ease, transform 0.12s ease',
        transform: pressed ? 'scale(0.98)' : 'none',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function iconFor(id, active) {
  switch (id) {
    case 'bookshelf': return <IconBook     active={active} />
    case 'seasons':   return <IconCal      active={active} />
    case 'tips':      return <IconTips     active={active} />
    case 'members':   return <IconPeople   active={active} />
    case 'stats':     return <IconChart    active={active} />
    case 'planning':  return <IconPlanning active={active} />
    case 'mer':       return <IconMer      active={active} />
    case 'food':      return <IconFood     active={active} />
    case 'photos':    return <IconPhoto    active={active} />
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
function IconTips({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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
function IconPlanning({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="15" x2="10" y2="15" />
      <line x1="14" y1="15" x2="16" y2="15" />
    </svg>
  )
}
function IconMer({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="5"  cy="12" r="1" fill={strokeColor(active)} stroke="none" />
      <circle cx="12" cy="12" r="1" fill={strokeColor(active)} stroke="none" />
      <circle cx="19" cy="12" r="1" fill={strokeColor(active)} stroke="none" />
    </svg>
  )
}
function IconFood({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={strokeColor(active)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}
