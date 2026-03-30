import { useEffect, useState } from 'react';
import { Mail, RefreshCw, Send, Save, Sparkles, ArrowLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { fetchEmails, fetchEmailDetail, sendEmail, saveDraft, markAsRead } from '../lib/gmailClient';
import { callGeminiChat } from '../lib/gemini';
import Button from '../components/shared/Button';
import Badge from '../components/shared/Badge';
import EmptyState from '../components/shared/EmptyState';
import { SkeletonList } from '../components/shared/Skeleton';

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

export default function EmailPage() {
  const user = useAuthStore((s) => s.user);
  const { emailConnected } = useSettingsStore();

  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user && emailConnected) loadEmails();
  }, [user?.id, emailConnected]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await fetchEmails(user.id, 20);
      setEmails(data);
    } catch (err) {
      console.error('Load emails error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = async (email) => {
    setLoadingDetail(true);
    try {
      const detail = await fetchEmailDetail(user.id, email.id);
      setSelectedEmail(detail);
      if (email.unread) {
        await markAsRead(user.id, email.id);
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, unread: false } : e))
        );
      }
    } catch (err) {
      console.error('Load email detail error:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDraftWithAI = async () => {
    if (!draftPrompt.trim() || !selectedEmail) return;
    setGeneratingDraft(true);

    try {
      const prompt = `You are an email assistant. Based on this email:
Subject: ${selectedEmail.subject}
From: ${selectedEmail.from}
Content: ${selectedEmail.snippet}

The user wants to reply: "${draftPrompt}"

Write a professional email reply. Return ONLY the email body text, no subject line.`;

      const draft = await callGeminiChat('You are a professional email writing assistant.', prompt);
      setAiDraft(draft);
      setReplyBody(draft);
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);

    try {
      const to = selectedEmail.from?.match(/<(.+?)>/)?.[1] || selectedEmail.from;
      const subject = selectedEmail.subject.startsWith('Re:')
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`;

      await sendEmail(user.id, to, subject, replyBody, selectedEmail.threadId);
      setShowCompose(false);
      setReplyBody('');
      setAiDraft('');
      setDraftPrompt('');
    } catch (err) {
      console.error('Send reply error:', err);
    } finally {
      setSending(false);
    }
  };

  if (!emailConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={Mail}
          title="Gmail not connected"
          description="Connect your Gmail account to manage emails with AI assistance."
          action={
            <Button onClick={() => (window.location.href = '/settings')}>
              Connect Gmail
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        {/* Email list */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 ${selectedEmail ? 'hidden md:block' : ''}`}>
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text">Inbox</h2>
              <button
                onClick={loadEmails}
                className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
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
                    onClick={() => handleSelectEmail(email)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-surface-light'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm truncate ${email.unread ? 'font-semibold text-text' : 'text-text-muted'}`}>
                        {extractSenderName(email.from)}
                      </span>
                      <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">
                        {formatEmailDate(email.date)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${email.unread ? 'font-medium text-text' : 'text-text-muted'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {email.snippet}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Email detail */}
        <div className={`flex-1 ${!selectedEmail ? 'hidden md:flex' : ''}`}>
          {!selectedEmail ? (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center text-text-muted">
                <Mail size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select an email to read</p>
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4 md:hidden">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 rounded-lg hover:bg-surface-light text-text-muted"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-sm text-text-muted">Back to inbox</span>
              </div>

              <div className="border-b border-border pb-4 mb-4">
                <h2 className="text-lg font-semibold text-text mb-2">
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">
                      {extractSenderName(selectedEmail.from)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {selectedEmail.from}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(selectedEmail.date).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Body */}
              {loadingDetail ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw size={24} className="animate-spin text-text-muted" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <div
                    className="prose prose-invert prose-sm max-w-none text-text"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedEmail.body),
                    }}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-border pt-4 mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    setReplyTo(selectedEmail.from);
                    setReplySubject(
                      selectedEmail.subject.startsWith('Re:')
                        ? selectedEmail.subject
                        : `Re: ${selectedEmail.subject}`
                    );
                    setShowCompose(true);
                  }}
                >
                  <Send size={14} /> Reply
                </Button>
                <Button variant="ghost" onClick={() => setShowCompose(true)}>
                  <Sparkles size={14} /> AI Draft
                </Button>
              </div>

              {/* Compose / AI Draft */}
              {showCompose && (
                <div className="border-t border-border pt-4 mt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draftPrompt}
                      onChange={(e) => setDraftPrompt(e.target.value)}
                      placeholder="Tell AI how to reply (e.g., 'say I'll confirm by Thursday')"
                      className="input-field flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleDraftWithAI()}
                    />
                    <Button
                      size="sm"
                      onClick={handleDraftWithAI}
                      loading={generatingDraft}
                    >
                      <Sparkles size={14} />
                    </Button>
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
                        setAiDraft('');
                        setDraftPrompt('');
                      }}
                      className="text-sm text-text-muted hover:text-text"
                    >
                      Cancel
                    </button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await saveDraft(user.id, replyTo, replySubject, replyBody);
                          setShowCompose(false);
                        }}
                      >
                        <Save size={14} /> Save Draft
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendReply}
                        loading={sending}
                        disabled={!replyBody.trim()}
                      >
                        <Send size={14} /> Send
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
