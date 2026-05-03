import { describe, it, expect } from 'vitest';
import { buildBookUpdates, buildFormFromBook } from './bookEdit.js';
import { MEMBERS } from './constants.js';

const NOW = '2026-05-03T12:00:00.000Z';

function makeForm(overrides = {}) {
  const prelim = {};
  const final = {};
  for (const m of MEMBERS) {
    prelim[m] = { vote: '7', comment: '', submitted: true };
    final[m] = { vote: '8', comment: '', submitted: true };
  }
  return {
    title: 'Bok',
    author: 'Förf',
    season: '6',
    chosenBy: 'Viktor',
    meetingDate: '2026-04-01',
    coverUrl: '',
    phase: 'finalized',
    preliminaryVotes: prelim,
    finalJudgments: final,
    ...overrides,
  };
}

describe('buildBookUpdates', () => {
  it('beräknar finalAverage = sum/5 när alla 5 slutomdömen är inlämnade', () => {
    const form = makeForm();
    form.finalJudgments.Viktor.vote = '10';
    form.finalJudgments.Armando.vote = '8';
    form.finalJudgments.Pontus.vote = '6';
    form.finalJudgments.Oskar.vote = '7';
    form.finalJudgments.Aaron.vote = '9';
    const u = buildBookUpdates({}, form, NOW);
    expect(u.finalAverage).toBe(40 / 5);
  });

  it('beräknar averageChange och votesChanged korrekt', () => {
    const form = makeForm();
    form.preliminaryVotes.Viktor.vote = '7';
    form.finalJudgments.Viktor.vote = '9';
    form.preliminaryVotes.Armando.vote = '5';
    form.finalJudgments.Armando.vote = '5';
    const u = buildBookUpdates({}, form, NOW);
    expect(u.averageChange).toBe((2 + 0 + 1 + 1 + 1) / 5);
    expect(u.votesChanged).toBe(4);
  });

  it('lämnar finalAverage null om någon röst saknas', () => {
    const form = makeForm();
    form.finalJudgments.Aaron.submitted = false;
    const u = buildBookUpdates({}, form, NOW);
    expect(u.finalAverage).toBeNull();
    expect(u.averageChange).toBeNull();
    expect(u.votesChanged).toBeNull();
    expect(u.ratings).toBeNull();
  });

  it('sätter changedFromPreliminary per medlem', () => {
    const form = makeForm();
    form.preliminaryVotes.Viktor.vote = '7';
    form.finalJudgments.Viktor.vote = '8';
    form.preliminaryVotes.Armando.vote = '6';
    form.finalJudgments.Armando.vote = '6';
    const u = buildBookUpdates({}, form, NOW);
    expect(u.finalJudgments.Viktor.changedFromPreliminary).toBe(true);
    expect(u.finalJudgments.Armando.changedFromPreliminary).toBe(false);
  });

  it('bevarar submittedAt från originalet', () => {
    const orig = {
      finalJudgments: { Viktor: { vote: 8, submitted: true, submittedAt: '2026-01-01T00:00:00Z' } },
    };
    const form = makeForm();
    const u = buildBookUpdates(orig, form, NOW);
    expect(u.finalJudgments.Viktor.submittedAt).toBe('2026-01-01T00:00:00Z');
    expect(u.finalJudgments.Armando.submittedAt).toBe(NOW);
  });

  it('rensar submittedAt när submitted=false', () => {
    const form = makeForm();
    form.finalJudgments.Viktor.submitted = false;
    const u = buildBookUpdates({}, form, NOW);
    expect(u.finalJudgments.Viktor.submittedAt).toBeNull();
  });
});

describe('buildFormFromBook', () => {
  it('läser legacy ratings som final votes', () => {
    const book = { ratings: { Viktor: 8, Armando: 7 }, title: 'X' };
    const form = buildFormFromBook(book);
    expect(form.finalJudgments.Viktor.vote).toBe('8');
    expect(form.finalJudgments.Viktor.submitted).toBe(true);
    expect(form.finalJudgments.Pontus.submitted).toBe(false);
  });
});
