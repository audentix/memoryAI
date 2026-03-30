import { z } from 'zod';

/**
 * Input validation schemas — validate all user input before DB operations
 * Prevents bad data from reaching Supabase and catches issues at the boundary
 */

export const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  body: z.string().max(1000, 'Description too long').trim().optional().nullable(),
  remind_at: z.string().datetime('Invalid date format'),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  recurrence_rule: z.string().max(500).optional().nullable(),
  friend_email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  source: z.enum(['chat', 'manual', 'image', 'email']).default('manual'),
});

export const listSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  icon: z.string().max(10).default('📝'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color').default('#6366f1'),
});

export const listItemSchema = z.object({
  text: z.string().min(1, 'Item text is required').max(500, 'Item text too long').trim(),
  position: z.number().int().min(0).default(0),
});

export const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
  timezone: z.string().max(50).optional(),
  briefing_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format').optional(),
  briefing_enabled: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long').trim(),
  role: z.enum(['user', 'assistant']),
  attachments: z.array(z.object({
    type: z.enum(['image', 'file']),
    url: z.string().url(),
    name: z.string().optional(),
  })).default([]),
});

export const emailSchema = z.string().email('Invalid email address');

export const searchQuerySchema = z.string().min(1).max(500).trim();

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(dirty) {
  if (typeof dirty !== 'string') return '';
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Truncate text to a max length, adding ellipsis
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

/**
 * Validate and parse with Zod, returning { data, error }
 */
export function safeParse(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) {
    return { data: result.data, error: null };
  }
  return {
    data: null,
    error: result.error.errors.map((e) => e.message).join(', '),
  };
}
