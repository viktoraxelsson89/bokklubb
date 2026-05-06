import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSuggestions } from '../context/SuggestionsContext.jsx'
import { addSuggestion, deleteSuggestion } from '../firebase/suggestions.js'
import { coverHue, SUGGESTION_COMMENT_MAX, SUGGESTION_DESCRIPTION_MAX } from '../domain/suggestions.js'
import { Avatar } from '../components/ui.jsx'
import { DS, LORA } from '../styles/tokens.js'

export default function Suggestions() {
  const { userData } = useAuth()
  const { suggestions, loading } = useSuggestions()
  const [showForm, setShowForm] = useState(false)
  const memberName = userData?.displayName

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.ash }}>
        Laddar…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 16px 100px' }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink }}>
            Tips
          </div>
          <div style={{ fontSize: '0.75rem', color: DS.ash, marginTop: 2 }}>
            {suggestions.length === 0 ? 'Inga förslag ännu' : `${suggestions.length} förslag`}
          </div>
        </div>

        {suggestions.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {suggestions.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                isOwn={s.suggestedBy === memberName}
              />
            ))}
          </div>
        )}
      </div>

      {!showForm && (
        <AddFab onClick={() => setShowForm(true)} />
      )}

      {showForm && (
        <AddForm memberName={memberName} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function SuggestionCard({ suggestion, isOwn }) {
  const [deleting, setDeleting] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const hue = coverHue(suggestion.title)
  const hasDescription = !!suggestion.description

  async function handleDelete(e) {
    e.stopPropagation()
    setDeleting(true)
    await deleteSuggestion(suggestion.id)
  }

  return (
    <div
      onClick={() => hasDescription && setFlipped(f => !f)}
      style={{
        perspective: 900,
        cursor: hasDescription ? 'pointer' : 'default',
      }}
    >
      {/* Rotating inner */}
      <div style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* ── Front ── */}
        <div style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          background: 'rgba(255,255,255,0.72)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 2px 14px rgba(18,19,18,0.07)',
          outline: '1px solid rgba(156,153,143,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Cover */}
          <div style={{ position: 'relative', paddingTop: '150%', overflow: 'hidden' }}>
            {suggestion.coverUrl ? (
              <img
                src={suggestion.coverUrl}
                alt={suggestion.title}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                background: `oklch(38% 0.12 ${hue})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 14,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(120% 120% at 0% 0%, rgba(255,255,255,0.18) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }} />
                <div style={{
                  fontFamily: LORA, fontWeight: 700,
                  fontSize: '0.8rem',
                  color: `oklch(90% 0.06 ${hue})`,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}>
                  {suggestion.title}
                </div>
              </div>
            )}

            {isOwn && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'rgba(18,19,18,0.55)',
                  backdropFilter: 'blur(6px)',
                  border: 'none', cursor: deleting ? 'default' : 'pointer',
                  color: 'rgba(244,243,241,0.9)',
                  fontSize: '1rem', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: deleting ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                ×
              </button>
            )}

            {hasDescription && (
              <div style={{
                position: 'absolute', bottom: 7, right: 7,
                background: 'rgba(18,19,18,0.5)',
                backdropFilter: 'blur(6px)',
                borderRadius: 6,
                padding: '2px 6px',
                fontSize: '0.58rem',
                color: 'rgba(244,243,241,0.75)',
                letterSpacing: '0.04em',
                pointerEvents: 'none',
              }}>
                vänd
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            <div style={{
              fontFamily: LORA, fontWeight: 600,
              fontSize: '0.83rem', color: DS.ink,
              lineHeight: 1.3,
            }}>
              {suggestion.title}
            </div>
            <div style={{ fontSize: '0.72rem', color: DS.soft }}>
              {suggestion.author}
            </div>

            {suggestion.comment && (
              <div style={{
                fontSize: '0.68rem', color: DS.ash,
                fontStyle: 'italic', lineHeight: 1.45,
                marginTop: 4,
              }}>
                "{suggestion.comment}"
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              marginTop: 'auto', paddingTop: 8,
            }}>
              <Avatar name={suggestion.suggestedBy} size={18} />
              <span style={{ fontSize: '0.65rem', color: DS.ash }}>
                {suggestion.suggestedBy}
              </span>
            </div>
          </div>
        </div>

        {/* ── Back ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: `oklch(96% 0.015 ${hue})`,
          borderRadius: 18,
          outline: `1px solid oklch(85% 0.04 ${hue})`,
          boxShadow: '0 2px 14px rgba(18,19,18,0.07)',
          display: 'flex',
          flexDirection: 'column',
          padding: '14px 13px 12px',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 600,
            color: `oklch(52% 0.08 ${hue})`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 8, flexShrink: 0,
          }}>
            {suggestion.title}
          </div>

          <div style={{
            fontSize: '0.73rem',
            color: DS.soft,
            lineHeight: 1.6,
            overflowY: 'auto',
            flex: 1,
          }}>
            {suggestion.description}
          </div>

          <div style={{
            marginTop: 10, flexShrink: 0,
            fontSize: '0.6rem',
            color: `oklch(62% 0.06 ${hue})`,
            textAlign: 'center',
            letterSpacing: '0.04em',
          }}>
            tryck för att vända
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div
      onClick={onAdd}
      style={{
        marginTop: 8,
        background: 'rgba(186,209,150,0.18)',
        borderRadius: 24,
        padding: '20px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
        outline: '1.5px dashed rgba(186,209,150,0.55)',
        transition: 'transform 0.15s',
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'rgba(186,209,150,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem', flexShrink: 0,
      }}>
        📚
      </div>
      <div>
        <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink, marginBottom: 2 }}>
          Lägg till ett boktips
        </div>
        <div style={{ fontSize: '0.78rem', color: DS.soft }}>
          Föreslå nästa bok för klubben.
        </div>
      </div>
    </div>
  )
}

// ─── FAB ──────────────────────────────────────────────────────────────────────

function AddFab({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 78, right: 18,
        width: 52, height: 52,
        borderRadius: '50%',
        background: DS.sage,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 18px rgba(18,19,18,0.22)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.65rem', color: DS.ink,
        transition: 'transform 0.15s',
        lineHeight: 1,
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'none' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
    >
      +
    </button>
  )
}

// ─── Add form (bottom sheet) ───────────────────────────────────────────────────

function AddForm({ memberName, onClose }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [comment, setComment] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !author.trim()) return
    setSaving(true)
    await addSuggestion({
      title: title.trim(),
      author: author.trim(),
      coverUrl: coverUrl.trim() || null,
      comment: comment.trim() || null,
      description: description.trim() || null,
      suggestedBy: memberName,
    })
    setSaving(false)
    onClose()
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(18,19,18,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: DS.bone,
        borderRadius: '24px 24px 0 0',
        paddingBottom: 'max(32px, calc(32px + env(safe-area-inset-bottom)))',
        zIndex: 101,
        boxShadow: '0 -8px 32px rgba(18,19,18,0.16)',
        maxHeight: '88dvh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: DS.dune }} />
        </div>

        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink, marginBottom: 18 }}>
            Nytt boktips
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="Titel *">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Bokens titel"
                required
                autoFocus
                style={inputStyle}
              />
            </FormField>

            <FormField label="Författare *">
              <input
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Förnamn Efternamn"
                required
                style={inputStyle}
              />
            </FormField>

            <FormField label="Omslag (URL, valfritt)">
              <input
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="https://…"
                style={inputStyle}
              />
            </FormField>

            <FormField label={`Kommentar (valfritt, ${comment.length}/${SUGGESTION_COMMENT_MAX})`}>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, SUGGESTION_COMMENT_MAX))}
                placeholder="Varför vill du läsa den?"
                rows={2}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              />
            </FormField>

            <FormField label={`Baksidestext (valfritt, ${description.length}/${SUGGESTION_DESCRIPTION_MAX})`}>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, SUGGESTION_DESCRIPTION_MAX))}
                placeholder="Klistra in bokens beskrivning…"
                rows={4}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              />
            </FormField>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={saving || !title.trim() || !author.trim()}
                style={{
                  ...primaryBtnStyle,
                  opacity: (!title.trim() || !author.trim()) ? 0.5 : 1,
                }}
              >
                {saving ? 'Lägger till…' : 'Lägg till'}
              </button>
              <button type="button" onClick={onClose} style={ghostBtnStyle}>
                Avbryt
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

function FormField({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: '0.72rem', color: DS.ash }}>{label}</span>
      {children}
    </label>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid rgba(156,153,143,0.35)',
  background: 'rgba(255,255,255,0.7)',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  color: DS.ink,
  boxSizing: 'border-box',
  outline: 'none',
}

const primaryBtnStyle = {
  padding: '10px 20px',
  borderRadius: 12,
  border: 'none',
  background: DS.sage,
  color: DS.ink,
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: '0.88rem',
  cursor: 'pointer',
}

const ghostBtnStyle = {
  padding: '9px 18px',
  borderRadius: 12,
  border: '1.5px solid rgba(156,153,143,0.35)',
  background: 'transparent',
  color: DS.soft,
  fontFamily: 'inherit',
  fontSize: '0.85rem',
  cursor: 'pointer',
}
