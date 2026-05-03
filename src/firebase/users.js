import { doc, getDoc } from 'firebase/firestore'
import { db } from './config.js'

export async function getUserData(email) {
  const snap = await getDoc(doc(db, 'users', email))
  return snap.exists() ? snap.data() : null
}
