'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, File, X, CheckCircle2, AlertCircle } from 'lucide-react';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: 'xlsx' | 'pdf';
  status: 'ready' | 'processing' | 'done' | 'error';
  rawFile: File; // <--- Simpan file asli di sini
}

interface FileUploadZoneProps {
  onFilesReady: (files: UploadedFile[]) => void;
}

export default function FileUploadZone({ onFilesReady }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((f, i) => ({
      id: `upload-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.name.endsWith('.xlsx') || f.name.endsWith('.xls') ? 'xlsx' : 'pdf',
      status: 'ready',
      rawFile: f, // <--- Masukkan objek File
    }));
    const updated = [...files, ...newFiles];
    setFiles(updated);
    onFilesReady(updated);
  };

  const removeFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesReady(updated);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
            : 'border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.pdf"
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
        />
        <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          <Upload size={28} className={isDragging ? 'text-emerald-600' : 'text-slate-500'} />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-800">
            {isDragging ? 'Lepaskan file di sini' : 'Seret & lepas file log fingerprint'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            atau <span className="text-emerald-600 font-semibold underline-offset-2 hover:underline">pilih dari komputer</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Format didukung: <strong>.xlsx</strong>, <strong>.pdf</strong> — Maks. 10 MB per file
          </p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${file.type === 'xlsx' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {file.type === 'xlsx'
                  ? <FileSpreadsheet size={16} className="text-emerald-600" />
                  : <File size={16} className="text-rose-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
              </div>
              {file.status === 'done' && <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />}
              {file.status === 'error' && <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />}
              {(file.status === 'ready' || file.status === 'processing') && (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {file.status === 'processing' ? 'Memproses...' : 'Siap'}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                title="Hapus file ini"
              >
                <X size={14} className="text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}