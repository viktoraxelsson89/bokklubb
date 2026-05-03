import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { useRecipes } from '../context/RecipesContext.jsx'
import { updateBook } from '../firebase/books.js'
import { computePreliminaryVote, computeStartDiscussion, computeFinalJudgment } from '../domain/voting.js'
import { canUserVotePreliminary, canUserVoteFinal } from '../domain/permissions.js'
import { getRecipesForBook, canAddRecipe, bookHasLegacyRecipe } from '../domain/recipes.js'
import { getDisplayAverage } from '../domain/calculations.js'
import { BOOK_PHASES, MEMBERS, COMMENT_MAX_LENGTH } from '../domain/constants.js'
import { DS, LORA, SYS } from '../styles/tokens.js'
import {
  Avatar,
  CoverPlaceholder,
  MutedLabel,
  PhasePill,
  PrimaryBtn,
  RatingBadge,
} from '../components/ui.jsx'

const SLIDE_UP_KEYFRAMES = `@keyframes bookDetailSlideUp { from { transform: translateY(28px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`

const heroIconBtn = {
  background: 'rgba(255,255,255,0.6)',
  border: 'none', cursor: 'pointer',
  borderRadius: 10, width: 32, height: 32,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  outline: '1px solid rgba(156,153,143,0.2)',
  transition: 'background 0.15s',
}

export default function BookDetails() {
  const { bookId } = useParams()
  const { userData } = useAuth()
  const { books, loading } = useBooks()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.soft }}>
        Laddar…
      </div>
    )
  }

  const book = books.find(b => b.id === bookId)
  if (!book) {
    return (
      <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.soft }}>
        Boken hittades inte.
      </div>
    )
  }

  const phase = book.phase || BOOK_PHASES.PRELIMINARY_VOTING
  const avg = getDisplayAverage(book)

  return (
    <div style={{
      minHeight: '100vh',
      background: DS.gradientBg,
      color: DS.ink,
      animation: 'bookDetailSlideUp 0.22s ease',
    }}>
      <style>{SLIDE_UP_KEYFRAMES}</style>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Hero — light, cover-led */}
        <div style={{ padding: '14px 18px 24px', position: 'relative' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button onClick={() => navigate('/')} style={heroIconBtn} title="Tillbaka">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.soft} strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {userData?.role === 'admin' && (
              <button onClick={() => navigate(`/books/${book.id}/edit`)} style={heroIconBtn} title="Redigera">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.soft} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
              </button>
            )}
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 14,
          }}>
            <div style={{
              filter: 'drop-shadow(0 18px 36px rgba(18,19,18,0.22)) drop-shadow(0 4px 8px rgba(18,19,18,0.08))',
            }}>
              <CoverPlaceholder title={book.title} coverUrl={book.coverUrl} size="xl" />
            </div>

            <div style={{ maxWidth: 480 }}>
              <div style={{
                fontFamily: LORA, fontWeight: 600, fontSize: '1.45rem',
                color: DS.ink, lineHeight: 1.25, marginBottom: 4,
              }}>
                {book.title}
              </div>
              <div style={{
                fontFamily: LORA, fontStyle: 'italic', fontSize: '0.95rem',
                color: DS.soft,
              }}>
                {book.author}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <PhasePill phase={phase} />
              <span style={{ fontSize: '0.72rem', color: DS.ash }}>
                Säsong {book.season} · Vald av {book.chosenBy}
                {book.meetingDate && ` · ${book.meetingDate}`}
              </span>
            </div>

            {avg > 0 && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '1.6rem', color: DS.ink, lineHeight: 1 }}>
                  {Number(avg).toFixed(1)}
                </span>
                <span style={{ fontSize: '0.72rem', color: DS.ash }}>/10</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 14px 32px' }}>
          {phase === BOOK_PHASES.PRELIMINARY_VOTING && (
            <PreliminaryVotingSection book={book} userData={userData} />
          )}
          {phase === BOOK_PHASES.REVEALED && (
            <RevealedSection book={book} />
          )}
          {phase === BOOK_PHASES.DISCUSSION && (
            <DiscussionSection book={book} userData={userData} />
          )}
          {phase === BOOK_PHASES.FINALIZED && (
            <FinalizedSection book={book} />
          )}
          <RecipesSection book={book} userData={userData} />
        </div>
      </div>
    </div>
  )
}

