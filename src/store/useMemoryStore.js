import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { generateEmbedding } from '../lib/gemini';

export const useMemoryStore = create((set, get) => ({
  files: [],
  searchResults: [],
  loading: false,
  uploading: false,

  fetchFiles: async (userId, filter = 'all') => {
    set({ loading: true });
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter === 'images') query = query.like('mime_type', 'image/%');
      else if (filter === 'pdfs') query = query.eq('mime_type', 'application/pdf');
      else if (filter === 'documents') query = query.in('mime_type', [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
      ]);

      const { data, error } = await query;
      if (error) throw error;
      set({ files: data || [] });
    } catch (err) {
      console.error('Fetch files error:', err);
    } finally {
      set({ loading: false });
    }
  },

  uploadFile: async (userId, file, aiSummary, aiTags = []) => {
    set({ uploading: true });
    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop();
      const path = `files/${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('memories')
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(path);

      // Generate embedding from summary
      let embedding = null;
      try {
        embedding = await generateEmbedding(aiSummary || file.name);
      } catch (e) {
        console.warn('Embedding generation failed:', e);
      }

      // Save to files table
      const { data, error } = await supabase
        .from('files')
        .insert({
          user_id: userId,
          filename: file.name,
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          tags: aiTags,
          ai_summary: aiSummary,
          embedding,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ files: [data, ...state.files] }));
      return data;
    } catch (err) {
      console.error('Upload file error:', err);
      throw err;
    } finally {
      set({ uploading: false });
    }
  },

  deleteFile: async (fileId, storagePath) => {
    // Delete from storage
    if (storagePath) {
      await supabase.storage.from('memories').remove([storagePath]);
    }

    // Delete from table
    const { error } = await supabase.from('files').delete().eq('id', fileId);
    if (error) throw error;

    set((state) => ({
      files: state.files.filter((f) => f.id !== fileId),
    }));
  },

  semanticSearch: async (userId, query) => {
    set({ loading: true });
    try {
      const embedding = await generateEmbedding(query);

      // Search in memories table
      const { data: memoryResults, error: memErr } = await supabase.rpc(
        'match_memories',
        {
          query_embedding: embedding,
          match_user_id: userId,
          match_count: 10,
        }
      );

      if (memErr) throw memErr;

      // Also search files by filename and tags
      const { data: fileResults } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .or(`filename.ilike.%${query}%,tags.cs.{${query}}`)
        .limit(10);

      set({
        searchResults: [
          ...(memoryResults || []).map((r) => ({ ...r, source: 'memory' })),
          ...(fileResults || []).map((f) => ({ ...f, source: 'file' })),
        ],
      });
    } catch (err) {
      console.error('Semantic search error:', err);
      set({ searchResults: [] });
    } finally {
      set({ loading: false });
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),
}));
