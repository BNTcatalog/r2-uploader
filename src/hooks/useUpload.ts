import { useState } from 'react';
import { UploadState, UploadedFile } from '../types';
import { uploadToR2 } from '../services/r2Service';

export const useUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    files: [],
    recentUploads: []
  });

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files.length) return;
    
    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null
    }));

    const filesToUpload = Array.from(files);
    const newFiles: UploadedFile[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Update progress
        const progressPerFile = 100 / filesToUpload.length;
        setUploadState(prev => ({
          ...prev,
          progress: Math.round(progressPerFile * i)
        }));

        // Upload file
        const uploadedFile = await uploadToR2(file, (progress) => {
          setUploadState(prev => ({
            ...prev,
            progress: Math.round((i * progressPerFile) + (progress * progressPerFile / 100))
          }));
        });

        // Log the URL of the uploaded file
        console.log('File uploaded successfully. URL:', uploadedFile.url);

        newFiles.push(uploadedFile);
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        files: [...prev.files, ...newFiles],
        recentUploads: newFiles
      }));
      
      // Reset progress after 2 seconds
      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          progress: 0
        }));
      }, 2000);
      
      return newFiles;
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
      return null;
    }
  };

  const clearRecentUploads = () => {
    setUploadState(prev => ({
      ...prev,
      recentUploads: []
    }));
  };

  return {
    ...uploadState,
    uploadFiles,
    clearRecentUploads
  };
};