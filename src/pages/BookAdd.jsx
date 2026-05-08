import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { addBook, setCurrentBook } from '../firebase/books.js'
import { buildNewBookDoc, validateNewBookForm } from '../domain/bookCreate.js'
import { MEMBERS } from '../domain/constants.js'
import { DS } from '../styles/tokens.js'
import { CoverPlaceholder, MutedLabel, PageHeader, PrimaryBtn } from '../components/ui.jsx'

export default function BookAdd() {
  const { userData } = useAuth()
  const { books, currentBook } = useBooks()
  const navigate = useNavigate()

  const nextSeason = useMemo(() => {
    if (currentBook?.season) return currentBook.season
    const max = books.reduce((m, b) => Math.max(m, b.season || 0), 0)
    return max || 1
  }, [books, currentBook])

  const [form, setForm] = useState({
    title: '',
    author: '',
    season: String(nextSeason),
    chosenBy: '',
    meetingDate: '',
    coverUrl: '',
  })
  const [makeCurrent, setMakeCurrent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (userData && userData.role !== 'admin') return <Navigate to="/" replace />

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    const validationError = validateNewBookForm(form)
    if (validationError) { setError(validationError); return }

    setSubmitting(true)
    try {
      const doc = buildNewBookDoc(form)
      const ref = await addBook(doc)
      if (makeCurrent) {
        await setCurrentBook(ref.id, books)
      }
      navigate(`/books/${ref.id}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Kunde inte spara')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 14px 32px' }}>

        <PageHeader title="Ny bok" onBack={() => navigate(-1)} />

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <Card>
            <SectionLabel>Bokuppgifter</SectionLabel>
            <Grid>
              <TextField label="Titel" value={form.title} onChange={v => setField('title', v)} required autoFocus />
              <TextField label="Författare" value={form.author} onChange={v => setField('author', v)} />
              <TextField label="Säsong" type="number" value={form.season} onChange={v => setField('season', v)} required />
              <SelectField label="Vald av" value={form.chosenBy} onChange={v => setField('chosenBy', v)}
                options={[{ value: '', label: '—' }, ...MEMBERS.map(m => ({ value: m, label: m }))]} />
              <TextField label="Mötesdatum" type="date" value={form.meetingDate} onChange={v => setField('meetingDate', v)} />
            </Grid>
          </Card>

          <Card>
            <SectionLabel>Omslag</SectionLabel>
            <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: DS.ash }}>
              Klistra in en bildlänk (URL). Lämna tomt om du inte har någon.
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <CoverPlaceholder title={form.title || '—'} coverUrl={form.coverUrl || null} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <TextField label="Bild-URL" value={form.coverUrl} onChange={v => setField('coverUrl', v)} placeholder="https://..." fullWidth />
              </div>
            </div>
          </Card>

          <Card>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={makeCurrent}
                onChange={e => setMakeCurrent(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: '0.9rem', color: DS.ink }}>
                Sätt som <strong>aktuell bok</strong> direkt
              </span>
            </label>
            <p style={{ margin: '8px 0 0 28px', fontSize: '0.74rem', color: DS.ash }}>
              Tidigare aktuell bok behåller alla sina röster och slutomdömen.
            </p>
          </Card>

          {error && (
            <div style={{
              background: 'rgba(180,60,60,0.08)', color: '#8b3a3a',
              fontSize: '0.85rem', padding: '10px 14px', borderRadius: 12,
              outline: '1px solid rgba(180,60,60,0.18)',
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate(-1)} style={cancelBtn}>
              Avbryt
            </button>
            <PrimaryBtn type="submit">{submitting ? 'Skapar…' : 'Skapa bok'}</PrimaryBtn>
          </div>
        </form>
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      background: DS.bone, borderRadius: 20, padding: 18,
      boxShadow: DS.shadowSoft,
      outline: '1px solid rgba(156,153,143,0.15)',
      position: 'relative', overflow: 'hidden',
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

function TextField({ label, value, onChange, type = 'text', required, fullWidth, autoFocus, placeholder }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
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
