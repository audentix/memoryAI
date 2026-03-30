import { useEffect, useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';

export default function CalendarPage() {
  const user = useAuthStore((s) => s.user);
  const { calendarConnected } = useSettingsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'

  useEffect(() => {
    if (user && calendarConnected) {
      loadEvents();
    }
  }, [user?.id, calendarConnected, currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { getCalendarEvents } = await import('../lib/googleCalendar');
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const data = await getCalendarEvents(user.id, start, end);
      setEvents(data);
    } catch (err) {
      console.error('Load calendar events error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const getEventsForDay = (day) => {
    return events.filter((e) => isSameDay(e.start, day));
  };

  const selectedDateEvents = selectedDate
    ? getEventsForDay(selectedDate)
    : [];

  if (!calendarConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={CalendarIcon}
          title="No calendar connected"
          description="Connect Google Calendar to see your events and create new ones from chat."
          action={
            <Button onClick={() => (window.location.href = '/settings')}>
              Connect Google Calendar
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Calendar</h1>
          <p className="text-sm text-text-muted mt-1">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-light rounded-lg p-0.5">
            {['month', 'week'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="md:col-span-2">
          <div className="card">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-semibold text-text">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-text-muted py-2"
                >
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
                    onClick={() => setSelectedDate(day)}
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
                        isToday(day)
                          ? 'text-primary'
                          : isCurrentMonth
                          ? 'text-text'
                          : 'text-text-muted'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className="w-full h-1.5 rounded-full bg-primary/60"
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-text-muted">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - selected day events */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-text mb-3">
              {selectedDate
                ? format(selectedDate, 'EEEE, MMM d')
                : 'Select a day'}
            </h3>

            {!selectedDate ? (
              <p className="text-sm text-text-muted">
                Click on a day to see events
              </p>
            ) : selectedDateEvents.length === 0 ? (
              <p className="text-sm text-text-muted">No events on this day</p>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors cursor-pointer"
                    onClick={() => {
                      if (event.htmlLink) window.open(event.htmlLink, '_blank');
                    }}
                  >
                    <h4 className="text-sm font-medium text-text mb-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Clock size={12} />
                      {event.allDay
                        ? 'All day'
                        : `${format(event.start, 'h:mm a')} - ${format(
                            event.end,
                            'h:mm a'
                          )}`}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                        <MapPin size={12} />
                        {event.location}
                      </div>
                    )}
                    {event.description && (
                      <p className="text-xs text-text-muted mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming this week */}
          <div className="card">
            <h3 className="font-semibold text-text mb-3">This Week</h3>
            {events
              .filter((e) => {
                const now = new Date();
                const weekEnd = addDays(now, 7);
                return e.start >= now && e.start <= weekEnd;
              })
              .slice(0, 5)
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-2 py-2 border-b border-border last:border-0"
                >
                  <div className="w-1 h-full min-h-[32px] bg-primary rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text truncate">{event.title}</p>
                    <p className="text-xs text-text-muted">
                      {format(event.start, 'EEE, MMM d · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            {events.filter((e) => {
              const now = new Date();
              return e.start >= now && e.start <= addDays(now, 7);
            }).length === 0 && (
              <p className="text-sm text-text-muted">No events this week</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
