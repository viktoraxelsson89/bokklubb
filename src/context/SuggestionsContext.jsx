import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToSuggestions } from '../firebase/suggestions.js'

const SuggestionsContext = createContext(null)

export function SuggestionsProvider({ children }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToSuggestions(incoming => {
      setSuggestions(incoming)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <SuggestionsContext.Provider value={{ suggestions, loading }}>
      {children}
    </SuggestionsContext.Provider>
  )
}

export function useSuggestions() {
  const ctx = useContext(SuggestionsContext)
  if (!ctx) throw new Error('useSuggestions must be used within SuggestionsProvider')
  return ctx
}
