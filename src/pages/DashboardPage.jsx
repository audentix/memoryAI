import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ListTodo,
  Calendar,
  HardDrive,
  ChevronRight,
  Clock,
  Sun,
  FileText,
  Plus,
  Send,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useReminderStore } from '../store/useReminderStore';
import { useListStore } from '../store/useListStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { supabase } from '../lib/supabaseClient';
import EmptyState from '../components/shared/EmptyState';
import Button from '../components/shared/Button';

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date - now;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 0) return 'Overdue';
  if (minutes < 60) return `In ${minutes} min`;
  if (hours < 24) return `In ${hours}h`;
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { reminders, fetchReminders } = useReminderStore();
  const { lists, fetchLists } = useListStore();
  const { checkConnections, calendarConnected } = useSettingsStore();

  const [briefing, setBriefing] = useState(null);
  const [quickChat, setQuickChat] = useState('');
  const [todayEvents, setTodayEvents] = useState([]);

  useEffect(() => {
    if (user) {
      fetchReminders(user.id);
      fetchLists(user.id);
      checkConnections(user.id);
      loadBriefing();
      if (calendarConnected) loadTodayEvents();
    }
  }, [user?.id]);

  const loadBriefing = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_briefings')
      .select('*')
      .eq('user_id', user.id)
      .gte('sent_at', today)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (data) setBriefing(data);
  };

  const loadTodayEvents = async () => {
    try {
      const { getCalendarEvents } = await import('../lib/googleCalendar');
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59);
      const events = await getCalendarEvents(user.id, now, endOfDay);
      setTodayEvents(events.slice(0, 3));
    } catch (err) {
      console.error('Load events error:', err);
    }
  };

  const upcomingReminders = reminders
    .filter((r) => r.status === 'pending' && new Date(r.remind_at) > new Date())
    .slice(0, 5);

  const activeLists = lists.slice(0, 4);

  const greeting = () => {
    const hour = new Date().getHours();
    const name = profile?.full_name?.split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name} ☀️`;
    if (hour < 17) return `Good afternoon, ${name} 👋`;
    return `Good evening, ${name} 🌙`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text">{greeting()}</h1>
        <p className="text-text-muted mt-1">Here's your overview for today</p>
      </div>

      {/* Quick Chat */}
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={quickChat}
              onChange={(e) => setQuickChat(e.target.value)}
              placeholder="Tell me something to remember..."
              className="w-full bg-transparent border-none text-text placeholder-text-muted focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickChat.trim()) {
                  navigate('/chat', { state: { message: quickChat } });
                }
              }}
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              if (quickChat.trim()) {
                navigate('/chat', { state: { message: quickChat } });
              }
            }}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/reminders')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center">
              <Bell size={18} className="text-warning" />
            </div>
            <span className="text-2xl font-bold text-text">
              {reminders.filter((r) => r.status === 'pending').length}
            </span>
          </div>
          <p className="text-xs text-text-muted">Today's Reminders</p>
        </div>

        <div className="card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/lists')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <ListTodo size={18} className="text-primary" />
            </div>
            <span className="text-2xl font-bold text-text">{lists.length}</span>
          </div>
          <p className="text-xs text-text-muted">Active Lists</p>
        </div>

        <div className="card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/calendar')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center">
              <Calendar size={18} className="text-success" />
            </div>
            <span className="text-2xl font-bold text-text">
              {todayEvents.length}
            </span>
          </div>
          <p className="text-xs text-text-muted">Upcoming Events</p>
        </div>

        <div className="card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate('/memory')}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-danger/15 flex items-center justify-center">
              <HardDrive size={18} className="text-danger" />
            </div>
            <span className="text-2xl font-bold text-text">
              {useSettingsStore.getState().memoryCount}
            </span>
          </div>
          <p className="text-xs text-text-muted">Memories Stored</p>
        </div>
      </div>

      {/* Briefing */}
      {briefing && (
        <div className="card border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Sun size={18} className="text-warning" />
            <h3 className="font-semibold text-text">Today's Briefing</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
            {briefing.content.slice(0, 300)}
            {briefing.content.length > 300 && '...'}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Reminders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">Upcoming Reminders</h3>
            <button
              onClick={() => navigate('/reminders')}
              className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          {upcomingReminders.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No upcoming reminders"
              description="Try saying 'Remind me to call mom tomorrow at 6pm'"
            />
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors cursor-pointer"
                  onClick={() => navigate('/reminders')}
                >
                  <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatRelativeTime(r.remind_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Lists */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text">Active Lists</h3>
            <button
              onClick={() => navigate('/lists')}
              className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          {activeLists.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No lists yet"
              description='Try saying "Create a grocery list"'
              action={
                <Button size="sm" onClick={() => navigate('/lists')}>
                  <Plus size={14} /> New List
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {activeLists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors cursor-pointer"
                  onClick={() => navigate(`/lists/${list.id}`)}
                >
                  <span className="text-lg">{list.icon || '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {list.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {list.itemCount || 0} items
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-text-muted" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Memory Trunk */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text">Recent Memory Trunk</h3>
          <button
            onClick={() => navigate('/memory')}
            className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
          >
            View Vault <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <FileText size={16} />
          <span>Upload files to your vault to see them here</span>
        </div>
      </div>
    </div>
  );
}
