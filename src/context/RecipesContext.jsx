import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToRecipes } from '../firebase/recipes.js'

const RecipesContext = createContext(null)

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToRecipes(incoming => {
      setRecipes(incoming)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <RecipesContext.Provider value={{ recipes, loading }}>
      {children}
    </RecipesContext.Provider>
  )
}

export function useRecipes() {
  return useContext(RecipesContext)
}
