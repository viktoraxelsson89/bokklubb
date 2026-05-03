import { BOOK_PHASES, QUORUM, COMMENT_MAX_LENGTH } from './constants.js';
import { calculateAverage } from './calculations.js';

export function computePreliminaryVote(book, memberName, vote, comment, now) {
  if (book.phase !== BOOK_PHASES.PRELIMINARY_VOTING) {
    throw new Error(`Felaktig fas: ${book.phase}`);
  }
  if (book.preliminaryVotes?.[memberName]?.submitted) {
    throw new Error(`${memberName} har redan röstat`);
  }

  const voteInt = parseInt(vote, 10);
  const trimmedComment = String(comment).trim().substring(0, COMMENT_MAX_LENGTH);

  const newVoteEntry = { vote: voteInt, comment: trimmedComment, submitted: true, submittedAt: now };
  const updates = { [`preliminaryVotes.${memberName}`]: newVoteEntry };

  const allVotes = { ...book.preliminaryVotes, [memberName]: newVoteEntry };
  const submittedCount = Object.values(allVotes).filter(v => v.submitted).length;

  if (submittedCount === QUORUM) {
    updates.phase = BOOK_PHASES.REVEALED;
    updates.preliminaryRevealedAt = now;
    updates.preliminaryAverage = calculateAverage(allVotes);
  }

  return updates;
}

export function computeStartDiscussion(book, now) {
  if (book.phase !== BOOK_PHASES.REVEALED) {
    throw new Error(`Felaktig fas: ${book.phase}`);
  }

  const finalJudgments = {};
  for (const [member, prelim] of Object.entries(book.preliminaryVotes || {})) {
    finalJudgments[member] = {
      vote: prelim.vote,
      comment: '',
      submitted: false,
      submittedAt: null,
      changedFromPreliminary: false,
    };
  }

  return { phase: BOOK_PHASES.DISCUSSION, discussionStartedAt: now, finalJudgments };
}

export function computeFinalJudgment(book, memberName, vote, comment, now) {
  if (book.phase !== BOOK_PHASES.DISCUSSION) {
    throw new Error(`Felaktig fas: ${book.phase}`);
  }
  if (book.finalJudgments?.[memberName]?.submitted) {
    throw new Error(`${memberName} har redan lämnat slutomdöme`);
  }

  const voteInt = parseInt(vote, 10);
  const trimmedComment = String(comment).trim().substring(0, COMMENT_MAX_LENGTH);
  const prelimVote = book.preliminaryVotes?.[memberName]?.vote;
  const changedFromPreliminary = prelimVote !== voteInt;

  const newJudgment = {
    vote: voteInt,
    comment: trimmedComment,
    submitted: true,
    submittedAt: now,
    changedFromPreliminary,
  };

  const updates = { [`finalJudgments.${memberName}`]: newJudgment };

  const allJudgments = { ...book.finalJudgments, [memberName]: newJudgment };
  const finalCount = Object.values(allJudgments).filter(j => j.submitted).length;

  if (finalCount === QUORUM) {
    const finalAverage =
      Object.values(allJudgments).reduce((sum, j) => sum + j.vote, 0) / QUORUM;

    const averageChange =
      Object.entries(allJudgments).reduce((sum, [member, j]) => {
        const prelim = book.preliminaryVotes?.[member]?.vote ?? j.vote;
        return sum + (j.vote - prelim);
      }, 0) / QUORUM;

    const votesChanged = Object.values(allJudgments).filter(j => j.changedFromPreliminary).length;

    const ratings = {};
    for (const [m, j] of Object.entries(allJudgments)) {
      ratings[m] = j.vote;
    }

    Object.assign(updates, {
      phase: BOOK_PHASES.FINALIZED,
      finalizedAt: now,
      isCurrentBook: false,
      finalAverage,
      averageChange,
      votesChanged,
      ratings,
    });
  }

  return updates;
}
