export default function StepBriefingTime({ briefingTime, setBriefingTime, briefingEnabled, setBriefingEnabled }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-text mb-2 text-center">Morning Briefing ☀️</h2>
      <p className="text-text-muted mb-6 text-center">
        Get a daily summary of your schedule, reminders, and tasks.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
          <span className="text-sm font-medium text-text">Enable daily briefing</span>
          <button
            onClick={() => setBriefingEnabled(!briefingEnabled)}
            className={`w-11 h-6 rounded-full transition-colors ${briefingEnabled ? 'bg-primary' : 'bg-surface-lighter'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${briefingEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {briefingEnabled && (
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Briefing time</label>
            <input type="time" value={briefingTime} onChange={(e) => setBriefingTime(e.target.value)} className="input-field" />
          </div>
        )}
      </div>
    </div>
  );
}
