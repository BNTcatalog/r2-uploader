export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  error: string | null;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  files: UploadedFile[];
  recentUploads: UploadedFile[];
}