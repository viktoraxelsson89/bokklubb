import { describe, it, expect } from 'vitest';
import { canUserVotePreliminary, canUserVoteFinal, canEditFullBook } from './permissions.js';

const admin = { displayName: 'Viktor', role: 'admin' };
const regular = { displayName: 'Armando', role: 'member' };

describe('canUserVotePreliminary', () => {
  it('nekar om user är null', () => {
    const book = { phase: 'preliminary_voting', preliminaryVotes: {} };
    expect(canUserVotePreliminary(book, null)).toBe(false);
  });

  it('nekar om fas inte är preliminary_voting', () => {
    const book = { phase: 'discussion', preliminaryVotes: {} };
    expect(canUserVotePreliminary(book, regular)).toBe(false);
  });

  it('tillåter om fas är preliminary_voting och användaren inte röstat', () => {
    const book = {
      phase: 'preliminary_voting',
      preliminaryVotes: { Armando: { submitted: false } },
    };
    expect(canUserVotePreliminary(book, regular)).toBe(true);
  });

  it('nekar om användaren redan röstat', () => {
    const book = {
      phase: 'preliminary_voting',
      preliminaryVotes: { Armando: { submitted: true } },
    };
    expect(canUserVotePreliminary(book, regular)).toBe(false);
  });

  it('admin tillåts rösta even om redan submitted (admin override)', () => {
    const book = {
      phase: 'preliminary_voting',
      preliminaryVotes: { Viktor: { submitted: true } },
    };
    expect(canUserVotePreliminary(book, admin)).toBe(true);
  });

  it('behandlar bok utan phase som preliminary_voting', () => {
    const book = { preliminaryVotes: { Armando: { submitted: false } } };
    expect(canUserVotePreliminary(book, regular)).toBe(true);
  });
});

describe('canUserVoteFinal', () => {
  it('nekar om user är null', () => {
    expect(canUserVoteFinal({ phase: 'discussion', finalJudgments: {} }, null)).toBe(false);
  });

  it('nekar om fas inte är discussion', () => {
    const book = { phase: 'revealed', finalJudgments: {} };
    expect(canUserVoteFinal(book, regular)).toBe(false);
  });

  it('tillåter om användaren inte lämnat omdöme', () => {
    const book = {
      phase: 'discussion',
      finalJudgments: { Armando: { submitted: false } },
    };
    expect(canUserVoteFinal(book, regular)).toBe(true);
  });

  it('nekar om användaren redan lämnat omdöme', () => {
    const book = {
      phase: 'discussion',
      finalJudgments: { Armando: { submitted: true } },
    };
    expect(canUserVoteFinal(book, regular)).toBe(false);
  });
});

describe('canEditFullBook', () => {
  it('nekar om user är null', () => {
    expect(canEditFullBook({ chosenBy: 'Armando' }, null)).toBe(false);
  });

  it('admin kan alltid redigera', () => {
    const book = { chosenBy: 'Armando' };
    expect(canEditFullBook(book, admin)).toBe(true);
  });

  it('bokväljaren kan redigera sin bok', () => {
    const book = { chosenBy: 'Armando' };
    expect(canEditFullBook(book, regular)).toBe(true);
  });

  it('vanlig användare kan inte redigera andras bok', () => {
    const book = { chosenBy: 'Pontus' };
    expect(canEditFullBook(book, regular)).toBe(false);
  });
});
