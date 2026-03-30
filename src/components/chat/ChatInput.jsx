import { useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, X, Loader2 } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSend,
  onVoiceToggle,
  onFileSelect,
  preview,
  onClearPreview,
  isRecording,
  isTranscribing,
  sending,
  fileInputRef,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div>
      {/* File preview */}
      {preview && (
        <div className="mb-3 relative inline-block">
          {preview.type === 'image' ? (
            <img src={preview.url} alt="Preview" className="max-h-32 rounded-lg border border-border" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-light rounded-lg border border-border">
              <Paperclip size={14} className="text-text-muted" />
              <span className="text-sm text-text">{preview.name}</span>
            </div>
          )}
          <button
            onClick={onClearPreview}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center"
            aria-label="Remove file"
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.docx,.csv"
          className="hidden"
          onChange={onFileSelect}
          aria-label="Upload file"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors flex-shrink-0"
          aria-label="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent border-none text-text placeholder-text-muted focus:outline-none resize-none text-sm py-2 max-h-32"
          aria-label="Message input"
        />

        <button
          onClick={onVoiceToggle}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
            isRecording
              ? 'bg-danger/20 text-danger animate-pulse'
              : 'hover:bg-surface-light text-text-muted hover:text-text'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={onSend}
          disabled={(!input.trim() && !preview) || sending}
          className="p-2 rounded-lg bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
