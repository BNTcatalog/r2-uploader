// functions/api/r2/presign.ts

import type { PagesFunction } from '@cloudflare/workers-types';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Define the expected environment variables
// These need to be set in your Cloudflare Pages dashboard
interface Env {
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_DOMAIN?: string; // The endpoint URL for R2
    PUBLIC_IMAGE_DOMAIN?: string; // Your custom public domain for accessing images
}

// Define the expected request body structure
interface PresignRequestBody {
    fileName?: string;
    contentType?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;

        // --- Environment Variable Validation ---
        const {
            R2_ACCOUNT_ID,
            R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY,
            R2_BUCKET_NAME,
            R2_PUBLIC_DOMAIN,
            PUBLIC_IMAGE_DOMAIN
        } = env;

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_DOMAIN || !PUBLIC_IMAGE_DOMAIN) {
            console.error('Missing one or more R2 environment variables in Cloudflare.');
            return new Response(JSON.stringify({ success: false, error: 'Server configuration error (R2).' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Request Body Parsing ---
        let requestBody: PresignRequestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid request body.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { fileName, contentType } = requestBody;

        // --- Input Validation ---
        if (typeof fileName !== 'string' || !fileName || typeof contentType !== 'string' || !contentType) {
            return new Response(JSON.stringify({ success: false, error: 'fileName and contentType are required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (!contentType.startsWith('image/')) {
            return new Response(JSON.stringify({ success: false, error: 'Only image files are allowed.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }


        // --- S3 Client Initialization (inside the function) ---
        const s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, // Construct the endpoint
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        // --- Generate Key and Presign URL ---
        //const key = `${Date.now()}-${fileName}`;
        const key = fileName;
        const publicUrl = `${PUBLIC_IMAGE_DOMAIN}/${key}`; // Construct the final public URL

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            // ACL: 'public-read', // Optional: Set if your bucket requires public read ACLs for public access via custom domain
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // Expires in 5 minutes

        // --- Return Response ---
        return new Response(JSON.stringify({
            success: true,
            presignedUrl,
            publicUrl,
            key // Send the key back for potential use in the UploadedFile object
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('R2 presign function error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return new Response(JSON.stringify({ success: false, error: `Failed to generate presigned URL: ${errorMessage}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// Optional: Handle other methods
export const onRequestGet: PagesFunction<Env> = async () => {
    return new Response(null, { status: 405 });
}
