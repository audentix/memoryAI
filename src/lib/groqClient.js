const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

class GroqError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'GroqError';
    this.status = status;
  }
}

/**
 * Transcribe audio using Groq Whisper Large v3
 * @param {Blob} audioBlob - Audio blob to transcribe
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioBlob) {
  if (!GROQ_API_KEY) {
    throw new GroqError('Groq API key not configured', 401);
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new GroqError(
      errorData?.error?.message || `Groq API error: ${res.status}`,
      res.status
    );
  }

  const data = await res.json();

  if (!data.text) {
    throw new GroqError('No transcription returned', 204);
  }

  return data.text;
}

export { GroqError };
