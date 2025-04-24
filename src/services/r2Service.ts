// src/services/r2Service.ts

// Note: No need for AWS SDK client or presigner here anymore!
import { UploadedFile } from '../types';

// No S3 client needed here - it's handled by the backend function.

export const uploadToR2 = async (
  file: File,
  onProgress: (progress: number) => void // Keep onProgress for potential future XHR-based progress tracking
): Promise<UploadedFile> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // --- 1. Get Presigned URL from our backend function ---
  let presignResponseData: { success: boolean; presignedUrl?: string; publicUrl?: string; key?: string, error?: string };
  try {
    const presignResponse = await fetch('/api/r2presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
      }),
    });

    presignResponseData = await presignResponse.json();

    if (!presignResponse.ok || !presignResponseData.success || !presignResponseData.presignedUrl || !presignResponseData.publicUrl || !presignResponseData.key) {
      console.error("Presign API Error:", presignResponseData);
      throw new Error(presignResponseData.error || `Failed to get presigned URL (Status: ${presignResponse.status})`);
    }

  } catch (error) {
    console.error('Error fetching presigned URL:', error);
    throw new Error(error instanceof Error ? `Failed to prepare upload: ${error.message}` : 'Failed to prepare upload');
  }

  const { presignedUrl, publicUrl, key } = presignResponseData;

  // --- 2. Upload file using the Presigned URL ---
  try {
    // Simulate progress for now, as Fetch API doesn't easily support upload progress.
    // For real progress, you'd use XMLHttpRequest.
    onProgress(50); // Indicate starting upload

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    onProgress(100); // Indicate completion

    if (!uploadResponse.ok) {
      // Attempt to get more detailed error from R2 if possible
      let errorText = `Upload failed with status: ${uploadResponse.status}`;
      try {
        const r2ErrorText = await uploadResponse.text();
        // Basic check for XML error format from S3/R2
        if (r2ErrorText.includes('<Code>')) {
          errorText += ` - R2 Error: ${r2ErrorText.substring(0, 200)}`; // Limit length
        }
        console.error("R2 Upload Error Response:", r2ErrorText);
      } catch (_) {
        // Ignore if reading response body fails
      }
      throw new Error(errorText);
    }

    // --- 3. Return UploadedFile details ---
    return {
      id: key, // Use the key from the presign response
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl, // Use the public URL from the presign response
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Upload error details:', error);
    // Provide more specific feedback if possible
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error during upload: Please check your internet connection and try again');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Upload failed: An unexpected error occurred');
  }
};

// The testR2Connection function is removed as it relied on client-side credentials.
// You could create a new API endpoint `/api/r2/test` in a function to test connectivity server-side if needed.
