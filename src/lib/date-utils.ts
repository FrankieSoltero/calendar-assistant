/**
 * Returns the start (Sunday 00:00) and end (Saturday 23:59) of
 * the week containing the given date.
 */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Returns an array of 7 Date objects for each day in the week
 * starting from the given Sunday.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })
}

/** First and last visible hours on the calendar grid. */
const DAY_START_HOUR = 6
const DAY_END_HOUR = 22

/**
 * Returns hour labels for the time axis (e.g., "6 AM", "7 AM", ..., "9 PM").
 */
export function getDayHours(): string[] {
  return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => {
    const hour = DAY_START_HOUR + i
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${display} ${suffix}`
  })
}

/**
 * Formats an ISO string to a short time like "9:00 AM".
 */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Formats a start/end pair into a readable range.
 * e.g., "Mon, Mar 10 · 9:00 AM – 10:00 AM"
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const day = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  return `${day} · ${formatTime(start)} – ${formatTime(end)}`
}

/**
 * Calculates the top offset (%) and height (%) for positioning
 * an event on the time grid. Based on the visible hour range
 * (DAY_START_HOUR to DAY_END_HOUR).
 */
export function getEventPosition(
  eventStart: string,
  eventEnd: string
): { top: number; height: number } {
  const start = new Date(eventStart)
  const end = new Date(eventEnd)

  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60

  const startMinutes =
    (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes()
  const endMinutes =
    (end.getHours() - DAY_START_HOUR) * 60 + end.getMinutes()

  const top = Math.max(0, (startMinutes / totalMinutes) * 100)
  const height = Math.max(
    2, // minimum 2% height so short events are visible
    ((endMinutes - startMinutes) / totalMinutes) * 100
  )

  return { top, height }
}

/**
 * Checks if two dates fall on the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Formats a date range for the calendar nav header.
 * e.g., "Mar 10 – 16, 2026"
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`
}
