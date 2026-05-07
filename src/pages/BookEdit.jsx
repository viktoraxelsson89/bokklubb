import { useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { updateBook } from '../firebase/books.js'
import { buildBookUpdates, buildFormFromBook } from '../domain/bookEdit.js'
import { BOOK_PHASES, MEMBERS, COMMENT_MAX_LENGTH } from '../domain/constants.js'
import { DS } from '../styles/tokens.js'
import { Avatar, LoadingState, MutedLabel, PageHeader, PrimaryBtn } from '../components/ui.jsx'

const PHASE_OPTIONS = [
  { value: BOOK_PHASES.PRELIMINARY_VOTING, label: 'Förhandsröstning' },
  { value: BOOK_PHASES.REVEALED,           label: 'Avslöjat' },
  { value: BOOK_PHASES.DISCUSSION,         label: 'Diskussion' },
  { value: BOOK_PHASES.FINALIZED,          label: 'Slutgiltig' },
]

export default function BookEdit() {
  const { bookId } = useParams()
  const { userData } = useAuth()
  const { books, loading } = useBooks()
  const navigate = useNavigate()

  const book = useMemo(() => books.find(b => b.id === bookId), [books, bookId])
  const initialForm = useMemo(() => (book ? buildFormFromBook(book) : null), [book])
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (loading) return <LoadingState text="Laddar..." />
  if (userData && userData.role !== 'admin') return <Navigate to={`/books/${bookId}`} replace />
  if (!book) return <PageShell>Boken hittades inte.</PageShell>
  if (!form) return <LoadingState text="Laddar..." />

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }
  function setMemberField(group, member, key, value) {
    setForm(f => ({
      ...f,
      [group]: { ...f[group], [member]: { ...f[group][member], [key]: value } },
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const updates = buildBookUpdates(book, form)
      await updateBook(book.id, updates)
      navigate(`/books/${book.id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Kunde inte spara')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 14px 32px' }}>

        <PageHeader title="Redigera bok" onBack={() => navigate(`/books/${book.id}`, { replace: true })} />

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <Card>
            <SectionLabel>Grunduppgifter</SectionLabel>
            <Grid>
              <TextField label="Titel" value={form.title} onChange={v => setField('title', v)} required />
              <TextField label="Författare" value={form.author} onChange={v => setField('author', v)} />
              <TextField label="Säsong" type="number" value={form.season} onChange={v => setField('season', v)} />
              <SelectField label="Vald av" value={form.chosenBy} onChange={v => setField('chosenBy', v)}
                options={[{ value: '', label: '—' }, ...MEMBERS.map(m => ({ value: m, label: m }))]} />
              <TextField label="Mötesdatum" type="date" value={form.meetingDate} onChange={v => setField('meetingDate', v)} />
              <SelectField label="Fas" value={form.phase} onChange={v => setField('phase', v)} options={PHASE_OPTIONS} />
              <TextField label="Omslag (URL)" value={form.coverUrl} onChange={v => setField('coverUrl', v)} fullWidth />
            </Grid>
          </Card>

          <Card>
            <SectionLabel>Förhandsröster</SectionLabel>
            <MemberVoteList
              group="preliminaryVotes"
              entries={form.preliminaryVotes}
              onChange={setMemberField}
            />
          </Card>

          <Card>
            <SectionLabel>Slutomdömen</SectionLabel>
            <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: DS.ash }}>
              Slutbetyg räknas ut automatiskt när alla 5 är inlämnade.
            </p>
            <MemberVoteList
              group="finalJudgments"
              entries={form.finalJudgments}
              onChange={setMemberField}
            />
          </Card>

          {error && (
            <div style={{
              background: 'rgba(180,60,60,0.08)', color: '#8b3a3a',
              fontSize: '0.85rem', padding: '10px 14px', borderRadius: 12,
              outline: '1px solid rgba(180,60,60,0.18)',
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate(`/books/${book.id}`)} style={cancelBtn}>
              Avbryt
            </button>
            <PrimaryBtn type="submit">{submitting ? 'Sparar…' : 'Spara'}</PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  )
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.soft }}>
      {children}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      background: DS.bone,
      borderRadius: 20,
      padding: 18,
      boxShadow: DS.shadowSoft,
      outline: '1px solid rgba(156,153,143,0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: DS.sheen, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ marginBottom: 12 }}><MutedLabel>{children}</MutedLabel></div>
}

function Grid({ children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 12,
    }}>{children}</div>
  )
}

function TextField({ label, value, onChange, type = 'text', required, fullWidth }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={inputStyle}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <FieldLabel>{label}</FieldLabel>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={inputStyle}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function FieldLabel({ children }) {
  return (
    <span style={{
      fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.07em',
      textTransform: 'uppercase', color: DS.ash,
    }}>{children}</span>
  )
}

function MemberVoteList({ group, entries, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {MEMBERS.map(member => {
        const e = entries[member]
        return (
          <div key={member} style={{
            display: 'grid',
            gridTemplateColumns: '38px 90px 1fr auto',
            alignItems: 'center', gap: 10,
            padding: 10,
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 14,
            outline: '1px solid rgba(156,153,143,0.15)',
          }}>
            <Avatar name={member} size={30} />
            <select
              value={e.vote}
              onChange={ev => onChange(group, member, 'vote', ev.target.value)}
              style={{ ...inputStyle, padding: '6px 8px' }}
            >
              <option value="">–</option>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <input
              type="text"
              value={e.comment}
              onChange={ev => onChange(group, member, 'comment', ev.target.value)}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="Kommentar (valfritt)"
              style={{ ...inputStyle, padding: '6px 10px' }}
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', color: DS.soft, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={e.submitted}
                onChange={ev => onChange(group, member, 'submitted', ev.target.checked)}
              />
              inlämnad
            </label>
          </div>
        )
      })}
    </div>
  )
}

const inputStyle = {
  fontFamily: 'inherit', fontSize: '0.9rem', color: DS.ink,
  background: '#fff',
  border: '1px solid rgba(156,153,143,0.3)',
  borderRadius: 10,
  padding: '8px 10px',
  outline: 'none',
}

const cancelBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.85rem', color: DS.soft,
  padding: '8px 14px',
}
