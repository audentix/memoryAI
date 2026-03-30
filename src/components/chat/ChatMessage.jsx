import { Brain, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ActionCard from './ActionCard';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatMessage({ message, isUser }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain size={16} className="text-primary" />
        </div>
      )}

      <div className={`max-w-[80%] md:max-w-[70%] group ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface border border-border text-text rounded-bl-md'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && message.intent && message.action_card && (
          <ActionCard type={message.action_card.type} data={message.action_card.data} />
        )}

        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-text-muted">{formatTime(message.created_at)}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text transition-opacity"
              aria-label="Copy message"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