// ─── Phase sections ──────────────────────────────────────────────────────────

function PreliminaryVotingSection({ book, userData }) {
  const [vote, setVote] = useState('7')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submitted = book.preliminaryVotes?.[userData?.displayName]?.submitted
  const submittedCount = Object.values(book.preliminaryVotes ?? {}).filter(v => v.submitted).length
  const canVote = canUserVotePreliminary(book, userData)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const updates = computePreliminaryVote(book, userData.displayName, vote, comment, now)
      await updateBook(book.id, updates)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Section title="Förhandsröstning">
        <ProgressLine count={submittedCount} label="har röstat" />
      </Section>

      {canVote ? (
        <Section title={submitted ? 'Ändra din röst' : 'Din röst'}>
          <VoteForm
            vote={vote} setVote={setVote}
            comment={comment} setComment={setComment}
            submitting={submitting} error={error}
            onSubmit={handleSubmit}
            submitLabel="Skicka röst"
          />
        </Section>
      ) : submitted ? (
        <InfoNote>Du har röstat. Väntar på de andra…</InfoNote>
      ) : null}
    </>
  )
}

function RevealedSection({ book }) {
  const [submitting, setSubmitting] = useState(false)

  async function handleStartDiscussion() {
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const updates = computeStartDiscussion(book, now)
      await updateBook(book.id, updates)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <CollapsiblePrelim book={book} />
      <div style={{ marginTop: 8 }}>
        <PrimaryBtn onClick={handleStartDiscussion}>
          {submitting ? 'Startar…' : 'Starta diskussion'}
        </PrimaryBtn>
      </div>
    </>
  )
}

function DiscussionSection({ book, userData }) {
  const myPrelim = book.preliminaryVotes?.[userData?.displayName]
  const [vote, setVote] = useState(String(myPrelim?.vote ?? '7'))
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submittedCount = Object.values(book.finalJudgments ?? {}).filter(j => j.submitted).length
  const canVote = canUserVoteFinal(book, userData)
  const myFinal = book.finalJudgments?.[userData?.displayName]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const updates = computeFinalJudgment(book, userData.displayName, vote, comment, now)
      await updateBook(book.id, updates)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Section title="Slutomdömen">
        <ProgressLine count={submittedCount} label="har lämnat slutomdöme" />
        <div style={{ marginTop: 8 }}>
          <VoteRowList votes={book.finalJudgments ?? {}} showAll />
        </div>
      </Section>

      {canVote ? (
        <Section title="Ditt slutomdöme">
          <VoteForm
            vote={vote} setVote={setVote}
            comment={comment} setComment={setComment}
            submitting={submitting} error={error}
            onSubmit={handleSubmit}
            submitLabel="Skicka slutomdöme"
          />
        </Section>
      ) : myFinal?.submitted ? (
        <InfoNote>Du har lämnat ditt slutomdöme ({myFinal.vote}).</InfoNote>
      ) : null}

      <CollapsiblePrelim book={book} />
    </>
  )
}

function FinalizedSection({ book }) {
  const { userData } = useAuth()
  const navigate = useNavigate()
  const avg = getDisplayAverage(book)
  const showNextBookCta = book.isCurrentBook && userData?.role === 'admin'

  return (
    <>
      {book.averageChange != null && (
        <Section title="Slutbetyg">
          <p style={{ margin: 0, fontSize: '0.85rem', color: DS.soft }}>
            Snitt: <strong>{Number(avg).toFixed(2)}</strong>
            {' · '}
            Förändring: {book.averageChange > 0 ? '+' : ''}{book.averageChange.toFixed(2)}
            {' · '}
            {book.votesChanged} av 5 ändrade sin röst
          </p>
        </Section>
      )}

      <Section title="Slutomdömen">
        <VoteRowList votes={book.finalJudgments ?? {}} showAll />
      </Section>

      {showNextBookCta && (
        <div style={{
          marginBottom: 18,
          padding: 16,
          background: 'rgba(186,209,150,0.18)',
          border: '1px solid rgba(186,209,150,0.4)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.95rem', color: DS.ink, marginBottom: 2 }}>
              Klart för nästa bok
            </div>
            <div style={{ fontSize: '0.78rem', color: DS.soft }}>
              Den här boken är slutbetygsatt. Lägg till nästa aktuella bok.
            </div>
          </div>
          <PrimaryBtn onClick={() => navigate('/books/new')}>+ Lägg till nästa bok</PrimaryBtn>
        </div>
      )}

      {Object.keys(book.preliminaryVotes ?? {}).length > 0 && (
        <CollapsiblePrelim book={book} />
      )}
    </>
  )
}

