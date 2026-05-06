import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
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

export function addComment(suggestionId, { text, authorName }) {
  return addDoc(
    collection(db, 'suggestions', suggestionId, 'comments'),
    { text, authorName, createdAt: new Date().toISOString() }
  )
}
