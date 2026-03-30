import { supabase } from './supabaseClient';

const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Get a valid access token for the user, refreshing if needed
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Access token
 */
async function getAccessToken(userId) {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .single();

  if (error || !data?.connected) {
    throw new Error('Google Calendar not connected');
  }

  // Check if token needs refresh
  if (new Date(data.token_expiry) <= new Date()) {
    const refreshed = await refreshAccessToken(data.refresh_token, userId);
    return refreshed;
  }

  return data.access_token;
}

/**
 * Refresh an expired Google OAuth token
 */
async function refreshAccessToken(refreshToken, userId) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh token');

  const data = await res.json();
  const tokenExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await supabase
    .from('calendar_connections')
    .update({
      access_token: data.access_token,
      token_expiry: tokenExpiry,
    })
    .eq('user_id', userId);

  return data.access_token;
}

/**
 * Fetch calendar events for a date range
 * @param {string} userId - User ID
 * @param {Date} timeMin - Start date
 * @param {Date} timeMax - End date
 * @returns {Promise<Array>} - Calendar events
 */
export async function getCalendarEvents(userId, timeMin, timeMax) {
  const token = await getAccessToken(userId);

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/primary/events?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) throw new Error('Failed to fetch calendar events');

  const data = await res.json();
  return (data.items || []).map((event) => ({
    id: event.id,
    title: event.summary || 'Untitled Event',
    description: event.description || '',
    location: event.location || '',
    start: new Date(event.start.dateTime || event.start.date),
    end: new Date(event.end.dateTime || event.end.date),
    allDay: !event.start.dateTime,
    htmlLink: event.htmlLink,
  }));
}

/**
 * Create a calendar event
 * @param {string} userId - User ID
 * @param {object} event - Event details
 * @returns {Promise<object>} - Created event
 */
export async function createCalendarEvent(userId, event) {
  const token = await getAccessToken(userId);

  const body = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.start.toISOString(),
    },
    end: {
      dateTime: event.end.toISOString(),
    },
  };

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error('Failed to create calendar event');

  return res.json();
}

/**
 * Delete a calendar event
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 */
export async function deleteCalendarEvent(userId, eventId) {
  const token = await getAccessToken(userId);

  await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
