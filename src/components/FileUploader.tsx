import React, { useCallback, useState, useRef } from 'react';
import { Upload, X, Check, Image, LogOut, Copy, CheckCheck } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  onUpload: (files: FileList | File[]) => Promise<UploadedFile[] | null>;
  onLogout: () => void;
  isUploading: boolean;
  progress: number;
  error: string | null;
  recentUploads: UploadedFile[];
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  onLogout,
  isUploading,
  progress,
  error,
  recentUploads
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      e.target.value = '';
    }
  }, [onUpload]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Image Uploader</h1>
            <p className="text-gray-500">Upload images to your R2 bucket</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 text-gray-600 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div
              className={`relative bg-white p-8 rounded-xl shadow-sm mb-6 transition-all duration-300
                ${isDragging
                  ? 'border-2 border-blue-400 bg-blue-50 shadow-lg'
                  : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center py-6">
                <div className="mb-4 p-4 bg-blue-50 rounded-full">
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-blue-500'}`} />
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  {isDragging ? 'Drop to upload!' : 'Upload your images'}
                </h2>
                <p className="text-gray-500 mb-4 text-center">
                  Drag & drop your images here or click to browse
                </p>
                <button
                  type="button"
                  onClick={handleButtonClick}
                  disabled={isUploading}
                  className={`px-6 py-3 rounded-lg transition-all duration-300 ${isUploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    }`}
                >
                  Select Files
                </button>
              </div>

              {isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl z-10 animate-fadeIn">
                  <div className="w-16 h-16 mb-4 relative">
                    <svg className="animate-spin w-16 h-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-600">{`Uploading... ${progress}%`}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <X className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {progress === 100 && !isUploading && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6 animate-fadeIn">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">
                    {recentUploads.length > 1
                      ? `${recentUploads.length} files uploaded successfully!`
                      : 'File uploaded successfully!'}
                  </h3>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Uploads</h2>

            {recentUploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Image className="w-12 h-12 mb-3 text-gray-300" />
                <p>No recent uploads</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUploads.map(file => (
                  <div key={file.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start space-x-3">
                      {file.type.startsWith('image/') && (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate mb-1">{file.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{formatFileSize(file.size)}</p>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={file.url}
                            readOnly
                            className="text-xs bg-white border border-gray-200 rounded px-2 py-1 flex-1 truncate"
                          />
                          <button
                            onClick={() => handleCopyUrl(file.id, file.url)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy URL"
                          >
                            {copiedId === file.id ? (
                              <CheckCheck className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;