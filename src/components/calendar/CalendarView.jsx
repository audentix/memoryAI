import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';

export default function CalendarView({ currentDate, events, selectedDate, onSelectDate, onNavigate }) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const getEventsForDay = (day) => events.filter((e) => isSameDay(e.start, day));

  return (
    <div className="card">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-text-muted py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`relative min-h-[64px] p-1.5 rounded-lg text-left transition-colors ${
                !isCurrentMonth
                  ? 'opacity-30'
                  : isSelected
                  ? 'bg-primary/15 ring-1 ring-primary'
                  : isToday(day)
                  ? 'bg-primary/10'
                  : 'hover:bg-surface-light'
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday(day) ? 'text-primary' : isCurrentMonth ? 'text-text' : 'text-text-muted'
                }`}
              >
                {format(day, 'd')}
              </span>

              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div key={i} className="w-full h-1.5 rounded-full bg-primary/60" title={event.title} />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-text-muted">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
