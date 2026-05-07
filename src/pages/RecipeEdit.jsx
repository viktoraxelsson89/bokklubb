import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useBooks } from '../context/BooksContext.jsx'
import { useRecipes } from '../context/RecipesContext.jsx'
import {
  buildRecipeFormFromRecipe,
  buildRecipeFormFromBookLegacy,
  buildRecipePayload,
  buildRecipeUpdates,
  validateRecipeForm,
  canEditRecipe,
  canAddRecipe,
} from '../domain/recipes.js'
import {
  addRecipe,
  updateRecipe,
  uploadRecipeImage,
  deleteRecipeImage,
} from '../firebase/recipes.js'
import { compressImage } from '../domain/image.js'
import { DS, LORA, SYS } from '../styles/tokens.js'
import { IconButton, MutedLabel, PrimaryBtn } from '../components/ui.jsx'

export default function RecipeEdit() {
  const params = useParams()
  const { recipeId, bookId: bookIdFromUrl } = params
  const isNew = !recipeId
  const [searchParams] = useSearchParams()
  const wantsLegacyPrefill = isNew && searchParams.get('prefill') === 'legacy'

  const { userData } = useAuth()
  const { books, loading: booksLoading } = useBooks()
  const { recipes, loading: recipesLoading } = useRecipes()
  const navigate = useNavigate()

  const recipe = useMemo(
    () => (recipeId ? recipes.find(r => r.id === recipeId) : null),
    [recipeId, recipes],
  )
  const book = useMemo(
    () => books.find(b => b.id === (recipe?.bookId || bookIdFromUrl)),
    [books, recipe, bookIdFromUrl],
  )

  const [form, setForm] = useState(buildRecipeFormFromRecipe(null))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (recipe) setForm(buildRecipeFormFromRecipe(recipe))
    else if (wantsLegacyPrefill && book) setForm(buildRecipeFormFromBookLegacy(book))
  }, [recipe, wantsLegacyPrefill, book])

  useEffect(() => {
    if (wantsLegacyPrefill && book?.recipeImageUrl && !imagePreview) {
      setImagePreview(book.recipeImageUrl)
    }
  }, [wantsLegacyPrefill, book, imagePreview])

  if (booksLoading || recipesLoading) return <Shell>Laddar…</Shell>
  if (!isNew && !recipe) return <Shell>Receptet hittades inte.</Shell>
  if (!book) return <Shell>Boken hittades inte.</Shell>

  const allowed = isNew ? canAddRecipe(book, userData) : canEditRecipe(book, userData)
  if (!allowed) {
    return <Navigate to={isNew ? `/books/${book.id}` : `/recipes/${recipe.id}`} replace />
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const validationError = validateRecipeForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const now = new Date().toISOString()

      let targetId = recipeId
      if (isNew) {
        const payload = buildRecipePayload(form, {
          bookId: book.id,
          createdBy: userData.displayName,
          now,
        })
        if (wantsLegacyPrefill && book.recipeImageUrl && !imageFile) {
          payload.imageUrl = book.recipeImageUrl
        }
        const docRef = await addRecipe(payload)
        targetId = docRef.id
      } else {
        await updateRecipe(recipeId, buildRecipeUpdates(form, now))
      }

      if (imageFile) {
        const blob = await compressImage(imageFile, { maxWidth: 1200, quality: 0.85 })
        if (!isNew && recipe?.imagePath) {
          await deleteRecipeImage(recipe.imagePath)
        }
        const { path, url } = await uploadRecipeImage(targetId, blob)
        await updateRecipe(targetId, { imagePath: path, imageUrl: url, updatedAt: new Date().toISOString() })
      }

      navigate(`/recipes/${targetId}`)
    } catch (err) {
      setError(err.message || 'Kunde inte spara')
      setSubmitting(false)
    }
  }

  const currentImage = imagePreview || recipe?.imageUrl

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 14px 32px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '0 4px' }}>
          <IconButton onClick={() => navigate(-1)} label="Tillbaka" size={30}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </IconButton>
          <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem' }}>
            {isNew ? 'Lägg till recept' : 'Redigera recept'}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Card>
            <div style={{ marginBottom: 12 }}><MutedLabel>Bok</MutedLabel></div>
            <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '0.95rem', color: DS.ink }}>
              {book.title}
            </div>
            <div style={{ fontFamily: LORA, fontStyle: 'italic', fontSize: '0.78rem', color: DS.soft, marginTop: 2 }}>
              {book.author} · Säsong {book.season} · Värd: {book.chosenBy}
            </div>
          </Card>

          <Card>
            <SectionLabel>Bild</SectionLabel>
            {currentImage ? (
              <div style={{
                width: '100%', aspectRatio: '4 / 3',
                borderRadius: 14, overflow: 'hidden',
                marginBottom: 10,
                background: DS.dune,
              }}>
                <img src={currentImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{
                width: '100%', aspectRatio: '4 / 3',
                borderRadius: 14, marginBottom: 10,
                background: 'rgba(255,255,255,0.5)',
                outline: '1px dashed rgba(156,153,143,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: DS.ash, fontSize: '0.82rem',
              }}>Ingen bild</div>
            )}
            <label style={{
              display: 'inline-block', cursor: 'pointer',
              padding: '8px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.7)',
              outline: '1px solid rgba(156,153,143,0.25)',
              fontSize: '0.82rem', fontWeight: 500, color: DS.ink,
            }}>
              {currentImage ? 'Byt bild' : 'Välj bild'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {imageFile && (
              <span style={{ marginLeft: 10, fontSize: '0.78rem', color: DS.soft }}>
                {imageFile.name}
              </span>
            )}
          </Card>

          <Card>
            <SectionLabel>Receptinnehåll</SectionLabel>
            <Field label="Receptnamn" required>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                style={inputStyle}
                required
              />
            </Field>
            <Field label="Ingredienser">
              <textarea
                value={form.ingredients}
                onChange={e => setField('ingredients', e.target.value)}
                placeholder="En per rad…"
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: SYS }}
              />
            </Field>
            <Field label="Instruktioner">
              <textarea
                value={form.instructions}
                onChange={e => setField('instructions', e.target.value)}
                rows={8}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: SYS }}
              />
            </Field>
            <Field label="Originallänk (valfritt)">
              <input
                type="url"
                value={form.originalUrl}
                onChange={e => setField('originalUrl', e.target.value)}
                placeholder="https://…"
                style={inputStyle}
              />
            </Field>
          </Card>

          {error && (
            <div style={{
              background: 'rgba(180,60,60,0.08)', color: '#8b3a3a',
              fontSize: '0.85rem', padding: '10px 14px', borderRadius: 12,
              outline: '1px solid rgba(180,60,60,0.18)',
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate(-1)} style={cancelBtn}>
              Avbryt
            </button>
            <PrimaryBtn type="submit">
              {submitting ? 'Sparar…' : (isNew ? 'Skapa recept' : 'Spara')}
            </PrimaryBtn>
          </div>
        </form>
      </div>
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

function Card({ children }) {
  return (
    <div style={{
      background: DS.bone,
      borderRadius: 20,
      padding: 18,
      boxShadow: DS.shadowSoft,
      outline: '1px solid rgba(156,153,143,0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: DS.sheen, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ marginBottom: 12 }}><MutedLabel>{children}</MutedLabel></div>
}

function Field({ label, required, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
      <span style={{
        fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: DS.ash,
      }}>
        {label}
        {required && <span style={{ color: '#b94a48', marginLeft: 4 }}>*</span>}
      </span>
      {children}
    </label>
  )
}

const inputStyle = {
  fontFamily: 'inherit', fontSize: '0.9rem', color: DS.ink,
  background: '#fff',
  border: '1px solid rgba(156,153,143,0.3)',
  borderRadius: 10,
  padding: '8px 10px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const cancelBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: '0.85rem', color: DS.soft,
  padding: '8px 14px',
}
