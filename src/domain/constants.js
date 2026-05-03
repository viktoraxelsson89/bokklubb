export const BOOK_PHASES = Object.freeze({
  PRELIMINARY_VOTING: 'preliminary_voting',
  REVEALED: 'revealed',
  DISCUSSION: 'discussion',
  FINALIZED: 'finalized',
});

export const MEMBERS = ['Viktor', 'Armando', 'Pontus', 'Oskar', 'Aaron'];

export const QUORUM = 5;

export const COMMENT_MAX_LENGTH = 120;

export const EMAIL_TO_NAME = Object.freeze({
  'viktoraxelsson89@gmail.com': 'Viktor',
  'armando.tobar.dubon@hotmail.com': 'Armando',
  'aaron.kepler@gmail.com': 'Aaron',
  'ponrud@gmail.com': 'Pontus',
  'oskar.wikingsson@gmail.com': 'Oskar',
});

const PHASE_DISPLAY_NAMES = {
  [BOOK_PHASES.PRELIMINARY_VOTING]: 'Förhandsröstning',
  [BOOK_PHASES.REVEALED]: 'Resultat avslöjat',
  [BOOK_PHASES.DISCUSSION]: 'Diskussion',
  [BOOK_PHASES.FINALIZED]: 'Slutgiltig',
};

const PHASE_STATUS_TEXT = {
  [BOOK_PHASES.PRELIMINARY_VOTING]: 'Pågående förhandsröstning',
  [BOOK_PHASES.REVEALED]: 'Väntar på diskussion',
  [BOOK_PHASES.DISCUSSION]: 'Pågående slutomdömen',
  default: 'Ej betygsatt än',
};

export function getPhaseDisplayName(phase) {
  return PHASE_DISPLAY_NAMES[phase] ?? 'Okänd';
}

export function getPhaseStatusText(phase) {
  return PHASE_STATUS_TEXT[phase] ?? PHASE_STATUS_TEXT.default;
}
