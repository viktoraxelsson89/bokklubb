import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from './config.js'

const recipesCol = collection(db, 'recipes')

export function subscribeToRecipes(callback) {
  const q = query(recipesCol, orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const recipes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(recipes)
  })
}

export function addRecipe(recipeData) {
  return addDoc(recipesCol, recipeData)
}

export function updateRecipe(recipeId, updates) {
  return updateDoc(doc(db, 'recipes', recipeId), updates)
}

export function deleteRecipe(recipeId) {
  return deleteDoc(doc(db, 'recipes', recipeId))
}

export async function uploadRecipeImage(recipeId, blob) {
  const path = `recipes/${recipeId}/cover-${Date.now()}.jpg`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(fileRef)
  return { path, url }
}

export async function deleteRecipeImage(path) {
  if (!path) return
  try {
    await deleteObject(ref(storage, path))
  } catch (err) {
    if (err?.code !== 'storage/object-not-found') throw err
  }
}
