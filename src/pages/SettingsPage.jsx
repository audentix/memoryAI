import { useEffect, useState } from 'react';
import {
  User,
  Bell,
  Link2,
  Brain,
  Shield,
  LogOut,
  ChevronRight,
  Download,
  Trash2,
  Clock,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotifications } from '../hooks/useNotifications';
import Button from '../components/shared/Button';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const SECTIONS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'integrations', label: 'Integrations', icon: Link2 },
  { key: 'memory', label: 'AI Memory', icon: Brain },
  { key: 'privacy', label: 'Data & Privacy', icon: Shield },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const {
    calendarConnected,
    emailConnected,
    memoryCount,
    checkConnections,
    disconnectCalendar,
    disconnectEmail,
    clearAllMemories,
    exportAllData,
    deleteAllData,
  } = useSettingsStore();

  const { supported: pushSupported, subscribed, subscribe } = useNotifications(user?.id);

  const [activeSection, setActiveSection] = useState('profile');
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [briefingTime, setBriefingTime] = useState('');
  const [briefingEnabled, setBriefingEnabled] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [clearMemConfirm, setClearMemConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnections(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTimezone(profile.timezone || 'UTC');
      setBriefingTime(profile.briefing_time?.slice(0, 5) || '08:00');
      setBriefingEnabled(profile.briefing_enabled ?? true);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        timezone,
        briefing_time: briefingTime + ':00',
        briefing_enabled: briefingEnabled,
      });
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    const data = await exportAllData(user.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memorai-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    await deleteAllData(user.id);
    await signOut();
    navigate('/auth');
  };

  const timezones = Intl.supportedValuesOf('timeZone');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Settings</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar menu */}
        <div className="space-y-1">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === key
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:bg-surface-light hover:text-text'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <div className="card">
            {/* Profile */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-text mb-4">Profile</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input-field opacity-60 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        Timezone
                      </label>
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

                    <Button onClick={handleSaveProfile} loading={saving}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-text mb-4">Notifications</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text">Push Notifications</p>
                      <p className="text-xs text-text-muted">
                        {subscribed ? 'Enabled' : pushSupported ? 'Not enabled' : 'Not supported in this browser'}
                      </p>
                    </div>
                    {!subscribed && pushSupported && (
                      <Button size="sm" onClick={subscribe}>
                        Enable
                      </Button>
                    )}
                    {subscribed && (
                      <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                        <Check size={14} className="text-success" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text">Daily Briefing</p>
                      <p className="text-xs text-text-muted">
                        {briefingEnabled ? `Enabled at ${briefingTime}` : 'Disabled'}
                      </p>
                    </div>
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
                        <Clock size={14} className="inline mr-1" />
                        Briefing Time
                      </label>
                      <input
                        type="time"
                        value={briefingTime}
                        onChange={(e) => setBriefingTime(e.target.value)}
                        className="input-field w-48"
                      />
                    </div>
                  )}

                  <Button onClick={handleSaveProfile} loading={saving}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeSection === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-text mb-4">Integrations</h2>

                <div className="space-y-3">
                  {/* Google Calendar */}
                  <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                        📅
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">Google Calendar</p>
                        <p className="text-xs text-text-muted">
                          {calendarConnected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {calendarConnected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectCalendar(user.id)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => useAuthStore.getState().signInWithGoogle()}
                      >
                        Connect
                      </Button>
                    )}
                  </div>

                  {/* Gmail */}
                  <div className="flex items-center justify-between p-4 bg-surface-light rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-danger/15 flex items-center justify-center">
                        ✉️
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">Gmail</p>
                        <p className="text-xs text-text-muted">
                          {emailConnected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {emailConnected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectEmail(user.id)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => useAuthStore.getState().signInWithGoogle()}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI Memory */}
            {activeSection === 'memory' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-text mb-4">AI Memory</h2>

                <div className="p-4 bg-surface-light rounded-lg">
                  <p className="text-sm font-medium text-text mb-1">
                    Stored Memories
                  </p>
                  <p className="text-2xl font-bold text-text">{memoryCount}</p>
                  <p className="text-xs text-text-muted">
                    Memories help the AI give you personalized responses
                  </p>
                </div>

                <Button
                  variant="danger"
                  onClick={() => setClearMemConfirm(true)}
                >
                  <Trash2 size={14} /> Clear All Memories
                </Button>
              </div>
            )}

            {/* Data & Privacy */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-text mb-4">Data & Privacy</h2>

                <div className="space-y-3">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-4 bg-surface-light rounded-lg hover:bg-surface-lighter transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Download size={18} className="text-text-muted" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-text">Export All Data</p>
                        <p className="text-xs text-text-muted">
                          Download all your data as JSON
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirm('all')}
                    className="w-full flex items-center justify-between p-4 bg-danger/5 rounded-lg hover:bg-danger/10 transition-colors border border-danger/20"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-danger" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-danger">Delete All Data</p>
                        <p className="text-xs text-text-muted">
                          Permanently delete all your data and account
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-danger" />
                  </button>

                  <button
                    onClick={async () => {
                      await signOut();
                      navigate('/auth');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-surface-light rounded-lg hover:bg-surface-lighter transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={18} className="text-text-muted" />
                      <p className="text-sm font-medium text-text">Log Out</p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={clearMemConfirm}
        onClose={() => setClearMemConfirm(false)}
        onConfirm={() => {
          clearAllMemories(user.id);
          setClearMemConfirm(false);
        }}
        title="Clear All Memories"
        message="This will delete all stored memories. The AI will lose personalization. This cannot be undone."
        confirmText="Clear Memories"
      />

      <ConfirmDialog
        isOpen={deleteConfirm === 'all'}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteAllData}
        title="Delete All Data"
        message="This will permanently delete your account, all memories, reminders, lists, and files. This cannot be undone."
        confirmText="Delete Everything"
      />
    </div>
  );
}
