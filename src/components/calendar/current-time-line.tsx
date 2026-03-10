import { useState, useEffect } from 'react'

const DAY_START_HOUR = 6
const DAY_END_HOUR = 22

/**
 * Red horizontal line that indicates the current time on the calendar grid.
 * Updates position every 60 seconds.
 * Only renders if the current time falls within the visible hour range.
 */
export function CurrentTimeLine() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const currentHour = now.getHours() + now.getMinutes() / 60
  if (currentHour < DAY_START_HOUR || currentHour >= DAY_END_HOUR) return null

  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60
  const minutesFromStart =
    (now.getHours() - DAY_START_HOUR) * 60 + now.getMinutes()
  const topPercent = (minutesFromStart / totalMinutes) * 100

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${topPercent}%` }}
    >
      <div className="flex items-center">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  )
}
