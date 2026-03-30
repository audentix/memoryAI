import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  isSubscribed,
} from '../lib/webPush';

/**
 * Hook for managing push notifications
 */
export function useNotifications(userId) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPushSupported()) {
      isSubscribed().then(setSubscribed);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        await subscribeToPush(userId);
        setSubscribed(true);
      }
    } catch (err) {
      console.error('Subscribe error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    supported: isPushSupported(),
    permission,
    subscribed,
    loading,
    subscribe,
  };
}
