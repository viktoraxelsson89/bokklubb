import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooks } from '../context/BooksContext.jsx'
import { useRecipes } from '../context/RecipesContext.jsx'
import {
  enrichRecipe,
  filterRecipesBySeason,
  getAllRecipeSeasons,
  getRecipesForKokbok,
} from '../domain/recipes.js'
import { DS, LORA, SYS } from '../styles/tokens.js'
import { saveMainScrollPosition, useRestoreMainScroll } from '../components/scroll.js'
import { LoadingState, MutedLabel } from '../components/ui.jsx'

const KOKBOK_SCROLL_KEY = 'kokbok_scroll'

export default function Kokbok() {
  const { books, loading: booksLoading } = useBooks()
  const { recipes, loading: recipesLoading } = useRecipes()
  const [season, setSeason] = useState(() => sessionStorage.getItem('kokbok_season') ?? 'all')
  useEffect(() => { sessionStorage.setItem('kokbok_season', season) }, [season])
  const navigate = useNavigate()
  useRestoreMainScroll(KOKBOK_SCROLL_KEY, !(booksLoading || recipesLoading))

  const merged = useMemo(() => getRecipesForKokbok(recipes, books), [recipes, books])
  const seasons = useMemo(() => getAllRecipeSeasons(merged, books), [merged, books])
  const filtered = useMemo(
    () => filterRecipesBySeason(merged, books, season).map(r => enrichRecipe(r, books)),
    [merged, books, season],
  )
  const navigateToRecipe = (recipe) => {
    saveMainScrollPosition(KOKBOK_SCROLL_KEY)
    navigate(recipe.legacy ? `/books/${recipe.bookId}` : `/recipes/${recipe.id}`)
  }

  if (booksLoading || recipesLoading) {
    return <LoadingState text="Laddar recept..." />
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.gradientBg, color: DS.ink }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 14px 32px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 16, padding: '0 4px' }}>
          <div>
            <div style={{ fontFamily: LORA, fontWeight: 600, fontSize: '1.05rem', color: DS.ink, marginBottom: 2 }}>
              Kokbok
            </div>
            <div style={{ fontSize: '0.72rem', color: DS.ash }}>
              {filtered.length} {filtered.length === 1 ? 'recept' : 'recept'}
            </div>
          </div>
          <SeasonSelect value={season} onChange={setSeason} seasons={seasons} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState season={season} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}>
            {filtered.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => navigateToRecipe(recipe)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SeasonSelect({ value, onChange, seasons }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: DS.ash,
      }}>Säsong</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontFamily: 'inherit', fontSize: '0.85rem',
          padding: '6px 10px', borderRadius: 10,
          border: '1px solid rgba(156,153,143,0.3)',
          background: '#fff', color: DS.ink, cursor: 'pointer',
        }}
      >
        <option value="all">Alla</option>
        {seasons.map(s => (
          <option key={s} value={s}>Säsong {s}</option>
        ))}
      </select>
    </label>
  )
}

function RecipeCard({ recipe, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: DS.bone,
        borderRadius: 18,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hov ? '0 12px 32px rgba(18,19,18,0.12)' : DS.shadowSoft,
        outline: '1px solid rgba(156,153,143,0.18)',
        transition: 'all 0.15s ease',
        transform: hov ? 'translateY(-1px)' : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <RecipeImage recipe={recipe} />
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: LORA, fontWeight: 600, fontSize: '0.92rem',
          color: DS.ink, lineHeight: 1.25,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {recipe.name || 'Namnlöst recept'}
        </div>
        <div style={{
          fontFamily: LORA, fontStyle: 'italic', fontSize: '0.72rem',
          color: DS.soft, lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {recipe.bookTitle}
        </div>
        <div style={{
          fontFamily: SYS, fontSize: '0.66rem', color: DS.ash,
          marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {recipe.host && <span>{recipe.host}</span>}
          {recipe.host && recipe.meetingDate && <span> · </span>}
          {recipe.meetingDate && <span>{recipe.meetingDate}</span>}
        </div>
      </div>
    </div>
  )
}

function RecipeImage({ recipe }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '4 / 3',
      background: 'linear-gradient(135deg, rgba(201,192,148,0.22), rgba(186,209,150,0.22))',
      overflow: 'hidden',
    }}>
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.name || ''}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <PlaceholderIcon />
      )}
      {recipe.season != null && (
        <span style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 9px', borderRadius: 14,
          background: 'rgba(18,19,18,0.78)',
          color: DS.bone,
          fontSize: '0.66rem', fontWeight: 600,
          letterSpacing: '0.04em',
          backdropFilter: 'blur(4px)',
        }}>S{recipe.season}</span>
      )}
    </div>
  )
}

function PlaceholderIcon() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={DS.grout} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11h18" />
        <path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3" />
        <path d="M5 11l1 8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-8" />
        <path d="M9 5V3" />
        <path d="M15 5V3" />
      </svg>
    </div>
  )
}

function EmptyState({ season }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center', color: DS.ash,
      background: 'rgba(255,255,255,0.5)',
      borderRadius: 18,
      outline: '1px solid rgba(156,153,143,0.15)',
    }}>
      <div style={{ marginBottom: 6 }}>
        <MutedLabel>Inga recept</MutedLabel>
      </div>
      <div style={{ fontSize: '0.85rem', color: DS.soft }}>
        {season === 'all'
          ? 'Lägg till recept från en boks detaljsida.'
          : 'Inga recept i den här säsongen än.'}
      </div>
    </div>
  )
}
