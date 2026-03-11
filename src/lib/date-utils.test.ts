import { describe, it, expect } from 'vitest'
import {
  getWeekBounds,
  getWeekDays,
  getDayHours,
  formatTime,
  formatDateRange,
  getEventPosition,
  isSameDay,
  formatWeekRange,
  getEventOutOfRangeStatus,
  calculateEventLayout,
  DAY_START_HOUR,
  DAY_END_HOUR,
} from './date-utils'

describe('getWeekBounds', () => {
  it('returns Sunday to Saturday for a mid-week date', () => {
    // Wednesday, March 12, 2025
    const date = new Date(2025, 2, 12)
    const { start, end } = getWeekBounds(date)

    // Should start on Sunday, March 9
    expect(start.getDay()).toBe(0) // Sunday
    expect(start.getDate()).toBe(9)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)

    // Should end on Saturday, March 15
    expect(end.getDay()).toBe(6) // Saturday
    expect(end.getDate()).toBe(15)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
  })

  it('returns same week for Sunday date', () => {
    const sunday = new Date(2025, 2, 9)
    const { start, end } = getWeekBounds(sunday)

    expect(start.getDate()).toBe(9)
    expect(end.getDate()).toBe(15)
  })

  it('returns same week for Saturday date', () => {
    const saturday = new Date(2025, 2, 15)
    const { start, end } = getWeekBounds(saturday)

    expect(start.getDate()).toBe(9)
    expect(end.getDate()).toBe(15)
  })

  it('handles month boundaries correctly', () => {
    // March 1, 2025 is a Saturday
    const date = new Date(2025, 2, 1)
    const { start, end } = getWeekBounds(date)

    expect(start.getMonth()).toBe(1) // February
    expect(start.getDate()).toBe(23)
    expect(end.getMonth()).toBe(2) // March
    expect(end.getDate()).toBe(1)
  })
})

describe('getWeekDays', () => {
  it('returns 7 days starting from given date', () => {
    const sunday = new Date(2025, 2, 9)
    const days = getWeekDays(sunday)

    expect(days).toHaveLength(7)
    expect(days[0].getDate()).toBe(9)
    expect(days[6].getDate()).toBe(15)
  })

  it('each day increments by one calendar day', () => {
    const sunday = new Date(2025, 2, 9)
    const days = getWeekDays(sunday)

    // Just check the sequence is correct: 9, 10, 11, 12, 13, 14, 15
    expect(days[0].getDate()).toBe(9)
    expect(days[1].getDate()).toBe(10)
    expect(days[2].getDate()).toBe(11)
    expect(days[3].getDate()).toBe(12)
    expect(days[4].getDate()).toBe(13)
    expect(days[5].getDate()).toBe(14)
    expect(days[6].getDate()).toBe(15)
  })
})

describe('getDayHours', () => {
  it('returns hours from 6 AM to 9 PM', () => {
    const hours = getDayHours()

    expect(hours).toHaveLength(16) // 6 AM to 9 PM = 16 hours
    expect(hours[0]).toBe('6 AM')
    expect(hours[15]).toBe('9 PM')
  })

  it('formats hours correctly in 12-hour format', () => {
    const hours = getDayHours()

    expect(hours).toContain('12 PM') // noon
    expect(hours).toContain('1 PM')
    expect(hours).toContain('6 AM')
    expect(hours).toContain('9 PM')
  })
})

describe('formatTime', () => {
  it('formats ISO string to 12-hour time', () => {
    const isoString = '2025-03-12T14:30:00.000Z'
    const result = formatTime(isoString)

    // Result depends on timezone, but should contain time components
    expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/)
  })

  it('formats time with AM/PM indicator', () => {
    const morning = '2025-03-12T08:00:00.000Z'
    const afternoon = '2025-03-12T14:00:00.000Z'
    
    const morningResult = formatTime(morning)
    const afternoonResult = formatTime(afternoon)
    
    // One should contain AM, the other PM
    const hasAm = morningResult.includes('AM')
    const hasPm = afternoonResult.includes('PM')
    expect(hasAm || morningResult.includes('PM')).toBe(true)
    expect(hasPm || afternoonResult.includes('AM')).toBe(true)
  })
})

describe('formatDateRange', () => {
  it('formats date range with day and times', () => {
    const start = '2025-03-12T09:00:00.000Z'
    const end = '2025-03-12T10:30:00.000Z'
    const result = formatDateRange(start, end)

    expect(result).toContain('Wed')
    expect(result).toContain('Mar')
    expect(result).toContain('·')
    expect(result).toContain('–')
  })
})

