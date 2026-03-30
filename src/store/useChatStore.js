import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { callGeminiChat, callGeminiVision, generateEmbedding } from '../lib/gemini';
import { searchMemories, saveMemory } from '../lib/vectorSearch';

const SYSTEM_PROMPT_TEMPLATE = `You are MemorAI, a personal memory and productivity assistant.
Your job is to understand what the user wants and return a JSON response.

User's timezone: {{timezone}}
Current date/time: {{current_datetime}}

User's relevant memory context:
{{retrieved_memories}}

Recent conversation:
{{last_messages}}

Analyze the user's message and return ONLY valid JSON in this format:
{
  "intent": "set_reminder | create_list | add_to_list | remove_from_list | complete_list_item | get_reminders | get_lists | create_calendar_event | get_calendar | query_memory | save_note | draft_email | get_briefing | friend_reminder | delete_reminder | snooze_reminder | general_chat",
  "entities": {
    "title": "...",
    "datetime": "ISO 8601 string or null",
    "recurrence": "none | daily | weekly | monthly",
    "list_name": "...",
    "item_text": "...",
    "friend_email": "...",
    "duration_minutes": 60,
    "snooze_minutes": 30
  },
  "reply": "Natural language confirmation or response to show the user",
  "action_card": {
    "type": "reminder | list_item | calendar_event | note | null",
    "data": {}
  }
}

Be helpful, concise, and friendly. If the user's intent is ambiguous, ask for clarification via general_chat.`;

