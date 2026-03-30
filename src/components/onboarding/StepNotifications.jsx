import { Bell } from 'lucide-react';

export default function StepNotifications({ onEnable, onSkip }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-6">
        <Bell size={32} className="text-warning" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">Stay in the loop 🔔</h2>
      <p className="text-text-muted mb-6">
        Enable notifications so we can remind you even when the app is closed.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-sm text-text-muted hover:text-text rounded-lg"
        >
          Skip for now
        </button>
        <button
          onClick={onEnable}
          className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
        >
          Allow Notifications
        </button>
      </div>
    </div>
  );
}
