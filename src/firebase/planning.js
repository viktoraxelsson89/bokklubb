import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './config.js'

const planningCol = collection(db, 'planningRounds')

export function subscribeToActiveRound(callback) {
  const q = query(planningCol, where('status', 'in', ['active', 'locked']))
  return onSnapshot(q, snap => {
    const rounds = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const sorted = rounds.sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    )
    callback(sorted[0] || null)
  })
}

export function createRound({ title, proposedDates, createdBy }) {
  return addDoc(planningCol, {
    title,
    status: 'active',
    proposedDates: [...proposedDates].sort(),
    responses: {},
    lockedDate: null,
    createdBy,
    createdAt: new Date().toISOString(),
  })
}

export function setDateResponse(roundId, memberName, dateStr, response) {
  return updateDoc(doc(db, 'planningRounds', roundId), {
    [`responses.${memberName}.dates.${dateStr}`]: response,
  })
}

export function addAwayPeriod(roundId, memberName, from, to) {
  return updateDoc(doc(db, 'planningRounds', roundId), {
    [`responses.${memberName}.awayPeriods`]: arrayUnion({ from, to }),
  })
}

export function removeAwayPeriod(roundId, memberName, from, to) {
  return updateDoc(doc(db, 'planningRounds', roundId), {
    [`responses.${memberName}.awayPeriods`]: arrayRemove({ from, to }),
  })
}

export function addProposedDate(roundId, dateStr) {
  return updateDoc(doc(db, 'planningRounds', roundId), {
    proposedDates: arrayUnion(dateStr),
  })
}

export function lockRoundDate(roundId, dateStr) {
  return updateDoc(doc(db, 'planningRounds', roundId), {
    status: 'locked',
    lockedDate: dateStr,
  })
}

export function unlockRound(roundId) {
  return updateDoc(doc(db, 'planningRounds', roundId), {
    status: 'active',
    lockedDate: null,
  })
}
