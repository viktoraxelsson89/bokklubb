import { describe, it, expect } from 'vitest';
import {
  canEditRecipe,
  canAddRecipe,
  buildRecipeFormFromRecipe,
  buildRecipeFormFromBookLegacy,
  buildRecipePayload,
  buildRecipeUpdates,
  validateRecipeForm,
  getRecipesForBook,
  groupRecipesBySeason,
  getAllRecipeSeasons,
  filterRecipesBySeason,
  enrichRecipe,
  bookHasLegacyRecipe,
  buildLegacyRecipeCard,
  buildLegacyRecipeCards,
  getRecipesForKokbok,
} from './recipes.js';

const admin = { displayName: 'Viktor', role: 'admin' };
const host = { displayName: 'Armando', role: 'member' };
const other = { displayName: 'Pontus', role: 'member' };

describe('canEditRecipe / canAddRecipe', () => {
  const book = { chosenBy: 'Armando' };

  it('admin har alltid rätt', () => {
    expect(canEditRecipe(book, admin)).toBe(true);
    expect(canAddRecipe(book, admin)).toBe(true);
  });

  it('värden får redigera och lägga till', () => {
    expect(canEditRecipe(book, host)).toBe(true);
    expect(canAddRecipe(book, host)).toBe(true);
  });

  it('andra medlemmar får inte', () => {
    expect(canEditRecipe(book, other)).toBe(false);
    expect(canAddRecipe(book, other)).toBe(false);
  });

  it('null user nekas', () => {
    expect(canEditRecipe(book, null)).toBe(false);
  });
});

describe('buildRecipeFormFromRecipe', () => {
  it('returnerar tom form från null', () => {
    expect(buildRecipeFormFromRecipe(null)).toEqual({
      name: '', ingredients: '', instructions: '', originalUrl: '',
    });
  });

  it('hämtar fält från befintligt recept', () => {
    const recipe = {
      name: 'Lasagne', ingredients: 'pasta', instructions: 'baka',
      originalUrl: 'http://x.se',
    };
    expect(buildRecipeFormFromRecipe(recipe)).toEqual({
      name: 'Lasagne', ingredients: 'pasta', instructions: 'baka',
      originalUrl: 'http://x.se',
    });
  });
});

describe('buildRecipePayload', () => {
  it('trimmar fält och inkluderar metadata', () => {
    const form = {
      name: '  Pizza  ', ingredients: ' deg ', instructions: '', originalUrl: '',
    };
    const payload = buildRecipePayload(form, {
      bookId: 'b1', createdBy: 'Viktor', now: '2026-05-03T00:00:00Z',
    });
    expect(payload).toMatchObject({
      bookId: 'b1',
      name: 'Pizza',
      ingredients: 'deg',
      instructions: '',
      originalUrl: null,
      imageUrl: null,
      imagePath: null,
      createdBy: 'Viktor',
      createdAt: '2026-05-03T00:00:00Z',
      updatedAt: '2026-05-03T00:00:00Z',
    });
  });

  it('behåller url om angiven', () => {
    const payload = buildRecipePayload(
      { name: 'X', ingredients: '', instructions: '', originalUrl: 'http://a' },
      { bookId: 'b1', createdBy: 'V', now: 'now' },
    );
    expect(payload.originalUrl).toBe('http://a');
  });
});

describe('buildRecipeUpdates', () => {
  it('uppdaterar fält + updatedAt', () => {
    const updates = buildRecipeUpdates(
      { name: ' A ', ingredients: 'b', instructions: 'c', originalUrl: '' },
      'now',
    );
    expect(updates).toEqual({
      name: 'A', ingredients: 'b', instructions: 'c', originalUrl: null, updatedAt: 'now',
    });
  });
});

describe('validateRecipeForm', () => {
  it('kräver namn', () => {
    expect(validateRecipeForm({ name: '' })).toBeTruthy();
    expect(validateRecipeForm({ name: '   ' })).toBeTruthy();
  });

  it('returnerar null om namn finns', () => {
    expect(validateRecipeForm({ name: 'X' })).toBe(null);
  });
});

describe('getRecipesForBook', () => {
  it('filtrerar på bookId', () => {
    const recipes = [
      { id: '1', bookId: 'a' }, { id: '2', bookId: 'b' }, { id: '3', bookId: 'a' },
    ];
    expect(getRecipesForBook(recipes, 'a').map(r => r.id)).toEqual(['1', '3']);
  });
});

