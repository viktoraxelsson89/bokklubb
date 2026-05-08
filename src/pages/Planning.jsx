import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { usePlanning } from '../context/PlanningContext.jsx'
import { MEMBERS } from '../domain/constants.js'
import {
  RESPONSES,
  formatDateSv,
  summarizeDates,
  hasUnansweredDates,
  getEffectiveResponse,
  generateWeekendDates,
} from '../domain/planning.js'
import {
  createRound,
  setDateResponse,
  addAwayPeriod,
  removeAwayPeriod,
  addProposedDate,
  lockRoundDate,
  unlockRound,
} from '../firebase/planning.js'
import { DS, LORA } from '../styles/tokens.js'
import { LoadingState, MutedLabel } from '../components/ui.jsx'

const RESPONSE_COLOR = {
  [RESPONSES.KAN]:      DS.sage,
  [RESPONSES.KANSKE]:   DS.sand,
  [RESPONSES.KAN_INTE]: '#c47c7c',
}

const RESPONSE_LABEL = {
  [RESPONSES.KAN]:      'Kan',
  [RESPONSES.KANSKE]:   'Kanske',
  [RESPONSES.KAN_INTE]: 'Kan inte',
}

export default function Planning() {
  const { userData } = useAuth()
  const { round, loading } = usePlanning()
  const isAdmin = userData?.role === 'admin'
  const memberName = userData?.displayName

  if (loading) {
    return <LoadingState text="Laddar..." />
  }

  if (!round) return <NoRoundView isAdmin={isAdmin} memberName={memberName} />
  if (round.status === 'locked') return <LockedView round={round} isAdmin={isAdmin} />
  return <ActiveView round={round} memberName={memberName} isAdmin={isAdmin} />
}

// ─── No active round ──────────────────────────────────────────────────────────

function NoRoundView({ isAdmin, memberName }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ minHeight: '100%', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 18px 24px' }}>
        <PageHeader title="Planering" />
        {isAdmin ? (
          showForm
            ? <CreateRoundForm memberName={memberName} onCancel={() => setShowForm(false)} />
            : (
              <div
                onClick={() => setShowForm(true)}
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
                  fontSize: '1.6rem', flexShrink: 0,
                }}>📅</div>
                <div>
                  <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink, marginBottom: 2 }}>
                    Starta planeringsrunda
                  </div>
                  <div style={{ fontSize: '0.78rem', color: DS.soft }}>
                    Hitta ett datum som passar alla.
                  </div>
                </div>
              </div>
            )
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: DS.ash, fontSize: '0.88rem' }}>
            Ingen pågående planeringsrunda.
          </div>
        )}
      </div>
    </div>
  )
}

function CreateRoundForm({ memberName, onCancel }) {
  const [title, setTitle] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !from || !to) return
    setSaving(true)
    const proposedDates = generateWeekendDates(from, to)
    await createRound({ title: title.trim(), proposedDates, createdBy: memberName })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{
      marginTop: 8,
      background: 'rgba(186,209,150,0.12)',
      borderRadius: 24,
      padding: 20,
      outline: '1.5px solid rgba(186,209,150,0.4)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1rem', color: DS.ink }}>
        Ny planeringsrunda
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: '0.72rem', color: DS.ash }}>Namn på rundan</span>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="t.ex. Sommarplanering jul/aug"
          required
          style={inputStyle}
        />
      </label>

      <div style={{ display: 'flex', gap: 10 }}>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', color: DS.ash }}>Från</span>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} required style={inputStyle} />
        </label>
        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', color: DS.ash }}>Till</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} required style={inputStyle} />
        </label>
      </div>

      {from && to && from <= to && (
        <div style={{ fontSize: '0.75rem', color: DS.soft }}>
          Genererar {generateWeekendDates(from, to).length} fredagar/lördagar.
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving} style={primaryBtnStyle}>
          {saving ? 'Skapar…' : 'Starta'}
        </button>
        <button type="button" onClick={onCancel} style={ghostBtnStyle}>Avbryt</button>
      </div>
    </form>
  )
}

// ─── Locked view ──────────────────────────────────────────────────────────────

