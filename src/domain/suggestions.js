export const SUGGESTION_COMMENT_MAX = 200
export const SUGGESTION_DESCRIPTION_MAX = 600
export const SUGGESTION_REPLY_MAX = 150

export function validateSuggestion({ title, author }) {
  if (!title || !title.trim()) return 'Titel krävs'
  if (!author || !author.trim()) return 'Författare krävs'
  return null
}

export function coverHue(title) {
  let h = 0
  for (let i = 0; i < (title || '').length; i++) {
    h = (h * 31 + title.charCodeAt(i)) % 360
  }
  return h
}
