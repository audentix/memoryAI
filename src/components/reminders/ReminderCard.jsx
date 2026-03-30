import { useState } from 'react';
import { Clock, Check, Edit3, Trash2, ChevronDown } from 'lucide-react';
import Badge from '../shared/Badge';

const SNOOZE_OPTIONS = [
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '3 hours', minutes: 180 },
  { label: 'Tomorrow', minutes: 1440 },
];

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (dateOnly.getTime() === today.getTime()) return `Today at ${time}`;
  if (dateOnly.getTime() === tomorrow.getTime()) return `Tomorrow at ${time}`;
  return `${date.toLocaleDateString()} at ${time}`;
}

export default function ReminderCard({ reminder, onEdit, onSnooze, onDone, onDelete }) {
  const [showSnooze, setShowSnooze] = useState(false);

  return (
    <div className="card hover:border-primary/30 transition-colors group">
      <div className="flex items-start gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
            reminder.status === 'sent'
              ? 'bg-success'
              : reminder.status === 'snoozed'
              ? 'bg-primary'
              : 'bg-warning'
          }`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-medium text-sm ${
                reminder.status === 'sent' ? 'line-through text-text-muted' : 'text-text'
              }`}
            >
              {reminder.title}
            </h3>
            {reminder.recurrence !== 'none' && (
              <Badge variant="primary" className="text-[10px]">
                {reminder.recurrence}
              </Badge>
            )}
          </div>

          {reminder.body && (
            <p className="text-xs text-text-muted mb-2 line-clamp-2">{reminder.body}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(reminder.remind_at)}
            </span>
            {reminder.source !== 'manual' && (
              <span className="text-text-muted/60">from {reminder.source}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {reminder.status !== 'sent' && (
            <>
              <button
                onClick={() => onDone(reminder.id)}
                className="p-1.5 rounded-lg hover:bg-success/15 text-text-muted hover:text-success transition-colors"
                title="Mark done"
                aria-label="Mark reminder done"
              >
                <Check size={14} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSnooze(!showSnooze)}
                  className="p-1.5 rounded-lg hover:bg-primary/15 text-text-muted hover:text-primary transition-colors"
                  title="Snooze"
                  aria-label="Snooze reminder"
                >
                  <ChevronDown size={14} />
                </button>
                {showSnooze && (
                  <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                    {SNOOZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.minutes}
                        onClick={() => {
                          onSnooze(reminder.id, opt.minutes);
                          setShowSnooze(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm text-text hover:bg-surface-light transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <button
            onClick={() => onEdit(reminder)}
            className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
            title="Edit"
            aria-label="Edit reminder"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors"
            title="Delete"
            aria-label="Delete reminder"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
