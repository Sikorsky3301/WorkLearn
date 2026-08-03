import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
  format, isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Button } from './button'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/** Minimal single-date month-grid picker (hand-rolled — react-day-picker v10's
 * API is a large surface for a feature that only needs "pick one day"). */
function Calendar({ selected, onSelect, month, onMonthChange, className }) {
  const [internalMonth, setInternalMonth] = useState(month || selected || new Date())
  const viewMonth = month || internalMonth

  function changeMonth(delta) {
    const next = addMonths(viewMonth, delta)
    onMonthChange ? onMonthChange(next) : setInternalMonth(next)
  }

  const gridStart = startOfWeek(startOfMonth(viewMonth))
  const gridEnd = endOfWeek(endOfMonth(viewMonth))
  const days = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  return (
    <div className={cn('w-64', className)}>
      <div className="flex items-center justify-between px-1 pb-2">
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-on-surface">{format(viewMonth, 'MMMM yyyy')}</span>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10px] font-medium text-outline">{w}</span>
        ))}
        {days.map((day) => {
          const outside = !isSameMonth(day, viewMonth)
          const active = selected && isSameDay(day, selected)
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onSelect?.(day)}
              className={cn(
                'mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors',
                outside && 'text-outline/40',
                !outside && !active && 'text-on-surface hover:bg-surface-low',
                isToday(day) && !active && 'font-semibold text-primary',
                active && 'bg-primary text-white font-semibold'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
