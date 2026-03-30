import { Calendar } from 'lucide-react';
import Button from '../shared/Button';

export default function StepCalendarConnect({ onConnect, onSkip }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
        <Calendar size={32} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">Connect your calendar 📅</h2>
      <p className="text-text-muted mb-6">
        Sync Google Calendar to see events and create them from chat.
      </p>
      <Button onClick={onConnect} className="w-full mb-3">
        Connect Google Calendar
      </Button>
      <button onClick={onSkip} className="text-sm text-text-muted hover:text-text">
        Skip for now
      </button>
    </div>
  );
}
