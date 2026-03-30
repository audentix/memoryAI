const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

class GeminiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.data = data;
  }
}

async function geminiRequest(endpoint, body) {
  const url = `${GEMINI_BASE}/${endpoint}?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new GeminiError(
      errorData?.error?.message || `Gemini API error: ${res.status}`,
      res.status,
      errorData
    );
  }

  const data = await res.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new GeminiError('No response generated from Gemini', 204, data);
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Chat / Intent parsing with Gemini 2.0 Flash
 * @param {string} systemPrompt - System instruction
 * @param {string} userMessage - User's message
 * @param {Array} history - Previous conversation messages [{role, content}]
 * @returns {Promise<string>} - Gemini's text response
 */
export async function callGeminiChat(systemPrompt, userMessage, history = []) {
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  return geminiRequest('models/gemini-2.0-flash:generateContent', {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });
}

/**
 * Vision analysis with Gemini 1.5 Flash
 * @param {string} imageBase64 - Base64-encoded image data
 * @param {string} mimeType - Image MIME type
 * @param {string} prompt - Analysis prompt
 * @returns {Promise<string>} - Gemini's analysis
 */
export async function callGeminiVision(imageBase64, mimeType, prompt) {
  return geminiRequest('models/gemini-1.5-flash:generateContent', {
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });
}

/**
 * Generate text embedding using Gemini text-embedding-004
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 768-dimension embedding vector
 */
export async function generateEmbedding(text) {
  const url = `${GEMINI_BASE}/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
    }),
  });

  if (!res.ok) {
    throw new GeminiError(`Embedding error: ${res.status}`, res.status);
  }

  const data = await res.json();

  if (!data.embedding?.values) {
    throw new GeminiError('No embedding returned', 204, data);
  }

  return data.embedding.values;
}

export { GeminiError };
