import { doc, getDoc } from 'firebase/firestore'
import { db } from './config.js'

const configDoc = doc(db, 'appState', 'config')

export async function getAppState() {
  const snap = await getDoc(configDoc)
  return snap.exists() ? snap.data() : null
}
