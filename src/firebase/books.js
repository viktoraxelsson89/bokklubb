import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config.js'

const booksCol = collection(db, 'books')

export function subscribeToBooks(callback) {
  const q = query(booksCol, orderBy('season'), orderBy('dateAdded', 'desc'))
  return onSnapshot(q, snap => {
    const books = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(books)
  })
}

export function updateBook(bookId, updates) {
  return updateDoc(doc(db, 'books', bookId), updates)
}

export function addBook(bookData) {
  return addDoc(booksCol, bookData)
}

export async function setCurrentBook(bookId, allBooks) {
  const batch = writeBatch(db)

  for (const book of allBooks.filter(b => b.isCurrentBook)) {
    batch.update(doc(db, 'books', book.id), { isCurrentBook: false })
  }
  batch.update(doc(db, 'books', bookId), { isCurrentBook: true })
  batch.update(doc(db, 'appState', 'config'), {
    currentBookId: bookId,
    lastUpdated: new Date().toISOString(),
  })

  return batch.commit()
}
