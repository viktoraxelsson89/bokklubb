import { Outlet } from 'react-router-dom'
import { BooksProvider } from '../context/BooksContext.jsx'
import { RecipesProvider } from '../context/RecipesContext.jsx'
import { PhotosProvider } from '../context/PhotosContext.jsx'
import RequireAuth from './RequireAuth.jsx'
import BottomNav from './BottomNav.jsx'
import AppHeader from './AppHeader.jsx'

export default function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <BooksProvider>
        <RecipesProvider>
          <PhotosProvider>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
              <AppHeader />
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                <Outlet />
              </div>
              <BottomNav />
            </div>
          </PhotosProvider>
        </RecipesProvider>
      </BooksProvider>
    </RequireAuth>
  )
}
