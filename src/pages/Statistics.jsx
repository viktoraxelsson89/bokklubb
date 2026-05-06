import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '../context/BooksContext.jsx'
import { MEMBERS } from '../domain/constants.js'
import { getDisplayAverage } from '../domain/calculations.js'
import {
  getHighestRatedBook,
  getLowestRatedBook,
  getMostControversialBook,
  getBiggestSurprise,
  getStrictestMember,
  getMostGenerousMember,
  getHardestToPleaseChooser,
  getCorrelationMatrix,
  getControversyRanking,
} from '../domain/statistics.js'
import { DS, LORA } from '../styles/tokens.js'
import { Avatar, MutedLabel } from '../components/ui.jsx'

const TABS = [
  { id: 'records', label: 'Rekord' },
  { id: 'heatmap', label: 'Smakheatmap' },
  { id: 'controversy', label: 'Kontrovers' },
]

export default function Statistics() {
  const { books, loading } = useBooks()
  const navigate = useNavigate()
  const [tab, setTab] = useState(() => sessionStorage.getItem('statistics_tab') ?? 'records')
  useEffect(() => { sessionStorage.setItem('statistics_tab', tab) }, [tab])

  const finalizedBooks = useMemo(
    () => books.filter(b => b.phase === 'finalized'),
    [books]
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.soft }}>
        Laddar statistik…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ padding: '18px 18px 12px' }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: 2 }}>
            Statistik
          </div>
          <div style={{ fontSize: '0.72rem', color: DS.ash }}>
            {finalizedBooks.length} avslutade böcker
          </div>
        </div>

        <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: active ? 'none' : '1px solid rgba(156,153,143,0.25)',
                  background: active ? DS.ink : 'rgba(255,255,255,0.6)',
                  color: active ? DS.bone : DS.soft,
                  fontSize: '0.78rem',
                  fontWeight: active ? 600 : 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? DS.shadowInset : 'none',
                  transition: 'all 0.15s ease',
                }}
              >{t.label}</button>
            )
          })}
        </div>

        <div style={{ padding: '8px 14px 32px' }}>
          {tab === 'records' && <RecordsView books={finalizedBooks} navigate={navigate} />}
          {tab === 'heatmap' && <HeatmapView books={finalizedBooks} />}
          {tab === 'controversy' && <ControversyView books={finalizedBooks} navigate={navigate} />}
        </div>
      </div>
    </div>
  )
}

// ────────── Rekordtavlan ──────────

function RecordsView({ books, navigate }) {
  const cards = useMemo(() => buildRecordCards(books), [books])

  if (books.length === 0) {
    return <EmptyHint text="Inga avslutade böcker att räkna på ännu." />
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 10,
    }}>
      {cards.map(card => (
        <RecordCard
          key={card.key}
          card={card}
          onClick={card.bookId ? () => navigate(`/books/${card.bookId}`) : undefined}
        />
      ))}
    </div>
  )
}

function buildRecordCards(books) {
  const cards = []

  const highest = getHighestRatedBook(books)
  if (highest) {
    cards.push({
      key: 'highest',
      icon: '★',
      tone: 'sage',
      label: 'Högst betyg',
      title: highest.title,
      subtitle: highest.chosenBy ? `Vald av ${highest.chosenBy}` : null,
      value: getDisplayAverage(highest).toFixed(2),
      bookId: highest.id,
    })
  }

  const lowest = getLowestRatedBook(books)
  if (lowest && lowest.id !== highest?.id) {
    cards.push({
      key: 'lowest',
      icon: '↓',
      tone: 'grout',
      label: 'Lägst betyg',
      title: lowest.title,
      subtitle: lowest.chosenBy ? `Vald av ${lowest.chosenBy}` : null,
      value: getDisplayAverage(lowest).toFixed(2),
      bookId: lowest.id,
    })
  }

  const contro = getMostControversialBook(books)
  if (contro) {
    cards.push({
      key: 'controversial',
      icon: '⚡',
      tone: 'sand',
      label: 'Mest kontroversiell',
      title: contro.book.title,
      subtitle: contro.book.chosenBy ? `Vald av ${contro.book.chosenBy}` : null,
      value: `${contro.spread.min}–${contro.spread.max}`,
      hint: `σ ${contro.spread.stddev.toFixed(2)}`,
      bookId: contro.book.id,
    })
  }

  const surprise = getBiggestSurprise(books)
  if (surprise) {
    const arrow = surprise.diff >= 0 ? '↑' : '↓'
    const sign = surprise.diff >= 0 ? '+' : ''
    cards.push({
      key: 'surprise',
      icon: '✦',
      tone: 'sage',
      label: 'Största överraskningen',
      title: surprise.book.title,
      subtitle: `${surprise.preliminaryAverage.toFixed(1)} → ${surprise.finalAverage.toFixed(1)}`,
      value: `${arrow} ${sign}${surprise.diff.toFixed(1)}`,
      bookId: surprise.book.id,
    })
  }

  const strict = getStrictestMember(books, MEMBERS)
  if (strict) {
    cards.push({
      key: 'strict',
      icon: 'A',
      tone: 'grout',
      label: 'Strängaste medlemmen',
      title: strict.member,
      subtitle: `${strict.count} betyg`,
      value: strict.average.toFixed(2),
      avatar: strict.member,
    })
  }

  const generous = getMostGenerousMember(books, MEMBERS)
  if (generous && generous.member !== strict?.member) {
    cards.push({
      key: 'generous',
      icon: 'A',
      tone: 'sage',
      label: 'Generösaste medlemmen',
      title: generous.member,
      subtitle: `${generous.count} betyg`,
      value: generous.average.toFixed(2),
      avatar: generous.member,
    })
  }

  const hardest = getHardestToPleaseChooser(books, MEMBERS)
  if (hardest) {
    cards.push({
      key: 'hardest',
      icon: 'A',
      tone: 'sand',
      label: 'Mest svårflörtade bokvalet',
      title: hardest.member,
      subtitle: `${hardest.count} ${hardest.count === 1 ? 'val' : 'val'}`,
      value: hardest.average.toFixed(2),
      avatar: hardest.member,
    })
  }

  return cards
}

