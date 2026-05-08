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
                <div id="main-scroll" style={{
                  minHeight: '100vh',
                  paddingBottom: 'calc(62px + env(safe-area-inset-bottom))',
                  background: DS.dune,
                }}>
                  <AppHeader />
                  <Outlet />
                </div>
                <BottomNav />
              </SuggestionsProvider>
            </PlanningProvider>
          </PhotosProvider>
        </RecipesProvider>
      </BooksProvider>
    </RequireAuth>
  )
}
