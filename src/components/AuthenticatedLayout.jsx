import { Outlet } from 'react-router-dom'
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
                  height: '100dvh',
                  minHeight: '-webkit-fill-available',
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
