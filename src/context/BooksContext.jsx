import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToBooks } from '../firebase/books.js'
import { getCurrentBook } from '../domain/books.js'

const BooksContext = createContext(null)

export function BooksProvider({ children }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToBooks(incoming => {
      setBooks(incoming)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <BooksContext.Provider value={{ books, currentBook: getCurrentBook(books), loading }}>
      {children}
    </BooksContext.Provider>
  )
}

export function useBooks() {
  return useContext(BooksContext)
}
