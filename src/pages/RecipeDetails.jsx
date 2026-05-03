import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { useRecipes } from '../context/RecipesContext.jsx'
import { canEditRecipe } from '../domain/recipes.js'
import { deleteRecipe, deleteRecipeImage } from '../firebase/recipes.js'
import { DS, LORA, SYS } from '../styles/tokens.js'
import { MutedLabel, PrimaryBtn } from '../components/ui.jsx'

export default function RecipeDetails() {
  const { recipeId } = useParams()
  const { userData } = useAuth()
  const { books, loading: booksLoading } = useBooks()
  const { recipes, loading: recipesLoading } = useRecipes()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  if (booksLoading || recipesLoading) {
    return <Shell>Laddar…</Shell>
  }

  const recipe = recipes.find(r => r.id === recipeId)
  if (!recipe) return <Shell>Receptet hittades inte.</Shell>

  const book = books.find(b => b.id === recipe.bookId)
  const canEdit = book ? canEditRecipe(book, userData) : false

  async function handleDelete() {
    if (!confirm('Ta bort detta recept?')) return
    setDeleting(true)
    setError('')
    try {
      if (recipe.imagePath) {
        await deleteRecipeImage(recipe.imagePath)
      }
      await deleteRecipe(recipe.id)
      navigate('/kokbok')
    } catch (err) {
      setError(err.message || 'Kunde inte ta bort')
      setDeleting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {recipe.imageUrl ? (
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            background: DS.dune,
            overflow: 'hidden',
          }}>
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <button onClick={() => navigate(-1)} style={overlayBackBtn}>
              <BackArrow color="#fff" />
            </button>
          </div>
        ) : (
          <div style={{
            background: DS.darkBg,
            padding: '14px 18px 24px',
            color: DS.bone,
          }}>
            <button onClick={() => navigate(-1)} style={darkBackBtn}>
              <BackArrow color="rgba(244,243,241,0.7)" />
            </button>
          </div>
        )}

        <div style={{ padding: '18px 14px 32px' }}>

          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: LORA, fontWeight: 600, fontSize: '1.4rem',
              color: DS.ink, lineHeight: 1.25, marginBottom: 6,
            }}>
              {recipe.name || 'Namnlöst recept'}
            </div>
            <div style={{
              fontFamily: SYS, fontSize: '0.78rem', color: DS.soft,
              display: 'flex', flexWrap: 'wrap', gap: 10,
            }}>
              {book && (
                <Link to={`/books/${book.id}`} style={{
                  color: DS.ink, textDecoration: 'underline',
                  textDecorationColor: 'rgba(18,19,18,0.3)',
                }}>
                  {book.title}
                </Link>
              )}
              {recipe.host && <span>· Värd: {recipe.host}</span>}
              {recipe.season != null && <span>· Säsong {book?.season ?? recipe.season}</span>}
              {book?.meetingDate && <span>· {book.meetingDate}</span>}
            </div>
          </div>

          {recipe.ingredients ? (
            <Section title="Ingredienser">
              <pre style={textBlock}>{recipe.ingredients}</pre>
            </Section>
          ) : null}

          {recipe.instructions ? (
            <Section title="Gör så här">
              <pre style={textBlock}>{recipe.instructions}</pre>
            </Section>
          ) : null}

          {!recipe.ingredients && !recipe.instructions && (
            <FallbackContent recipe={recipe} canEdit={canEdit} />
          )}

          {recipe.originalUrl && (
            <Section title="Källa">
              <a href={recipe.originalUrl} target="_blank" rel="noopener noreferrer" style={{
                fontSize: '0.85rem', color: DS.ink,
                wordBreak: 'break-all',
              }}>{recipe.originalUrl}</a>
            </Section>
          )}

          {error && (
            <div style={{
              background: 'rgba(180,60,60,0.08)', color: '#8b3a3a',
              fontSize: '0.85rem', padding: '10px 14px', borderRadius: 12,
              outline: '1px solid rgba(180,60,60,0.18)',
              margin: '12px 0',
            }}>{error}</div>
          )}

          {canEdit && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <PrimaryBtn onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>
                Redigera
              </PrimaryBtn>
              <button onClick={handleDelete} disabled={deleting} style={dangerBtn}>
                {deleting ? 'Tar bort…' : 'Ta bort'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FallbackContent({ recipe, canEdit }) {
  if (recipe.originalUrl) {
    return (
      <div style={{
        padding: 14,
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 14,
        outline: '1px solid rgba(156,153,143,0.18)',
        marginBottom: 14,
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: DS.soft }}>
          Receptet finns bara som länk. {canEdit && 'Klicka på "Redigera" för att klistra in ingredienser och instruktioner direkt här.'}
        </p>
        <a href={recipe.originalUrl} target="_blank" rel="noopener noreferrer" style={{
          fontSize: '0.85rem', color: DS.ink,
        }}>Öppna originalreceptet ↗</a>
      </div>
    )
  }
  return (
    <p style={{ color: DS.ash, fontSize: '0.88rem' }}>
      Inget receptinnehåll än.
    </p>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 8 }}><MutedLabel>{title}</MutedLabel></div>
      {children}
    </div>
  )
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, padding: 24, color: DS.soft }}>
      {children}
    </div>
  )
}

function BackArrow({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

const textBlock = {
  margin: 0,
  padding: 14,
  background: DS.bone,
  borderRadius: 14,
  outline: '1px solid rgba(156,153,143,0.15)',
  boxShadow: DS.shadowSoft,
  fontFamily: SYS,
  fontSize: '0.9rem',
  color: DS.ink,
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
}

const overlayBackBtn = {
  position: 'absolute', top: 12, left: 12,
  background: 'rgba(18,19,18,0.5)', border: 'none', cursor: 'pointer',
  borderRadius: 10, width: 34, height: 34,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(4px)',
}

const darkBackBtn = {
  background: 'rgba(244,243,241,0.1)', border: 'none', cursor: 'pointer',
  borderRadius: 10, width: 30, height: 30,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const dangerBtn = {
  background: 'transparent', border: '1px solid rgba(180,60,60,0.4)',
  color: '#8b3a3a', borderRadius: 20,
  padding: '10px 18px', fontWeight: 600, fontFamily: 'inherit',
  fontSize: '0.85rem', cursor: 'pointer',
}
