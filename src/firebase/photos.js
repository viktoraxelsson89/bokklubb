import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from './config.js'

const photosCol = collection(db, 'photos')

export function subscribeToPhotos(callback) {
  const q = query(photosCol, orderBy('uploadedAt', 'desc'))
  return onSnapshot(q, snap => {
    const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(photos)
  })
}

export function addPhoto(payload) {
  return addDoc(photosCol, payload)
}

export function deletePhoto(photoId) {
  return deleteDoc(doc(db, 'photos', photoId))
}

export async function uploadPhotoBlob(storagePath, blob) {
  const fileRef = ref(storage, storagePath)
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(fileRef)
}

export async function deletePhotoFile(storagePath) {
  if (!storagePath) return
  try {
    await deleteObject(ref(storage, storagePath))
  } catch (err) {
    if (err?.code !== 'storage/object-not-found') throw err
  }
}
