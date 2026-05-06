import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx'
import Login from './pages/Login.jsx'
import Bookshelf from './pages/Bookshelf.jsx'
import BookDetails from './pages/BookDetails.jsx'
import BookEdit from './pages/BookEdit.jsx'
import BookAdd from './pages/BookAdd.jsx'
import Seasons from './pages/Seasons.jsx'
import Members from './pages/Members.jsx'
import Statistics from './pages/Statistics.jsx'
import Kokbok from './pages/Kokbok.jsx'
import RecipeDetails from './pages/RecipeDetails.jsx'
import RecipeEdit from './pages/RecipeEdit.jsx'
import Bilder from './pages/Bilder.jsx'
import Planning from './pages/Planning.jsx'
import Suggestions from './pages/Suggestions.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Bookshelf />} />
            <Route path="/books/new" element={<BookAdd />} />
            <Route path="/books/:bookId" element={<BookDetails />} />
            <Route path="/books/:bookId/edit" element={<BookEdit />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/members" element={<Members />} />
            <Route path="/stats"   element={<Statistics />} />
            <Route path="/kokbok"  element={<Kokbok />} />
            <Route path="/recipes/:recipeId" element={<RecipeDetails />} />
            <Route path="/recipes/:recipeId/edit" element={<RecipeEdit />} />
            <Route path="/books/:bookId/recipes/new" element={<RecipeEdit />} />
            <Route path="/bilder"  element={<Bilder />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/tips"     element={<Suggestions />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
