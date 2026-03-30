import { supabase } from './supabaseClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Request notification permission
 * @returns {Promise<string>} - Permission state
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Subscribe to push notifications and save to Supabase
 * @param {string} userId - User ID
 * @returns {Promise<PushSubscription>}
 */
export async function subscribeToPush(userId) {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key not configured');
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // Save subscription to Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ push_subscription: subscription.toJSON() })
    .eq('user_id', userId);

  if (error) throw error;

  return subscription;
}

/**
 * Unsubscribe from push notifications
 * @param {string} userId - User ID
 */
export async function unsubscribeFromPush(userId) {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }

  await supabase
    .from('profiles')
    .update({ push_subscription: null })
    .eq('user_id', userId);
}

/**
 * Check current push subscription status
 * @returns {Promise<boolean>}
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
