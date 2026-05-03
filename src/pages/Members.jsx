import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '../context/BooksContext.jsx'
import { MEMBERS } from '../domain/constants.js'
import { getDisplayAverage } from '../domain/calculations.js'
import { DS, LORA } from '../styles/tokens.js'
import { Avatar, MutedLabel, RatingBadge } from '../components/ui.jsx'

function getMemberRating(book, memberName) {
  const finalVote = book.finalJudgments?.[memberName]?.vote
  if (finalVote != null) return finalVote
  const legacyVote = book.ratings?.[memberName]
  if (legacyVote != null) return legacyVote
  return null
}

function getMemberStats(finalizedBooks, memberName) {
  const chosenBooks = finalizedBooks.filter(b => b.chosenBy === memberName)
  const ratedBooks = finalizedBooks.filter(b => getMemberRating(b, memberName) != null)

  if (ratedBooks.length === 0) {
    return { chosenBooks, ratedBooks: [], averageRating: null, favoriteBook: null, leastLiked: null }
  }

  const averageRating = ratedBooks.reduce((sum, b) => sum + getMemberRating(b, memberName), 0) / ratedBooks.length

  const favoriteBook = ratedBooks.reduce((best, b) =>
    getMemberRating(b, memberName) > getMemberRating(best, memberName) ? b : best
  )

  const leastLiked = ratedBooks.reduce((worst, b) =>
    getMemberRating(b, memberName) < getMemberRating(worst, memberName) ? b : worst
  )

  return { chosenBooks, ratedBooks, averageRating, favoriteBook, leastLiked }
}

export default function Members() {
  const { books, loading } = useBooks()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.soft }}>
        Laddar böcker…
      </div>
    )
  }

  const finalizedBooks = books.filter(b => b.phase === 'finalized')

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ padding: '18px 18px 14px' }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: 2 }}>
            Medlemmar
          </div>
          <div style={{ fontSize: '0.72rem', color: DS.ash }}>
            {MEMBERS.length} aktiva läsare
          </div>
        </div>

        <div style={{ padding: '0 14px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MEMBERS.map(member => {
              const stats = getMemberStats(finalizedBooks, member)
              const isOpen = expanded === member

              return (
                <div key={member} style={{
                  background: DS.bone,
                  borderRadius: 20,
                  boxShadow: DS.shadowSoft,
                  outline: '1px solid rgba(156,153,143,0.2)',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: DS.sheen, zIndex: 0 }} />

                  <button
                    onClick={() => setExpanded(isOpen ? null : member)}
                    style={{
                      position: 'relative', zIndex: 1,
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px',
                      background: isOpen ? 'rgba(186,209,150,0.12)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Avatar name={member} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.94rem', color: DS.ink }}>
                        {member}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: DS.ash, marginTop: 1 }}>
                        {stats.ratedBooks.length} betygsatt · {stats.chosenBooks.length} valt
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {stats.averageRating != null && <RatingBadge rating={stats.averageRating} small />}
                      <svg
                        width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={DS.ash} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{
                      position: 'relative', zIndex: 1,
                      borderTop: '1px solid rgba(156,153,143,0.15)',
                      padding: '14px 16px 16px',
                    }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 0,
                        marginBottom: 14,
                        background: 'rgba(186,209,150,0.1)',
                        borderRadius: 12,
                        overflow: 'hidden',
                        outline: '1px solid rgba(186,209,150,0.2)',
                      }}>
                        {[
                          { label: 'Snitt', value: stats.averageRating != null ? stats.averageRating.toFixed(2) : '–' },
                          { label: 'Betygsatt', value: stats.ratedBooks.length },
                          { label: 'Valt', value: stats.chosenBooks.length },
                        ].map((s, i) => (
                          <div key={i} style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            borderRight: i < 2 ? '1px solid rgba(186,209,150,0.2)' : 'none',
                          }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: DS.ink }}>{s.value}</div>
                            <div style={{
                              fontSize: '0.65rem', color: DS.ash, marginTop: 1,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {stats.favoriteBook && (
                        <div style={{ marginBottom: 8 }}>
                          <MutedLabel>Favoritbok</MutedLabel>
                          <BookHighlight
                            book={stats.favoriteBook}
                            rating={getMemberRating(stats.favoriteBook, member)}
                            onClick={() => navigate(`/books/${stats.favoriteBook.id}`)}
                            tone="sage"
                          />
                        </div>
                      )}

                      {stats.leastLiked && stats.leastLiked.id !== stats.favoriteBook?.id && (
                        <div style={{ marginBottom: stats.chosenBooks.length > 0 ? 12 : 0 }}>
                          <MutedLabel>Minst gillade</MutedLabel>
                          <BookHighlight
                            book={stats.leastLiked}
                            rating={getMemberRating(stats.leastLiked, member)}
                            onClick={() => navigate(`/books/${stats.leastLiked.id}`)}
                            tone="grout"
                          />
                        </div>
                      )}

                      {stats.chosenBooks.length > 0 && (
                        <div>
                          <MutedLabel>Valda böcker</MutedLabel>
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {stats.chosenBooks.map(book => (
                              <div
                                key={book.id}
                                onClick={() => navigate(`/books/${book.id}`)}
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '7px 10px',
                                  background: 'rgba(244,243,241,0.7)',
                                  borderRadius: 10,
                                  outline: '1px solid rgba(156,153,143,0.1)',
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,243,241,1)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,243,241,0.7)' }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <span style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.83rem', color: DS.ink }}>
                                    {book.title}
                                  </span>
                                  <span style={{ color: DS.ash, fontSize: '0.7rem', marginLeft: 6 }}>
                                    S{book.season}
                                  </span>
                                </div>
                                <RatingBadge rating={getDisplayAverage(book)} small />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function BookHighlight({ book, rating, onClick, tone }) {
  const isSage = tone === 'sage'
  const baseBg = isSage ? 'rgba(186,209,150,0.15)' : 'rgba(156,153,143,0.08)'
  const hoverBg = isSage ? 'rgba(186,209,150,0.25)' : 'rgba(156,153,143,0.15)'
  const outline = isSage ? '1px solid rgba(186,209,150,0.25)' : '1px solid rgba(156,153,143,0.15)'
  return (
    <div
      onClick={onClick}
      style={{
        marginTop: 6,
        padding: '9px 12px',
        background: baseBg,
        borderRadius: 12,
        cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        outline,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { e.currentTarget.style.background = baseBg }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.85rem', color: DS.ink }}>
          {book.title}
        </div>
        <div style={{ fontFamily: LORA, fontStyle: 'italic', fontSize: '0.72rem', color: DS.soft, marginTop: 1 }}>
          {book.author}
        </div>
      </div>
      {rating != null && <RatingBadge rating={rating} small />}
    </div>
  )
}
