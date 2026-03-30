import { RefreshCw } from 'lucide-react';
import { SkeletonList } from '../shared/Skeleton';

function formatEmailDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function extractSenderName(from) {
  const match = from?.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from?.split('@')[0] || 'Unknown';
}

export default function EmailList({ emails, selectedId, onSelect, onRefresh, loading }) {
  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text">Inbox</h2>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
          aria-label="Refresh inbox"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {loading ? (
          <SkeletonList count={10} />
        ) : emails.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">No emails</p>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelect(email)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedId === email.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-light'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm truncate ${email.unread ? 'font-semibold text-text' : 'text-text-muted'}`}
                >
                  {extractSenderName(email.from)}
                </span>
                <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                  {formatEmailDate(email.date)}
                </span>
              </div>
              <p className={`text-sm truncate ${email.unread ? 'font-medium text-text' : 'text-text-muted'}`}>
                {email.subject}
              </p>
              <p className="text-xs text-text-muted truncate mt-0.5">{email.snippet}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
