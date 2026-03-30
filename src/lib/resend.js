const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

/**
 * Send an email via Resend API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @returns {Promise<object>} - Resend response
 */
export async function sendResendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    throw new Error('Resend API key not configured');
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'MemorAI <noreply@memorai.app>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send email');
  }

  return res.json();
}

/**
 * Send a friend reminder email
 * @param {string} recipientEmail - Friend's email
 * @param {string} senderName - User's name
 * @param {string} message - Reminder message
 */
export async function sendFriendReminderEmail(recipientEmail, senderName, message) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: system-ui, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 40px; }
        .card { background: #1e1e2e; border-radius: 12px; padding: 32px; max-width: 480px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 24px; }
        .emoji { font-size: 48px; }
        .message { background: #2a2a3e; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .cta { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="emoji">⏰</div>
          <h2>Reminder from ${senderName}</h2>
        </div>
        <div class="message">
          <p>${message}</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 14px;">
          Sent via <a href="${APP_URL}" style="color: #6366f1;">MemorAI</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return sendResendEmail(recipientEmail, `Reminder from ${senderName}`, html);
}
