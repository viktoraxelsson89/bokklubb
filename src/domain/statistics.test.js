import { describe, it, expect } from 'vitest';
import {
  getMemberRating,
  getBookRatings,
  getPreliminaryAverage,
  getFinalAverage,
  getBookSpread,
  getHighestRatedBook,
  getLowestRatedBook,
  getMostControversialBook,
  getBiggestSurprise,
  getMemberAverageRating,
  getStrictestMember,
  getMostGenerousMember,
  getHardestToPleaseChooser,
  getMemberPairCorrelation,
  getCorrelationMatrix,
  getControversyRanking,
} from './statistics.js';

const MEMBERS = ['Viktor', 'Armando', 'Pontus', 'Oskar', 'Aaron'];

function makeFinalJudgments(map) {
  const out = {};
  for (const [m, v] of Object.entries(map)) out[m] = { vote: v };
  return out;
}

function makePrelim(map) {
  const out = {};
  for (const [m, v] of Object.entries(map)) {
    out[m] = { vote: v, submitted: v != null };
  }
  return out;
}

const legacyBook = (id, ratings, chosenBy = 'Viktor', extra = {}) => ({
  id, title: `B${id}`, season: 1, chosenBy, ratings, finalAverage: null, ...extra,
});

const modernBook = (id, finalMap, prelimMap, chosenBy = 'Viktor', extra = {}) => {
  const finals = Object.values(finalMap);
  const finalAverage = finals.reduce((a, b) => a + b, 0) / finals.length;
  return {
    id, title: `B${id}`, season: 6, chosenBy,
    finalJudgments: makeFinalJudgments(finalMap),
    preliminaryVotes: makePrelim(prelimMap),
    finalAverage,
    ...extra,
  };
};

describe('getMemberRating', () => {
  it('föredrar finalJudgments framför ratings', () => {
    const b = { finalJudgments: { Viktor: { vote: 8 } }, ratings: { Viktor: 5 } };
    expect(getMemberRating(b, 'Viktor')).toBe(8);
  });
  it('faller tillbaka på legacy ratings', () => {
    expect(getMemberRating({ ratings: { Viktor: 7 } }, 'Viktor')).toBe(7);
  });
  it('returnerar null om medlemmen saknas helt', () => {
    expect(getMemberRating({ ratings: {} }, 'Viktor')).toBeNull();
  });
  it('hanterar bok utan vare sig finalJudgments eller ratings', () => {
    expect(getMemberRating({}, 'Viktor')).toBeNull();
  });
});

describe('getBookRatings', () => {
  it('samlar alla medlemsröster', () => {
    const b = legacyBook(1, { Viktor: 8, Armando: 6 });
    expect(getBookRatings(b).sort()).toEqual([6, 8]);
  });
  it('returnerar tom array för bok utan röster', () => {
    expect(getBookRatings({})).toEqual([]);
  });
});

describe('getBookSpread', () => {
  it('returnerar min, max, range och stddev', () => {
    const b = legacyBook(1, { Viktor: 2, Armando: 9, Pontus: 5 });
    const s = getBookSpread(b);
    expect(s.min).toBe(2);
    expect(s.max).toBe(9);
    expect(s.range).toBe(7);
    expect(s.stddev).toBeGreaterThan(0);
    expect(s.count).toBe(3);
  });
  it('returnerar null vid färre än 2 röster', () => {
    expect(getBookSpread(legacyBook(1, { Viktor: 8 }))).toBeNull();
    expect(getBookSpread(legacyBook(1, {}))).toBeNull();
  });
});

describe('getHighestRatedBook / getLowestRatedBook', () => {
  it('plockar högst och lägst genomsnitt', () => {
    const books = [
      legacyBook(1, { Viktor: 9, Armando: 9 }),
      legacyBook(2, { Viktor: 3, Armando: 5 }),
      legacyBook(3, { Viktor: 7, Armando: 6 }),
    ];
    expect(getHighestRatedBook(books).id).toBe(1);
    expect(getLowestRatedBook(books).id).toBe(2);
  });
  it('ignorerar böcker utan röster', () => {
    const books = [
      legacyBook(1, {}),
      legacyBook(2, { Viktor: 7 }),
    ];
    expect(getHighestRatedBook(books).id).toBe(2);
    expect(getLowestRatedBook(books).id).toBe(2);
  });
  it('returnerar null när inga böcker har röster', () => {
    expect(getHighestRatedBook([])).toBeNull();
    expect(getLowestRatedBook([legacyBook(1, {})])).toBeNull();
  });
});

describe('getMostControversialBook', () => {
  it('returnerar boken med störst stddev', () => {
    const books = [
      legacyBook(1, { Viktor: 7, Armando: 7, Pontus: 7 }),
      legacyBook(2, { Viktor: 2, Armando: 9, Pontus: 4 }),
    ];
    const result = getMostControversialBook(books);
    expect(result.book.id).toBe(2);
    expect(result.spread.range).toBe(7);
  });
  it('returnerar null när inga böcker kvalificerar', () => {
    expect(getMostControversialBook([legacyBook(1, { Viktor: 8 })])).toBeNull();
  });
});

