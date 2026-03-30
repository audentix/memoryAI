import { FileText, Image as ImageIcon, File, Download, Trash2 } from 'lucide-react';
import Badge from '../shared/Badge';

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

export default function FileCard({ file, onDelete }) {
  const Icon = getFileIcon(file.mime_type);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="card hover:border-primary/30 transition-all group">
      {file.mime_type?.startsWith('image/') ? (
        <div className="w-full h-32 rounded-lg bg-surface-light mb-3 overflow-hidden">
          <img
            src={`${supabaseUrl}/storage/v1/object/public/memories/${file.storage_path}`}
            alt={file.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-24 rounded-lg bg-surface-light mb-3 flex items-center justify-center">
          <Icon size={32} className="text-text-muted" />
        </div>
      )}

      <h3 className="text-sm font-medium text-text truncate mb-1">{file.filename}</h3>

      {file.ai_summary && (
        <p className="text-xs text-text-muted mb-2 line-clamp-2">{file.ai_summary}</p>
      )}

      {file.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {file.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{formatFileSize(file.size_bytes)}</span>
        <span>{new Date(file.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() =>
            window.open(
              `${supabaseUrl}/storage/v1/object/public/memories/${file.storage_path}`,
              '_blank'
            )
          }
          className="p-1.5 rounded-lg hover:bg-surface-light text-text-muted hover:text-text transition-colors"
          title="Download"
        >
          <Download size={14} />
        </button>
        <button
          onClick={() => onDelete(file.id, file.storage_path)}
          className="p-1.5 rounded-lg hover:bg-danger/15 text-text-muted hover:text-danger transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
