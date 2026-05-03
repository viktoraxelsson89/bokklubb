import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, logoutUser } from '../firebase/auth.js'
import { getUserData } from '../firebase/users.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = auth state not yet known, null = logged out
  const [user, setUser] = useState(undefined)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    return onAuthChange(async firebaseUser => {
      if (firebaseUser) {
        const data = await getUserData(firebaseUser.email)
        setUserData(data)
      } else {
        setUserData(null)
      }
      setUser(firebaseUser)
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      userData,
      loading: user === undefined,
      logout: logoutUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
