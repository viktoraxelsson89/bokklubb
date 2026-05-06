import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToActiveRound } from '../firebase/planning.js'

const PlanningContext = createContext(null)

export function PlanningProvider({ children }) {
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToActiveRound(incoming => {
      setRound(incoming)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <PlanningContext.Provider value={{ round, loading }}>
      {children}
    </PlanningContext.Provider>
  )
}

export function usePlanning() {
  return useContext(PlanningContext)
}
