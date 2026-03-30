import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ListTodo, Trash2, ArrowLeft, Check, GripVertical, Edit3, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '../store/useAuthStore';
import { useListStore } from '../store/useListStore';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import EmptyState from '../components/shared/EmptyState';
import { SkeletonList } from '../components/shared/Skeleton';

function SortableItem({ item, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== item.text) {
      onEdit(item.id, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg bg-surface-light hover:bg-surface-lighter transition-colors group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-text-muted hover:text-text cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.done
            ? 'bg-success border-success'
            : 'border-border hover:border-primary'
        }`}
      >
        {item.done && <Check size={12} className="text-white" />}
      </button>

      {/* Text */}
      {editing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
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

      {/* Actions */}
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ListCard({ list, onClick }) {
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
          style={{
            width: list.itemCount > 0 ? '30%' : '0%',
          }}
        />
      </div>
    </div>
  );
}

// Lists grid view
function ListsGridView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { lists, loading, fetchLists, createList, deleteList } = useListStore();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📝');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (user) fetchLists(user.id);
  }, [user?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const list = await createList(user.id, newName.trim(), newIcon);
    setShowNew(false);
    setNewName('');
    setNewIcon('📝');
    navigate(`/lists/${list.id}`);
  };

  const icons = ['📝', '🛒', '🎯', '💼', '🏋️', '📚', '🎬', '🍳', '✈️', '🎵', '💡', '🏠'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Lists</h1>
          <p className="text-sm text-text-muted mt-1">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus size={16} /> New List
        </Button>
      </div>

      {loading ? (
        <SkeletonList count={6} />
      ) : lists.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No lists yet"
          description='Create your first list or ask me in chat — "Create a grocery list"'
          action={
            <Button onClick={() => setShowNew(true)}>
              <Plus size={14} /> Create List
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onClick={() => navigate(`/lists/${list.id}`)}
            />
          ))}
        </div>
      )}

      {/* New List Modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New List">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setNewIcon(icon)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    newIcon === icon
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'bg-surface-light hover:bg-surface-lighter'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Grocery, Movies, Tasks..."
              className="input-field"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowNew(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">Create List</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          deleteList(deleteConfirm);
          setDeleteConfirm(null);
        }}
        title="Delete List"
        message="All items in this list will be permanently deleted."
        confirmText="Delete"
      />
    </div>
  );
}

// Single list detail view
function ListDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { items, loading, fetchListItems, addItem, toggleItem, updateItemText, deleteItem, reorderItems, clearCompleted } = useListStore();
  const [newItemText, setNewItemText] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [listInfo, setListInfo] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id) {
      fetchListItems(id);
      // Fetch list info
      supabase.from('lists').select('*').eq('id', id).single().then(({ data }) => {
        setListInfo(data);
      });
    }
  }, [id]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    await addItem(id, newItemText.trim());
    setNewItemText('');
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      reorderItems(id, newItems);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'active') return !item.done;
    if (filter === 'completed') return item.done;
    return true;
  });

  const completedCount = items.filter((i) => i.done).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/lists')}
          className="p-2 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <span>{listInfo?.icon || '📝'}</span>
            {listInfo?.name || 'List'}
          </h1>
          <p className="text-xs text-text-muted">
            {completedCount} of {items.length} done
          </p>
        </div>
      </div>

      {/* Add item form */}
      <form onSubmit={handleAddItem}>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add an item..."
            className="input-field flex-1"
          />
          <Button type="submit" disabled={!newItemText.trim()}>
            <Plus size={16} />
          </Button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:bg-surface-light'
            }`}
          >
            {f}
          </button>
        ))}
        {completedCount > 0 && (
          <button
            onClick={() => clearCompleted(id)}
            className="ml-auto px-3 py-1 rounded-lg text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Items */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          {filter === 'all'
            ? 'No items yet. Add one above!'
            : filter === 'active'
            ? 'No active items'
            : 'No completed items'}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onEdit={updateItemText}
                  onDelete={(itemId) => deleteItem(itemId, id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// Main page component that routes between grid and detail
export default function ListsPage() {
  const { id } = useParams();
  return id ? <ListDetailView /> : <ListsGridView />;
}
