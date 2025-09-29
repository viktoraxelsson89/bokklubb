// selectors.js - Härledda data från state (undviker duplicerad logik)

import { getAvgRating } from '../utils/metrics.js';

export const getFinalizedBooks = (state) => {
  return state.books.filter(book => book.phase === 'finalized');
};

export const getCurrentBook = (state) => {
  return state.books.find(book => book.isCurrentBook) || null;
};

export const getBooksBySeason = (state, seasonNum) => {
  return state.books.filter(book => book.season === seasonNum);
};

export const getSeasonWinner = (state, seasonNum) => {
  const books = getBooksBySeason(state, seasonNum);
  if (books.length === 0) return null;
  
  return books.reduce((winner, book) => {
    const winnerRating = getAvgRating(winner);
    const bookRating = getAvgRating(book);
    return bookRating > winnerRating ? book : winner;
  });
};

export const getAllSeasons = (state) => {
  const seasons = new Set(state.books.map(book => book.season));
  return Array.from(seasons).sort((a, b) => b - a);
};