function CollapsiblePrelim({ book }) {
  const [open, setOpen] = useState(false)
  const avg = book.preliminaryAverage
  const summaryParts = []
  if (avg != null) summaryParts.push(`Snitt ${Number(avg).toFixed(2)}`)
  if (book.votesChanged != null) summaryParts.push(`${book.votesChanged} av 5 ändrade sig`)
  const summary = summaryParts.join(' · ')

  return (
    <div style={{ marginBottom: 18 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.5)',
          border: 'none',
          outline: '1px solid rgba(156,153,143,0.18)',
          borderRadius: 14,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: DS.ash, marginBottom: 2,
          }}>Förhandsröster</div>
          {summary && (
            <div style={{ fontSize: '0.78rem', color: DS.soft }}>{summary}</div>
          )}
        </div>
        <span style={{ fontSize: '0.7rem', color: DS.ash, fontWeight: 600 }}>
          {open ? 'Dölj' : 'Visa'}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={DS.ash} strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <VoteRowList votes={book.preliminaryVotes ?? {}} />
        </div>
      )}
    </div>
  )
}

function RecipesSection({ book, userData }) {
  const navigate = useNavigate()
  const { recipes, loading } = useRecipes()
  const bookRecipes = loading ? [] : getRecipesForBook(recipes, book.id)
  const canAdd = canAddRecipe(book, userData)
  const hasLegacy = bookHasLegacyRecipe(book)
  const newRecipePath = `/books/${book.id}/recipes/new${hasLegacy ? '?prefill=legacy' : ''}`

  if (bookRecipes.length === 0 && !hasLegacy && !canAdd) return null

  return (
    <Section title="Recept">
      {bookRecipes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: hasLegacy || canAdd ? 12 : 0 }}>
          {bookRecipes.map(recipe => (
            <RecipeRow key={recipe.id} recipe={recipe} onClick={() => navigate(`/recipes/${recipe.id}`)} />
          ))}
        </div>
      )}

      {hasLegacy && bookRecipes.length === 0 && (
        <div style={{
          display: 'flex', gap: 12,
          padding: 12,
          background: 'rgba(255,255,255,0.6)',
          borderRadius: 14,
          outline: '1px solid rgba(156,153,143,0.18)',
          marginBottom: canAdd ? 12 : 0,
        }}>
          {book.recipeImageUrl && (
            <div style={{
              width: 72, height: 72, borderRadius: 10, flexShrink: 0,
              background: `center / cover url(${book.recipeImageUrl})`,
              outline: '1px solid rgba(0,0,0,0.06)',
            }} />
          )}
          <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: DS.soft, alignSelf: 'center' }}>
            {book.food && (
              <div style={{ fontFamily: LORA, fontWeight: 600, color: DS.ink, marginBottom: 4 }}>
                {book.food}
              </div>
            )}
            {book.recipeLink && (
              <a href={book.recipeLink} target="_blank" rel="noopener noreferrer" style={{ color: DS.ink, fontSize: '0.82rem' }}>
                Originalrecept ↗
              </a>
            )}
          </div>
        </div>
      )}

      {canAdd && (
        <PrimaryBtn small onClick={() => navigate(newRecipePath)}>
          {hasLegacy && bookRecipes.length === 0 ? 'Spara recept' : '+ Lägg till recept'}
        </PrimaryBtn>
      )}
    </Section>
  )
}

function RecipeRow({ recipe, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: 10,
        background: hov ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        outline: '1px solid rgba(156,153,143,0.18)',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 10, flexShrink: 0,
        background: recipe.imageUrl
          ? `center / cover url(${recipe.imageUrl})`
          : 'linear-gradient(135deg, rgba(201,192,148,0.3), rgba(186,209,150,0.3))',
        outline: '1px solid rgba(0,0,0,0.06)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: LORA, fontWeight: 600, fontSize: '0.9rem', color: DS.ink,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {recipe.name || 'Namnlöst recept'}
        </div>
        {recipe.createdBy && (
          <div style={{ fontFamily: SYS, fontSize: '0.7rem', color: DS.ash, marginTop: 2 }}>
            Av {recipe.createdBy}
          </div>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.ash} strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 8 }}>
        <MutedLabel>{title}</MutedLabel>
      </div>
      {children}
    </div>
  )
}

