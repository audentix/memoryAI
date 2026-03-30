import { supabase } from './supabaseClient';
import { generateEmbedding } from './gemini';

/**
 * Search memories using semantic vector search
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Matching memories with similarity scores
 */
export async function searchMemories(query, userId, limit = 5) {
  try {
    const embedding = await generateEmbedding(query);
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: limit,
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Vector search error:', err);
    return [];
  }
}

/**
 * Save a memory with embedding
 * @param {string} userId - User ID
 * @param {string} content - Memory content
 * @param {string} type - Memory type
 * @param {string} source - Source of the memory
 * @param {object} metadata - Additional metadata
 */
export async function saveMemory(userId, content, type = 'general', source = 'chat', metadata = {}) {
  try {
    const embedding = await generateEmbedding(content);
    const { error } = await supabase.from('memories').insert({
      user_id: userId,
      content,
      type,
      embedding,
      source,
      metadata,
    });

    if (error) throw error;
  } catch (err) {
    console.error('Save memory error:', err);
  }
}
