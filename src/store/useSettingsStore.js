import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useSettingsStore = create((set, get) => ({
  calendarConnected: false,
  emailConnected: false,
  notificationsEnabled: false,
  memoryCount: 0,

  checkConnections: async (userId) => {
    try {
      // Check calendar connection
      const { data: calData } = await supabase
        .from('calendar_connections')
        .select('connected')
        .eq('user_id', userId)
        .single();

      // Check email connection
      const { data: emailData } = await supabase
        .from('email_connections')
        .select('connected')
        .eq('user_id', userId)
        .single();

      // Check memory count
      const { count } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      set({
        calendarConnected: calData?.connected || false,
        emailConnected: emailData?.connected || false,
        memoryCount: count || 0,
      });
    } catch (err) {
      console.error('Check connections error:', err);
    }
  },

  disconnectCalendar: async (userId) => {
    const { error } = await supabase
      .from('calendar_connections')
      .update({ connected: false, access_token: null, refresh_token: null })
      .eq('user_id', userId);

    if (error) throw error;
    set({ calendarConnected: false });
  },

  disconnectEmail: async (userId) => {
    const { error } = await supabase
      .from('email_connections')
      .update({ connected: false, access_token: null, refresh_token: null })
      .eq('user_id', userId);

    if (error) throw error;
    set({ emailConnected: false });
  },

  clearAllMemories: async (userId) => {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    set({ memoryCount: 0 });
  },

  exportAllData: async (userId) => {
    const tables = ['profiles', 'reminders', 'lists', 'list_items', 'memories', 'chat_messages'];
    const exportData = {};

    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq(table === 'list_items' ? 'list_id' : 'user_id', userId);

      // For list_items, we need to filter by user's lists
      if (table === 'list_items') {
        const { data: userLists } = await supabase
          .from('lists')
          .select('id')
          .eq('user_id', userId);
        const listIds = (userLists || []).map((l) => l.id);
        const { data: items } = await supabase
          .from('list_items')
          .select('*')
          .in('list_id', listIds);
        exportData[table] = items || [];
      } else {
        exportData[table] = data || [];
      }
    }

    return exportData;
  },

  deleteAllData: async (userId) => {
    const tables = ['chat_messages', 'memories', 'files', 'list_items', 'lists', 'reminders', 'daily_briefings', 'friend_reminders'];

    for (const table of tables) {
      if (table === 'list_items') {
        const { data: userLists } = await supabase
          .from('lists')
          .select('id')
          .eq('user_id', userId);
        const listIds = (userLists || []).map((l) => l.id);
        if (listIds.length > 0) {
          await supabase.from('list_items').delete().in('list_id', listIds);
        }
      } else {
        await supabase.from(table).delete().eq('user_id', userId);
      }
    }
  },
}));
