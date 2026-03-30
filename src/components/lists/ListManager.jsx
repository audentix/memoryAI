import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ListCard from './ListCard';
import Button from '../shared/Button';
import EmptyState from '../shared/EmptyState';
import { ListTodo } from 'lucide-react';

export default function ListManager({ lists, onCreateNew }) {
  const navigate = useNavigate();

  if (lists.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No lists yet"
        description='Create your first list or ask me in chat — "Create a grocery list"'
        action={
          <Button onClick={onCreateNew}>
            <Plus size={14} /> Create List
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lists.map((list) => (
        <ListCard key={list.id} list={list} onClick={() => navigate(`/lists/${list.id}`)} />
      ))}
    </div>
  );
}
