// js/utils/constants.js
export const BOOK_PHASES = Object.freeze({
  PRELIMINARY_VOTING: 'preliminary_voting',
  REVEALED: 'revealed',
  DISCUSSION: 'discussion',
  FINALIZED: 'finalized',
});

const PHASE_DISPLAY_NAME = {
  [BOOK_PHASES.PRELIMINARY_VOTING]: 'Förhandsröstning',
  [BOOK_PHASES.REVEALED]:           'Resultat avslöjat',
  [BOOK_PHASES.DISCUSSION]:         'Diskussion',
  [BOOK_PHASES.FINALIZED]:          'Slutgiltig',
};

const PHASE_STATUS_TEXT = {
  [BOOK_PHASES.PRELIMINARY_VOTING]: 'Pågående förhandsröstning',
  [BOOK_PHASES.REVEALED]:           'Väntar på diskussion',
  [BOOK_PHASES.DISCUSSION]:         'Pågående slutomdömen',
  default:                          'Ej betygsatt än',
};

export function getPhaseDisplayName(phase) {
  return PHASE_DISPLAY_NAME[phase] ?? 'Okänd';
}

export function getPhaseStatusText(phase) {
  return PHASE_STATUS_TEXT[phase] ?? PHASE_STATUS_TEXT.default;
}
