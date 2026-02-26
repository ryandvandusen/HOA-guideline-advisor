'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

type Props = {
  onFileSelect: (file: File, preview: string) => void;
  preview: string | null;
  disabled?: boolean;
};

export function PhotoUploader({ onFileSelect, preview, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileSelect(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  if (preview) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Uploaded property" className="w-full object-cover max-h-64" />
        {!disabled && (
          <button
            onClick={() => onFileSelect(new File([], ''), '')}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white shadow"
            aria-label="Remove photo"
          >
            <X size={16} className="text-gray-600" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <UploadCloud className="mx-auto mb-3 text-gray-400" size={36} />
      <p className="text-sm font-medium text-gray-600">
        Drop a photo here or <span className="text-blue-600 underline">browse</span>
      </p>
      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP up to 10MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
