import { supabase } from './supabaseClient';
import DOMPurify from 'dompurify';

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

/**
 * Get valid Gmail access token, refreshing if needed
 */
async function getGmailAccessToken(userId) {
  const { data, error } = await supabase
    .from('email_connections')
    .select('access_token, refresh_token, token_expiry')
    .eq('user_id', userId)
    .single();

  if (error || !data?.connected) {
    throw new Error('Gmail not connected');
  }

  if (new Date(data.token_expiry) <= new Date()) {
    const refreshed = await refreshGmailToken(data.refresh_token, userId);
    return refreshed;
  }

  return data.access_token;
}

async function refreshGmailToken(refreshToken, userId) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh Gmail token');

  const data = await res.json();
  const tokenExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await supabase
    .from('email_connections')
    .update({
      access_token: data.access_token,
      token_expiry: tokenExpiry,
    })
    .eq('user_id', userId);

  return data.access_token;
}

/**
 * Extract email header value
 */
function getHeader(headers, name) {
  return headers.find((h) => h.name === name)?.value || '';
}

/**
 * Decode base64url encoded body
 */
function decodeBody(data) {
  if (!data) return '';
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return atob(normalized);
}

/**
 * Extract email body from payload
 */
function extractBody(payload) {
  if (payload.body?.data) {
    return decodeBody(payload.body.data);
  }

  if (payload.parts) {
    const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) {
      return decodeBody(htmlPart.body.data);
    }

    const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      return decodeBody(textPart.body.data);
    }
  }

  return '';
}

/**
 * Fetch inbox emails
 * @param {string} userId - User ID
 * @param {number} maxResults - Max emails to fetch
 * @param {boolean} unreadOnly - Only fetch unread
 * @returns {Promise<Array>} - Email list
 */
export async function fetchEmails(userId, maxResults = 20, unreadOnly = false) {
  const token = await getGmailAccessToken(userId);

  const params = new URLSearchParams({
    maxResults: maxResults.toString(),
    labelIds: 'INBOX',
  });

  if (unreadOnly) {
    params.append('q', 'is:unread');
  }

  const listRes = await fetch(`${GMAIL_BASE}/messages?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) throw new Error('Failed to fetch emails');

  const listData = await listRes.json();
  const messages = listData.messages || [];

  // Fetch details for each message
  const emails = await Promise.all(
    messages.map(async (msg) => {
      const msgRes = await fetch(
        `${GMAIL_BASE}/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];

      return {
        id: msgData.id,
        threadId: msgData.threadId,
        subject: getHeader(headers, 'Subject') || '(No Subject)',
        from: getHeader(headers, 'From'),
        date: getHeader(headers, 'Date'),
        snippet: msgData.snippet || '',
        unread: msgData.labelIds?.includes('UNREAD') || false,
      };
    })
  );

  return emails;
}

/**
 * Fetch full email content
 * @param {string} userId - User ID
 * @param {string} messageId - Message ID
 * @returns {Promise<object>} - Full email
 */
export async function fetchEmailDetail(userId, messageId) {
  const token = await getGmailAccessToken(userId);

  const res = await fetch(`${GMAIL_BASE}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to fetch email');

  const data = await res.json();
  const headers = data.payload?.headers || [];
  const body = extractBody(data.payload);

  return {
    id: data.id,
    threadId: data.threadId,
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    date: getHeader(headers, 'Date'),
    snippet: data.snippet || '',
    body: DOMPurify.sanitize(body),
    labels: data.labelIds || [],
  };
}

/**
 * Send an email reply
 * @param {string} userId - User ID
 * @param {string} to - Recipient
 * @param {string} subject - Subject
 * @param {string} body - Email body
 * @param {string} threadId - Thread ID for replies
 */
export async function sendEmail(userId, to, subject, body, threadId = null) {
  const token = await getGmailAccessToken(userId);

  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payload = { raw: encoded };
  if (threadId) {
    payload.threadId = threadId;
  }

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Failed to send email');

  return res.json();
}

/**
 * Save email as draft
 */
export async function saveDraft(userId, to, subject, body) {
  const token = await getGmailAccessToken(userId);

  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_BASE}/drafts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw: encoded },
    }),
  });

  if (!res.ok) throw new Error('Failed to save draft');

  return res.json();
}

/**
 * Mark email as read
 */
export async function markAsRead(userId, messageId) {
  const token = await getGmailAccessToken(userId);

  await fetch(`${GMAIL_BASE}/messages/${messageId}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      removeLabelIds: ['UNREAD'],
    }),
  });
}
