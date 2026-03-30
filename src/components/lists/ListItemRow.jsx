import { useState } from 'react';
import { GripVertical, X, Check } from 'lucide-react';

export default function ListItemRow({ item, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onEdit(item.id, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors group">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.done ? 'bg-success border-success' : 'border-border hover:border-primary'
        }`}
        aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
      >
        {item.done && <Check size={12} className="text-white" />}
      </button>

      {/* Text */}
      {editing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditText(item.text);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent border-none text-text focus:outline-none text-sm"
          autoFocus
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-text ${
            item.done ? 'line-through text-text-muted' : 'text-text'
          }`}
          onClick={() => setEditing(true)}
        >
          {item.text}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
        aria-label="Delete item"
      >
        <X size={14} />
      </button>
    </div>
  );
}
