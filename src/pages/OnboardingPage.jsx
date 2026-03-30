import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Globe, Bell, Calendar, ChevronRight, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotifications } from '../hooks/useNotifications';
import Button from '../components/shared/Button';

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Brain },
  { id: 'timezone', title: 'Timezone', icon: Globe },
  { id: 'briefing', title: 'Briefing', icon: Bell },
  { id: 'notifications', title: 'Notifications', icon: Bell },
  { id: 'calendar', title: 'Calendar', icon: Calendar },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);

  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [timezone, setTimezone] = useState(
    profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [briefingTime, setBriefingTime] = useState(
    profile?.briefing_time?.slice(0, 5) || '08:00'
  );
  const [briefingEnabled, setBriefingEnabled] = useState(
    profile?.briefing_enabled ?? true
  );
  const [loading, setLoading] = useState(false);

  const { subscribe: subscribeToPush } = useNotifications(user?.id);

  const timezones = Intl.supportedValuesOf('timeZone');

  const handleNext = async () => {
    setLoading(true);

    try {
      switch (steps[currentStep].id) {
        case 'welcome':
          await updateProfile({ full_name: fullName });
          break;
        case 'timezone':
          await updateProfile({ timezone });
          break;
        case 'briefing':
          await updateProfile({
            briefing_time: briefingTime + ':00',
            briefing_enabled: briefingEnabled,
          });
          break;
        case 'notifications':
          break;
        case 'calendar':
          break;
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        await setOnboardingComplete();
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Onboarding step error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOnboardingComplete().then(() => navigate('/dashboard'));
    }
  };

  const handleEnableNotifications = async () => {
    try {
      await subscribeToPush();
    } catch (err) {
      console.error('Notification subscribe error:', err);
    }
    handleNext();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i < currentStep
                    ? 'bg-success text-white'
                    : i === currentStep
                    ? 'bg-primary text-white'
                    : 'bg-surface-light text-text-muted'
                }`}
              >
                {i < currentStep ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
                    i < currentStep ? 'bg-success' : 'bg-surface-light'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          {steps[currentStep].id === 'welcome' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Brain size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">
                Welcome to MemorAI! 🎉
              </h2>
              <p className="text-text-muted mb-6">
                Let's set you up in just a few steps. What should we call you?
              </p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="input-field text-center text-lg"
                autoFocus
              />
            </div>
          )}

          {steps[currentStep].id === 'timezone' && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-2 text-center">
                Where are you based? 🌍
              </h2>
              <p className="text-text-muted mb-6 text-center">
                We'll use this for reminders and briefings.
              </p>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input-field"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {steps[currentStep].id === 'briefing' && (
            <div>
              <h2 className="text-2xl font-bold text-text mb-2 text-center">
                Morning Briefing ☀️
              </h2>
              <p className="text-text-muted mb-6 text-center">
                Get a daily summary of your schedule, reminders, and tasks.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                  <span className="text-sm font-medium text-text">
                    Enable daily briefing
                  </span>
                  <button
                    onClick={() => setBriefingEnabled(!briefingEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      briefingEnabled ? 'bg-primary' : 'bg-surface-lighter'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        briefingEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {briefingEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Briefing time
                    </label>
                    <input
                      type="time"
                      value={briefingTime}
                      onChange={(e) => setBriefingTime(e.target.value)}
                      className="input-field"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {steps[currentStep].id === 'notifications' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-6">
                <Bell size={32} className="text-warning" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">
                Stay in the loop 🔔
              </h2>
              <p className="text-text-muted mb-6">
                Enable notifications so we can remind you even when the app is
                closed.
              </p>
            </div>
          )}

          {steps[currentStep].id === 'calendar' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Calendar size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">
                Connect your calendar 📅
              </h2>
              <p className="text-text-muted mb-6">
                Sync Google Calendar to see events and create them from chat.
              </p>
              <Button onClick={() => handleNext()} className="w-full mb-3">
                Connect Google Calendar
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            {currentStep < steps.length - 1 &&
            steps[currentStep].id !== 'welcome' ? (
              <button
                onClick={handleSkip}
                className="text-sm text-text-muted hover:text-text"
              >
                Skip for now
              </button>
            ) : (
              <div />
            )}

            {steps[currentStep].id === 'notifications' ? (
              <Button onClick={handleEnableNotifications} loading={loading}>
                Allow Notifications
                <ChevronRight size={16} />
              </Button>
            ) : steps[currentStep].id === 'calendar' ? (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            ) : (
              <Button onClick={handleNext} loading={loading}>
                Continue
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
