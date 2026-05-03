import { describe, it, expect } from 'vitest';
import { computePreliminaryVote, computeStartDiscussion, computeFinalJudgment } from './voting.js';

const NOW = '2024-06-01T12:00:00.000Z';

const emptyVotes = () => ({
  Viktor:  { vote: null, comment: '', submitted: false, submittedAt: null },
  Armando: { vote: null, comment: '', submitted: false, submittedAt: null },
  Pontus:  { vote: null, comment: '', submitted: false, submittedAt: null },
  Oskar:   { vote: null, comment: '', submitted: false, submittedAt: null },
  Aaron:   { vote: null, comment: '', submitted: false, submittedAt: null },
});

const fourVotesSubmitted = () => ({
  Viktor:  { vote: 8, comment: 'bra', submitted: true, submittedAt: NOW },
  Armando: { vote: 7, comment: 'ok',  submitted: true, submittedAt: NOW },
  Pontus:  { vote: 9, comment: 'wow', submitted: true, submittedAt: NOW },
  Oskar:   { vote: 6, comment: 'hyf', submitted: true, submittedAt: NOW },
  Aaron:   { vote: null, comment: '', submitted: false, submittedAt: null },
});

const allVotesSubmitted = () => ({
  Viktor:  { vote: 8, comment: 'bra',  submitted: true, submittedAt: NOW },
  Armando: { vote: 7, comment: 'ok',   submitted: true, submittedAt: NOW },
  Pontus:  { vote: 9, comment: 'wow',  submitted: true, submittedAt: NOW },
  Oskar:   { vote: 6, comment: 'hyf',  submitted: true, submittedAt: NOW },
  Aaron:   { vote: 5, comment: 'medel', submitted: true, submittedAt: NOW },
});

// ─── computePreliminaryVote ───────────────────────────────────────────────────

describe('computePreliminaryVote', () => {
  it('kastar om fas inte är preliminary_voting', () => {
    const book = { phase: 'revealed', preliminaryVotes: emptyVotes() };
    expect(() => computePreliminaryVote(book, 'Viktor', 7, '', NOW)).toThrow();
  });

  it('kastar om medlemmen redan röstat', () => {
    const book = {
      phase: 'preliminary_voting',
      preliminaryVotes: {
        ...emptyVotes(),
        Viktor: { vote: 8, submitted: true, submittedAt: NOW },
      },
    };
    expect(() => computePreliminaryVote(book, 'Viktor', 9, '', NOW)).toThrow();
  });

  it('returnerar korrekt update för en enstaka röst', () => {
    const book = { phase: 'preliminary_voting', preliminaryVotes: emptyVotes() };
    const updates = computePreliminaryVote(book, 'Viktor', '7', 'bra bok', NOW);

    expect(updates['preliminaryVotes.Viktor']).toEqual({
      vote: 7,
      comment: 'bra bok',
      submitted: true,
      submittedAt: NOW,
    });
    expect(updates.phase).toBeUndefined();
  });

  it('sparar vote som integer', () => {
    const book = { phase: 'preliminary_voting', preliminaryVotes: emptyVotes() };
    const updates = computePreliminaryVote(book, 'Viktor', '8', '', NOW);
    expect(updates['preliminaryVotes.Viktor'].vote).toBe(8);
    expect(typeof updates['preliminaryVotes.Viktor'].vote).toBe('number');
  });

  it('trunkerar kommentar till 120 tecken', () => {
    const book = { phase: 'preliminary_voting', preliminaryVotes: emptyVotes() };
    const longComment = 'x'.repeat(200);
    const updates = computePreliminaryVote(book, 'Viktor', 7, longComment, NOW);
    expect(updates['preliminaryVotes.Viktor'].comment.length).toBe(120);
  });

  it('auto-avslöjar när 5:e rösten lämnas in', () => {
    const book = { phase: 'preliminary_voting', preliminaryVotes: fourVotesSubmitted() };
    const updates = computePreliminaryVote(book, 'Aaron', 5, 'medel', NOW);

    expect(updates.phase).toBe('revealed');
    expect(updates.preliminaryRevealedAt).toBe(NOW);
    // genomsnitt: (8+7+9+6+5)/5 = 7
    expect(updates.preliminaryAverage).toBeCloseTo(7);
  });

  it('auto-avslöjar inte vid 4:e rösten', () => {
    const book = {
      phase: 'preliminary_voting',
      preliminaryVotes: {
        ...emptyVotes(),
        Viktor:  { vote: 8, submitted: true, submittedAt: NOW },
        Armando: { vote: 7, submitted: true, submittedAt: NOW },
        Pontus:  { vote: 9, submitted: true, submittedAt: NOW },
      },
    };
    const updates = computePreliminaryVote(book, 'Oskar', 6, '', NOW);
    expect(updates.phase).toBeUndefined();
  });
});

// ─── computeStartDiscussion ───────────────────────────────────────────────────

describe('computeStartDiscussion', () => {
  it('kastar om fas inte är revealed', () => {
    const book = { phase: 'preliminary_voting', preliminaryVotes: emptyVotes() };
    expect(() => computeStartDiscussion(book, NOW)).toThrow();
  });

  it('sätter fas till discussion', () => {
    const book = { phase: 'revealed', preliminaryVotes: allVotesSubmitted() };
    const updates = computeStartDiscussion(book, NOW);
    expect(updates.phase).toBe('discussion');
    expect(updates.discussionStartedAt).toBe(NOW);
  });

  it('initierar finalJudgments från preliminaryVotes', () => {
    const book = { phase: 'revealed', preliminaryVotes: allVotesSubmitted() };
    const updates = computeStartDiscussion(book, NOW);

    expect(updates.finalJudgments.Viktor).toEqual({
      vote: 8,
      comment: '',
      submitted: false,
      submittedAt: null,
      changedFromPreliminary: false,
    });
    expect(Object.keys(updates.finalJudgments)).toHaveLength(5);
  });
});

