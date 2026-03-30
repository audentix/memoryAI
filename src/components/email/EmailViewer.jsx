import { ArrowLeft, RefreshCw, Send, Save, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function EmailViewer({
  email,
  onBack,
  loading,
  replyBody,
  setReplyBody,
  draftPrompt,
  setDraftPrompt,
  onDraftWithAI,
  generatingDraft,
  onSendReply,
  sending,
  onSaveDraft,
  showCompose,
  setShowCompose,
}) {
  if (!email) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-center text-text-muted">
          <p className="text-sm">Select an email to read</p>
        </div>
      </div>
    );
  }

  const extractSenderName = (from) => {
    const match = from?.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : from?.split('@')[0] || 'Unknown';
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 md:hidden">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-surface-light text-text-muted">
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm text-text-muted">Back to inbox</span>
      </div>

      <div className="border-b border-border pb-4 mb-4">
        <h2 className="text-lg font-semibold text-text mb-2">{email.subject}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">{extractSenderName(email.from)}</p>
            <p className="text-xs text-text-muted">{email.from}</p>
          </div>
          <span className="text-xs text-text-muted">{new Date(email.date).toLocaleString()}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw size={24} className="animate-spin text-text-muted" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div
            className="prose prose-invert prose-sm max-w-none text-text"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }}
          />
        </div>
      )}

      <div className="border-t border-border pt-4 mt-4 flex gap-2">
        <button
          onClick={() => setShowCompose(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm"
        >
          <Send size={14} /> Reply
        </button>
        <button
          onClick={() => setShowCompose(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-text hover:bg-surface-light"
        >
          <Sparkles size={14} /> AI Draft
        </button>
      </div>

      {showCompose && (
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              placeholder='Tell AI how to reply (e.g., "say I\'ll confirm by Thursday")'
              className="input-field flex-1 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && onDraftWithAI()}
            />
            <button
              onClick={onDraftWithAI}
              disabled={generatingDraft}
              className="px-3 py-2 bg-primary/15 text-primary rounded-lg text-sm"
            >
              {generatingDraft ? '...' : <Sparkles size={14} />}
            </button>
          </div>

          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write your reply..."
            className="input-field resize-none text-sm"
            rows={6}
          />

          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setShowCompose(false);
                setReplyBody('');
                setDraftPrompt('');
              }}
              className="text-sm text-text-muted hover:text-text"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                onClick={onSaveDraft}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-text hover:bg-surface-light rounded-lg"
              >
                <Save size={14} /> Save Draft
              </button>
              <button
                onClick={onSendReply}
                disabled={!replyBody.trim() || sending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
              >
                <Send size={14} /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
