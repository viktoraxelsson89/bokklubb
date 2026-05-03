import { MEMBERS, QUORUM, COMMENT_MAX_LENGTH } from './constants.js';
import { calculateAverage } from './calculations.js';

function trimComment(c) {
  return String(c ?? '').trim().substring(0, COMMENT_MAX_LENGTH);
}

function buildVoteEntry(formEntry, originalEntry, now) {
  const submitted = !!formEntry?.submitted;
  const voteInt = parseInt(formEntry?.vote, 10);
  const vote = Number.isFinite(voteInt) ? voteInt : null;
  return {
    vote,
    comment: trimComment(formEntry?.comment),
    submitted,
    submittedAt: submitted ? (originalEntry?.submittedAt || now) : null,
  };
}

export function buildBookUpdates(originalBook, form, now = new Date().toISOString()) {
  const seasonInt = parseInt(form.season, 10);

  const preliminaryVotes = {};
  const finalJudgments = {};
  for (const member of MEMBERS) {
    preliminaryVotes[member] = buildVoteEntry(
      form.preliminaryVotes?.[member],
      originalBook.preliminaryVotes?.[member],
      now,
    );
    const finalEntry = buildVoteEntry(
      form.finalJudgments?.[member],
      originalBook.finalJudgments?.[member],
      now,
    );
    const prelimVote = preliminaryVotes[member].vote;
    finalJudgments[member] = {
      ...finalEntry,
      changedFromPreliminary:
        finalEntry.submitted && prelimVote != null && prelimVote !== finalEntry.vote,
    };
  }

  const allFinalSubmitted = MEMBERS.every(
    m => finalJudgments[m].submitted && Number.isFinite(finalJudgments[m].vote),
  );

  const updates = {
    title: String(form.title ?? '').trim(),
    author: String(form.author ?? '').trim(),
    season: Number.isFinite(seasonInt) ? seasonInt : (originalBook.season ?? null),
    chosenBy: form.chosenBy || null,
    meetingDate: form.meetingDate || null,
    coverUrl: form.coverUrl?.trim() || null,
    phase: form.phase || originalBook.phase || null,
    preliminaryVotes,
    finalJudgments,
    preliminaryAverage: calculateAverage(preliminaryVotes) || null,
    finalAverage: null,
    averageChange: null,
    votesChanged: null,
    ratings: null,
  };

  if (allFinalSubmitted) {
    const finalSum = MEMBERS.reduce((s, m) => s + finalJudgments[m].vote, 0);
    const changeSum = MEMBERS.reduce((s, m) => {
      const prelim = preliminaryVotes[m].vote ?? finalJudgments[m].vote;
      return s + (finalJudgments[m].vote - prelim);
    }, 0);
    const ratings = {};
    for (const m of MEMBERS) ratings[m] = finalJudgments[m].vote;

    updates.finalAverage = finalSum / QUORUM;
    updates.averageChange = changeSum / QUORUM;
    updates.votesChanged = MEMBERS.filter(m => finalJudgments[m].changedFromPreliminary).length;
    updates.ratings = ratings;
  }

  return updates;
}

export function buildFormFromBook(book) {
  const preliminaryVotes = {};
  const finalJudgments = {};
  for (const member of MEMBERS) {
    const p = book.preliminaryVotes?.[member];
    const f = book.finalJudgments?.[member];
    const legacyRating = book.ratings?.[member];
    preliminaryVotes[member] = {
      vote: p?.vote != null ? String(p.vote) : '',
      comment: p?.comment || '',
      submitted: !!p?.submitted,
    };
    finalJudgments[member] = {
      vote: f?.vote != null ? String(f.vote) : (legacyRating != null ? String(legacyRating) : ''),
      comment: f?.comment || '',
      submitted: !!f?.submitted || legacyRating != null,
    };
  }
  return {
    title: book.title || '',
    author: book.author || '',
    season: book.season != null ? String(book.season) : '',
    chosenBy: book.chosenBy || '',
    meetingDate: book.meetingDate || '',
    coverUrl: book.coverUrl || '',
    phase: book.phase || 'finalized',
    preliminaryVotes,
    finalJudgments,
  };
}
