'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'info',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Circle */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            isDanger
              ? 'bg-red-50 text-red-600 border border-red-100'
              : isSuccess
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : 'bg-sky-50 text-sky-600 border border-sky-100'
          }`}
        >
          {isDanger ? (
            <Trash2 className="w-7 h-7" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-7 h-7" />
          ) : (
            <AlertCircle className="w-7 h-7" />
          )}
        </div>

        {/* Title & Message */}
        <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed px-2">{message}</p>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
