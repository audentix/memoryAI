import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-md flex items-center px-4 gap-3 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full bg-surface-light border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/memory?search=${encodeURIComponent(e.target.value)}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/reminders')}
          className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors relative"
        >
          <Bell size={18} />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-light transition-colors"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
          )}
          <span className="hidden md:block text-sm text-text truncate max-w-24">
            {profile?.full_name || 'User'}
          </span>
        </button>
      </div>
    </header>
  );
}
