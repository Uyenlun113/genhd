'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Clipboard } from 'lucide-react';

interface ImageDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
}

export default function ImageDropzone({
  onFileSelected,
  accept = 'image/*',
  disabled = false,
  className = '',
  children,
  label,
  icon,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const urlToFile = async (url: string): Promise<File | null> => {
    try {
      if (url.startsWith('data:image/')) {
        const arr = url.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], `pasted_image_${Date.now()}.jpg`, { type: mime });
      } else {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] || 'jpg';
        return new File([blob], `pasted_image_${Date.now()}.${ext}`, { type: blob.type || 'image/jpeg' });
      }
    } catch (err) {
      console.error('Lỗi chuyển đổi ảnh:', err);
      return null;
    }
  };

  const processClipboardItems = (items: DataTransferItemList | DataTransferItem[]) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          onFileSelected(file);
          return true;
        }
      }
    }
    return false;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.clipboardData && e.clipboardData.items) {
      const handled = processClipboardItems(Array.from(e.clipboardData.items));
      if (handled) {
        e.preventDefault();
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    // 1. Check direct files (File Explorer, Zalo PC if supported)
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!accept.includes('image') || file.type.startsWith('image/')) {
        onFileSelected(file);
        return;
      }
    }

    // 2. Check dataTransfer items (getAsFile)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const handled = processClipboardItems(Array.from(e.dataTransfer.items));
      if (handled) return;
    }

    // 3. Check HTML snippet (Zalo Web, Browser drag image)
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src=["'](data:image\/[^"']+|https?:\/\/[^"']+)["']/i);
      if (match && match[1]) {
        const file = await urlToFile(match[1]);
        if (file) {
          onFileSelected(file);
          return;
        }
      }
    }

    // 4. Check URL or plain text
    const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:image/'))) {
      const file = await urlToFile(uri);
      if (file) {
        onFileSelected(file);
        return;
      }
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    e.target.value = '';
  };

  if (children) {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={handleClick}
        tabIndex={0}
        className={`relative cursor-pointer transition-all outline-none ${
          isDragging ? 'ring-2 ring-sky-500 ring-offset-2 bg-sky-50/50' : ''
        } ${className}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
        />
        {children}
        {isDragging && (
          <div className="absolute inset-0 bg-sky-500/10 backdrop-blur-[1px] border-2 border-dashed border-sky-500 rounded-xl flex items-center justify-center pointer-events-none z-10">
            <span className="text-xs font-bold text-sky-700 bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">
              Thả ảnh vào đây
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={handleClick}
      tabIndex={0}
      className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 outline-none focus:border-sky-400 ${
        isDragging
          ? 'border-sky-500 bg-sky-50 text-sky-700'
          : 'border-slate-300 hover:border-sky-400 hover:bg-sky-50/40 text-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
      />
      {icon || <UploadCloud className={`w-5 h-5 ${isDragging ? 'text-sky-600' : 'text-slate-400'}`} />}
      <span className="text-xs font-semibold">
        {label || (isDragging ? 'Thả ảnh vào đây' : 'Kéo & thả ảnh, bấm để chọn, hoặc nhấn Ctrl+V để dán ảnh Zalo')}
      </span>
      <span className="text-[10px] text-slate-400 font-normal">
        (Có thể Copy ảnh trong Zalo rồi nhấn Ctrl+V để dán trực tiếp)
      </span>
    </div>
  );
}
