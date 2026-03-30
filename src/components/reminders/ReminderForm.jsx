import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function ReminderForm({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    remind_at: '',
    recurrence: 'none',
    friend_email: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        body: initialData.body || '',
        remind_at: initialData.remind_at?.slice(0, 16) || '',
        recurrence: initialData.recurrence || 'none',
        friend_email: initialData.friend_email || '',
      });
    } else {
      setFormData({ title: '', body: '', remind_at: '', recurrence: 'none', friend_email: '' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Reminder' : 'New Reminder'}>
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
          <label className="block text-sm font-medium text-text mb-1.5">Remind a friend? (optional)</label>
          <input
            type="email"
            value={formData.friend_email}
            onChange={(e) => setFormData({ ...formData, friend_email: e.target.value })}
            placeholder="friend@example.com"
            className="input-field"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">{initialData ? 'Save Changes' : 'Create Reminder'}</Button>
        </div>
      </form>
    </Modal>
  );
}
