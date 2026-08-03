'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, FileText, X, UploadCloud, Loader2, CloudCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  accept?: string;
  label: string;
  value?: string;
  onChange: (urlOrBase64: string) => void;
  isImage?: boolean;
  disabled?: boolean;
}

export default function FileUpload({
  accept = 'image/*',
  label,
  value,
  onChange,
  isImage = true,
  disabled = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileToCloudinary = async (base64Data: string) => {
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          folder: 'genhd_medical_results',
          resourceType: isImage ? 'image' : 'raw',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const finalUrl = data.url || base64Data;
        onChange(finalUrl);
        if (finalUrl.startsWith('http')) {
          toast.success('Đã tải file lên Cloudinary thành công!');
        }
      } else {
        onChange(base64Data);
      }
    } catch {
      onChange(base64Data);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      await uploadFileToCloudinary(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isCloudinaryUrl = value && value.startsWith('http');

  return (
    <div className="space-y-1.5 mb-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-600">{label}</label>
        {isCloudinaryUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            <CloudCheck className="w-3.5 h-3.5" />
            <span>Lưu trên Cloudinary</span>
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          handleDrop(e);
        }}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          disabled
            ? 'border-slate-200 bg-slate-100/60 opacity-80 cursor-not-allowed'
            : dragOver
            ? 'border-sky-500 bg-sky-50/50 cursor-pointer'
            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer'
        }`}
      >
        <input
          type="file"
          accept={accept}
          ref={fileInputRef}
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            if (disabled) return;
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-2 text-sky-600">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-xs font-bold">Đang tải file lên Cloudinary...</p>
          </div>
        ) : value ? (
          <div>
            {isImage ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Preview"
                  className="max-h-40 rounded-lg object-contain border border-slate-200 shadow-sm"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange('');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Xóa ảnh / Thay ảnh khác</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-5 h-5 text-sky-600" />
                <span className="text-sm font-medium text-slate-700">File PDF đã sẵn sàng</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Chọn file khác</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
            </div>
            <p className="text-sm font-medium text-slate-700">
              Nhấp hoặc kéo thả file vào đây
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Định dạng hỗ trợ: {accept}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
