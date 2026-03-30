import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, Bell, ListTodo, MoreHorizontal } from 'lucide-react';

const quickNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/lists', icon: ListTodo, label: 'Lists' },
  { to: '/settings', icon: MoreHorizontal, label: 'More' },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {quickNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
