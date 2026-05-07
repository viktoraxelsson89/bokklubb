import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx'
import Login from './pages/Login.jsx'

const Bookshelf    = lazy(() => import('./pages/Bookshelf.jsx'))
const BookDetails  = lazy(() => import('./pages/BookDetails.jsx'))
const BookEdit     = lazy(() => import('./pages/BookEdit.jsx'))
const BookAdd      = lazy(() => import('./pages/BookAdd.jsx'))
const Seasons      = lazy(() => import('./pages/Seasons.jsx'))
const Members      = lazy(() => import('./pages/Members.jsx'))
const Statistics   = lazy(() => import('./pages/Statistics.jsx'))
const Kokbok       = lazy(() => import('./pages/Kokbok.jsx'))
const RecipeDetails = lazy(() => import('./pages/RecipeDetails.jsx'))
const RecipeEdit   = lazy(() => import('./pages/RecipeEdit.jsx'))
const Bilder       = lazy(() => import('./pages/Bilder.jsx'))
const Planning     = lazy(() => import('./pages/Planning.jsx'))
const Suggestions  = lazy(() => import('./pages/Suggestions.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
