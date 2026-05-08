import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, increment, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from './config.js'

const suggestionsCol = collection(db, 'suggestions')

export function subscribeToSuggestions(callback) {
  const q = query(suggestionsCol, orderBy('addedAt', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function addSuggestion(data) {
  return addDoc(suggestionsCol, { ...data, addedAt: new Date().toISOString() })
}

export function updateSuggestion(id, data) {
  return updateDoc(doc(db, 'suggestions', id), data)
}

export function deleteSuggestion(id) {
  return deleteDoc(doc(db, 'suggestions', id))
}

export function subscribeToComments(suggestionId, callback) {
  const q = query(
    collection(db, 'suggestions', suggestionId, 'comments'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addComment(suggestionId, { text, authorName }) {
  const batch = writeBatch(db)
  const commentRef = doc(collection(db, 'suggestions', suggestionId, 'comments'))
  batch.set(commentRef, { text, authorName, createdAt: serverTimestamp() })
  batch.update(doc(db, 'suggestions', suggestionId), { commentCount: increment(1) })
  await batch.commit()
}