describe('getPreliminaryAverage / getFinalAverage', () => {
  it('preliminär hoppar över ej inlämnade röster', () => {
    const b = {
      preliminaryVotes: {
        Viktor: { vote: 8, submitted: true },
        Armando: { vote: 6, submitted: true },
        Pontus: { vote: null, submitted: false },
      },
    };
    expect(getPreliminaryAverage(b)).toBe(7);
  });
  it('returnerar null om preliminaryVotes saknas', () => {
    expect(getPreliminaryAverage({})).toBeNull();
  });
  it('final räknar alla med vote', () => {
    const b = { finalJudgments: makeFinalJudgments({ Viktor: 8, Armando: 6 }) };
    expect(getFinalAverage(b)).toBe(7);
  });
});

describe('getBiggestSurprise', () => {
  it('plockar boken med störst skillnad mellan prelim och final', () => {
    const a = modernBook(1, { Viktor: 8, Armando: 8 }, { Viktor: 8, Armando: 8 });
    const b = modernBook(2, { Viktor: 4, Armando: 4 }, { Viktor: 9, Armando: 9 });
    const result = getBiggestSurprise([a, b]);
    expect(result.book.id).toBe(2);
    expect(result.diff).toBe(-5);
  });
  it('hoppar över böcker utan både prelim och final', () => {
    const legacy = legacyBook(1, { Viktor: 5 });
    const result = getBiggestSurprise([legacy]);
    expect(result).toBeNull();
  });
});

describe('member averages', () => {
  const books = [
    legacyBook(1, { Viktor: 8, Armando: 4 }),
    legacyBook(2, { Viktor: 9, Armando: 5 }),
  ];
  it('strictest = lägst snitt', () => {
    expect(getStrictestMember(books, MEMBERS).member).toBe('Armando');
  });
  it('most generous = högst snitt', () => {
    expect(getMostGenerousMember(books, MEMBERS).member).toBe('Viktor');
  });
  it('returnerar null när medlem inte röstat', () => {
    expect(getMemberAverageRating([legacyBook(1, { Viktor: 8 })], 'Pontus')).toBeNull();
  });
  it('strictest/generous är null när ingen röstat', () => {
    expect(getStrictestMember([], MEMBERS)).toBeNull();
    expect(getMostGenerousMember([], MEMBERS)).toBeNull();
  });
});

describe('getHardestToPleaseChooser', () => {
  it('plockar medlem vars val fick lägst gruppsnitt', () => {
    const books = [
      legacyBook(1, { Viktor: 9, Armando: 9 }, 'Viktor'),
      legacyBook(2, { Viktor: 3, Armando: 4 }, 'Armando'),
      legacyBook(3, { Viktor: 8, Armando: 8 }, 'Viktor'),
    ];
    const result = getHardestToPleaseChooser(books, MEMBERS);
    expect(result.member).toBe('Armando');
    expect(result.count).toBe(1);
  });
  it('hoppar över medlemmar utan valda böcker', () => {
    const books = [legacyBook(1, { Viktor: 7 }, 'Viktor')];
    const result = getHardestToPleaseChooser(books, MEMBERS);
    expect(result.member).toBe('Viktor');
  });
  it('returnerar null när ingen valt något', () => {
    expect(getHardestToPleaseChooser([], MEMBERS)).toBeNull();
  });
});

describe('getMemberPairCorrelation', () => {
  it('beräknar korrelation över överlapp', () => {
    const books = [
      legacyBook(1, { Viktor: 8, Armando: 7 }),
      legacyBook(2, { Viktor: 6, Armando: 5 }),
      legacyBook(3, { Viktor: 9, Armando: 8 }),
    ];
    const r = getMemberPairCorrelation(books, 'Viktor', 'Armando');
    expect(r.overlap).toBe(3);
    expect(r.correlation).toBeCloseTo(1, 5);
  });
  it('returnerar null-korrelation vid otillräckligt överlapp', () => {
    const books = [legacyBook(1, { Viktor: 8, Armando: 7 })];
    const r = getMemberPairCorrelation(books, 'Viktor', 'Armando');
    expect(r.correlation).toBeNull();
    expect(r.overlap).toBe(1);
  });
  it('hoppar över böcker där en medlem saknar röst', () => {
    const books = [
      legacyBook(1, { Viktor: 8 }),
      legacyBook(2, { Viktor: 6, Armando: 5 }),
    ];
    const r = getMemberPairCorrelation(books, 'Viktor', 'Armando', 1);
    expect(r.overlap).toBe(1);
  });
});

describe('getCorrelationMatrix', () => {
  it('innehåller alla par', () => {
    const matrix = getCorrelationMatrix([], MEMBERS);
    expect(matrix.length).toBe(MEMBERS.length * MEMBERS.length);
  });
});

describe('getControversyRanking', () => {
  it('sorterar efter stddev fallande', () => {
    const books = [
      legacyBook(1, { Viktor: 7, Armando: 7 }),
      legacyBook(2, { Viktor: 2, Armando: 9 }),
      legacyBook(3, { Viktor: 5, Armando: 6 }),
    ];
    const ranking = getControversyRanking(books);
    expect(ranking[0].book.id).toBe(2);
    expect(ranking.length).toBe(3);
  });
  it('exkluderar böcker utan tillräckligt med röster', () => {
    const books = [legacyBook(1, { Viktor: 8 }), legacyBook(2, { Viktor: 5, Armando: 9 })];
    const ranking = getControversyRanking(books);
    expect(ranking.length).toBe(1);
    expect(ranking[0].book.id).toBe(2);
  });
});
