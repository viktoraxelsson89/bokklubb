import { getDisplayAverage } from './calculations.js';

export function getCurrentBook(books) {
  return books.find(b => b.isCurrentBook) ?? null;
}

export function getFinalizedBooks(books) {
  return books.filter(b => b.phase === 'finalized');
}

export function getBooksBySeason(books, seasonNum) {
  return books.filter(b => b.season === seasonNum);
}

export function getSeasonWinner(books, seasonNum) {
  const seasonBooks = getBooksBySeason(books, seasonNum);
  if (seasonBooks.length === 0) return null;
  return seasonBooks.reduce((winner, book) =>
    getDisplayAverage(book) > getDisplayAverage(winner) ? book : winner
  );
}

export function getAllSeasons(books) {
  return [...new Set(books.map(b => b.season))].sort((a, b) => b - a);
}
