// js/state/actions.js
import { store } from './store.js';

function safeUpdate(updater) {
  const s = store;
  const curr = s.getState ? s.getState() : {};
  const next = updater(curr);

  if (typeof s.dispatch === 'function') {
    s.dispatch({ type: 'books/replaceAll', payload: next.books });
  } else if (typeof s.setState === 'function') {
    s.setState(next);
  } else {
    console.error('Store saknar dispatch/setState – kan inte uppdatera state.');
  }
}

function normalizeBook(book) {
  const now = new Date().toISOString();
  return {
    id: book.id || (crypto?.randomUUID && crypto.randomUUID()) || String(Date.now()),
    dateAdded: book.dateAdded || now,
    title: book.title || 'Okänd titel',
    author: book.author || 'Okänd författare',
    season: Number(book.season) || 1,
    chosenBy: book.chosenBy || '-',
    coverUrl: book.coverUrl || '',
    meetingDate: book.meetingDate || null,
    phase: book.phase || 'preliminary_voting',
    finalAverage: Number(book.finalAverage) || 0,
    preliminaryAverage: Number(book.preliminaryAverage) || 0,
    averageChange: Number(book.averageChange) || 0,
    food: book.food || '',
    recipeLink: book.recipeLink || '',
    ratings: book.ratings || {}
  };
}

export function hydrateBooks(initialBooks = []) {
  safeUpdate((state) => {
    const current = Array.isArray(state.books) ? state.books : [];
    if (current.length > 0) return state; // redan data → gör inget
    const seeded = initialBooks.map(normalizeBook);
    return { ...state, books: seeded };
  });
}


export function addBook(book) {
  safeUpdate((state) => {
    const now = new Date().toISOString();
    const newBook = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      dateAdded: book.dateAdded || now,
      // obligatoriska fält
      title: book.title,
      author: book.author,
      season: Number(book.season) || 1,
      chosenBy: book.chosenBy || '-',
      // valfria fält
      coverUrl: book.coverUrl || '',
      meetingDate: book.meetingDate || null,
      phase: book.phase || 'preliminary_voting',
      finalAverage: book.finalAverage || 0,
      preliminaryAverage: book.preliminaryAverage || 0,
      averageChange: book.averageChange || 0,
      food: book.food || '',
      recipeLink: book.recipeLink || '',
      ratings: book.ratings || {}
    };

    const books = Array.isArray(state.books) ? state.books : [];
    return { ...state, books: [newBook, ...books] };
  });
}

