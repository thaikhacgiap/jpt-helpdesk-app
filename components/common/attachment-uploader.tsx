"use client";

import { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  FileArchive, 
  FileCode, 
  Trash2, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  HardDrive,
  Database
} from "lucide-react";
import { 
  AttachedFile, 
  StorageConfig, 
  getStorageConfig, 
  uploadFileToStorage, 
  formatFileSize 
} from "@/lib/storage-service";

interface AttachmentUploaderProps {
  files: AttachedFile[];
  onChange: (updatedFiles: AttachedFile[]) => void;
  module?: string;
  readOnly?: boolean;
  maxFiles?: number;
}

export default function AttachmentUploader({
  files = [],
  onChange,
  module = "tickets",
  readOnly = false,
  maxFiles = 10
}: AttachmentUploaderProps) {
  const [config, setConfig] = useState<StorageConfig | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getStorageConfig().then(setConfig);
  }, []);

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) || mimeType.includes('image')) {
      return <FileImage className="text-emerald-500 shrink-0" size={18} />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="text-green-600 shrink-0" size={18} />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed')) {
      return <FileArchive className="text-amber-500 shrink-0" size={18} />;
    }
    if (['pdf'].includes(ext) || mimeType.includes('pdf')) {
      return <FileText className="text-rose-500 shrink-0" size={18} />;
    }
    if (['js', 'ts', 'json', 'html', 'css', 'py'].includes(ext)) {
      return <FileCode className="text-blue-500 shrink-0" size={18} />;
    }
    return <FileText className="text-slate-400 shrink-0" size={18} />;
  };

  const handleFilesSelected = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setUploadError(null);
    setUploadSuccess(null);

    if (files.length + selectedFiles.length > maxFiles) {
      setUploadError(`Tối đa chỉ được đính kèm ${maxFiles} tệp.`);
      return;
    }

    setIsUploading(true);
    const newAttachedFiles: AttachedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const result = await uploadFileToStorage(file, module);

      if (result.success && result.attachedFile) {
        newAttachedFiles.push(result.attachedFile);
      } else {
        setUploadError(result.error || `Tải tệp "${file.name}" thất bại.`);
      }
    }

    if (newAttachedFiles.length > 0) {
      onChange([...files, ...newAttachedFiles]);
      const providerName = config?.provider === "google_drive" ? "Google Drive" : "Supabase Storage";
      setUploadSuccess(`Đã lưu ${newAttachedFiles.length} tệp lên ${providerName} thành công!`);
      setTimeout(() => setUploadSuccess(null), 4000);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (id: string) => {
    if (readOnly) return;
    const updated = files.filter(f => f.id !== id);
    onChange(updated);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Tệp đính kèm ({files.length})</span>
          {config && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              config.provider === "google_drive" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {config.provider === "google_drive" ? (
                <>
                  <HardDrive size={11} className="text-emerald-600" />
                  <span>Google Drive</span>
                </>
              ) : (
                <>
                  <Database size={11} className="text-blue-600" />
                  <span>Supabase Storage</span>
                </>
              )}
            </span>
          )}
        </div>
        {!readOnly && config?.provider === "google_drive" && (
          <span className="text-[11px] text-emerald-600 font-medium">
            Lưu trực tiếp Google Drive ({config.drive_folder_name || "Mặc định"})
          </span>
        )}
      </div>

      {/* Upload Zone */}
      {!readOnly && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFilesSelected(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            dragOver 
              ? "border-emerald-500 bg-emerald-50/50" 
              : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesSelected(e.target.files)}
            multiple
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold py-1">
              <RefreshCw size={18} className="animate-spin" />
              <span>Đang tải tệp lên Google Drive...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UploadCloud size={18} />
              </div>
              <p className="text-xs text-slate-700 font-medium">
                <span className="font-bold text-emerald-600 underline">Nhấp để chọn tệp</span> hoặc kéo thả vào đây
              </p>
              <p className="text-[10px] text-slate-400">
                Hỗ trợ PDF, Word, Excel, Hình ảnh, ZIP... (Tối đa {config?.max_file_size_mb || 50} MB/tệp)
              </p>
            </>
          )}
        </div>
      )}

      {/* Alerts */}
      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {getFileIcon(file.type, file.name)}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      file.provider === "google_drive" 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {file.provider === "google_drive" ? "Google Drive" : "Supabase"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {formatFileSize(file.size)} • Tải lên: {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                    title={file.provider === "google_drive" ? "Xem trên Google Drive" : "Mở file"}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Xóa file đính kèm"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        readOnly && (
          <p className="text-xs text-slate-400 italic">Chưa có tệp đính kèm nào.</p>
        )
      )}
    </div>
  );
}
