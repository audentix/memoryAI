import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Mic, MicOff, Image, Paperclip, X, Loader2, Brain, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { useVoiceInput } from '../hooks/useVoiceInput';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActionCard({ type, data }) {
  if (!type || !data) return null;

  const configs = {
    reminder: {
      icon: '⏰',
      title: data.title,
      subtitle: data.remind_at
        ? new Date(data.remind_at).toLocaleString()
        : '',
      color: 'border-warning/30 bg-warning/5',
    },
    list_item: {
      icon: '✅',
      title: data.text || 'Item added',
      subtitle: 'Added to list',
      color: 'border-success/30 bg-success/5',
    },
    calendar_event: {
      icon: '📅',
      title: data.title || 'Event created',
      subtitle: data.start ? new Date(data.start).toLocaleString() : '',
      color: 'border-primary/30 bg-primary/5',
    },
    note: {
      icon: '📝',
      title: 'Note saved',
      subtitle: data.content?.slice(0, 50),
      color: 'border-primary/30 bg-primary/5',
    },
  };

  const config = configs[type];
  if (!config) return null;

  return (
    <div className={`mt-2 p-3 rounded-lg border ${config.color}`}>
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <div>
          <p className="text-sm font-medium text-text">{config.title}</p>
          {config.subtitle && (
            <p className="text-xs text-text-muted">{config.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message, isUser }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain size={16} className="text-primary" />
        </div>
      )}

      {/* Message */}
      <div
        className={`max-w-[80%] md:max-w-[70%] group ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface border border-border text-text rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Action card */}
        {!isUser && message.intent && (
          <ActionCard
            type={message.intent?.replace('set_', '').replace('create_', '')}
            data={message.metadata}
          />
        )}

        {/* Footer */}
        <div
          className={`flex items-center gap-2 mt-1 ${
            isUser ? 'justify-end' : ''
          }`}
        >
          <span className="text-[10px] text-text-muted">
            {formatTime(message.created_at)}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text transition-opacity"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { messages, sending, fetchMessages, sendMessage, processImage } =
    useChatStore();
  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } =
    useVoiceInput();

  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle pre-filled message from dashboard
  useEffect(() => {
    if (location.state?.message) {
      setInput(location.state.message);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Fetch messages on mount
  useEffect(() => {
    if (user) fetchMessages(user.id);
  }, [user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !previewFile) return;

    setInput('');
    setPreview(null);
    setPreviewFile(null);

    try {
      const attachments = [];

      if (previewFile) {
        // Upload image to Supabase Storage
        const ext = previewFile.name.split('.').pop();
        const path = `chat/${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('memories')
          .upload(path, previewFile);

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('memories')
            .getPublicUrl(path);

          attachments.push({
            type: previewFile.type.startsWith('image/') ? 'image' : 'file',
            url: urlData.publicUrl,
            name: previewFile.name,
          });

          // Process image with Gemini Vision
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
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(file.name);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
        {messages.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="Start a conversation"
            description="Ask me to set reminders, create lists, save notes, or just chat. I'm here to help you remember everything."
          />
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isUser={msg.role === 'user'}
            />
          ))
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="text-primary" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File preview */}
      {preview && (
        <div className="mb-3 relative inline-block">
          {preview.startsWith('data:') ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-32 rounded-lg border border-border"
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-light rounded-lg border border-border">
              <Paperclip size={14} className="text-text-muted" />
              <span className="text-sm text-text">{preview}</span>
            </div>
          )}
          <button
            onClick={() => {
              setPreview(null);
              setPreviewFile(null);
            }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <div className="mb-3 flex items-center gap-2 text-sm text-text-muted">
          <Loader2 size={14} className="animate-spin" />
          Transcribing...
        </div>
      )}

      {/* Input bar */}
      <div className="bg-surface border border-border rounded-2xl p-2 flex items-end gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.docx,.csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors flex-shrink-0"
        >
          <Paperclip size={18} />
        </button>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent border-none text-text placeholder-text-muted focus:outline-none resize-none text-sm py-2 max-h-32"
        />

        {/* Voice button */}
        <button
          onClick={handleVoiceToggle}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            isRecording
              ? 'bg-danger/20 text-danger animate-pulse'
              : 'hover:bg-surface-light text-text-muted hover:text-text'
          }`}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !previewFile) || sending}
          className="p-2 rounded-lg bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
