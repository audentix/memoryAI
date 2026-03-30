const CARD_CONFIGS = {
  reminder: {
    icon: '⏰',
    label: 'Reminder',
    color: 'border-warning/30 bg-warning/5',
    getTitle: (d) => d.title,
    getSubtitle: (d) => (d.remind_at ? new Date(d.remind_at).toLocaleString() : ''),
  },
  list_item: {
    icon: '✅',
    label: 'List Item',
    color: 'border-success/30 bg-success/5',
    getTitle: (d) => d.text || 'Item added',
    getSubtitle: () => 'Added to list',
  },
  calendar_event: {
    icon: '📅',
    label: 'Event',
    color: 'border-primary/30 bg-primary/5',
    getTitle: (d) => d.title || 'Event created',
    getSubtitle: (d) => (d.start ? new Date(d.start).toLocaleString() : ''),
  },
  note: {
    icon: '📝',
    label: 'Note',
    color: 'border-primary/30 bg-primary/5',
    getTitle: () => 'Note saved',
    getSubtitle: (d) => d.content?.slice(0, 50),
  },
};

export default function ActionCard({ type, data }) {
  if (!type || !data) return null;

  const config = CARD_CONFIGS[type];
  if (!config) return null;

  return (
    <div className={`mt-2 p-3 rounded-lg border ${config.color}`}>
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <div>
          <p className="text-sm font-medium text-text">{config.getTitle(data)}</p>
          {config.getSubtitle(data) && (
            <p className="text-xs text-text-muted">{config.getSubtitle(data)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