function ProgressLine({ count, label }) {
  return (
    <p style={{ margin: 0, fontSize: '0.88rem', color: DS.soft }}>
      <strong style={{ color: DS.ink }}>{count}/5</strong> {label}
    </p>
  )
}

function VoteRowList({ votes, showAll = false }) {
  const members = showAll ? MEMBERS : MEMBERS.filter(m => votes[m]?.submitted)
  if (members.length === 0) {
    return <p style={{ color: DS.ash, fontSize: '0.85rem', margin: 0 }}>Inga röster än.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {members.map(member => {
        const v = votes[member]
        return (
          <div key={member} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: DS.bone,
            borderRadius: 14,
            boxShadow: DS.shadowSoft,
            outline: '1px solid rgba(156,153,143,0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: DS.sheen, pointerEvents: 'none' }} />
            <Avatar name={member} size={30} />
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <div style={{ fontWeight: 500, fontSize: '0.86rem', color: DS.ink }}>
                {member}
                {v?.changedFromPreliminary && (
                  <span style={{ fontSize: '0.68rem', color: DS.sand, marginLeft: 8, fontWeight: 600 }}>
                    ändrade sig
                  </span>
                )}
              </div>
              {v?.comment && (
                <div style={{
                  fontSize: '0.7rem', color: DS.soft, marginTop: 1,
                  fontStyle: 'italic',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  "{v.comment}"
                </div>
              )}
            </div>
            {v?.submitted ? (
              <RatingBadge rating={v.vote} small />
            ) : (
              <span style={{ fontSize: '0.72rem', color: DS.ash, position: 'relative' }}>Inte lämnat</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AverageLine({ label, value }) {
  if (value == null) return null
  return (
    <p style={{ margin: '10px 0 0', fontSize: '0.88rem', color: DS.soft }}>
      {label}: <strong style={{ color: DS.ink }}>{Number(value).toFixed(2)}</strong>
    </p>
  )
}

function InfoNote({ children }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'rgba(186,209,150,0.18)',
      border: '1px solid rgba(186,209,150,0.35)',
      borderRadius: 14,
      color: DS.ink,
      fontSize: '0.85rem',
      marginBottom: 18,
    }}>
      {children}
    </div>
  )
}

function VoteForm({ vote, setVote, comment, setComment, submitting, error, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      padding: 14,
      background: DS.bone,
      borderRadius: 16,
      boxShadow: DS.shadowSoft,
      outline: '1px solid rgba(156,153,143,0.15)',
    }}>
      <VoteSelect value={vote} onChange={setVote} />
      <CommentInput value={comment} onChange={setComment} />
      {error && <p style={{ color: '#b94a48', margin: 0, fontSize: '0.82rem' }}>{error}</p>}
      <div style={{ alignSelf: 'flex-start' }}>
        <PrimaryBtn type="submit">{submitting ? 'Sparar…' : submitLabel}</PrimaryBtn>
      </div>
    </form>
  )
}

function VoteSelect({ value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.82rem', color: DS.soft }}>
        Betyg (1–10)
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontSize: '0.95rem',
          padding: '6px 10px',
          borderRadius: 10,
          border: '1px solid rgba(156,153,143,0.3)',
          background: '#fff',
          fontFamily: 'inherit',
          color: DS.ink,
        }}
      >
        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  )
}

function CommentInput({ value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.82rem', color: DS.soft }}>
        Kommentar <span style={{ color: DS.ash, fontWeight: 400 }}>(valfritt, max {COMMENT_MAX_LENGTH} tecken)</span>
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={COMMENT_MAX_LENGTH}
        rows={3}
        style={{
          width: '100%',
          fontSize: '0.9rem',
          padding: '8px 10px',
          boxSizing: 'border-box',
          borderRadius: 10,
          border: '1px solid rgba(156,153,143,0.3)',
          fontFamily: 'inherit',
          color: DS.ink,
          resize: 'vertical',
        }}
      />
    </div>
  )
}
