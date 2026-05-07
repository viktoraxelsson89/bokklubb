import { useEffect, useState } from 'react'
import { DS, LORA, SYS } from '../styles/tokens.js'
import { MEMBERS } from '../domain/constants.js'

export function Card({ children, style, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: DS.bone,
        borderRadius: 28,
        boxShadow: onClick && hovered ? '0 12px 36px rgba(18,19,18,0.12)' : DS.shadowSoft,
        outline: '1px solid rgba(156,153,143,0.2)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        cursor: onClick ? 'pointer' : 'default',
        transform: onClick && hovered ? 'translateY(-1px)' : 'none',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: DS.sheen, zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  )
}

export function RatingBadge({ rating, small }) {
  if (rating == null) return null
  let bg, color
  if (rating >= 8)      { bg = DS.sage;  color = DS.ink  }
  else if (rating >= 6) { bg = DS.sand;  color = DS.ink  }
  else if (rating >= 4) { bg = DS.grout; color = DS.bone }
  else                  { bg = DS.ink;   color = DS.bone }
  return (
    <span style={{
      background: bg, color,
      padding: small ? '2px 9px' : '3px 11px',
      borderRadius: 20,
      fontWeight: 600,
      fontSize: small ? '0.75rem' : '0.85rem',
      minWidth: small ? 30 : 36,
      textAlign: 'center',
      flexShrink: 0,
      letterSpacing: '0.01em',
      boxShadow: DS.shadowInset,
      display: 'inline-block',
    }}>
      {rating > 0 ? Number(rating).toFixed(1) : '–'}
    </span>
  )
}

const PHASE_PILL_CONFIG = {
  discussion:         { label: 'Diskussion',       bg: DS.ink,   color: DS.bone },
  preliminary_voting: { label: 'Förhandsröstning', bg: '#5b7fbe', color: '#fff' },
  revealed:           { label: 'Avslöjat',         bg: '#8b6bb1', color: '#fff' },
  finalized:          { label: 'Slutgiltig',       bg: DS.sage,  color: DS.ink },
}

export function PhasePill({ phase }) {
  const cfg = PHASE_PILL_CONFIG[phase] || { label: phase, bg: DS.grout, color: DS.bone }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      background: cfg.bg,
      color: cfg.color,
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      boxShadow: DS.shadowInset,
    }}>{cfg.label}</span>
  )
}

export function MutedLabel({ children }) {
  return (
    <span style={{
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: DS.ash,
    }}>{children}</span>
  )
}

const COVER_DIMS = { xs: [32, 48], sm: [44, 66], md: [58, 87], lg: [78, 117], xl: [180, 270] }
const COVER_HUES = [30, 80, 130, 190, 230, 280, 320]

