import { useBooks } from '../context/BooksContext.jsx'
import { DS, LORA } from '../styles/tokens.js'

const CLUB_NAME = 'Shuu of Books'

function deriveHeaderInfo(books) {
  if (!books?.length) return { season: null, nextHost: null }
  const season = Math.max(...books.map(b => b.season || 0))
  const currentBook = books.find(b => b.isCurrentBook)
  if (currentBook) {
    return { season, nextHost: currentBook.chosenBy ?? null }
  }
  const finalized = books
    .filter(b => b.phase === 'finalized')
    .slice()
    .sort((a, b) => {
      const da = a.dateAdded || a.finalizedAt || a.meetingDate || ''
      const db = b.dateAdded || b.finalizedAt || b.meetingDate || ''
      return db.localeCompare(da)
    })
  return { season, nextHost: finalized[0]?.chosenBy ?? null }
}

export default function AppHeader() {
  const { books } = useBooks()
  const { season, nextHost } = deriveHeaderInfo(books)

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: DS.bone,
      borderBottom: '1px solid rgba(156,153,143,0.15)',
      padding: '6px 18px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <HashIcon />
        <span style={{
          fontFamily: LORA,
          fontWeight: 600,
          fontSize: '0.9rem',
          color: DS.ink,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>{CLUB_NAME}</span>
      </div>
      <div style={{
        fontSize: '0.68rem',
        color: DS.ash,
        textAlign: 'right',
        lineHeight: 1.4,
        flexShrink: 0,
      }}>
        {season != null && <span>Säsong {season}</span>}
        {season != null && nextHost && <span> · </span>}
        {nextHost && <span>Nästa: {nextHost}</span>}
      </div>
    </header>
  )
}

function HashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <line x1="7.5" y1="4" x2="5.5" y2="18" stroke={DS.sage} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="14"  y1="4" x2="12"  y2="18" stroke={DS.sage} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="4" y1="8.5"  x2="18" y2="8.5"  stroke={DS.sage} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="13.5" x2="17" y2="13.5" stroke={DS.sage} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
