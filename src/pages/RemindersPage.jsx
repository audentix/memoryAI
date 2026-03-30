import { useEffect, useState } from 'react';
import { Plus, Bell, Clock, CalendarDays, Check, Trash2, Edit3, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useReminderStore } from '../store/useReminderStore';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import EmptyState from '../components/shared/EmptyState';
import { SkeletonList } from '../components/shared/Skeleton';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'completed', label: 'Completed' },
];

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

function ReminderCard({ reminder, onEdit, onSnooze, onDone, onDelete }) {
  const [showSnooze, setShowSnooze] = useState(false);

  const statusColors = {
    pending: 'warning',
    snoozed: 'primary',
    sent: 'success',
  };

  return (
    <div className="card hover:border-primary/30 transition-colors group">
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
          reminder.status === 'sent' ? 'bg-success' :
          reminder.status === 'snoozed' ? 'bg-primary' : 'bg-warning'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium text-sm ${reminder.status === 'sent' ? 'line-through text-text-muted' : 'text-text'}`}>
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

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {reminder.status !== 'sent' && (
            <>
              <button
                onClick={() => onDone(reminder.id)}
                className="p-1.5 rounded-lg hover:bg-success/15 text-text-muted hover:text-success transition-colors"
                title="Mark done"
              >
                <Check size={14} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSnooze(!showSnooze)}
                  className="p-1.5 rounded-lg hover:bg-primary/15 text-text-muted hover:text-primary transition-colors"
                  title="Snooze"
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
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const user = useAuthStore((s) => s.user);
  const {
    reminders,
    loading,
    filter,
    fetchReminders,
    getFilteredReminders,
    createReminder,
    updateReminder,
    snoozeReminder,
    markDone,
    deleteReminder,
    setFilter,
  } = useReminderStore();

  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    remind_at: '',
    recurrence: 'none',
    friend_email: '',
  });

  useEffect(() => {
    if (user) fetchReminders(user.id);
  }, [user?.id]);

  const filteredReminders = getFilteredReminders();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await updateReminder(editingReminder.id, formData);
      } else {
        await createReminder(user.id, formData);
      }
      resetForm();
    } catch (err) {
      console.error('Save reminder error:', err);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      body: reminder.body || '',
      remind_at: reminder.remind_at.slice(0, 16),
      recurrence: reminder.recurrence,
      friend_email: reminder.friend_email || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingReminder(null);
    setFormData({
      title: '',
      body: '',
      remind_at: '',
      recurrence: 'none',
      friend_email: '',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Reminders</h1>
          <p className="text-sm text-text-muted mt-1">
            {filteredReminders.length} reminder{filteredReminders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Reminder
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:bg-surface-light hover:text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredReminders.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No reminders"
          description="Create a reminder or ask me in chat — 'Remind me to call mom tomorrow at 6pm'"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus size={14} /> Create Reminder
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleEdit}
              onSnooze={snoozeReminder}
              onDone={markDone}
              onDelete={(id) => setDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={resetForm}
        title={editingReminder ? 'Edit Reminder' : 'New Reminder'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What do you need to remember?"
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description (optional)</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Add details..."
              className="input-field resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Date & Time</label>
              <input
                type="datetime-local"
                value={formData.remind_at}
                onChange={(e) => setFormData({ ...formData, remind_at: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Repeat</label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                className="input-field"
              >
                <option value="none">Don't repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Remind a friend? (optional)
            </label>
            <input
              type="email"
              value={formData.friend_email}
              onChange={(e) => setFormData({ ...formData, friend_email: e.target.value })}
              placeholder="friend@example.com"
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={resetForm} type="button">
              Cancel
            </Button>
            <Button type="submit">
              {editingReminder ? 'Save Changes' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          deleteReminder(deleteConfirm);
          setDeleteConfirm(null);
        }}
        title="Delete Reminder"
        message="This reminder will be dismissed. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
