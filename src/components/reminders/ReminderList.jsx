import ReminderCard from './ReminderCard';

export default function ReminderList({ reminders, onEdit, onSnooze, onDone, onDelete }) {
  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      {reminders.map((reminder) => (
        <ReminderCard
          key={reminder.id}
          reminder={reminder}
          onEdit={onEdit}
          onSnooze={onSnooze}
          onDone={onDone}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
