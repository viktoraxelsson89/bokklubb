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
            <div style={{ paddingBottom: 80 }}>
              <AppHeader />
              <Outlet />
            </div>
            <BottomNav />
          </PhotosProvider>
        </RecipesProvider>
      </BooksProvider>
    </RequireAuth>
  )
}
