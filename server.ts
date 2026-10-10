import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

// Pastikan DISABLE_HMR aktif di lingkungan AI Studio untuk mencegah error WebSocket tak terduga
if (process.env.DISABLE_HMR === undefined) {
  process.env.DISABLE_HMR = 'true';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const httpServer = http.createServer(app);

// Percayai proxy saat berada di balik reverse-proxy seperti Cloud Run, Nginx, Caddy, Cloudflare
app.set('trust proxy', 1);

// Header Keamanan Produksi
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Penanganan CORS fleksibel untuk hosting frontend terpisah atau monolithic
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['*'];

  const origin = req.headers.origin;
  if (origin) {
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Body parser dengan batas 25MB untuk foto resolusi tinggi dalam format Base64
app.use(express.json({ limit: '25mb' }));

// In-memory Rate Limiting untuk perlindungan endpoint AI dari abuse & spam
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Bersihkan memori rate limiter setiap 10 menit
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

function aiRateLimiter(maxRequests = 30, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(rawIp);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(rawIp, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error:
          'Terlalu banyak permintaan AI dalam 1 menit. Silakan tunggu beberapa saat sebelum mencoba lagi.',
      });
      return;
    }

    record.count++;
    next();
  };
}

// Endpoint Health Check untuk monitoring status server dan kesiapan Gemini API Key
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    env: process.env.NODE_ENV || 'development',
  });
});

