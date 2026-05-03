import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToPhotos } from '../firebase/photos.js'
import { normalizePhoto } from '../domain/photos.js'

const PhotosContext = createContext(null)

export function PhotosProvider({ children }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToPhotos(incoming => {
      setPhotos(incoming.map(normalizePhoto))
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <PhotosContext.Provider value={{ photos, loading }}>
      {children}
    </PhotosContext.Provider>
  )
}

export function usePhotos() {
  return useContext(PhotosContext)
}
