import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function ListCard({ list, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:border-primary/30 transition-all hover:shadow-lg group"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{list.icon || '📝'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{list.name}</h3>
          <p className="text-xs text-text-muted">{list.itemCount || 0} items</p>
        </div>
      </div>
      <div className="h-1 bg-surface-lighter rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: list.itemCount > 0 ? '30%' : '0%' }}
        />
      </div>
    </div>
  );
}
