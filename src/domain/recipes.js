import { canEditFullBook } from './permissions.js';

export function canEditRecipe(book, user) {
  return canEditFullBook(book, user);
}

export function canAddRecipe(book, user) {
  return canEditFullBook(book, user);
}

export function buildRecipeFormFromRecipe(recipe) {
  return {
    name: recipe?.name ?? '',
    ingredients: recipe?.ingredients ?? '',
    instructions: recipe?.instructions ?? '',
    originalUrl: recipe?.originalUrl ?? '',
  };
}

export function buildRecipePayload(form, { bookId, createdBy, now }) {
  const trimmed = {
    name: form.name?.trim() ?? '',
    ingredients: form.ingredients?.trim() ?? '',
    instructions: form.instructions?.trim() ?? '',
    originalUrl: form.originalUrl?.trim() ?? '',
  };
  return {
    bookId,
    name: trimmed.name,
    ingredients: trimmed.ingredients,
    instructions: trimmed.instructions,
    originalUrl: trimmed.originalUrl || null,
    imageUrl: null,
    imagePath: null,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildRecipeUpdates(form, now) {
  return {
    name: form.name?.trim() ?? '',
    ingredients: form.ingredients?.trim() ?? '',
    instructions: form.instructions?.trim() ?? '',
    originalUrl: form.originalUrl?.trim() || null,
    updatedAt: now,
  };
}

export function validateRecipeForm(form) {
  if (!form.name || !form.name.trim()) return 'Receptnamn krävs';
  return null;
}

export function getRecipesForBook(recipes, bookId) {
  return recipes.filter(r => r.bookId === bookId);
}

export function groupRecipesBySeason(recipes, books) {
  const bookById = new Map(books.map(b => [b.id, b]));
  const groups = new Map();
  for (const recipe of recipes) {
    const book = bookById.get(recipe.bookId);
    const season = book?.season ?? 0;
    if (!groups.has(season)) groups.set(season, []);
    groups.get(season).push(recipe);
  }
  return groups;
}

export function getAllRecipeSeasons(recipes, books) {
  const groups = groupRecipesBySeason(recipes, books);
  return [...groups.keys()].sort((a, b) => b - a);
}

export function filterRecipesBySeason(recipes, books, season) {
  if (season === 'all' || season == null) return recipes;
  const bookById = new Map(books.map(b => [b.id, b]));
  return recipes.filter(r => bookById.get(r.bookId)?.season === Number(season));
}

export function bookHasLegacyRecipe(book) {
  return !!(book && (book.food || book.recipeLink || book.recipeImageUrl));
}

export function buildLegacyRecipeCard(book) {
  return {
    id: `legacy-${book.id}`,
    legacy: true,
    bookId: book.id,
    name: book.food || 'Recept',
    ingredients: '',
    instructions: '',
    originalUrl: book.recipeLink || null,
    imageUrl: book.recipeImageUrl || null,
    createdBy: book.chosenBy || '',
    createdAt: book.dateAdded || '',
    updatedAt: book.dateAdded || '',
  };
}

export function buildLegacyRecipeCards(books, existingRecipes) {
  const taken = new Set(existingRecipes.map(r => r.bookId));
  return books
    .filter(b => !taken.has(b.id) && bookHasLegacyRecipe(b))
    .map(buildLegacyRecipeCard);
}

export function getRecipesForKokbok(recipes, books) {
  return [...recipes, ...buildLegacyRecipeCards(books, recipes)];
}

export function buildRecipeFormFromBookLegacy(book) {
  return {
    name: book.food || '',
    ingredients: '',
    instructions: '',
    originalUrl: book.recipeLink || '',
  };
}

export function enrichRecipe(recipe, books) {
  const book = books.find(b => b.id === recipe.bookId);
  return {
    ...recipe,
    book: book || null,
    bookTitle: book?.title || 'Okänd bok',
    season: book?.season ?? null,
    host: book?.chosenBy ?? null,
    meetingDate: book?.meetingDate ?? null,
  };
}
