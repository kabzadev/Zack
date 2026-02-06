import { Router, Request, Response } from 'express';

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD4F5xs2nayiYdKJ1q3jqUdGt53Lla3AkA';
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// POST /api/gemini/generate — proxy to Gemini image generation
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { contents, generationConfig } = req.body;

    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Missing or invalid contents array' });
    }

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data?.error?.message || response.status);
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request to Gemini' });
  }
});

export default router;