export const useChatStore = create((set, get) => ({
  messages: [],
  loading: false,
  sending: false,

  fetchMessages: async (userId) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Fetch messages error:', error);
      return;
    }

    set({ messages: data || [] });
  },

  sendMessage: async (userId, content, attachments = []) => {
    set({ sending: true });

    try {
      // Save user message
      const { data: userMsg, error: userErr } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          role: 'user',
          content,
          attachments,
        })
        .select()
        .single();

      if (userErr) throw userErr;

      set((state) => ({ messages: [...state.messages, userMsg] }));

      // Get user profile for timezone
      const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('user_id', userId)
        .single();

      const timezone = profile?.timezone || 'UTC';

      // Retrieve relevant memories
      const memories = await searchMemories(content, userId, 5);
      const memoryContext = memories.length > 0
        ? memories.map((m) => `- ${m.content} (${m.type}, similarity: ${m.similarity?.toFixed(2)})`).join('\n')
        : 'No relevant memories found.';

      // Get recent messages for context
      const recentMessages = get().messages.slice(-10);
      const historyContext = recentMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      // Build system prompt
      const systemPrompt = SYSTEM_PROMPT_TEMPLATE
        .replace('{{timezone}}', timezone)
        .replace('{{current_datetime}}', new Date().toISOString())
        .replace('{{retrieved_memories}}', memoryContext)
        .replace('{{last_messages}}', historyContext);

      // Call Gemini
      const aiResponse = await callGeminiChat(systemPrompt, content, recentMessages);

      // Parse JSON response
      let parsed;
      try {
        // Extract JSON from possible markdown code blocks
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiResponse];
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch {
        // If parsing fails, treat as general chat
        parsed = {
          intent: 'general_chat',
          reply: aiResponse,
          entities: {},
          action_card: null,
        };
      }

      // Execute actions based on intent
      const actionResult = await get().executeAction(userId, parsed);

      // Build assistant reply content
      let replyContent = parsed.reply || 'Done!';

      // Save assistant message
      const { data: aiMsg, error: aiErr } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          role: 'assistant',
          content: replyContent,
          intent: parsed.intent,
        })
        .select()
        .single();

      if (aiErr) throw aiErr;

      set((state) => ({ messages: [...state.messages, aiMsg] }));

      // Save user message embedding for long-term memory
      await saveMemory(userId, content, 'general', 'chat');

      return { reply: replyContent, intent: parsed.intent, actionCard: parsed.action_card, actionResult };
    } catch (err) {
      console.error('Send message error:', err);
      throw err;
    } finally {
      set({ sending: false });
    }
  },

  executeAction: async (userId, parsed) => {
    const { intent, entities } = parsed;

    try {
      switch (intent) {
        case 'set_reminder': {
          if (!entities.title || !entities.datetime) return null;
          const { data, error } = await supabase
            .from('reminders')
            .insert({
              user_id: userId,
              title: entities.title,
              remind_at: entities.datetime,
              recurrence: entities.recurrence || 'none',
              source: 'chat',
            })
            .select()
            .single();
          if (error) throw error;

          await saveMemory(userId, `Reminder: ${entities.title} at ${entities.datetime}`, 'reminder', 'chat');
          return { type: 'reminder', data };
        }

        case 'create_list': {
          if (!entities.list_name) return null;
          const { data, error } = await supabase
            .from('lists')
            .insert({
              user_id: userId,
              name: entities.list_name,
            })
            .select()
            .single();
          if (error) throw error;
          return { type: 'list', data };
        }

        case 'add_to_list': {
          if (!entities.list_name || !entities.item_text) return null;
          // Find or create list
          let { data: list } = await supabase
            .from('lists')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', entities.list_name)
            .single();

          if (!list) {
            const { data: newList } = await supabase
              .from('lists')
              .insert({ user_id: userId, name: entities.list_name })
              .select()
              .single();
            list = newList;
          }

          // Get current max position
          const { data: existingItems } = await supabase
            .from('list_items')
            .select('position')
            .eq('list_id', list.id)
            .order('position', { ascending: false })
            .limit(1);

          const nextPos = (existingItems?.[0]?.position ?? -1) + 1;

          const { data, error } = await supabase
            .from('list_items')
            .insert({
              list_id: list.id,
              text: entities.item_text,
              position: nextPos,
            })
            .select()
            .single();
          if (error) throw error;
          return { type: 'list_item', data };
        }

        case 'complete_list_item': {
          if (!entities.list_name || !entities.item_text) return null;
          const { data: list } = await supabase
            .from('lists')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', entities.list_name)
            .single();
          if (!list) return null;

          const { data, error } = await supabase
            .from('list_items')
            .update({ done: true })
            .eq('list_id', list.id)
            .ilike('text', `%${entities.item_text}%`)
            .select()
            .single();
          if (error) throw error;
          return { type: 'list_item', data };
        }

        case 'save_note': {
          if (!entities.title) return null;
          await saveMemory(userId, entities.title, 'note', 'chat');
          return { type: 'note', data: { content: entities.title } };
        }

        case 'delete_reminder': {
          if (!entities.title) return null;
          const { data, error } = await supabase
            .from('reminders')
            .update({ status: 'dismissed' })
            .eq('user_id', userId)
            .ilike('title', `%${entities.title}%`)
            .select()
            .single();
          if (error) throw error;
          return { type: 'reminder_deleted', data };
        }

        case 'snooze_reminder': {
          if (!entities.title) return null;
          const snoozeMinutes = entities.snooze_minutes || 30;
          const snoozeUntil = new Date(Date.now() + snoozeMinutes * 60 * 1000).toISOString();
          const { data, error } = await supabase
            .from('reminders')
            .update({ status: 'snoozed', snooze_until: snoozeUntil })
            .eq('user_id', userId)
            .ilike('title', `%${entities.title}%`)
            .select()
            .single();
          if (error) throw error;
          return { type: 'reminder_snoozed', data };
        }

        default:
          return null;
      }
    } catch (err) {
      console.error('Action execution error:', err);
      return null;
    }
  },

  processImage: async (userId, imageBase64, mimeType) => {
    const prompt = `Analyze this image and extract:
1. Any tasks, todos, or action items
2. Any dates, times, or deadlines
3. Any events or appointments
4. Any lists or items
5. A short summary of the image

Return ONLY valid JSON: { "tasks": [], "events": [], "lists": [], "summary": "..." }`;

    try {
      const response = await callGeminiVision(imageBase64, mimeType, prompt);
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
      return JSON.parse(jsonMatch[1].trim());
    } catch (err) {
      console.error('Image processing error:', err);
      return { tasks: [], events: [], lists: [], summary: 'Could not analyze image.' };
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
