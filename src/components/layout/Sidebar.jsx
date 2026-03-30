import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  Bell,
  ListTodo,
  Calendar,
  HardDrive,
  Mail,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/lists', icon: ListTodo, label: 'Lists' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/memory', icon: HardDrive, label: 'Memory Vault' },
  { to: '/email', icon: Mail, label: 'Email' },
];

export default function Sidebar({ collapsed, onToggle, mobile = false }) {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside
      className={`h-full bg-surface border-r border-border flex flex-col transition-all duration-200 ${
        collapsed && !mobile ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Brain size={18} className="text-primary" />
        </div>
        {(!collapsed || mobile) && (
          <span className="font-bold text-lg text-text">MemorAI</span>
        )}
        {!mobile && (
          <button
            onClick={onToggle}
            className="ml-auto p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => mobile && onToggle()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:bg-surface-light hover:text-text'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {(!collapsed || mobile) && (
              <span className="text-sm font-medium truncate">{label}</span>
            )}
            {collapsed && !mobile && (
              <div className="absolute left-16 bg-surface-light border border-border px-2 py-1 rounded-md text-xs text-text opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-1">
        <NavLink
          to="/settings"
          onClick={() => mobile && onToggle()}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:bg-surface-light hover:text-text'
            } ${collapsed && !mobile ? 'justify-center' : ''}`
          }
        >
          <Settings size={20} />
          {(!collapsed || mobile) && (
            <span className="text-sm font-medium">Settings</span>
          )}
        </NavLink>
        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-all duration-150 w-full ${
            collapsed && !mobile ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} />
          {(!collapsed || mobile) && (
            <span className="text-sm font-medium">Log Out</span>
          )}
        </button>
      </div>
    </aside>
  );
}
