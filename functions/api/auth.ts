// functions/api/auth.ts

import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
    // This environment variable needs to be set in your Cloudflare Pages dashboard
    AUTH_PASSWORD?: string;
}

interface AuthRequestBody {
    password?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;

        // --- Environment Variable Check ---
        const correctPassword = env.AUTH_PASSWORD;
        if (!correctPassword) {
            console.error('Server configuration error. AUTH_PASSWORD environment variable is not set in Cloudflare.');
            return new Response(JSON.stringify({ success: false, error: 'Server configuration error. AUTH_PASSWORD environment variable is not set in Cloudflare.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Request Body Parsing ---
        let requestBody: AuthRequestBody;
        try {
            requestBody = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid request body.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { password } = requestBody;

        // --- Input Validation ---
        if (typeof password !== 'string' || !password) {
            return new Response(JSON.stringify({ success: false, error: 'Password is required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- Password Comparison ---
        if (password === correctPassword) {
            // Authentication successful
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // Authentication failed
            return new Response(JSON.stringify({ success: false, error: 'Invalid password.' }), {
                status: 401, // Unauthorized
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        console.error('Authentication function error:', error);
        return new Response(JSON.stringify({ success: false, error: 'An internal server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// Optional: Handle other methods like GET if needed, otherwise they return 405 Method Not Allowed by default
export const onRequestGet: PagesFunction<Env> = async () => {
    return new Response(null, { status: 405 });
}
