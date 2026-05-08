import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '../context/BooksContext.jsx'
import { getAllSeasons, getBooksBySeason, getSeasonWinner } from '../domain/books.js'
import { getDisplayAverage } from '../domain/calculations.js'
import { DS, LORA } from '../styles/tokens.js'
import { CoverPlaceholder, LoadingState, RatingBadge } from '../components/ui.jsx'

export default function Seasons() {
  const { books, loading } = useBooks()
  const navigate = useNavigate()
  const [open, setOpen] = useState(() => {
    const saved = sessionStorage.getItem('seasons_open')
    return saved !== null ? Number(saved) : null
  })
  useEffect(() => {
    if (open === null) sessionStorage.removeItem('seasons_open')
    else sessionStorage.setItem('seasons_open', String(open))
  }, [open])

  if (loading) {
    return <LoadingState text="Laddar böcker..." />
  }

  const finalizedBooks = books.filter(b => b.phase === 'finalized')
  const seasons = getAllSeasons(finalizedBooks)

  return (
    <div style={{ minHeight: '100%', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ padding: '18px 18px 14px' }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: 2 }}>
            Säsonger
          </div>
          <div style={{ fontSize: '0.72rem', color: DS.ash }}>
            {seasons.length} avslutade säsonger
          </div>
        </div>

        <div style={{ padding: '0 14px 24px' }}>
          {seasons.length === 0 && (
            <div style={{ color: DS.ash, fontSize: '0.85rem', padding: 16 }}>
              Inga avslutade säsonger ännu.
            </div>
          )}

          {seasons.map(season => {
            const seasonBooks = getBooksBySeason(finalizedBooks, season)
            const winner = getSeasonWinner(finalizedBooks, season)
            const isOpen = open === season
            const avgAll = seasonBooks.length
              ? seasonBooks.reduce((a, b) => a + getDisplayAverage(b), 0) / seasonBooks.length
              : 0

            return (
              <div key={season} style={{ marginBottom: 10 }}>
                <button
                  onClick={() => setOpen(isOpen ? null : season)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px',
                    background: isOpen ? DS.darkBg : DS.bone,
                    borderRadius: isOpen ? '20px 20px 0 0' : 20,
                    boxShadow: isOpen ? '0 8px 28px rgba(18,19,18,0.12)' : DS.shadowSoft,
                    outline: isOpen ? 'none' : '1px solid rgba(156,153,143,0.2)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                    fontFamily: 'inherit',
                  }}
                >
                  {isOpen && (
                    <div style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      background: 'radial-gradient(80% 80% at 10% 0%, rgba(186,209,150,0.06) 0%, transparent 60%)',
                    }} />
                  )}

                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: isOpen ? 'rgba(186,209,150,0.15)' : 'rgba(186,209,150,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: isOpen ? '1px solid rgba(186,209,150,0.25)' : 'none',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: isOpen ? DS.sage : DS.ink }}>
                      {season}
                    </span>
                  </div>

                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isOpen ? DS.bone : DS.ink }}>
                      Säsong {season}
                    </div>
                    {winner && (
                      <div style={{
                        fontSize: '0.72rem',
                        color: isOpen ? 'rgba(244,243,241,0.45)' : DS.ash,
                        marginTop: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        Vinnare: {winner.title}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <RatingBadge rating={avgAll} small />
                    <span style={{
                      fontSize: '0.68rem',
                      color: isOpen ? 'rgba(244,243,241,0.35)' : DS.ash,
                    }}>{seasonBooks.length} böcker</span>
                  </div>

                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={isOpen ? 'rgba(244,243,241,0.5)' : DS.ash}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{
                      transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div style={{
                    background: DS.bone,
                    borderRadius: '0 0 20px 20px',
                    boxShadow: '0 8px 28px rgba(18,19,18,0.08)',
                    outline: '1px solid rgba(156,153,143,0.15)',
                    borderTop: 'none',
                    overflow: 'hidden',
                    animation: 'slideDown 0.18s ease',
                  }}>
                    {[...seasonBooks]
                      .sort((a, b) => getDisplayAverage(b) - getDisplayAverage(a))
                      .map((book, i) => {
                        const isW = winner?.id === book.id
                        return (
                          <div
                            key={book.id}
                            onClick={() => navigate(`/books/${book.id}`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 11,
                              padding: '11px 16px',
                              borderTop: i > 0 ? '1px solid rgba(156,153,143,0.12)' : 'none',
                              cursor: 'pointer',
                              transition: 'background 0.1s',
                              background: 'transparent',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(186,209,150,0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <span style={{
                              width: 18, textAlign: 'center', fontSize: '0.78rem',
                              color: isW ? DS.sage : DS.ash,
                              fontWeight: isW ? 700 : 400, flexShrink: 0,
                            }}>
                              {isW ? '★' : i + 1}
                            </span>
                            <CoverPlaceholder title={book.title} coverUrl={book.coverUrl} size="sm" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontFamily: LORA,
                                fontWeight: isW ? 700 : 600,
                                fontSize: '0.86rem',
                                color: DS.ink,
                                lineHeight: 1.3,
                              }}>{book.title}</div>
                              <div style={{ fontSize: '0.72rem', color: DS.ash, marginTop: 1 }}>
                                <span style={{ fontFamily: LORA, fontStyle: 'italic' }}>{book.author}</span>
                                {' · Vald av '}{book.chosenBy}
                              </div>
                            </div>
                            <RatingBadge rating={getDisplayAverage(book)} small />
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
