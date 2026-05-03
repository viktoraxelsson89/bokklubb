import { Outlet } from 'react-router-dom'
import { BooksProvider } from '../context/BooksContext.jsx'
import RequireAuth from './RequireAuth.jsx'
import BottomNav from './BottomNav.jsx'
import AppHeader from './AppHeader.jsx'

export default function AuthenticatedLayout() {
  return (
    <RequireAuth>
      <BooksProvider>
        <div style={{ paddingBottom: 80 }}>
          <AppHeader />
          <Outlet />
        </div>
        <BottomNav />
      </BooksProvider>
    </RequireAuth>
  )
}
