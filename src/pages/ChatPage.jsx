import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { supabase } from '../lib/supabaseClient';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import EmptyState from '../components/shared/EmptyState';

export default function ChatPage() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { messages, sending, fetchMessages, sendMessage, processImage } = useChatStore();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceInput();

  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (location.state?.message) {
      setInput(location.state.message);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (user) fetchMessages(user.id);
  }, [user?.id]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !previewFile) return;

    setInput('');
    setPreview(null);
    setPreviewFile(null);

    try {
      const attachments = [];

      if (previewFile) {
        const ext = previewFile.name.split('.').pop();
        const path = `chat/${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from('memories').upload(path, previewFile);

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('memories').getPublicUrl(path);
          attachments.push({
            type: previewFile.type.startsWith('image/') ? 'image' : 'file',
            url: urlData.publicUrl,
            name: previewFile.name,
          });

          if (previewFile.type.startsWith('image/')) {
            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(previewFile);
            });
            await processImage(user.id, base64, previewFile.type);
          }
        }
      }

      await sendMessage(user.id, text || 'Analyze this image', attachments);
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) setInput((prev) => prev + (prev ? ' ' : '') + text);
    } else {
      await startRecording();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview({ type: 'image', url: ev.target.result });
      reader.readAsDataURL(file);
    } else {
      setPreview({ type: 'file', name: file.name });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      <ChatWindow />

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onVoiceToggle={handleVoiceToggle}
        onFileSelect={handleFileSelect}
        preview={preview}
        onClearPreview={() => {
          setPreview(null);
          setPreviewFile(null);
        }}
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        sending={sending}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