export function CoverPlaceholder({ title, coverUrl, size = 'md' }) {
  const dims = COVER_DIMS[size] || COVER_DIMS.md
  const [w, h] = dims

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={title || ''}
        style={{
          width: w, height: h,
          borderRadius: 6,
          flexShrink: 0,
          objectFit: 'cover',
          outline: '1px solid rgba(0,0,0,0.08)',
        }}
      />
    )
  }

  const hash = [...(title || '')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const hue = COVER_HUES[hash % COVER_HUES.length]
  return (
    <div style={{
      width: w, height: h, borderRadius: 6, flexShrink: 0,
      background: `oklch(72% 0.08 ${hue})`,
      outline: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <span style={{
        fontSize: 8, color: `oklch(30% 0.06 ${hue})`,
        textAlign: 'center', padding: 4, lineHeight: 1.3,
        fontWeight: 600,
        whiteSpace: 'pre-wrap',
      }}>
        {title?.split(' ').slice(0, 3).join('\n')}
      </span>
    </div>
  )
}

const AVATAR_HUES = { Viktor: 220, Armando: 15, Pontus: 160, Oskar: 280, Aaron: 45 }

export function Avatar({ name, size = 36 }) {
  const hue = AVATAR_HUES[name] || 200
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `oklch(38% 0.07 ${hue})`,
      color: `oklch(90% 0.05 ${hue})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38,
    }}>
      {name?.[0] || '?'}
    </div>
  )
}

export function VoteDots({ votes, onDark }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {MEMBERS.map(m => (
        <div key={m} title={m} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: votes?.[m]?.submitted
            ? (onDark ? DS.sage : DS.ink)
            : (onDark ? 'rgba(244,243,241,0.2)' : 'rgba(18,19,18,0.12)'),
          transition: 'background 0.2s',
        }} />
      ))}
    </div>
  )
}

export function LogoBadge({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: DS.sage, color: DS.ink,
      fontWeight: 700, fontSize: size * 0.5,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: DS.shadowInset,
    }}>B</div>
  )
}

export function PrimaryBtn({ children, onClick, small, type = 'button' }) {
  const [hov, setHov] = useState(false)
  const [act, setAct] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setAct(false) }}
      onMouseDown={() => setAct(true)}
      onMouseUp={() => setAct(false)}
      style={{
        background: DS.sage, color: DS.ink,
        borderRadius: 20,
        padding: small ? '6px 14px' : '10px 20px',
        fontWeight: 600, fontFamily: 'inherit',
        fontSize: small ? '0.78rem' : '0.88rem',
        border: 'none', cursor: 'pointer',
        boxShadow: DS.shadowInset,
        transition: 'all 0.15s ease',
        filter: hov ? 'brightness(1.05)' : 'none',
        transform: act ? 'scale(0.95)' : 'none',
      }}
    >{children}</button>
  )
}

export function BottomSheet({ children, footer, onClose, title, contentStyle }) {
  useEffect(() => {
    const el = document.getElementById('main-scroll')
    if (!el) return
    const prev = el.style.overflow
    el.style.overflow = 'hidden'
    return () => { el.style.overflow = prev }
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(18,19,18,0.45)',
          zIndex: 100,
        }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          bottom: 'calc(62px + env(safe-area-inset-bottom))',
          left: 0,
          right: 0,
          background: DS.bone,
          borderRadius: '24px 24px 0 0',
          zIndex: 101,
          boxShadow: '0 -8px 32px rgba(18,19,18,0.16)',
          maxHeight: 'calc(88dvh - 62px - env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: DS.dune }} />
        </div>

        <div style={{
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          flex: 1,
          padding: '12px 20px 0',
          ...contentStyle,
        }}>
          {title && (
            <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink, marginBottom: 18 }}>
              {title}
            </div>
          )}
          {children}
        </div>

        {footer && (
          <div style={{
            flexShrink: 0,
            padding: '16px 20px 20px',
            background: DS.bone,
            borderTop: '1px solid rgba(156,153,143,0.15)',
            display: 'flex',
            gap: 10,
          }}>
            {footer}
          </div>
        )}
      </section>
    </>
  )
}

export function SortChips({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const active = value === o.value
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            padding: '5px 12px', borderRadius: 20,
            border: active ? 'none' : '1px solid rgba(156,153,143,0.25)',
            background: active ? DS.ink : 'rgba(255,255,255,0.6)',
            color: active ? DS.bone : DS.soft,
            fontSize: '0.76rem', fontWeight: active ? 600 : 500,
            fontFamily: 'inherit', cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: active ? DS.shadowInset : 'none',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

export function BookRow({ book, onClick, showSeason, rating }) {
  const [hov, setHov] = useState(false)
  const [act, setAct] = useState(false)
  const ratingValue = rating !== undefined ? rating : book.finalAverage
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setAct(false) }}
      onMouseDown={() => setAct(true)}
      onMouseUp={() => setAct(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 12px 7px 7px',
        borderRadius: 16,
        background: hov ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.5)',
        outline: '1px solid rgba(156,153,143,0.15)',
        transition: 'all 0.12s ease',
        transform: act ? 'scale(0.99)' : 'none',
      }}
    >
      <CoverPlaceholder title={book.title} coverUrl={book.coverUrl} size="xs" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.9rem', color: DS.ink, lineHeight: 1.3 }}>
          {book.title}
        </div>
        <div style={{ fontFamily: LORA, fontStyle: 'italic', fontSize: '0.75rem', color: DS.soft, marginTop: 2 }}>
          {book.author}
          {showSeason && (
            <span style={{ fontFamily: SYS, fontStyle: 'normal', color: DS.ash, marginLeft: 8, fontSize: '0.68rem' }}>
              S{book.season}
            </span>
          )}
        </div>
      </div>
      <RatingBadge rating={ratingValue} small />
    </div>
  )
}
