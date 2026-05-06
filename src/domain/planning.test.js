import { describe, it, expect } from 'vitest'
import {
  RESPONSES,
  formatDateSv,
  isDateInPeriod,
  getEffectiveResponse,
  summarizeDates,
  hasUnansweredDates,
  getMembersWithoutAnyResponse,
  generateWeekendDates,
} from './planning.js'

describe('isDateInPeriod', () => {
  it('date within period', () => {
    expect(isDateInPeriod('2025-07-15', '2025-07-10', '2025-07-20')).toBe(true)
  })
  it('date outside period', () => {
    expect(isDateInPeriod('2025-07-25', '2025-07-10', '2025-07-20')).toBe(false)
  })
  it('date on lower boundary', () => {
    expect(isDateInPeriod('2025-07-10', '2025-07-10', '2025-07-20')).toBe(true)
  })
  it('date on upper boundary', () => {
    expect(isDateInPeriod('2025-07-20', '2025-07-10', '2025-07-20')).toBe(true)
  })
})

describe('getEffectiveResponse', () => {
  it('explicit response returned directly', () => {
    const responses = {
      Viktor: {
        dates: { '2025-07-18': 'kan' },
        awayPeriods: [],
      },
    }
    expect(getEffectiveResponse(responses, 'Viktor', '2025-07-18')).toBe('kan')
  })

  it('explicit response takes priority over away period', () => {
    const responses = {
      Viktor: {
        dates: { '2025-07-18': 'kan' },
        awayPeriods: [{ from: '2025-07-10', to: '2025-07-25' }],
      },
    }
    expect(getEffectiveResponse(responses, 'Viktor', '2025-07-18')).toBe('kan')
  })

  it('away period returns kan_inte', () => {
    const responses = {
      Viktor: {
        dates: {},
        awayPeriods: [{ from: '2025-07-10', to: '2025-07-25' }],
      },
    }
    expect(getEffectiveResponse(responses, 'Viktor', '2025-07-15')).toBe(RESPONSES.KAN_INTE)
  })

  it('date outside away period returns null', () => {
    const responses = {
      Viktor: {
        dates: {},
        awayPeriods: [{ from: '2025-07-10', to: '2025-07-25' }],
      },
    }
    expect(getEffectiveResponse(responses, 'Viktor', '2025-08-01')).toBe(null)
  })

  it('missing member returns null', () => {
    expect(getEffectiveResponse({}, 'Viktor', '2025-07-15')).toBe(null)
  })

  it('null responses returns null', () => {
    expect(getEffectiveResponse(null, 'Viktor', '2025-07-15')).toBe(null)
  })
})

describe('summarizeDates', () => {
  const members = ['Viktor', 'Armando']
  const dates = ['2025-07-18']

  it('allCan true when all respond kan', () => {
    const responses = {
      Viktor:   { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
      Armando:  { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
    }
    const [s] = summarizeDates(dates, responses, members)
    expect(s.allCan).toBe(true)
    expect(s.kan).toEqual(['Viktor', 'Armando'])
    expect(s.no_response).toHaveLength(0)
  })

  it('tracks no_response correctly', () => {
    const responses = {
      Viktor: { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
      Armando: { dates: {}, awayPeriods: [] },
    }
    const [s] = summarizeDates(dates, responses, members)
    expect(s.allCan).toBe(false)
    expect(s.no_response).toEqual(['Armando'])
  })

  it('allResponded false when someone missing', () => {
    const responses = {
      Viktor: { dates: { '2025-07-18': 'kanske' }, awayPeriods: [] },
    }
    const [s] = summarizeDates(dates, responses, members)
    expect(s.allResponded).toBe(false)
  })

  it('noneCantGo false when someone has kan_inte via away period', () => {
    const responses = {
      Viktor:  { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
      Armando: { dates: {}, awayPeriods: [{ from: '2025-07-15', to: '2025-07-20' }] },
    }
    const [s] = summarizeDates(dates, responses, members)
    expect(s.noneCantGo).toBe(false)
    expect(s.kan_inte).toContain('Armando')
  })
})

describe('hasUnansweredDates', () => {
  it('false when all dates answered', () => {
    const responses = {
      Viktor: { dates: { '2025-07-18': 'kan', '2025-07-25': 'kanske' }, awayPeriods: [] },
    }
    expect(hasUnansweredDates(responses, ['2025-07-18', '2025-07-25'], 'Viktor')).toBe(false)
  })

  it('true when any date unanswered', () => {
    const responses = {
      Viktor: { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
    }
    expect(hasUnansweredDates(responses, ['2025-07-18', '2025-07-25'], 'Viktor')).toBe(true)
  })

  it('away period counts as answered', () => {
    const responses = {
      Viktor: { dates: {}, awayPeriods: [{ from: '2025-07-15', to: '2025-07-30' }] },
    }
    expect(hasUnansweredDates(responses, ['2025-07-18', '2025-07-25'], 'Viktor')).toBe(false)
  })
})

describe('getMembersWithoutAnyResponse', () => {
  it('returns members with zero responses', () => {
    const responses = {
      Viktor: { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
      Armando: { dates: {}, awayPeriods: [] },
    }
    const result = getMembersWithoutAnyResponse(responses, ['2025-07-18'], ['Viktor', 'Armando'])
    expect(result).toEqual(['Armando'])
  })

  it('empty when all responded', () => {
    const responses = {
      Viktor:  { dates: { '2025-07-18': 'kan' }, awayPeriods: [] },
      Armando: { dates: { '2025-07-18': 'kanske' }, awayPeriods: [] },
    }
    const result = getMembersWithoutAnyResponse(responses, ['2025-07-18'], ['Viktor', 'Armando'])
    expect(result).toHaveLength(0)
  })
})

describe('generateWeekendDates', () => {
  it('only returns fridays and saturdays', () => {
    // Week of 2025-07-14: Mon=14, Tue=15, Wed=16, Thu=17, Fri=18, Sat=19, Sun=20
    const dates = generateWeekendDates('2025-07-14', '2025-07-20')
    expect(dates).toEqual(['2025-07-18', '2025-07-19'])
  })

  it('includes both weeks when spanning two weekends', () => {
    const dates = generateWeekendDates('2025-07-18', '2025-07-26')
    expect(dates).toEqual(['2025-07-18', '2025-07-19', '2025-07-25', '2025-07-26'])
  })

  it('empty when no weekends in range', () => {
    // 2025-07-14 Mon to 2025-07-17 Thu
    const dates = generateWeekendDates('2025-07-14', '2025-07-17')
    expect(dates).toHaveLength(0)
  })
})

describe('formatDateSv', () => {
  it('formats friday correctly', () => {
    // 2025-07-18 is a Friday
    expect(formatDateSv('2025-07-18')).toBe('fre 18 jul')
  })
})
