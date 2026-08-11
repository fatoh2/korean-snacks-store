import { Buffer } from 'node:buffer';

const UPLOAD_WORKER_URL = 'https://korean-snacks-image-upload.korean-snacks.workers.dev/upload';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);

    const upstream = await fetch(UPLOAD_WORKER_URL, {
      method: 'POST',
      headers: {
        Authorization: request.headers.authorization || '',
        'Content-Type': request.headers['content-type'] || 'application/octet-stream',
      },
      body: Buffer.concat(chunks),
    });

    const payload = await upstream.text();
    response.status(upstream.status);
    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return response.send(payload);
  } catch (error) {
    console.error('Image upload proxy failed', error);
    return response.status(502).json({ error: 'Image upload service is temporarily unavailable' });
  }
}
