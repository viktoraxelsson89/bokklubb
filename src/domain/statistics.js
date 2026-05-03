import { calculateCorrelation, getDisplayAverage } from './calculations.js';
import { MEMBERS } from './constants.js';

// Hämtar en medlems röst för en bok. Slutomdöme har företräde, sedan legacy ratings.
export function getMemberRating(book, member) {
  const final = book?.finalJudgments?.[member]?.vote;
  if (final != null) return final;
  const legacy = book?.ratings?.[member];
  if (legacy != null) return legacy;
  return null;
}

// Alla medlemsröster på en bok som array av tal.
export function getBookRatings(book, members = MEMBERS) {
  const out = [];
  for (const m of members) {
    const r = getMemberRating(book, m);
    if (r != null) out.push(r);
  }
  return out;
}

// Genomsnittlig förhandsröst (endast inlämnade).
export function getPreliminaryAverage(book) {
  const votes = book?.preliminaryVotes;
  if (!votes) return null;
  const arr = [];
  for (const m of MEMBERS) {
    const v = votes[m];
    if (v && v.submitted && v.vote != null) arr.push(v.vote);
  }
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Genomsnittligt slutomdöme (alla finalJudgments med vote).
export function getFinalAverage(book) {
  const j = book?.finalJudgments;
  if (!j) return null;
  const arr = [];
  for (const m of MEMBERS) {
    const v = j[m]?.vote;
    if (v != null) arr.push(v);
  }
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Spridningsmått: min, max, range, stddev. Returnerar null om < 2 röster.
export function getBookSpread(book) {
  const ratings = getBookRatings(book);
  if (ratings.length < 2) return null;
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((s, r) => s + (r - mean) ** 2, 0) / ratings.length;
  return {
    min,
    max,
    range: max - min,
    stddev: Math.sqrt(variance),
    count: ratings.length,
  };
}

// Bok med högst genomsnitt. Kräver minst 1 röst. Null om ingen kvalificerar.
export function getHighestRatedBook(books) {
  const eligible = books.filter(b => getBookRatings(b).length > 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, b) =>
    getDisplayAverage(b) > getDisplayAverage(best) ? b : best
  );
}

export function getLowestRatedBook(books) {
  const eligible = books.filter(b => getBookRatings(b).length > 0);
  if (eligible.length === 0) return null;
  return eligible.reduce((worst, b) =>
    getDisplayAverage(b) < getDisplayAverage(worst) ? b : worst
  );
}

// Mest kontroversiella bok = störst standardavvikelse. Null om inget underlag.
export function getMostControversialBook(books) {
  let best = null;
  let bestSpread = null;
  for (const b of books) {
    const s = getBookSpread(b);
    if (!s) continue;
    if (bestSpread == null || s.stddev > bestSpread.stddev) {
      best = b;
      bestSpread = s;
    }
  }
  if (!best) return null;
  return { book: best, spread: bestSpread };
}

// Största överraskningen: bok med störst |avgFinal - avgPrelim|.
export function getBiggestSurprise(books) {
  let best = null;
  let bestDiff = -1;
  for (const b of books) {
    const prel = getPreliminaryAverage(b);
    const fin = getFinalAverage(b);
    if (prel == null || fin == null) continue;
    const diff = fin - prel;
    if (Math.abs(diff) > bestDiff) {
      best = { book: b, preliminaryAverage: prel, finalAverage: fin, diff };
      bestDiff = Math.abs(diff);
    }
  }
  return best;
}

// Snitt-betyg per medlem över alla böcker hen röstat på.
export function getMemberAverageRating(books, member) {
  const arr = [];
  for (const b of books) {
    const r = getMemberRating(b, member);
    if (r != null) arr.push(r);
  }
  if (arr.length === 0) return null;
  return {
    average: arr.reduce((a, b) => a + b, 0) / arr.length,
    count: arr.length,
  };
}

export function getStrictestMember(books, members = MEMBERS) {
  let best = null;
  for (const m of members) {
    const stats = getMemberAverageRating(books, m);
    if (!stats) continue;
    if (!best || stats.average < best.average) {
      best = { member: m, ...stats };
    }
  }
  return best;
}

export function getMostGenerousMember(books, members = MEMBERS) {
  let best = null;
  for (const m of members) {
    const stats = getMemberAverageRating(books, m);
    if (!stats) continue;
    if (!best || stats.average > best.average) {
      best = { member: m, ...stats };
    }
  }
  return best;
}

// Mest svårflörtade bokvalet: medlemmen vars valda böcker fick lägst gruppsnitt.
// Kräver minst 1 vald bok med minst 1 röst.
export function getHardestToPleaseChooser(books, members = MEMBERS) {
  let best = null;
  for (const m of members) {
    const chosen = books.filter(b => b.chosenBy === m && getBookRatings(b).length > 0);
    if (chosen.length === 0) continue;
    const avg = chosen.reduce((s, b) => s + getDisplayAverage(b), 0) / chosen.length;
    if (!best || avg < best.average) {
      best = { member: m, average: avg, count: chosen.length };
    }
  }
  return best;
}

// Korrelation mellan två medlemmars betyg över böcker båda röstat på.
// Returnerar null om < 3 gemensamma böcker (för få datapunkter för meningsfull korrelation).
export function getMemberPairCorrelation(books, m1, m2, minOverlap = 3) {
  const x = [];
  const y = [];
  for (const b of books) {
    const r1 = getMemberRating(b, m1);
    const r2 = getMemberRating(b, m2);
    if (r1 != null && r2 != null) {
      x.push(r1);
      y.push(r2);
    }
  }
  if (x.length < minOverlap) return { correlation: null, overlap: x.length };
  return { correlation: calculateCorrelation(x, y), overlap: x.length };
}

// Hela matrisen som array av {m1, m2, correlation, overlap}.
export function getCorrelationMatrix(books, members = MEMBERS) {
  const out = [];
  for (const m1 of members) {
    for (const m2 of members) {
      out.push({ m1, m2, ...getMemberPairCorrelation(books, m1, m2) });
    }
  }
  return out;
}

// Rangordna alla böcker efter spridning (stddev), störst först.
export function getControversyRanking(books) {
  return books
    .map(b => ({ book: b, spread: getBookSpread(b) }))
    .filter(x => x.spread != null)
    .sort((a, b) => b.spread.stddev - a.spread.stddev);
}
