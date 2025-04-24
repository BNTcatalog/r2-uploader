import React from 'react';
import AuthScreen from './components/AuthScreen';
import FileUploader from './components/FileUploader';
import { useAuth } from './hooks/useAuth';
import { useUpload } from './hooks/useUpload';

function App() {
  const { isAuthenticated, error: authError, login, logout } = useAuth();
  const { 
    isUploading, 
    progress, 
    error: uploadError, 
    recentUploads,
    uploadFiles
  } = useUpload();

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <AuthScreen onLogin={login} error={authError} />
      ) : (
        <FileUploader
          onUpload={uploadFiles}
          onLogout={logout}
          isUploading={isUploading}
          progress={progress}
          error={uploadError}
          recentUploads={recentUploads}
        />
      )}
    </div>
  );
}

export default App;