// ─── computeFinalJudgment ────────────────────────────────────────────────────

const discussionBook = () => ({
  phase: 'discussion',
  preliminaryVotes: allVotesSubmitted(),
  finalJudgments: {
    Viktor:  { vote: 8,    comment: '', submitted: true,  changedFromPreliminary: false, submittedAt: NOW },
    Armando: { vote: 8,    comment: '', submitted: true,  changedFromPreliminary: true,  submittedAt: NOW },
    Pontus:  { vote: 9,    comment: '', submitted: true,  changedFromPreliminary: false, submittedAt: NOW },
    Oskar:   { vote: 7,    comment: '', submitted: true,  changedFromPreliminary: true,  submittedAt: NOW },
    Aaron:   { vote: null, comment: '', submitted: false, changedFromPreliminary: false, submittedAt: null },
  },
});

describe('computeFinalJudgment', () => {
  it('kastar om fas inte är discussion', () => {
    const book = { phase: 'revealed', finalJudgments: {}, preliminaryVotes: {} };
    expect(() => computeFinalJudgment(book, 'Aaron', 6, '', NOW)).toThrow();
  });

  it('kastar om medlemmen redan lämnat slutomdöme', () => {
    const book = discussionBook();
    expect(() => computeFinalJudgment(book, 'Viktor', 9, '', NOW)).toThrow();
  });

  it('returnerar korrekt update för enstaka omdöme', () => {
    const book = { ...discussionBook(), finalJudgments: {} };
    book.finalJudgments = { ...discussionBook().finalJudgments };
    // Gör Aaron till enda inlämnade — ta bort de andra
    const onlyAaronBook = {
      phase: 'discussion',
      preliminaryVotes: allVotesSubmitted(),
      finalJudgments: {
        Aaron: { vote: null, comment: '', submitted: false, changedFromPreliminary: false, submittedAt: null },
      },
    };
    const updates = computeFinalJudgment(onlyAaronBook, 'Aaron', 6, 'ok', NOW);
    expect(updates['finalJudgments.Aaron']).toEqual({
      vote: 6,
      comment: 'ok',
      submitted: true,
      submittedAt: NOW,
      changedFromPreliminary: true, // prelimVote var 5
    });
    expect(updates.phase).toBeUndefined();
  });

  it('sätter changedFromPreliminary till false om rösten är oförändrad', () => {
    const book = {
      phase: 'discussion',
      preliminaryVotes: { Viktor: { vote: 8, submitted: true } },
      finalJudgments: { Viktor: { vote: null, submitted: false } },
    };
    const updates = computeFinalJudgment(book, 'Viktor', 8, '', NOW);
    expect(updates['finalJudgments.Viktor'].changedFromPreliminary).toBe(false);
  });

  it('sätter changedFromPreliminary till true om rösten ändrats', () => {
    const book = {
      phase: 'discussion',
      preliminaryVotes: { Viktor: { vote: 8, submitted: true } },
      finalJudgments: { Viktor: { vote: null, submitted: false } },
    };
    const updates = computeFinalJudgment(book, 'Viktor', 9, '', NOW);
    expect(updates['finalJudgments.Viktor'].changedFromPreliminary).toBe(true);
  });

  it('auto-finaliserar när 5:e omdömet lämnas', () => {
    const book = discussionBook();
    // Aaron (prelim: 5) lämnar final: 6
    const updates = computeFinalJudgment(book, 'Aaron', 6, '', NOW);

    expect(updates.phase).toBe('finalized');
    expect(updates.isCurrentBook).toBe(false);
    expect(updates.finalizedAt).toBe(NOW);
    // finalAverage: (8+8+9+7+6)/5 = 38/5 = 7.6
    expect(updates.finalAverage).toBeCloseTo(7.6);
    // averageChange: (0+1+0+1+1)/5 = 0.6
    expect(updates.averageChange).toBeCloseTo(0.6);
    // votesChanged: Armando, Oskar, Aaron = 3
    expect(updates.votesChanged).toBe(3);
    // legacy ratings
    expect(updates.ratings).toEqual({ Viktor: 8, Armando: 8, Pontus: 9, Oskar: 7, Aaron: 6 });
  });

  it('auto-finaliserar inte vid 4:e omdömet', () => {
    const book = {
      phase: 'discussion',
      preliminaryVotes: allVotesSubmitted(),
      finalJudgments: {
        Viktor:  { vote: 8, submitted: true, changedFromPreliminary: false },
        Armando: { vote: 7, submitted: true, changedFromPreliminary: false },
        Aaron:   { vote: null, submitted: false, changedFromPreliminary: false },
        Oskar:   { vote: null, submitted: false, changedFromPreliminary: false },
        Pontus:  { vote: null, submitted: false, changedFromPreliminary: false },
      },
    };
    const updates = computeFinalJudgment(book, 'Pontus', 9, '', NOW);
    expect(updates.phase).toBeUndefined();
  });

  it('trunkerar kommentar till 120 tecken', () => {
    const book = {
      phase: 'discussion',
      preliminaryVotes: { Viktor: { vote: 8, submitted: true } },
      finalJudgments: { Viktor: { vote: null, submitted: false } },
    };
    const updates = computeFinalJudgment(book, 'Viktor', 8, 'x'.repeat(200), NOW);
    expect(updates['finalJudgments.Viktor'].comment.length).toBe(120);
  });
});
