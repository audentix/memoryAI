import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useReminderStore = create((set, get) => ({
  reminders: [],
  filter: 'all', // 'all' | 'today' | 'upcoming' | 'recurring' | 'completed'
  loading: false,

  fetchReminders: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'dismissed')
        .order('remind_at', { ascending: true });

      if (error) throw error;
      set({ reminders: data || [] });
    } catch (err) {
      console.error('Fetch reminders error:', err);
    } finally {
      set({ loading: false });
    }
  },

  getFilteredReminders: () => {
    const { reminders, filter } = get();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        return reminders.filter((r) => {
          const remindAt = new Date(r.remind_at);
          return remindAt >= todayStart && remindAt < todayEnd;
        });
      case 'upcoming':
        return reminders.filter((r) => new Date(r.remind_at) > now && r.status === 'pending');
      case 'recurring':
        return reminders.filter((r) => r.recurrence !== 'none');
      case 'completed':
        return reminders.filter((r) => r.status === 'sent');
      default:
        return reminders;
    }
  },

  createReminder: async (userId, reminder) => {
    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        title: reminder.title,
        body: reminder.body || null,
        remind_at: reminder.remind_at,
        recurrence: reminder.recurrence || 'none',
        recurrence_rule: reminder.recurrence_rule || null,
        friend_email: reminder.friend_email || null,
        source: reminder.source || 'manual',
      })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ reminders: [...state.reminders, data].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)) }));
    return data;
  },

  updateReminder: async (reminderId, updates) => {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === reminderId ? data : r)),
    }));
    return data;
  },

  snoozeReminder: async (reminderId, minutes) => {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    return get().updateReminder(reminderId, {
      status: 'snoozed',
      snooze_until: snoozeUntil,
    });
  },

  markDone: async (reminderId) => {
    return get().updateReminder(reminderId, { status: 'sent' });
  },

  deleteReminder: async (reminderId) => {
    const { error } = await supabase
      .from('reminders')
      .update({ status: 'dismissed' })
      .eq('id', reminderId);

    if (error) throw error;
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== reminderId),
    }));
  },

  setFilter: (filter) => set({ filter }),
}));
