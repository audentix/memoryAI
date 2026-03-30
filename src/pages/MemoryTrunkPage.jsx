import { useEffect, useState, useRef, useCallback } from 'react';
import { HardDrive, Search, Upload, FileText, Image as ImageIcon, File, Trash2, Download, Tag, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useMemoryStore } from '../store/useMemoryStore';
import { callGeminiVision } from '../lib/gemini';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import Badge from '../components/shared/Badge';
import { SkeletonList } from '../components/shared/Skeleton';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'images', label: 'Images' },
  { key: 'pdfs', label: 'PDFs' },
  { key: 'documents', label: 'Documents' },
];

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

function FileCard({ file, onDelete }) {
  const Icon = getFileIcon(file.mime_type);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="card hover:border-primary/30 transition-all group">
      {/* Thumbnail */}
      {file.mime_type?.startsWith('image/') ? (
        <div
          className="w-full h-32 rounded-lg bg-surface-light mb-3 overflow-hidden cursor-pointer"
          onClick={() => setShowPreview(true)}
        >
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/memories/${file.storage_path}`}
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

      {/* Info */}
      <h3 className="text-sm font-medium text-text truncate mb-1">{file.filename}</h3>

      {file.ai_summary && (
        <p className="text-xs text-text-muted mb-2 line-clamp-2">{file.ai_summary}</p>
      )}

      {/* Tags */}
      {file.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {file.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="default" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{formatFileSize(file.size_bytes)}</span>
        <span>{new Date(file.created_at).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/memories/${file.storage_path}`;
            window.open(url, '_blank');
          }}
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

export default function MemoryTrunkPage() {
  const user = useAuthStore((s) => s.user);
  const {
    files,
    searchResults,
    loading,
    uploading,
    fetchFiles,
    uploadFile,
    deleteFile,
    semanticSearch,
    clearSearchResults,
  } = useMemoryStore();

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (user) fetchFiles(user.id, filter);
  }, [user?.id, filter]);

  // Semantic search with debounce
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      clearTimeout(searchTimeout.current);

      if (!query.trim()) {
        clearSearchResults();
        return;
      }

      searchTimeout.current = setTimeout(() => {
        semanticSearch(user.id, query);
      }, 500);
    },
    [user?.id]
  );

  const handleFileUpload = async (fileList) => {
    for (const file of fileList) {
      try {
        // AI analysis for images and PDFs
        let summary = '';
        let tags = [];

        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
          });

          try {
            const analysis = await callGeminiVision(
              base64,
              file.type,
              `Describe this file briefly. Return JSON: { "summary": "...", "tags": ["..."] }`
            );
            const jsonMatch = analysis.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, analysis];
            const parsed = JSON.parse(jsonMatch[1].trim());
            summary = parsed.summary || '';
            tags = parsed.tags || [];
          } catch {
            summary = file.name;
          }
        } else {
          summary = file.name;
        }

        await uploadFile(user.id, file, summary, tags);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const displayFiles = searchQuery ? [] : files;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Memory Vault</h1>
          <p className="text-sm text-text-muted mt-1">
            {files.length} file{files.length !== 1 ? 's' : ''} stored
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
          <Upload size={16} /> Upload
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search your memories... (powered by AI)"
          className="input-field pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              clearSearchResults();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-text-muted">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.map((result, i) => (
            <div key={i} className="card">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  {result.source === 'file' ? (
                    <FileText size={14} className="text-primary" />
                  ) : (
                    <Tag size={14} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text">
                    {result.content || result.filename}
                  </p>
                  {result.type && (
                    <Badge variant="default" className="mt-1 text-[10px]">
                      {result.type}
                    </Badge>
                  )}
                  {result.similarity && (
                    <span className="text-[10px] text-text-muted ml-2">
                      {Math.round(result.similarity * 100)}% match
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {!searchQuery && (
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:bg-surface-light hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.docx,.csv"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30'
        }`}
      >
        <Upload size={24} className="mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-muted">
          Drag & drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:text-primary-light"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-text-muted mt-1">
          Images, PDFs, documents up to 50MB
        </p>
      </div>

      {/* Files Grid */}
      {!searchQuery && (
        <>
          {loading ? (
            <SkeletonList count={6} />
          ) : displayFiles.length === 0 ? (
            <EmptyState
              icon={HardDrive}
              title="Your vault is empty"
              description="Upload files to store them with AI-powered search. Images and PDFs are analyzed automatically."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={deleteFile}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
