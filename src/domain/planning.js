export const RESPONSES = Object.freeze({
  KAN: 'kan',
  KANSKE: 'kanske',
  KAN_INTE: 'kan_inte',
})

const SV_WEEKDAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
const SV_MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function formatDateSv(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const weekday = SV_WEEKDAYS[d.getDay()]
  const day = d.getDate()
  const month = SV_MONTHS[d.getMonth()]
  return `${weekday} ${day} ${month}`
}

export function isDateInPeriod(dateStr, from, to) {
  return dateStr >= from && dateStr <= to
}

export function getEffectiveResponse(responses, memberName, dateStr) {
  const memberData = responses?.[memberName]
  if (!memberData) return null

  const explicit = memberData.dates?.[dateStr]
  if (explicit) return explicit

  const awayPeriods = memberData.awayPeriods || []
  for (const period of awayPeriods) {
    if (isDateInPeriod(dateStr, period.from, period.to)) return RESPONSES.KAN_INTE
  }

  return null
}

export function summarizeDates(proposedDates, responses, members) {
  return proposedDates.map(date => {
    const kan = []
    const kanske = []
    const kan_inte = []
    const no_response = []

    for (const member of members) {
      const r = getEffectiveResponse(responses, member, date)
      if (r === RESPONSES.KAN) kan.push(member)
      else if (r === RESPONSES.KANSKE) kanske.push(member)
      else if (r === RESPONSES.KAN_INTE) kan_inte.push(member)
      else no_response.push(member)
    }

    return {
      date,
      kan,
      kanske,
      kan_inte,
      no_response,
      allCan: kan.length === members.length,
      noneCantGo: kan_inte.length === 0 && no_response.length === 0,
      allResponded: no_response.length === 0,
    }
  })
}

export function hasUnansweredDates(responses, proposedDates, memberName) {
  return proposedDates.some(
    date => getEffectiveResponse(responses, memberName, date) === null
  )
}

export function getMembersWithoutAnyResponse(responses, proposedDates, members) {
  return members.filter(member =>
    proposedDates.every(date => getEffectiveResponse(responses, member, date) === null)
  )
}

export function generateWeekendDates(fromStr, toStr) {
  const dates = []
  const end = new Date(toStr + 'T12:00:00')
  const current = new Date(fromStr + 'T12:00:00')

  while (current <= end) {
    const day = current.getDay()
    if (day === 5 || day === 6) {
      dates.push(current.toISOString().slice(0, 10))
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}
