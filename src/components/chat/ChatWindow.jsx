import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import EmptyState from '../shared/EmptyState';
import { Brain } from 'lucide-react';

export default function ChatWindow({ messages, sending }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
      {messages.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="Start a conversation"
          description="Ask me to set reminders, create lists, save notes, or just chat. I'm here to help you remember everything."
        />
      ) : (
        messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} isUser={msg.role === 'user'} />
        ))
      )}

      {sending && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
