'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-card rounded-2xl shadow-modal border border-border w-full max-w-sm fade-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${confirmVariant === 'danger' ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle size={20} className={confirmVariant === 'danger' ? 'text-red-600' : 'text-green-600'} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-700 text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{message}</p>
            </div>
            <button onClick={onCancel} className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-600 text-foreground bg-muted hover:bg-border rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-sm font-600 text-white rounded-lg transition-colors scale-click
                ${confirmVariant === 'danger' ?'bg-red-600 hover:bg-red-700' :'bg-green-600 hover:bg-green-700'
                }
              `}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}