/**
 * ImageUploader.tsx
 * Reusable image-upload component with mock storage.
 *
 * Props:
 *   value    — current array of public image URLs
 *   onChange — called with updated array whenever images are added or removed
 *   maxFiles — max number of images allowed (default 6)
 *   disabled — disable all interaction
 *
 * Flow:
 *   1. User picks / drops an image file
 *   2. Component uploads it to mock storage API
 *   3. Mock API returns a placeholder URL
 *   4. URL is appended to `value` and `onChange` is called
 */
import { useRef, useState, useCallback, DragEvent } from 'react';
import { storageAPI } from '../../services/apiClient';
import { Upload, X, ImageIcon, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadingItem {
  id: string;      // local temp id
  name: string;
  preview: string; // local blob URL for immediate preview
  status: 'uploading' | 'done' | 'error';
  error?: string;
  file?: File;
}

interface Props {
  value: any[];
  onChange: (items: any[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  returnFiles?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  maxFiles = 6,
  disabled = false,
  label = 'Hình ảnh kho lạnh',
  returnFiles = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<UploadingItem[]>([]);
  const [dragging, setDragging] = useState(false);

  const canAddMore = value.length + uploading.filter(u => u.status === 'uploading').length < maxFiles;

  // ── Upload a single file ────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.warning(`"${file.name}" không phải file ảnh`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.warning(`"${file.name}" vượt quá giới hạn 10 MB`);
      return;
    }

    const id = `${Date.now()}-${Math.random()}`;
    const preview = URL.createObjectURL(file);

    if (returnFiles) {
      onChange([...value, file]);
      return;
    }

    const item: UploadingItem = { id, name: file.name, preview, status: 'uploading' };
    setUploading(prev => [...prev, item]);

    try {
      const url = await storageAPI.uploadImage(file);
      setUploading(prev => prev.map(u => u.id === id ? { ...u, status: 'done' } : u));
      onChange([...value, url]);
      setTimeout(() => {
        setUploading(prev => prev.filter(u => u.id !== id));
        URL.revokeObjectURL(preview);
      }, 800);
    } catch (err: any) {
      setUploading(prev => prev.map(u =>
        u.id === id ? { ...u, status: 'error', error: err?.message } : u
      ));
      toast.error(`Tải ảnh thất bại: ${err?.message ?? 'Lỗi không xác định'}`);
    }
  }, [value, onChange, returnFiles]);

  // ── Handle file selection ───────────────────────────────────────────────────
  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = maxFiles - value.length - uploading.filter(u => u.status === 'uploading').length;
    if (arr.length > remaining) {
      toast.warning(`Chỉ có thể thêm ${remaining} ảnh nữa (tối đa ${maxFiles} ảnh)`);
    }
    arr.slice(0, remaining).forEach(uploadFile);
  }, [value.length, uploading, maxFiles, uploadFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && canAddMore) setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || !canAddMore) return;
    const files = e.dataTransfer.files;
    if (files.length) handleFiles(files);
  };

  // ── Remove a confirmed URL ──────────────────────────────────────────────────
  const removeUrl = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  // ── Remove a failed upload ──────────────────────────────────────────────────
  const removeUploading = (id: string) => {
    setUploading(prev => {
      const item = prev.find(u => u.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(u => u.id !== id);
    });
  };

  const totalCount = value.length + uploading.length;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon style={{ width: 16, height: 16, color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            padding: '2px 8px',
          }}
        >
          {totalCount} / {maxFiles} ảnh
        </span>
      </div>

      {/* Thumbnail grid */}
      {totalCount > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {/* Confirmed uploaded URLs or local Files */}
          {value.map((urlOrFile, i) => {
            const isFile = urlOrFile instanceof File;
            const url = isFile ? URL.createObjectURL(urlOrFile) : urlOrFile;
            
            return (
            <div
              key={isFile ? `${urlOrFile.name}-${i}` : url}
              style={{
                position: 'relative',
                aspectRatio: '1',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
              }}
              className="group"
            >
              <img
                src={url}
                alt={`Ảnh ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeUrl(i)}
                  title="Xoá ảnh"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    background: 'rgba(239,68,68,0.9)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                  }}
                  className="group-hover:!opacity-100"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
              {/* Position index badge */}
              {i === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(37,99,235,0.75)',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    padding: '2px 0',
                    letterSpacing: '0.05em',
                  }}
                >
                  ẢNH CHÍNH
                </div>
              )}
            </div>
            );
          })}

          {/* In-progress uploads */}
          {uploading.map(u => (
            <div
              key={u.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                border: `1px solid ${u.status === 'error' ? 'var(--color-error)' : 'var(--color-border)'}`,
                overflow: 'hidden',
              }}
            >
              <img
                src={u.preview}
                alt={u.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.5 }}
              />
              {/* Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.35)',
                  gap: 4,
                }}
              >
                {u.status === 'uploading' && (
                  <Loader2
                    style={{
                      width: 20,
                      height: 20,
                      color: '#fff',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                )}
                {u.status === 'done' && (
                  <CheckCircle style={{ width: 20, height: 20, color: '#22c55e' }} />
                )}
                {u.status === 'error' && (
                  <>
                    <AlertCircle style={{ width: 18, height: 18, color: '#ef4444' }} />
                    <button
                      type="button"
                      onClick={() => removeUploading(u.id)}
                      style={{
                        fontSize: '0.6rem',
                        color: '#fff',
                        background: 'rgba(239,68,68,0.8)',
                        border: 'none',
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}
                    >
                      Xoá
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add-more tile */}
          {canAddMore && !disabled && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                aspectRatio: '1',
                border: '2px dashed var(--color-border)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <Upload style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
              <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Thêm
              </span>
            </button>
          )}
        </div>
      )}

      {/* Full drop-zone (shown when no images yet) */}
      {totalCount === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: dragging ? 'rgba(37,99,235,0.04)' : 'transparent',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Upload style={{ width: 28, height: 28, color: dragging ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem', margin: 0 }}>
              Kéo thả ảnh vào đây hoặc nhấn để chọn
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
              JPG, PNG, WebP · Tối đa 10 MB / ảnh · Tối đa {maxFiles} ảnh
            </p>
          </div>
        </div>
      )}

      {/* Mini add-button strip (shown when images exist but can add more) */}
      {totalCount > 0 && canAddMore && !disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `1px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: dragging ? 'rgba(37,99,235,0.04)' : 'transparent',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onClick={() => inputRef.current?.click()}
        >
          <Upload style={{ width: 13, height: 13, color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Kéo thả hoặc nhấn để thêm ảnh · tối đa {maxFiles - totalCount} ảnh nữa
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* CSS for spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
