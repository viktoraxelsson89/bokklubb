import { DS } from '../styles/tokens.js'

export default function Placeholder({ title }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: DS.gradientBg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: 32, color: DS.ink,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: 'rgba(186,209,150,0.2)',
        outline: '1px solid rgba(186,209,150,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DS.sage} strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      </div>
      <div style={{ fontWeight: 600, fontSize: '1rem', color: DS.ink }}>{title}</div>
      <div style={{ fontSize: '0.8rem', color: DS.ash, textAlign: 'center', lineHeight: 1.5 }}>
        Den här sidan är inte byggd än.
      </div>
    </div>
  )
}
