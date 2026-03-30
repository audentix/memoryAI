import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

export default function FileUploader({ onUpload, uploading }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onUpload(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.docx,.csv"
        className="hidden"
        onChange={(e) => onUpload(e.target.files)}
        aria-label="Upload files"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
        }`}
      >
        <Upload size={24} className="mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-muted">
          Drag & drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:text-primary-light"
            disabled={uploading}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-text-muted mt-1">Images, PDFs, documents up to 50MB</p>
      </div>
    </>
  );
}
