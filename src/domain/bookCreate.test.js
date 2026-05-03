import { describe, it, expect } from 'vitest'
import { buildNewBookDoc, validateNewBookForm } from './bookCreate.js'
import { MEMBERS, BOOK_PHASES } from './constants.js'

const NOW = '2026-05-04T12:00:00.000Z'

describe('buildNewBookDoc', () => {
  it('creates a book in preliminary_voting with all 5 empty vote slots', () => {
    const doc = buildNewBookDoc({
      title: '  En bok ', author: ' Åsa ', season: '7',
      chosenBy: 'Viktor', meetingDate: '2026-06-01', coverUrl: ' https://x/c.jpg ',
    }, NOW)

    expect(doc.title).toBe('En bok')
    expect(doc.author).toBe('Åsa')
    expect(doc.season).toBe(7)
    expect(doc.chosenBy).toBe('Viktor')
    expect(doc.meetingDate).toBe('2026-06-01')
    expect(doc.coverUrl).toBe('https://x/c.jpg')
    expect(doc.phase).toBe(BOOK_PHASES.PRELIMINARY_VOTING)
    expect(doc.dateAdded).toBe(NOW)
    expect(doc.isCurrentBook).toBe(false)

    for (const m of MEMBERS) {
      expect(doc.preliminaryVotes[m]).toEqual({ vote: null, comment: '', submitted: false, submittedAt: null })
      expect(doc.finalJudgments[m]).toEqual({ vote: null, comment: '', submitted: false, submittedAt: null, changedFromPreliminary: false })
    }
    expect(doc.preliminaryAverage).toBeNull()
    expect(doc.finalAverage).toBeNull()
    expect(doc.ratings).toBeNull()
  })

  it('handles missing optional fields', () => {
    const doc = buildNewBookDoc({ title: 'X', season: '1' }, NOW)
    expect(doc.author).toBe('')
    expect(doc.chosenBy).toBeNull()
    expect(doc.meetingDate).toBeNull()
    expect(doc.coverUrl).toBeNull()
  })

  it('coerces invalid season to null', () => {
    const doc = buildNewBookDoc({ title: 'X', season: 'abc' }, NOW)
    expect(doc.season).toBeNull()
  })
})

describe('validateNewBookForm', () => {
  it('requires a title', () => {
    expect(validateNewBookForm({ title: '   ', season: '1' })).toMatch(/titel/i)
  })
  it('requires a positive integer season', () => {
    expect(validateNewBookForm({ title: 'X', season: '0' })).toMatch(/säsong/i)
    expect(validateNewBookForm({ title: 'X', season: 'abc' })).toMatch(/säsong/i)
  })
  it('returns null when valid', () => {
    expect(validateNewBookForm({ title: 'X', season: '3' })).toBeNull()
  })
})