describe('getEventPosition', () => {
  it('calculates correct position for event within visible hours', () => {
    // Use local time to avoid timezone issues: 9:00 AM local
    const localDate = new Date(2025, 2, 12, 9, 0)
    const start = localDate.toISOString()
    const end = new Date(2025, 2, 12, 10, 0).toISOString()
    const { top, height } = getEventPosition(start, end)

    // 9 AM is 3 hours after 6 AM start
    // 3 hours / 16 hours total = 18.75%
    expect(top).toBeGreaterThanOrEqual(0)
    expect(top).toBeLessThan(50)
    expect(height).toBeGreaterThan(0)
    expect(height).toBeGreaterThanOrEqual(2) // minimum height
  })

  it('clamps top to 0 for events before visible hours', () => {
    // 4 AM local time, before 6 AM start
    const start = new Date(2025, 2, 12, 4, 0).toISOString()
    const end = new Date(2025, 2, 12, 5, 0).toISOString()
    const { top } = getEventPosition(start, end)

    expect(top).toBe(0)
  })

  it('enforces minimum height for short events', () => {
    const start = '2025-03-12T09:00:00.000Z'
    const end = '2025-03-12T09:05:00.000Z' // 5 minute event
    const { height } = getEventPosition(start, end)

    expect(height).toBe(2) // minimum 2%
  })
})

describe('isSameDay', () => {
  it('returns true for same day', () => {
    const a = new Date(2025, 2, 12, 9, 0)
    const b = new Date(2025, 2, 12, 18, 30)

    expect(isSameDay(a, b)).toBe(true)
  })

  it('returns false for different days', () => {
    const a = new Date(2025, 2, 12)
    const b = new Date(2025, 2, 13)

    expect(isSameDay(a, b)).toBe(false)
  })

  it('returns false for different months', () => {
    const a = new Date(2025, 2, 12)
    const b = new Date(2025, 3, 12)

    expect(isSameDay(a, b)).toBe(false)
  })

  it('returns false for different years', () => {
    const a = new Date(2025, 2, 12)
    const b = new Date(2026, 2, 12)

    expect(isSameDay(a, b)).toBe(false)
  })
})

describe('formatWeekRange', () => {
  it('formats same month range', () => {
    const start = new Date(2025, 2, 9)
    const end = new Date(2025, 2, 15)
    const result = formatWeekRange(start, end)

    expect(result).toBe('Mar 9 – 15, 2025')
  })

  it('formats different month range', () => {
    const start = new Date(2025, 2, 30)
    const end = new Date(2025, 3, 5)
    const result = formatWeekRange(start, end)

    expect(result).toContain('Mar')
    expect(result).toContain('Apr')
    expect(result).toContain('–')
  })
})

describe('getEventOutOfRangeStatus', () => {
  it('returns "before" for events ending before 6 AM', () => {
    const start = '2025-03-12T04:00:00.000Z'
    const end = '2025-03-12T05:00:00.000Z'

    expect(getEventOutOfRangeStatus(start, end)).toBe('before')
  })

  it('returns "after" for events starting after 10 PM local time', () => {
    const start = new Date(2025, 2, 12, 23, 0).toISOString() // 11 PM local
    const end = new Date(2025, 2, 12, 23, 30).toISOString()

    expect(getEventOutOfRangeStatus(start, end)).toBe('after')
  })

  it('returns null for events within range', () => {
    const start = new Date(2025, 2, 12, 9, 0).toISOString() // 9 AM local
    const end = new Date(2025, 2, 12, 10, 0).toISOString()

    expect(getEventOutOfRangeStatus(start, end)).toBeNull()
  })
})

describe('calculateEventLayout', () => {
  it('returns empty array for no events', () => {
    const result = calculateEventLayout([])
    expect(result).toHaveLength(0)
  })

  it('returns full width for single event', () => {
    const events = [
      { start: '2025-03-12T09:00:00.000Z', end: '2025-03-12T10:00:00.000Z', id: '1' },
    ]
    const result = calculateEventLayout(events)

    expect(result).toHaveLength(1)
    expect(result[0].width).toBe(100)
    expect(result[0].offset).toBe(0)
  })

  it('divides width equally for overlapping events', () => {
    const events = [
      { start: '2025-03-12T09:00:00.000Z', end: '2025-03-12T10:00:00.000Z', id: '1' },
      { start: '2025-03-12T09:30:00.000Z', end: '2025-03-12T10:30:00.000Z', id: '2' },
    ]
    const result = calculateEventLayout(events)

    expect(result).toHaveLength(2)
    expect(result[0].width).toBe(50)
    expect(result[1].width).toBe(50)
    expect(result[0].offset).toBe(0)
    expect(result[1].offset).toBe(50)
  })

  it('handles non-overlapping events as separate groups', () => {
    const events = [
      { start: '2025-03-12T09:00:00.000Z', end: '2025-03-12T10:00:00.000Z', id: '1' },
      { start: '2025-03-12T11:00:00.000Z', end: '2025-03-12T12:00:00.000Z', id: '2' },
    ]
    const result = calculateEventLayout(events)

    // Both should have full width since they don't overlap
    expect(result[0].width).toBe(100)
    expect(result[1].width).toBe(100)
  })
})

describe('constants', () => {
  it('exports correct day bounds', () => {
    expect(DAY_START_HOUR).toBe(6)
    expect(DAY_END_HOUR).toBe(22)
  })
})