function LockedView({ round, isAdmin }) {
  const [unlocking, setUnlocking] = useState(false)

  async function handleUnlock() {
    setUnlocking(true)
    await unlockRound(round.id)
    setUnlocking(false)
  }

  return (
    <div style={{ minHeight: '100%', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 18px 24px' }}>
        <PageHeader title="Planering" />
        <div style={{
          background: 'rgba(186,209,150,0.22)',
          borderRadius: 24,
          padding: '28px 20px',
          textAlign: 'center',
          outline: '1.5px solid rgba(186,209,150,0.5)',
          boxShadow: '0 4px 16px rgba(186,209,150,0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(100% 100% at 0% 0%, rgba(255,255,255,0.55) 0%, transparent 60%)',
          }} />
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: '0.75rem', color: DS.ash, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Nästa träff
          </div>
          <div style={{ fontFamily: LORA, fontWeight: 700, fontSize: '1.4rem', color: DS.ink, marginBottom: 4 }}>
            {formatDateSv(round.lockedDate)}
          </div>
          <div style={{ fontSize: '0.8rem', color: DS.soft }}>{round.title}</div>
        </div>

        {isAdmin && (
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button onClick={handleUnlock} disabled={unlocking} style={ghostBtnStyle}>
              {unlocking ? 'Låser upp…' : 'Lås upp datumet'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Active view ──────────────────────────────────────────────────────────────

function ActiveView({ round, memberName, isAdmin }) {
  const proposedDates = [...(round.proposedDates || [])].sort()
  const responses = round.responses || {}
  const summary = summarizeDates(proposedDates, responses, MEMBERS)
  const unanswered = hasUnansweredDates(responses, proposedDates, memberName)
  const today = new Date().toISOString().slice(0, 10)

  const perfectDates = summary.filter(s => s.allCan)
  const almostDates  = summary.filter(s => !s.allCan && s.noneCantGo)
  const futureSummary = summary.filter(s => s.date >= today)
  const pastSummary   = summary.filter(s => s.date < today)

  return (
    <div style={{ minHeight: '100%', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 18px 0' }}>
          <PageHeader title="Planering" subtitle={round.title} />
          {unanswered && (
            <div style={{
              marginTop: 10,
              padding: '9px 14px',
              background: 'rgba(201,192,148,0.3)',
              borderRadius: 12,
              fontSize: '0.78rem',
              color: DS.soft,
            }}>
              Du har inte svarat på alla datum än.
            </div>
          )}
        </div>

        <div style={{ padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Away periods */}
          <AwayPeriodsSection round={round} memberName={memberName} />

          {/* Calendar */}
          {proposedDates.length > 0 && (
            <div>
              <MutedLabel>Kalender</MutedLabel>
              <div style={{ marginTop: 8 }}>
                <CalendarView summary={summary} />
              </div>
            </div>
          )}

          {/* Dates */}
          <div>
            <MutedLabel>Datum</MutedLabel>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {proposedDates.length === 0 && (
                <div style={{ color: DS.ash, fontSize: '0.85rem', padding: '8px 0' }}>
                  Inga datum tillagda än.
                </div>
              )}
              {futureSummary.map(s => (
                <DateCard
                  key={s.date}
                  summary={s}
                  myResponse={getEffectiveResponse(responses, memberName, s.date)}
                  memberName={memberName}
                  roundId={round.id}
                  isAdmin={isAdmin}
                />
              ))}
              {pastSummary.length > 0 && (
                <>
                  {futureSummary.length > 0 && (
                    <div style={{ fontSize: '0.7rem', color: DS.ash, padding: '6px 0 2px', textAlign: 'center', letterSpacing: '0.04em' }}>
                      — passerade datum —
                    </div>
                  )}
                  {pastSummary.map(s => (
                    <div key={s.date} style={{ opacity: 0.4 }}>
                      <DateCard
                        summary={s}
                        myResponse={getEffectiveResponse(responses, memberName, s.date)}
                        memberName={memberName}
                        roundId={round.id}
                        isAdmin={isAdmin}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          {proposedDates.length > 0 && (
            <SummarySection perfect={perfectDates} almost={almostDates} responses={responses} proposedDates={proposedDates} />
          )}

          {/* Admin: add date + lock */}
          {isAdmin && (
            <AdminSection round={round} summary={summary} proposedDates={proposedDates} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Away periods ─────────────────────────────────────────────────────────────

function AwayPeriodsSection({ round, memberName }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [saving, setSaving] = useState(false)

  const memberData = round.responses?.[memberName] || {}
  const periods = memberData.awayPeriods || []

  async function handleAdd() {
    if (!from || !to || from > to) return
    setSaving(true)
    await addAwayPeriod(round.id, memberName, from, to)
    setFrom('')
    setTo('')
    setSaving(false)
  }

  async function handleRemove(period) {
    await removeAwayPeriod(round.id, memberName, period.from, period.to)
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', color: DS.ash, fontSize: '0.78rem',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: '0.65rem', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
        Bortresta perioder {periods.length > 0 && `(${periods.length})`}
      </button>

      {open && (
        <div style={{
          marginTop: 10,
          background: 'rgba(156,153,143,0.1)',
          borderRadius: 16,
          padding: 14,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: '0.72rem', color: DS.ash }}>
            Datum inom perioden markeras automatiskt som "Kan inte".
          </div>

          {periods.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1,
                fontSize: '0.82rem',
                color: DS.soft,
                background: 'rgba(196,124,124,0.12)',
                borderRadius: 8, padding: '5px 10px',
              }}>
                {formatDateSv(p.from)} → {formatDateSv(p.to)}
              </div>
              <button
                onClick={() => handleRemove(p)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: DS.grout, fontSize: '1rem', padding: '4px 6px',
                  lineHeight: 1,
                }}
              >×</button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
              <span style={{ fontSize: '0.67rem', color: DS.ash }}>Från</span>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...inputStyle, padding: '6px 10px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
              <span style={{ fontSize: '0.67rem', color: DS.ash }}>Till</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...inputStyle, padding: '6px 10px' }} />
            </label>
            <button
              onClick={handleAdd}
              disabled={saving || !from || !to || from > to}
              style={{ ...primaryBtnStyle, padding: '8px 16px', fontSize: '0.8rem', alignSelf: 'flex-end' }}
            >
              {saving ? '…' : 'Lägg till'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Date card ────────────────────────────────────────────────────────────────

function DateCard({ summary, myResponse, memberName, roundId }) {
  const [saving, setSaving] = useState(false)

  async function pick(response) {
    if (saving) return
    setSaving(true)
    await setDateResponse(roundId, memberName, summary.date, response)
    setSaving(false)
  }

  const allCan = summary.allCan

  return (
    <div style={{
      background: allCan
        ? 'rgba(186,209,150,0.22)'
        : 'rgba(255,255,255,0.55)',
      borderRadius: 18,
      padding: '12px 14px',
      outline: allCan
        ? '1.5px solid rgba(186,209,150,0.6)'
        : '1px solid rgba(156,153,143,0.2)',
      boxShadow: '0 2px 8px rgba(18,19,18,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.92rem', color: DS.ink }}>
          {formatDateSv(summary.date)}
          {allCan && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: DS.sage, fontFamily: 'inherit', fontWeight: 400 }}>Alla kan!</span>}
        </div>
        <MemberDots summary={summary} />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {[RESPONSES.KAN, RESPONSES.KANSKE, RESPONSES.KAN_INTE].map(r => (
          <button
            key={r}
            onClick={() => pick(r)}
            disabled={saving}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: 10,
              border: 'none',
              cursor: saving ? 'default' : 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'inherit',
              fontWeight: myResponse === r ? 600 : 400,
              background: myResponse === r
                ? RESPONSE_COLOR[r]
                : 'rgba(156,153,143,0.12)',
              color: myResponse === r ? DS.ink : DS.ash,
              transition: 'background 0.15s, color 0.15s',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {RESPONSE_LABEL[r]}
          </button>
        ))}
      </div>
    </div>
  )
}

function MemberDots({ summary }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {MEMBERS.map(member => {
        let r = null
        if (summary.kan.includes(member))       r = RESPONSES.KAN
        else if (summary.kanske.includes(member)) r = RESPONSES.KANSKE
        else if (summary.kan_inte.includes(member)) r = RESPONSES.KAN_INTE

        const color = r ? RESPONSE_COLOR[r] : DS.pebble
        const title = `${member}: ${r ? RESPONSE_LABEL[r] : 'Ej svarat'}`

        return (
          <div
            key={member}
            title={title}
            style={{
              width: 10, height: 10, borderRadius: '50%',
              background: color,
              border: r ? 'none' : '1.5px solid rgba(156,153,143,0.5)',
              boxSizing: 'border-box',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Summary section ──────────────────────────────────────────────────────────

function SummarySection({ perfect, almost, responses, proposedDates }) {
  const silent = MEMBERS.filter(m =>
    proposedDates.every(d => getEffectiveResponse(responses, m, d) === null)
  )

  if (perfect.length === 0 && almost.length === 0 && silent.length === 0) return null

  return (
    <div>
      <MutedLabel>Sammanfattning</MutedLabel>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {perfect.length > 0 && (
          <SummaryBlock
            label="Fungerar för alla"
            color={DS.sage}
            dates={perfect.map(s => s.date)}
          />
        )}

        {almost.length > 0 && (
          <SummaryBlock
            label="Ingen har nekat"
            color={DS.sand}
            dates={almost.map(s => s.date)}
          />
        )}

        {perfect.length === 0 && almost.length === 0 && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(156,153,143,0.1)',
            borderRadius: 12,
            fontSize: '0.78rem',
            color: DS.soft,
          }}>
            Inget datum fungerar för alla ännu. Lägg till fler datum eller vänta på fler svar.
          </div>
        )}

        {silent.length > 0 && (
          <div style={{
            padding: '8px 14px',
            background: 'rgba(201,192,148,0.2)',
            borderRadius: 12,
            fontSize: '0.78rem',
            color: DS.soft,
          }}>
            Har inte svarat alls: {silent.join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryBlock({ label, color, dates }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: `${color}22`,
      borderRadius: 12,
      outline: `1px solid ${color}66`,
    }}>
      <div style={{ fontSize: '0.7rem', color: DS.ash, marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {dates.map(d => (
        <div key={d} style={{ fontSize: '0.85rem', color: DS.ink, fontFamily: LORA, fontWeight: 500, lineHeight: 1.6 }}>
          {formatDateSv(d)}
        </div>
      ))}
    </div>
  )
}

// ─── Admin section ────────────────────────────────────────────────────────────

function AdminSection({ round, summary, proposedDates }) {
  const [showAddDate, setShowAddDate] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(null)

  async function handleAddDate() {
    if (!newDate || proposedDates.includes(newDate)) return
    setSaving(true)
    await addProposedDate(round.id, newDate)
    setNewDate('')
    setShowAddDate(false)
    setSaving(false)
  }

  async function handleLock(dateStr) {
    setLocking(dateStr)
    await lockRoundDate(round.id, dateStr)
    setLocking(null)
  }

  const lockableDates = summary.filter(s => s.allCan || s.noneCantGo)

  return (
    <div style={{ borderTop: '1px solid rgba(156,153,143,0.2)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <MutedLabel>Admin</MutedLabel>

      {!showAddDate ? (
        <button onClick={() => setShowAddDate(true)} style={ghostBtnStyle}>
          + Lägg till datum
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 140 }}>
            <span style={{ fontSize: '0.67rem', color: DS.ash }}>Nytt datum</span>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              style={inputStyle}
            />
          </label>
          <button onClick={handleAddDate} disabled={saving || !newDate} style={{ ...primaryBtnStyle, padding: '8px 16px', fontSize: '0.8rem' }}>
            {saving ? '…' : 'Lägg till'}
          </button>
          <button onClick={() => setShowAddDate(false)} style={{ ...ghostBtnStyle, padding: '8px 16px', fontSize: '0.8rem' }}>
            Avbryt
          </button>
        </div>
      )}

      {lockableDates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.72rem', color: DS.ash }}>Lås ett datum som nästa träff:</div>
          {lockableDates.map(s => (
            <button
              key={s.date}
              onClick={() => handleLock(s.date)}
              disabled={locking === s.date}
              style={{
                ...primaryBtnStyle,
                background: s.allCan ? DS.sage : DS.sand,
                fontSize: '0.82rem',
                padding: '9px 16px',
                textAlign: 'left',
              }}
            >
              {locking === s.date ? 'Låser…' : `Lås ${formatDateSv(s.date)}${s.allCan ? ' — alla kan' : ' — nästan'}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

const CAL_WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const CAL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function getMonthDays(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const days = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay; d++) days.push(d)
  return days
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CalendarView({ summary }) {
  const today = new Date().toISOString().slice(0, 10)
  const summaryMap = Object.fromEntries(summary.map(s => [s.date, s]))
  const months = [...new Set(summary.map(s => s.date.slice(0, 7)))].sort()
  if (months.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {months.map(ym => {
        const year = parseInt(ym.slice(0, 4))
        const month = parseInt(ym.slice(5, 7)) - 1
        return <MonthGrid key={ym} year={year} month={month} summaryMap={summaryMap} today={today} />
      })}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: '0 2px', fontSize: '0.68rem', color: DS.ash }}>
        {[
          { color: DS.sage,    label: 'Alla kan' },
          { color: DS.sand,    label: 'Osäkert' },
          { color: '#c47c7c',  label: 'Någon kan inte' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthGrid({ year, month, summaryMap, today }) {
  const days = getMonthDays(year, month)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      borderRadius: 18,
      padding: '14px 12px',
      outline: '1px solid rgba(156,153,143,0.2)',
    }}>
      <div style={{
        fontFamily: LORA, fontWeight: 600, fontSize: '0.85rem',
        color: DS.ink, marginBottom: 10, textAlign: 'center',
      }}>
        {CAL_MONTHS[month]} {year}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {CAL_WEEKDAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.58rem', color: DS.ash, fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((day, i) => {
          if (!day) return <div key={`_${i}`} />
          const dateStr = toDateStr(year, month, day)
          const s = summaryMap[dateStr]
          const isPast = dateStr < today

          let dotColor = null
          if (s) {
            if (s.kan_inte.length > 0) dotColor = '#c47c7c'
            else if (s.allCan)         dotColor = DS.sage
            else                       dotColor = DS.sand
          }

          return (
            <div key={day} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '3px 1px', opacity: isPast ? 0.35 : 1,
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: s ? DS.ink : DS.ash,
                fontWeight: s ? 600 : 400,
              }}>
                {day}
              </div>
              {dotColor && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: dotColor, marginTop: 1,
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Shared components ────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: subtitle ? 2 : 0 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.78rem', color: DS.ash }}>{subtitle}</div>
      )}
    </div>
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
