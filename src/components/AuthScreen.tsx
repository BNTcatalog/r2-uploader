import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (password: string) => Promise<boolean>;
  error: string | null;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, error }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    await onLogin(password);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <LockKeyhole className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Photo Uploader</h1>
          <p className="text-gray-500 mt-2 text-center">
            Enter the password to upload your photos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-all duration-300 bg-white/60 
                  ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                placeholder="Enter password"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500 transition-all duration-300 animate-fadeIn">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className={`w-full py-3 rounded-lg transition-all duration-300
              ${isLoading || !password.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Access Uploader'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;