import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useListStore = create((set, get) => ({
  lists: [],
  activeList: null,
  items: [],
  loading: false,

  fetchLists: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*, list_items(count)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const listsWithCounts = (data || []).map((list) => ({
        ...list,
        itemCount: list.list_items?.[0]?.count || 0,
      }));

      set({ lists: listsWithCounts });
    } catch (err) {
      console.error('Fetch lists error:', err);
    } finally {
      set({ loading: false });
    }
  },

  fetchListItems: async (listId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true });

      if (error) throw error;
      set({ items: data || [], activeList: listId });
    } catch (err) {
      console.error('Fetch list items error:', err);
    } finally {
      set({ loading: false });
    }
  },

  createList: async (userId, name, icon = '📝', color = '#6366f1') => {
    const { data, error } = await supabase
      .from('lists')
      .insert({ user_id: userId, name, icon, color })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({ lists: [{ ...data, itemCount: 0 }, ...state.lists] }));
    return data;
  },

  updateList: async (listId, updates) => {
    const { data, error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      lists: state.lists.map((l) => (l.id === listId ? { ...l, ...data } : l)),
    }));
    return data;
  },

  deleteList: async (listId) => {
    const { error } = await supabase.from('lists').delete().eq('id', listId);
    if (error) throw error;
    set((state) => ({
      lists: state.lists.filter((l) => l.id !== listId),
      activeList: state.activeList === listId ? null : state.activeList,
      items: state.activeList === listId ? [] : state.items,
    }));
  },

  addItem: async (listId, text) => {
    const { items } = get();
    const nextPos = items.length > 0 ? Math.max(...items.map((i) => i.position)) + 1 : 0;

    const { data, error } = await supabase
      .from('list_items')
      .insert({ list_id: listId, text, position: nextPos })
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      items: [...state.items, data],
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, itemCount: (l.itemCount || 0) + 1 } : l
      ),
    }));
    return data;
  },

  toggleItem: async (itemId) => {
    const { items } = get();
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const { data, error } = await supabase
      .from('list_items')
      .update({ done: !item.done })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? data : i)),
    }));
  },

  updateItemText: async (itemId, text) => {
    const { data, error } = await supabase
      .from('list_items')
      .update({ text })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? data : i)),
    }));
  },

  deleteItem: async (itemId, listId) => {
    const { error } = await supabase.from('list_items').delete().eq('id', itemId);
    if (error) throw error;
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, itemCount: Math.max(0, (l.itemCount || 0) - 1) } : l
      ),
    }));
  },

  reorderItems: async (listId, orderedItems) => {
    set({ items: orderedItems });

    const updates = orderedItems.map((item, index) =>
      supabase.from('list_items').update({ position: index }).eq('id', item.id)
    );

    await Promise.all(updates);
  },

  clearCompleted: async (listId) => {
    const { items } = get();
    const completedIds = items.filter((i) => i.done).map((i) => i.id);

    if (completedIds.length === 0) return;

    await supabase.from('list_items').delete().in('id', completedIds);

    set((state) => ({
      items: state.items.filter((i) => !i.done),
      lists: state.lists.map((l) =>
        l.id === listId ? { ...l, itemCount: Math.max(0, (l.itemCount || 0) - completedIds.length) } : l
      ),
    }));
  },
}));
