import { describe, it, expect } from 'vitest';
import { getCurrentBook, getFinalizedBooks, getBooksBySeason, getSeasonWinner, getAllSeasons } from './books.js';

const books = [
  { id: '1', season: 1, phase: 'finalized',           isCurrentBook: false, finalAverage: 8 },
  { id: '2', season: 1, phase: 'finalized',           isCurrentBook: false, finalAverage: 6 },
  { id: '3', season: 2, phase: 'preliminary_voting',  isCurrentBook: true,  finalAverage: 0 },
  { id: '4', season: 2, phase: 'finalized',           isCurrentBook: false, ratings: { Viktor: 7, Armando: 9 } },
];

describe('getCurrentBook', () => {
  it('returnerar boken med isCurrentBook: true', () => {
    expect(getCurrentBook(books)?.id).toBe('3');
  });

  it('returnerar null om ingen aktuell bok', () => {
    expect(getCurrentBook([{ isCurrentBook: false }])).toBeNull();
  });

  it('returnerar null för tom lista', () => {
    expect(getCurrentBook([])).toBeNull();
  });
});

describe('getFinalizedBooks', () => {
  it('returnerar bara finaliserade böcker', () => {
    const result = getFinalizedBooks(books);
    expect(result.map(b => b.id)).toEqual(['1', '2', '4']);
  });
});

describe('getBooksBySeason', () => {
  it('filtrerar korrekt på säsongnummer', () => {
    expect(getBooksBySeason(books, 1).map(b => b.id)).toEqual(['1', '2']);
    expect(getBooksBySeason(books, 2).map(b => b.id)).toEqual(['3', '4']);
  });

  it('returnerar tom lista för säsong utan böcker', () => {
    expect(getBooksBySeason(books, 99)).toHaveLength(0);
  });
});

describe('getSeasonWinner', () => {
  it('returnerar boken med högst betyg i säsongen', () => {
    expect(getSeasonWinner(books, 1)?.id).toBe('1'); // 8 > 6
  });

  it('använder ratings som fallback', () => {
    // säsong 2: bok 4 har ratings avg 8, bok 3 har finalAverage 0
    expect(getSeasonWinner(books, 2)?.id).toBe('4');
  });

  it('returnerar null för säsong utan böcker', () => {
    expect(getSeasonWinner(books, 99)).toBeNull();
  });
});

describe('getAllSeasons', () => {
  it('returnerar unika säsonger sorterade fallande', () => {
    expect(getAllSeasons(books)).toEqual([2, 1]);
  });

  it('returnerar tom lista om inga böcker', () => {
    expect(getAllSeasons([])).toHaveLength(0);
  });
});
