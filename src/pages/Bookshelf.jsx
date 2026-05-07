import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { usePlanning } from '../context/PlanningContext.jsx'
import { hasUnansweredDates, formatDateSv } from '../domain/planning.js'
import { getAllSeasons, getBooksBySeason } from '../domain/books.js'
import { getDisplayAverage } from '../domain/calculations.js'
import { DS, LORA } from '../styles/tokens.js'
import {
  BookRow,
  CoverPlaceholder,
  LoadingState,
  MutedLabel,
  PhasePill,
  RatingBadge,
  SortChips,
  VoteDots,
} from '../components/ui.jsx'

export { RatingBadge }

const SORT_OPTIONS = [
  { value: 'season', label: 'Säsong' },
  { value: 'title',  label: 'Titel'  },
  { value: 'rating', label: 'Betyg'  },
  { value: 'recent', label: 'Senast läst' },
]

function sortFinalized(books, sortBy) {
  const sorted = [...books]
  if (sortBy === 'title')  return sorted.sort((a, b) => a.title.localeCompare(b.title, 'sv'))
  if (sortBy === 'rating') return sorted.sort((a, b) => getDisplayAverage(b) - getDisplayAverage(a))
  if (sortBy === 'recent') return sorted.sort((a, b) => {
    const da = a.meetingDate || a.finalizedAt || ''
    const db = b.meetingDate || b.finalizedAt || ''
    return db.localeCompare(da)
  })
  return sorted
}

