import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadedFile } from '../types';

// Create S3 client using environment variables
const createS3Client = () => {
  const accountId = import.meta.env.VITE_ACCOUNT_ID;
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
  const publicDomain = import.meta.env.VITE_R2_PUBLIC_DOMAIN;

  if (!accountId || !accessKeyId || !secretAccessKey || !publicDomain) {
    throw new Error('Missing required R2 configuration. Please check your environment variables.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: publicDomain,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Initialize the client
const s3Client = createS3Client();

export const uploadToR2 = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadedFile> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;
  const publicImageDomain = import.meta.env.VITE_PUBLIC_IMAGE_DOMAIN;

  // Validate environment variables
  if (!bucketName || !publicImageDomain) {
    throw new Error('Missing required R2 configuration. Please check your environment variables.');
  }

  try {
    const key = `${Date.now()}-${file.name}`;

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
    const publicUrl = `${publicImageDomain}/${key}`;

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
  const bucketName = import.meta.env.VITE_R2_BUCKET_NAME;

  if (!bucketName) {
    console.error('Missing bucket name configuration');
    return false;
  }

  const testKey = `test-${Date.now()}.txt`;

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