const TONE_BG = {
  sage:  'rgba(186,209,150,0.18)',
  sand:  'rgba(201,192,148,0.22)',
  grout: 'rgba(156,153,143,0.18)',
}
const TONE_OUTLINE = {
  sage:  '1px solid rgba(186,209,150,0.35)',
  sand:  '1px solid rgba(201,192,148,0.4)',
  grout: '1px solid rgba(156,153,143,0.3)',
}
const TONE_ICON_BG = {
  sage:  'rgba(186,209,150,0.4)',
  sand:  'rgba(201,192,148,0.45)',
  grout: 'rgba(156,153,143,0.3)',
}

function RecordCard({ card, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: DS.bone,
        borderRadius: 18,
        padding: '14px 14px 12px',
        boxShadow: hov && onClick ? '0 12px 32px rgba(18,19,18,0.10)' : DS.shadowSoft,
        outline: '1px solid rgba(156,153,143,0.18)',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        transform: hov && onClick ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: DS.sheen }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        {card.avatar ? (
          <Avatar name={card.avatar} size={42} />
        ) : (
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: TONE_ICON_BG[card.tone] || TONE_ICON_BG.sage,
            outline: TONE_OUTLINE[card.tone],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.15rem', color: DS.ink, flexShrink: 0,
          }}>
            {card.icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.66rem', color: DS.ash, fontWeight: 600,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            marginBottom: 2,
          }}>{card.label}</div>
          <div style={{
            fontFamily: LORA, fontWeight: 600, fontSize: '0.95rem',
            color: DS.ink, lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{card.title}</div>
          {card.subtitle && (
            <div style={{ fontSize: '0.7rem', color: DS.ash, marginTop: 2 }}>
              {card.subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{
        position: 'relative',
        marginTop: 12,
        padding: '8px 12px',
        background: TONE_BG[card.tone] || TONE_BG.sage,
        outline: TONE_OUTLINE[card.tone],
        borderRadius: 12,
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontWeight: 700, fontSize: '1.4rem', color: DS.ink, letterSpacing: '-0.01em' }}>
          {card.value}
        </span>
        {card.hint && (
          <span style={{ fontSize: '0.7rem', color: DS.soft }}>{card.hint}</span>
        )}
      </div>
    </div>
  )
}

// ────────── Smakheatmap ──────────

function HeatmapView({ books }) {
  const matrix = useMemo(() => getCorrelationMatrix(books, MEMBERS), [books])

  if (books.length === 0) {
    return <EmptyHint text="Behöver röster från flera medlemmar för att räkna ut korrelation." />
  }

  const cellByPair = new Map()
  for (const c of matrix) cellByPair.set(`${c.m1}|${c.m2}`, c)

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <MutedLabel>Korrelation mellan medlemmars betyg</MutedLabel>
        <div style={{ fontSize: '0.72rem', color: DS.ash, marginTop: 4, lineHeight: 1.4 }}>
          Varma färger = liknande smak. Kalla = motsatta. Grått = för få gemensamma böcker.
        </div>
      </div>

      <div style={{
        background: DS.bone,
        borderRadius: 18,
        padding: 12,
        boxShadow: DS.shadowSoft,
        outline: '1px solid rgba(156,153,143,0.18)',
        overflowX: 'auto',
      }}>
        <table style={{
          borderCollapse: 'separate',
          borderSpacing: 4,
          margin: '0 auto',
          fontFamily: 'inherit',
        }}>
          <thead>
            <tr>
              <th />
              {MEMBERS.map(m => (
                <th key={m} style={{
                  fontSize: '0.66rem', color: DS.ash, fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  padding: '4px 6px',
                }}>{m.slice(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map(rowM => (
              <tr key={rowM}>
                <th style={{
                  fontSize: '0.66rem', color: DS.ash, fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  textAlign: 'right', padding: '0 6px',
                }}>{rowM.slice(0, 3)}</th>
                {MEMBERS.map(colM => {
                  const cell = cellByPair.get(`${rowM}|${colM}`)
                  return (
                    <td key={colM}>
                      <HeatCell
                        correlation={cell?.correlation}
                        overlap={cell?.overlap || 0}
                        diagonal={rowM === colM}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <Legend />
      </div>
    </div>
  )
}

function correlationToColor(r) {
  // r in [-1, 1]. Warm (sage) for positive, cool (blueish ink) for negative.
  if (r == null) return { bg: 'rgba(156,153,143,0.18)', color: DS.ash }
  const a = Math.min(1, Math.abs(r))
  if (r >= 0) {
    // sage warm
    return {
      bg: `rgba(186,209,150,${0.18 + a * 0.7})`,
      color: a > 0.55 ? DS.ink : DS.soft,
    }
  }
  // cool slate
  return {
    bg: `rgba(91,127,190,${0.18 + a * 0.65})`,
    color: a > 0.55 ? DS.bone : DS.soft,
  }
}

function HeatCell({ correlation, overlap, diagonal }) {
  if (diagonal) {
    return (
      <div title="Samma medlem" style={{
        width: 48, height: 48, borderRadius: 10,
        background: 'rgba(18,19,18,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.68rem', color: DS.ash,
      }}>—</div>
    )
  }
  const { bg, color } = correlationToColor(correlation)
  const display = correlation == null ? '·' : correlation.toFixed(2)
  const title = correlation == null
    ? `För få gemensamma böcker (${overlap})`
    : `r = ${correlation.toFixed(3)}, ${overlap} gemensamma böcker`
  return (
    <div title={title} style={{
      width: 48, height: 48, borderRadius: 10,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: '0.78rem',
      boxShadow: DS.shadowInset,
      transition: 'transform 0.12s',
    }}>
      {display}
    </div>
  )
}

function Legend() {
  const stops = [-1, -0.5, 0, 0.5, 1]
  return (
    <div style={{
      marginTop: 12, paddingTop: 10,
      borderTop: '1px solid rgba(156,153,143,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '0.66rem', color: DS.ash }}>Olika</span>
      {stops.map(r => {
        const { bg } = correlationToColor(r)
        return (
          <div key={r} style={{
            width: 22, height: 14, borderRadius: 4,
            background: bg,
            outline: '1px solid rgba(156,153,143,0.15)',
          }} />
        )
      })}
      <span style={{ fontSize: '0.66rem', color: DS.ash }}>Lika</span>
    </div>
  )
}

// ────────── Kontroversbarometern ──────────

function ControversyView({ books, navigate }) {
  const ranking = useMemo(() => getControversyRanking(books), [books])

  if (ranking.length === 0) {
    return <EmptyHint text="Inga böcker med tillräckligt många röster för att ranka spridning." />
  }

  const maxStddev = ranking[0].spread.stddev || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ marginBottom: 4 }}>
        <MutedLabel>Sorterat efter spridning i betyg</MutedLabel>
      </div>
      {ranking.map((entry, i) => (
        <ControversyRow
          key={entry.book.id}
          rank={i + 1}
          book={entry.book}
          spread={entry.spread}
          maxStddev={maxStddev}
          onClick={() => navigate(`/books/${entry.book.id}`)}
        />
      ))}
    </div>
  )
}

function ControversyRow({ rank, book, spread, maxStddev, onClick }) {
  const [hov, setHov] = useState(false)
  const intensity = spread.stddev / maxStddev
  // Visualize span as a bar from min to max along 1..10 scale
  const leftPct  = ((spread.min - 1) / 9) * 100
  const widthPct = Math.max(2, ((spread.max - spread.min) / 9) * 100)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer',
        background: hov ? DS.bone : 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        padding: '11px 14px',
        outline: '1px solid rgba(156,153,143,0.18)',
        boxShadow: hov ? DS.shadowSoft : 'none',
        transition: 'all 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          width: 22, textAlign: 'center', fontSize: '0.78rem',
          color: DS.ash, fontWeight: 600, flexShrink: 0,
        }}>{rank}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: LORA, fontWeight: 600, fontSize: '0.88rem',
            color: DS.ink, lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{book.title}</div>
          <div style={{ fontSize: '0.7rem', color: DS.ash, marginTop: 1 }}>
            <span style={{ fontFamily: LORA, fontStyle: 'italic' }}>{book.author}</span>
            {book.chosenBy && <> · Vald av {book.chosenBy}</>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: DS.ink }}>
            {spread.min}–{spread.max}
          </div>
          <div style={{ fontSize: '0.66rem', color: DS.ash, marginTop: 1 }}>
            σ {spread.stddev.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{
        position: 'relative',
        height: 8,
        background: 'rgba(156,153,143,0.15)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          background: `rgba(201,192,148,${0.5 + intensity * 0.4})`,
          borderRadius: 6,
          boxShadow: DS.shadowInset,
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.6rem', color: DS.ash, marginTop: 3,
        letterSpacing: '0.05em',
      }}>
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  )
}

function EmptyHint({ text }) {
  return (
    <div style={{
      padding: 24, textAlign: 'center',
      color: DS.ash, fontSize: '0.85rem',
      background: DS.bone, borderRadius: 16,
      outline: '1px solid rgba(156,153,143,0.15)',
    }}>
      {text}
    </div>
  )
}
