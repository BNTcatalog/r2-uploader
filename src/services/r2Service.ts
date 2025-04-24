import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadedFile } from '../types';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_PUBLIC_DOMAIN,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

export const uploadToR2 = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadedFile> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  try {
    const key = `${Date.now()}-${file.name}`;
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

    // Validate environment variables
    if (!import.meta.env.VITE_R2_ACCESS_KEY_ID || 
        !import.meta.env.VITE_R2_SECRET_ACCESS_KEY || 
        !import.meta.env.VITE_R2_BUCKET_NAME || 
        !import.meta.env.VITE_R2_PUBLIC_DOMAIN ||
        !import.meta.env.VITE_PUBLIC_IMAGE_DOMAIN) {
      throw new Error('Missing required R2 configuration');
    }

    // Get presigned URL for upload
    const presignedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: file.type,
      }),
      { expiresIn: 3600 } // URL expires in 1 hour
    );

    // Upload file using presigned URL
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    // Use the public image domain for the URL
    const publicUrl = `${import.meta.env.VITE_PUBLIC_IMAGE_DOMAIN}/${key}`;

    return {
      id: key,
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Upload error details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Please check your internet connection and try again');
      } else if (error.message.includes('AccessDenied')) {
        throw new Error('Access denied: Please check your R2 credentials and bucket permissions');
      } else if (error.message.includes('NoSuchBucket')) {
        throw new Error('Bucket not found: Please verify your R2 bucket configuration');
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    throw new Error('Upload failed: An unexpected error occurred');
  }
};

// Test function for connectivity
export const testR2Connection = async (): Promise<boolean> => {
  const testKey = `test-${Date.now()}.txt`;
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

  try {
    // Upload test file
    const presignedUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        ContentType: 'text/plain',
      }),
      { expiresIn: 3600 }
    );

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: 'test',
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    if (!uploadResponse.ok) {
      return false;
    }

    // Delete test file
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    } catch (deleteError) {
      console.error('Failed to delete test file:', deleteError);
      // Don't fail the test if cleanup fails
    }

    return true;
  } catch (error) {
    console.error('Test connection error:', error);
    return false;
  }
};