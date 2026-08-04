import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

const DEV_ORIGINS = ['http://localhost:5174', 'http://localhost:5173'];

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === env.ALLOWED_ORIGIN || DEV_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

async function verifyAdmin(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error('Missing bearer token');

  const { payload } = await jwtVerify(match[1], GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  });

  const adminEmails = env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase());
  if (!payload.email || !adminEmails.includes(payload.email.toLowerCase())) {
    throw new Error('Not an admin');
  }
  return payload.email;
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/upload' || request.method !== 'POST') {
      return new Response('Not found', { status: 404, headers });
    }

    try {
      await verifyAdmin(request, env);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid form data' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const file = form.get('file');
    const key = form.get('key');

    if (!(file instanceof File) || !file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid image file' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    const maxUploadBytes = 5 * 1024 * 1024;
    if (file.size > maxUploadBytes) {
      return new Response(JSON.stringify({ error: 'Image exceeds the 5 MB limit' }), {
        status: 413,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
    if (typeof key !== 'string' || !/^product-images\/[a-zA-Z0-9_-]+$/.test(key)) {
      return new Response(JSON.stringify({ error: 'Invalid key' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return new Response(JSON.stringify({ url: `${env.R2_PUBLIC_URL}/${key}` }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
