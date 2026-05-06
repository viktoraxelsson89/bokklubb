import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSuggestions } from '../context/SuggestionsContext.jsx'
import { addSuggestion, deleteSuggestion, updateSuggestion, subscribeToComments, addComment } from '../firebase/suggestions.js'
import { coverHue, SUGGESTION_COMMENT_MAX, SUGGESTION_DESCRIPTION_MAX, SUGGESTION_REPLY_MAX } from '../domain/suggestions.js'
import { Avatar } from '../components/ui.jsx'
import { DS, LORA } from '../styles/tokens.js'

export default function Suggestions() {
  const { userData } = useAuth()
  const { suggestions, loading } = useSuggestions()
  const [showForm, setShowForm] = useState(false)
  const [editingSuggestion, setEditingSuggestion] = useState(null)
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
                memberName={memberName}
                isOwn={s.suggestedBy === memberName}
                onEdit={() => setEditingSuggestion(s)}
              />
            ))}
          </div>
        )}
      </div>

      {!showForm && !editingSuggestion && (
        <AddFab onClick={() => setShowForm(true)} />
      )}

      {showForm && (
        <SuggestionForm memberName={memberName} onClose={() => setShowForm(false)} />
      )}

      {editingSuggestion && (
        <SuggestionForm
          memberName={memberName}
          initial={editingSuggestion}
          onClose={() => setEditingSuggestion(null)}
        />
      )}
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function SuggestionCard({ suggestion, memberName, isOwn, onEdit }) {
  const [deleting, setDeleting] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [comments, setComments] = useState([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const commentsEndRef = useRef(null)
  const didScrollRef = useRef(false)
  const hue = coverHue(suggestion.title)
  const hasDescription = !!suggestion.description

  useEffect(() => {
    if (!flipped) return
    return subscribeToComments(suggestion.id, setComments)
  }, [flipped, suggestion.id])

  useEffect(() => {
    if (flipped && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [comments.length, flipped])

  async function handleReply(e) {
    if (e.key !== 'Enter') return
    const text = replyText.trim()
    if (!text || sending || !memberName) return
    setSending(true)
    await addComment(suggestion.id, { text, authorName: memberName })
    setReplyText('')
    setSending(false)
  }

  async function handleDelete(e) {
    e.stopPropagation()
    setDeleting(true)
    await deleteSuggestion(suggestion.id)
  }

  function handleEdit(e) {
    e.stopPropagation()
    onEdit()
  }

  return (
    <div
      onClick={() => {
        if (didScrollRef.current) { didScrollRef.current = false; return }
        setFlipped(f => !f)
      }}
      style={{
        perspective: 900,
        cursor: 'pointer',
        height: '100%',
      }}
    >
      {/* Rotating inner */}
      <div style={{
        position: 'relative',
        height: '100%',
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
          height: '100%',
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
              <>
                <button
                  onClick={handleEdit}
                  style={{
                    position: 'absolute', top: 7, left: 7,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(18,19,18,0.55)',
                    backdropFilter: 'blur(6px)',
                    border: 'none', cursor: 'pointer',
                    color: 'rgba(244,243,241,0.9)',
                    fontSize: '0.75rem', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✏
                </button>
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
              </>
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
              <span style={{ fontSize: '0.65rem', color: DS.ash, flex: 1 }}>
                {suggestion.suggestedBy}
              </span>
              {suggestion.commentCount > 0 && (
                <span style={{
                  fontSize: '0.6rem', color: DS.ash,
                  display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  💬 {suggestion.commentCount}
                </span>
              )}
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
          padding: '14px 13px 10px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          {/* Title label */}
          <div style={{
            fontSize: '0.65rem', fontWeight: 600,
            color: `oklch(52% 0.08 ${hue})`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: 8, flexShrink: 0,
          }}>
            {suggestion.title}
          </div>

          {/* Scrollable body: description + comments */}
          <div
            onScroll={() => { didScrollRef.current = true }}
            style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
          >
            {suggestion.description && (
              <div style={{
                fontSize: '0.73rem', color: DS.soft,
                lineHeight: 1.6, marginBottom: 10,
              }}>
                {suggestion.description}
              </div>
            )}

            <div style={{ height: 1, background: `oklch(88% 0.03 ${hue})`, marginBottom: 8 }} />

            <div style={{
              fontSize: '0.6rem', fontWeight: 600,
              color: `oklch(52% 0.08 ${hue})`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              {comments.length > 0 ? `Kommentarer (${comments.length})` : 'Kommentarer'}
            </div>

            {comments.length === 0 && (
              <div style={{ fontSize: '0.68rem', color: DS.ash, fontStyle: 'italic', marginBottom: 6 }}>
                Inga kommentarer än.
              </div>
            )}

            {comments.map(c => (
              <div key={c.id} style={{ marginBottom: 5 }}>
                <span style={{ fontWeight: 600, fontSize: '0.68rem', color: DS.soft }}>{c.authorName}: </span>
                <span style={{ fontSize: '0.68rem', color: DS.ash }}>{c.text}</span>
              </div>
            ))}

            <div ref={commentsEndRef} />
          </div>

          {/* Reply input */}
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value.slice(0, SUGGESTION_REPLY_MAX))}
            onKeyDown={handleReply}
            onClick={e => e.stopPropagation()}
            placeholder={memberName ? 'Kommentera… (Enter)' : ''}
            disabled={sending || !memberName}
            style={{
              marginTop: 8, flexShrink: 0,
              width: '100%', boxSizing: 'border-box',
              padding: '6px 10px',
              borderRadius: 8,
              border: `1px solid oklch(82% 0.04 ${hue})`,
              background: `oklch(99% 0.005 ${hue})`,
              fontSize: '0.72rem',
              fontFamily: 'inherit',
              color: DS.ink,
              outline: 'none',
            }}
          />
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

// ─── Add / Edit form (bottom sheet) ───────────────────────────────────────────

function SuggestionForm({ memberName, initial, onClose }) {
  const isEdit = !!initial
  const [title, setTitle] = useState(initial?.title ?? '')
  const [author, setAuthor] = useState(initial?.author ?? '')
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? '')
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const el = document.getElementById('main-scroll')
    if (!el) return
    const prev = el.style.overflow
    el.style.overflow = 'hidden'
    return () => { el.style.overflow = prev }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !author.trim()) return
    setSaving(true)
    if (isEdit) {
      await updateSuggestion(initial.id, {
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim() || null,
        comment: comment.trim() || null,
        description: description.trim() || null,
      })
    } else {
      await addSuggestion({
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim() || null,
        comment: comment.trim() || null,
        description: description.trim() || null,
        suggestedBy: memberName,
      })
    }
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
        position: 'fixed',
        bottom: 'calc(62px + env(safe-area-inset-bottom))',
        left: 0, right: 0,
        background: DS.bone,
        borderRadius: '24px 24px 0 0',
        zIndex: 101,
        boxShadow: '0 -8px 32px rgba(18,19,18,0.16)',
        maxHeight: 'calc(88dvh - 62px - env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: DS.dune }} />
        </div>

        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', flex: 1, padding: '12px 20px 0' }}>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink, marginBottom: 18 }}>
            {isEdit ? 'Redigera tips' : 'Nytt boktips'}
          </div>

          <form id="suggestion-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

            {/* spacer so last field isn't hidden behind sticky buttons */}
            <div style={{ height: 4 }} />
          </form>
        </div>

        {/* Sticky button row always visible */}
        <div style={{
          flexShrink: 0,
          padding: '16px 20px 20px',
          background: DS.bone,
          borderTop: '1px solid rgba(156,153,143,0.15)',
          display: 'flex', gap: 10,
        }}>
          <button
            type="submit"
            form="suggestion-form"
            disabled={saving || !title.trim() || !author.trim()}
            style={{
              ...primaryBtnStyle,
              opacity: (!title.trim() || !author.trim()) ? 0.5 : 1,
            }}
          >
            {saving ? (isEdit ? 'Sparar…' : 'Lägger till…') : (isEdit ? 'Spara' : 'Lägg till')}
          </button>
          <button type="button" onClick={onClose} style={ghostBtnStyle}>
            Avbryt
          </button>
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
