import { BOOK_PHASES } from './constants.js';

export function canUserVotePreliminary(book, user) {
  if (!user) return false;
  const phase = book.phase || BOOK_PHASES.PRELIMINARY_VOTING;
  if (phase !== BOOK_PHASES.PRELIMINARY_VOTING) return false;
  if (user.role === 'admin') return true;
  return !book.preliminaryVotes?.[user.displayName]?.submitted;
}

export function canUserVoteFinal(book, user) {
  if (!user) return false;
  if (book.phase !== BOOK_PHASES.DISCUSSION) return false;
  return !book.finalJudgments?.[user.displayName]?.submitted;
}

export function canEditFullBook(book, user) {
  if (!user) return false;
  return user.role === 'admin' || book.chosenBy === user.displayName;
}