export default function Bookshelf() {
  const { userData, logout } = useAuth()
  const { books, currentBook, loading } = useBooks()
  const { round } = usePlanning()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState(() => sessionStorage.getItem('bookshelf_sortby') ?? 'season')
  useEffect(() => { sessionStorage.setItem('bookshelf_sortby', sortBy) }, [sortBy])

  const memberName = userData?.displayName
  const planningActive = round && round.status === 'active'
  const planningLocked = round && round.status === 'locked'
  const planningUnanswered = planningActive && memberName &&
    hasUnansweredDates(round.responses || {}, round.proposedDates || [], memberName)

  if (loading) {
    return <LoadingState text="Laddar böcker..." />
  }

  const finalizedBooks = books.filter(b => b.phase === 'finalized')
  const seasons = getAllSeasons(finalizedBooks)
  const finalsSubmitted = currentBook
    ? Object.values(currentBook.finalJudgments || {}).filter(v => v?.submitted).length
    : 0

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: 2 }}>
              Bokhyllan
            </div>
            <div style={{ fontSize: '0.72rem', color: DS.ash }}>
              {finalizedBooks.length} böcker
              {userData?.displayName && <span> · {userData.displayName}</span>}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              fontSize: '0.72rem',
              fontFamily: 'inherit',
              padding: 0,
              border: 'none',
              background: 'none',
              color: DS.ash,
              cursor: 'pointer',
              textDecoration: 'underline',
              flexShrink: 0,
            }}
          >Logga ut</button>
        </div>

        {/* Scrollable area */}
        <div style={{ padding: '0 14px 24px' }}>

          {/* No current book — admin CTA */}
          {!currentBook && userData?.role === 'admin' && (
            <div style={{ marginBottom: 20 }}>
              <MutedLabel>Pågående</MutedLabel>
              <div
                onClick={() => navigate('/books/new')}
                style={{
                  marginTop: 8,
                  background: 'rgba(186,209,150,0.18)',
                  borderRadius: 24,
                  padding: 18,
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                  outline: '1.5px dashed rgba(186,209,150,0.55)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'rgba(186,209,150,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', color: DS.ink, fontWeight: 300,
                  flexShrink: 0,
                }}>+</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink, marginBottom: 2 }}>
                    Lägg till aktuell bok
                  </div>
                  <div style={{ fontSize: '0.78rem', color: DS.soft }}>
                    Ingen pågående bok just nu.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current book */}
          {currentBook && (
            <div style={{ marginBottom: 20 }}>
              <MutedLabel>Pågående</MutedLabel>
              <div
                onClick={() => navigate(`/books/${currentBook.id}`)}
                style={{
                  marginTop: 8,
                  background: 'rgba(201,192,148,0.28)',
                  borderRadius: 24,
                  padding: 16,
                  display: 'flex',
                  gap: 14,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(201,192,148,0.18)',
                  outline: '1.5px solid rgba(201,192,148,0.5)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'radial-gradient(100% 100% at 0% 0%, rgba(255,255,255,0.55) 0%, transparent 60%)',
                }} />
                <CoverPlaceholder title={currentBook.title} coverUrl={currentBook.coverUrl} size="md" />
                <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                  <div style={{ marginBottom: 8 }}>
                    <PhasePill phase={currentBook.phase} />
                  </div>
                  <div style={{
                    fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink,
                    lineHeight: 1.3, marginBottom: 3,
                  }}>
                    {currentBook.title}
                  </div>
                  <div style={{ fontFamily: LORA, fontStyle: 'italic', fontSize: '0.78rem', color: DS.soft, marginBottom: 12 }}>
                    {currentBook.author}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <VoteDots votes={currentBook.finalJudgments} />
                    <span style={{ fontSize: '0.7rem', color: DS.ash }}>
                      {finalsSubmitted}/5 omdömen
                    </span>
                  </div>
                  {currentBook.meetingDate && (
                    <div style={{ marginTop: 8, fontSize: '0.72rem', color: DS.ash }}>
                      Träff {formatDateSv(currentBook.meetingDate)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Planning: locked date card */}
          {planningLocked && (
            <div style={{ marginBottom: 20 }}>
              <MutedLabel>Nästa träff</MutedLabel>
              <div
                onClick={() => navigate('/planning')}
                style={{
                  marginTop: 8,
                  background: 'rgba(186,209,150,0.22)',
                  borderRadius: 20,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                  outline: '1.5px solid rgba(186,209,150,0.55)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                <span style={{ fontSize: '1.4rem' }}>📅</span>
                <div>
                  <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.95rem', color: DS.ink, marginBottom: 1 }}>
                    {formatDateSv(round.lockedDate)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: DS.ash }}>{round.title}</div>
                </div>
              </div>
            </div>
          )}

          {/* Planning: active round CTA */}
          {planningActive && (
            <div style={{ marginBottom: 20 }}>
              <div
                onClick={() => navigate('/planning')}
                style={{
                  background: planningUnanswered
                    ? 'rgba(201,192,148,0.28)'
                    : 'rgba(186,209,150,0.15)',
                  borderRadius: 16,
                  padding: '11px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer',
                  outline: planningUnanswered
                    ? '1px solid rgba(201,192,148,0.5)'
                    : '1px solid rgba(186,209,150,0.35)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                <span style={{ fontSize: '1.1rem' }}>📅</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', color: DS.ink, fontWeight: 500 }}>
                    {round.title}
                  </div>
                  {planningUnanswered && (
                    <div style={{ fontSize: '0.72rem', color: DS.soft }}>
                      Du har inte svarat på alla datum.
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: DS.ash, flexShrink: 0 }}>→</span>
              </div>
            </div>
          )}

          {/* Sort header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
            <MutedLabel>Lästa böcker</MutedLabel>
            <SortChips options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
          </div>

          {sortBy === 'season' ? (
            seasons.map(season => {
              const seasonBooks = getBooksBySeason(finalizedBooks, season)
              if (seasonBooks.length === 0) return null
              return (
                <section key={season} style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: DS.soft }}>
                      Säsong {season}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(156,153,143,0.2)' }} />
                    <span style={{ fontSize: '0.7rem', color: DS.ash }}>{seasonBooks.length} böcker</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {seasonBooks.map(book => (
                      <BookRow
                        key={book.id}
                        book={book}
                        rating={getDisplayAverage(book)}
                        onClick={() => navigate(`/books/${book.id}`)}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortFinalized(finalizedBooks, sortBy).map(book => (
                <BookRow
                  key={book.id}
                  book={book}
                  rating={getDisplayAverage(book)}
                  showSeason
                  onClick={() => navigate(`/books/${book.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
