import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook for Supabase realtime subscriptions
 * @param {string} table - Table to subscribe to
 * @param {string} filter - Row filter (e.g., 'user_id=eq.xxx')
 * @param {function} onInsert - Callback for inserts
 * @param {function} onUpdate - Callback for updates
 * @param {function} onDelete - Callback for deletes
 */
export function useRealtimeSync(table, filter, { onInsert, onUpdate, onDelete }) {
  const channelRef = useRef(null);

  useEffect(() => {
    const channelName = `${table}-${filter}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            onInsert?.(payload.new);
            break;
          case 'UPDATE':
            onUpdate?.(payload.new, payload.old);
            break;
          case 'DELETE':
            onDelete?.(payload.old);
            break;
        }
      }
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