// Endpoint AI Generator Kata Promosi
app.post(
  '/api/ai/generate-promo',
  aiRateLimiter(30, 60 * 1000),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(503).json({
          error:
            'API Key Gemini belum disetel di server (Settings > Secrets). Silakan atur GEMINI_API_KEY untuk menggunakan fitur AI.',
        });
        return;
      }

      const { promptText, photos, style = 'santai' } = req.body;

      const trimmedText = typeof promptText === 'string' ? promptText.trim() : '';
      const photosList = Array.isArray(photos) ? photos : [];

      // Validasi input: harus ada teks atau minimal satu foto
      if (!trimmedText && photosList.length === 0) {
        res.status(400).json({
          error: 'Mohon sertakan teks keterangan produk atau pilih minimal 1 foto produk.',
        });
        return;
      }

      // Validasi batas ukuran teks (maksimal 5000 karakter untuk keamanan)
      if (trimmedText.length > 5000) {
        res.status(400).json({
          error: 'Teks keterangan produk terlalu panjang (maksimal 5000 karakter).',
        });
        return;
      }

      // Validasi dan sanitasi foto (maksimal 3 foto, batasan ukuran 8MB string base64 per foto)
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      const selectedPhotos = photosList.slice(0, 3);

      for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        if (photo && typeof photo.dataUrl === 'string') {
          if (photo.dataUrl.length > 8 * 1024 * 1024) {
            res.status(400).json({
              error: `Foto ke-${i + 1} berukuran terlalu besar (maksimal 6MB per foto untuk AI).`,
            });
            return;
          }

          const match = photo.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1] || 'image/jpeg';
            const base64Data = match[2];

            if (!/^image\/(jpeg|png|webp|gif|heic)$/i.test(mimeType)) {
              res.status(400).json({
                error: `Format gambar ${mimeType} tidak didukung oleh AI. Gunakan JPG, PNG, atau WebP.`,
              });
              return;
            }

            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        }
      }

      // Gaya promosi yang dipilih
      let styleDescription = '';
      switch (style) {
        case 'singkat':
          styleDescription =
            'Gaya SINGKAT & PADAT: Tuliskan 3–5 kalimat ringkas to-the-point. Langsung sebutkan nama produk, keunggulan pokok, dan ajakan pesan yang cepat dipahami pembaca.';
          break;
        case 'profesional':
          styleDescription =
            'Gaya PROFESIONAL: Nada bahasa rapi, informatif, dan kredibel. Susun dengan struktur katalog jelas: Nama Produk di baris pertama, Keunggulan, Spesifikasi (jika disebutkan), dan Cara Order.';
          break;
        case 'marketplace':
          styleDescription =
            'Gaya FACEBOOK MARKETPLACE & OLX: Gunakan format postingan jual-beli marketplace. Baris pertama Nama Produk dengan huruf kapital menarik, baris harga, kondisi, keunggulan barang, kelengkapan, dan ajakan langsung chat/inbox/WA.';
          break;
        case 'santai':
        default:
          styleDescription =
            'Gaya SANTAI & AKRAB: Bahasa ramah, bersahabat, seperti menyapa follower di WhatsApp Story atau Instagram/TikTok. Gunakan beberapa emoji yang sesuai dan hashtag relevan di baris paling bawah.';
          break;
      }

      const systemInstruction = `Anda adalah asisten copywriter profesional khusus UMKM dan pedagang online di Indonesia.
Tugas Anda adalah membuat kata-kata promosi penjualan yang menarik, persuasif, dan siap disalin untuk WhatsApp, Instagram, TikTok Shop, atau Facebook Marketplace.

PANDUAN GAYA:
${styleDescription}

ATURAN MUTLAK KEBENARAN (JANGAN MENGARANG):
1. JANGAN PERNAH MENGARANG harga, diskon, garansi, lokasi, kondisi, atau spesifikasi teknis yang TIDAK TERDAPAT pada teks pengguna dan TIDAK TERLIHAT pada foto produk.
2. Jika harga atau nomor kontak tidak ada pada bahan, JANGAN buat angka fiktif. Tuliskan tanda pengganti yang jelas seperti "[Tanyakan Harga]" atau cukup fokus mengulas keunggulan produk.
3. Jika foto produk disertakan, amati bentuk, warna, dan detail fisik nyata pada foto, lalu sebutkan keunggulan fisiknya dengan tepat.
4. Gunakan Bahasa Indonesia yang wajar dan menarik minat pembeli di Indonesia.
5. Susun dengan paragraf dan spasi baris yang rapi agar nyaman dibaca di layar HP.
6. Berikan langsung hasil teks promosinya tanpa pembuka ("Tentu, ini hasilnya:") atau penutup ("Semoga bermanfaat").`;

      let userPromptContent = '';
      if (trimmedText) {
        userPromptContent = `Berikut adalah catatan / informasi produk dari pedagang:\n"""\n${trimmedText}\n"""\n\nTolong buatkan teks promosi terbaik berdasarkan informasi di atas sesuai gaya yang diminta.`;
      } else {
        userPromptContent = `Pedagang belum menuliskan teks, namun telah melampirkan foto produk di atas. Tolong amati foto produk tersebut dan buatkan kata-kata promosi menarik untuk produk ini sesuai gaya yang diminta.`;
      }

      parts.push({ text: userPromptContent });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts,
        },
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const generatedText = response.text;
      if (!generatedText || !generatedText.trim()) {
        res.status(502).json({
          error:
            'AI tidak menghasilkan teks promosi. Silakan coba lagi dengan foto atau keterangan yang lebih jelas.',
        });
        return;
      }

      res.json({
        success: true,
        generatedText: generatedText.trim(),
      });
    } catch (error: unknown) {
      console.error('Error saat menghasilkan kata promosi AI:', error);

      let statusCode = 500;
      let errorMessage = 'Terjadi kesalahan pada server saat memproses permintaan AI.';

      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes('api key') ||
          msg.includes('unauthorized') ||
          msg.includes('401') ||
          msg.includes('403')
        ) {
          statusCode = 401;
          errorMessage =
            'API Key Gemini tidak valid atau izin ditolak. Periksa kembali GEMINI_API_KEY di Settings > Secrets.';
        } else if (
          msg.includes('quota') ||
          msg.includes('429') ||
          msg.includes('rate limit') ||
          msg.includes('resource_exhausted')
        ) {
          statusCode = 429;
          errorMessage =
            'Batas kuota Gemini tercapai. Silakan tunggu beberapa saat sebelum mencoba lagi.';
        } else if (msg.includes('timeout') || msg.includes('deadline')) {
          statusCode = 504;
          errorMessage = 'Permintaan AI melebihi batas waktu (timeout). Silakan coba lagi.';
        } else if (msg.includes('network') || msg.includes('fetch')) {
          statusCode = 502;
          errorMessage = 'Gagal menghubungi server Gemini. Pastikan koneksi internet server stabil.';
        } else {
          errorMessage = `Gagal memproses AI: ${error.message}`;
        }
      }

      res.status(statusCode).json({ error: errorMessage });
    }
  }
);

// Mode dev vs produksi Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Mode Produksi: Sajikan static assets dari direktori dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`FotoPromosi server berjalan pada port ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