describe('grupperingar', () => {
  const books = [
    { id: 'b1', season: 1 },
    { id: 'b2', season: 2 },
    { id: 'b3', season: 1 },
  ];
  const recipes = [
    { id: 'r1', bookId: 'b1' },
    { id: 'r2', bookId: 'b2' },
    { id: 'r3', bookId: 'b3' },
  ];

  it('groupRecipesBySeason grupperar per säsong', () => {
    const groups = groupRecipesBySeason(recipes, books);
    expect(groups.get(1).length).toBe(2);
    expect(groups.get(2).length).toBe(1);
  });

  it('getAllRecipeSeasons returnerar säsonger sorterat senast först', () => {
    expect(getAllRecipeSeasons(recipes, books)).toEqual([2, 1]);
  });

  it('filterRecipesBySeason returnerar alla för "all"', () => {
    expect(filterRecipesBySeason(recipes, books, 'all').length).toBe(3);
  });

  it('filterRecipesBySeason filtrerar på säsong', () => {
    expect(filterRecipesBySeason(recipes, books, 1).length).toBe(2);
    expect(filterRecipesBySeason(recipes, books, '2').length).toBe(1);
  });
});

describe('legacy-stöd', () => {
  it('bookHasLegacyRecipe matchar food/recipeLink/recipeImageUrl', () => {
    expect(bookHasLegacyRecipe({ food: 'Pizza' })).toBe(true);
    expect(bookHasLegacyRecipe({ recipeLink: 'http://x' })).toBe(true);
    expect(bookHasLegacyRecipe({ recipeImageUrl: 'http://x.jpg' })).toBe(true);
    expect(bookHasLegacyRecipe({})).toBe(false);
    expect(bookHasLegacyRecipe(null)).toBe(false);
  });

  it('buildLegacyRecipeCard mappar bokfält till syntetiskt receptkort', () => {
    const book = {
      id: 'b1', title: 'Bok', food: 'Pasta', recipeLink: 'http://r',
      recipeImageUrl: 'http://i.jpg', chosenBy: 'Viktor', dateAdded: '2024-01-01',
    };
    const card = buildLegacyRecipeCard(book);
    expect(card).toMatchObject({
      id: 'legacy-b1',
      legacy: true,
      bookId: 'b1',
      name: 'Pasta',
      originalUrl: 'http://r',
      imageUrl: 'http://i.jpg',
      createdBy: 'Viktor',
    });
  });

  it('buildLegacyRecipeCards hoppar över böcker som redan har riktigt recept', () => {
    const books = [
      { id: 'b1', food: 'A' },
      { id: 'b2', food: 'B' },
      { id: 'b3' },
    ];
    const recipes = [{ id: 'r1', bookId: 'b1' }];
    const cards = buildLegacyRecipeCards(books, recipes);
    expect(cards.length).toBe(1);
    expect(cards[0].bookId).toBe('b2');
  });

  it('getRecipesForKokbok kombinerar riktiga + legacy', () => {
    const books = [{ id: 'b1', food: 'X' }, { id: 'b2', food: 'Y' }];
    const recipes = [{ id: 'r1', bookId: 'b1' }];
    const merged = getRecipesForKokbok(recipes, books);
    expect(merged.length).toBe(2);
    expect(merged.find(r => r.id === 'r1')).toBeTruthy();
    expect(merged.find(r => r.id === 'legacy-b2')).toBeTruthy();
  });

  it('buildRecipeFormFromBookLegacy plockar upp food + recipeLink', () => {
    const form = buildRecipeFormFromBookLegacy({ food: 'Pizza', recipeLink: 'http://x' });
    expect(form).toEqual({
      name: 'Pizza', ingredients: '', instructions: '', originalUrl: 'http://x',
    });
  });
});

describe('enrichRecipe', () => {
  it('berikar med bokdata', () => {
    const recipe = { id: 'r1', bookId: 'b1', name: 'Pizza' };
    const books = [{ id: 'b1', title: 'Bok A', season: 3, chosenBy: 'Viktor', meetingDate: '2026-01-01' }];
    const enriched = enrichRecipe(recipe, books);
    expect(enriched).toMatchObject({
      bookTitle: 'Bok A',
      season: 3,
      host: 'Viktor',
      meetingDate: '2026-01-01',
    });
  });

  it('hanterar saknad bok gracefully', () => {
    const enriched = enrichRecipe({ bookId: 'missing' }, []);
    expect(enriched.bookTitle).toBe('Okänd bok');
    expect(enriched.book).toBe(null);
  });
});
