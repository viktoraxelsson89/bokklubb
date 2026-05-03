import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx'
import Login from './pages/Login.jsx'
import Bookshelf from './pages/Bookshelf.jsx'
import BookDetails from './pages/BookDetails.jsx'
import BookEdit from './pages/BookEdit.jsx'
import Seasons from './pages/Seasons.jsx'
import Members from './pages/Members.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Bookshelf />} />
            <Route path="/books/:bookId" element={<BookDetails />} />
            <Route path="/books/:bookId/edit" element={<BookEdit />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/members" element={<Members />} />
            <Route path="/stats"   element={<Placeholder title="Statistik" />} />
            <Route path="/kokbok"  element={<Placeholder title="Kokbok" />} />
            <Route path="/bilder"  element={<Placeholder title="Bilder" />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
