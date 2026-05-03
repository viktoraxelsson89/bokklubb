import { describe, it, expect } from 'vitest';
import {
  calculateAverage,
  getAverageRating,
  getDisplayAverage,
  getRatingColor,
  calculateCorrelation,
} from './calculations.js';

describe('calculateAverage', () => {
  it('returnerar genomsnitt av inlämnade röster', () => {
    const votes = {
      Viktor:  { vote: 8, submitted: true },
      Armando: { vote: 6, submitted: true },
    };
    expect(calculateAverage(votes)).toBe(7);
  });

  it('ignorerar ej inlämnade röster', () => {
    const votes = {
      Viktor:  { vote: 8, submitted: true },
      Armando: { vote: null, submitted: false },
    };
    expect(calculateAverage(votes)).toBe(8);
  });

  it('returnerar 0 om inga röster', () => {
    expect(calculateAverage({})).toBe(0);
  });

  it('returnerar 0 om inga inlämnade', () => {
    const votes = { Viktor: { vote: null, submitted: false } };
    expect(calculateAverage(votes)).toBe(0);
  });
});

describe('getAverageRating', () => {
  it('beräknar genomsnitt av legacy ratings', () => {
    expect(getAverageRating({ Viktor: 8, Armando: 6 })).toBe(7);
  });

  it('returnerar 0 för tomt objekt', () => {
    expect(getAverageRating({})).toBe(0);
  });
});

describe('getDisplayAverage', () => {
  it('använder finalAverage om det finns', () => {
    expect(getDisplayAverage({ finalAverage: 7.6, ratings: { Viktor: 9 } })).toBe(7.6);
  });

  it('faller tillbaka på ratings om finalAverage saknas', () => {
    expect(getDisplayAverage({ ratings: { Viktor: 8, Armando: 6 } })).toBe(7);
  });

  it('hanterar bok utan ratings eller finalAverage', () => {
    expect(getDisplayAverage({})).toBe(0);
  });
});

describe('getRatingColor', () => {
  it('grön vid >= 8', () => {
    expect(getRatingColor(8)).toBe('bg-sage text-ink');
    expect(getRatingColor(10)).toBe('bg-sage text-ink');
  });

  it('sand vid >= 6', () => {
    expect(getRatingColor(6)).toBe('bg-sand text-ink');
    expect(getRatingColor(7.9)).toBe('bg-sand text-ink');
  });

  it('grå vid >= 4', () => {
    expect(getRatingColor(4)).toBe('bg-mortar text-ink');
    expect(getRatingColor(5.9)).toBe('bg-mortar text-ink');
  });

  it('mörk grå under 4', () => {
    expect(getRatingColor(3.9)).toBe('bg-grout text-bone');
    expect(getRatingColor(1)).toBe('bg-grout text-bone');
  });
});

describe('calculateCorrelation', () => {
  it('returnerar 1 för perfekt positiv korrelation', () => {
    expect(calculateCorrelation([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('returnerar -1 för perfekt negativ korrelation', () => {
    expect(calculateCorrelation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1);
  });

  it('returnerar 0 för tomma arrayer', () => {
    expect(calculateCorrelation([], [])).toBe(0);
  });

  it('returnerar 0 om x och y har olika längd', () => {
    expect(calculateCorrelation([1, 2], [1])).toBe(0);
  });
});
