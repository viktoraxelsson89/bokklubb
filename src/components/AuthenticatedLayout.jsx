import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BooksProvider } from '../context/BooksContext.jsx'
import { RecipesProvider } from '../context/RecipesContext.jsx'
import { PhotosProvider } from '../context/PhotosContext.jsx'
import { PlanningProvider } from '../context/PlanningContext.jsx'
import { SuggestionsProvider } from '../context/SuggestionsContext.jsx'
import RequireAuth from './RequireAuth.jsx'
import BottomNav from './BottomNav.jsx'
import AppHeader from './AppHeader.jsx'
import { DS } from '../styles/tokens.js'

export default function AuthenticatedLayout() {
  const { pathname } = useLocation()
  useAppViewportHeight(pathname)

  return (
    <RequireAuth>
      <BooksProvider>
        <RecipesProvider>
          <PhotosProvider>
            <PlanningProvider>
              <SuggestionsProvider>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'var(--app-height, 100dvh)',
                  overflow: 'hidden',
                  background: DS.darkBg,
                }}>
                  <AppHeader />
                  <div id="main-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
                    <Outlet />
                  </div>
                  <BottomNav />
                </div>
              </SuggestionsProvider>
            </PlanningProvider>
          </PhotosProvider>
        </RecipesProvider>
      </BooksProvider>
    </RequireAuth>
  )
}

function useAppViewportHeight(pathname) {
  useEffect(() => {
    updateAppViewportHeight()
    window.addEventListener('resize', updateAppViewportHeight)
    window.addEventListener('orientationchange', updateAppViewportHeight)
    window.addEventListener('pageshow', updateAppViewportHeight)
    window.visualViewport?.addEventListener('resize', updateAppViewportHeight)
    document.addEventListener('visibilitychange', updateAppViewportHeight)

    return () => {
      window.removeEventListener('resize', updateAppViewportHeight)
      window.removeEventListener('orientationchange', updateAppViewportHeight)
      window.removeEventListener('pageshow', updateAppViewportHeight)
      window.visualViewport?.removeEventListener('resize', updateAppViewportHeight)
      document.removeEventListener('visibilitychange', updateAppViewportHeight)
    }
  }, [])

  useEffect(() => {
    updateAppViewportHeight()
  }, [pathname])
}

function updateAppViewportHeight() {
  const height = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
}
