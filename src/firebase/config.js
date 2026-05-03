import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyD7Lrv3NnOGnLXpbyY_ns6dBJlyO374ei4',
  authDomain: 'bokklubb-21022.firebaseapp.com',
  projectId: 'bokklubb-21022',
  storageBucket: 'bokklubb-21022.firebasestorage.app',
  messagingSenderId: '22696759927',
  appId: '1:22696759927:web:2e70088596f6104d6bec72',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
