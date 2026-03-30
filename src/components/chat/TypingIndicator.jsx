export default function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-primary">🤖</span>
      </div>
      <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-text-muted animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
