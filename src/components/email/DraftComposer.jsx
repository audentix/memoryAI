import { useState } from 'react';
import { Sparkles, Send, Save, Loader2 } from 'lucide-react';
import Button from '../shared/Button';

export default function DraftComposer({
  onGenerateDraft,
  onSend,
  onSaveDraft,
  generating,
  sending,
}) {
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const result = await onGenerateDraft(prompt);
    if (result) setDraft(result);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Tell AI how to reply..."
          className="input-field flex-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <Button size="sm" onClick={handleGenerate} loading={generating}>
          <Sparkles size={14} />
        </Button>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="AI draft will appear here..."
        className="input-field resize-none text-sm"
        rows={6}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => onSaveDraft(draft)}>
          <Save size={14} /> Save Draft
        </Button>
        <Button size="sm" onClick={() => onSend(draft)} loading={sending} disabled={!draft.trim()}>
          <Send size={14} /> Send
        </Button>
      </div>
    </div>
  );
}
