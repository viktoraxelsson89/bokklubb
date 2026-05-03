import { MEMBERS, BOOK_PHASES } from './constants.js'

function emptyVoteEntry() {
  return { vote: null, comment: '', submitted: false, submittedAt: null }
}

function emptyFinalEntry() {
  return { ...emptyVoteEntry(), changedFromPreliminary: false }
}

export function buildNewBookDoc(form, now = new Date().toISOString()) {
  const seasonInt = parseInt(form.season, 10)
  const preliminaryVotes = {}
  const finalJudgments = {}
  for (const member of MEMBERS) {
    preliminaryVotes[member] = emptyVoteEntry()
    finalJudgments[member] = emptyFinalEntry()
  }

  return {
    title: String(form.title ?? '').trim(),
    author: String(form.author ?? '').trim(),
    season: Number.isFinite(seasonInt) ? seasonInt : null,
    chosenBy: form.chosenBy || null,
    meetingDate: form.meetingDate || null,
    coverUrl: form.coverUrl?.trim() || null,
    phase: BOOK_PHASES.PRELIMINARY_VOTING,
    preliminaryVotes,
    finalJudgments,
    preliminaryAverage: null,
    finalAverage: null,
    averageChange: null,
    votesChanged: null,
    ratings: null,
    isCurrentBook: false,
    dateAdded: now,
  }
}

export function validateNewBookForm(form) {
  if (!form.title?.trim()) return 'Titel krävs'
  const seasonInt = parseInt(form.season, 10)
  if (!Number.isFinite(seasonInt) || seasonInt < 1) return 'Säsong måste vara ett positivt heltal'
  return null
}
