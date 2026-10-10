import { GoogleGenAI } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error:
          'API Key Gemini belum disetel di Vercel (Project Settings > Environment Variables). Silakan tambahkan GEMINI_API_KEY.',
      });
    }

    const { promptText, photos, style = 'santai' } = req.body || {};

    const trimmedText = typeof promptText === 'string' ? promptText.trim() : '';
    const photosList = Array.isArray(photos) ? photos : [];

    if (!trimmedText && photosList.length === 0) {
      return res.status(400).json({
        error: 'Mohon sertakan teks keterangan produk atau pilih minimal 1 foto produk.',
      });
    }

    if (trimmedText.length > 5000) {
      return res.status(400).json({
        error: 'Teks keterangan produk terlalu panjang (maksimal 5000 karakter).',
      });
    }

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    const selectedPhotos = photosList.slice(0, 3);

    for (let i = 0; i < selectedPhotos.length; i++) {
      const photo = selectedPhotos[i];
      if (photo && typeof photo.dataUrl === 'string') {
        const match = photo.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1] || 'image/jpeg';
          const base64Data = match[2];

          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }
    }

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

    // Model fallback sequence
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let generatedText = '';
    let lastCaughtError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts,
          },
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response.text && response.text.trim()) {
          generatedText = response.text.trim();
          break;
        }
      } catch (modelErr) {
        lastCaughtError = modelErr;
        console.warn(`Model ${modelName} gagal dipanggil, mencoba model cadangan:`, modelErr);
      }
    }

    if (!generatedText) {
      if (lastCaughtError) {
        throw lastCaughtError;
      }
      return res.status(502).json({
        error:
          'AI tidak menghasilkan teks promosi. Silakan coba lagi dengan foto atau keterangan yang lebih jelas.',
      });
    }

    return res.status(200).json({
      success: true,
      generatedText,
    });
  } catch (error: unknown) {
    console.error('Error saat menghasilkan kata promosi AI:', error);

    let statusCode = 500;
    let errorMessage = 'Terjadi kesalahan pada server saat memproses permintaan AI.';

    if (error instanceof Error) {
      const rawMsg = error.message;
      const msg = rawMsg.toLowerCase();

      if (
        msg.includes('api key') ||
        msg.includes('unauthorized') ||
        msg.includes('401') ||
        msg.includes('403')
      ) {
        statusCode = 401;
        errorMessage =
          'API Key Gemini tidak valid atau izin ditolak. Periksa kembali GEMINI_API_KEY di Settings > Secrets / Environment Variables.';
      } else if (
        msg.includes('quota') ||
        msg.includes('resource_exhausted') ||
        msg.includes('rate limit') ||
        msg.includes('429')
      ) {
        statusCode = 429;
        errorMessage =
          'Batas kuota harian Gemini saat ini sedang penuh. Silakan tunggu beberapa saat atau hubungi administrator untuk meningkatkan batas kuota.';
      } else if (
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('unavailable') ||
        msg.includes('overloaded')
      ) {
        statusCode = 503;
        errorMessage =
          'Server AI Gemini sedang mengalami lonjakan trafik tinggi (503). Silakan coba kirim ulang dalam 5–10 detik.';
      } else if (msg.includes('timeout') || msg.includes('deadline')) {
        statusCode = 504;
        errorMessage = 'Permintaan AI melebihi batas waktu (timeout). Silakan coba lagi.';
      } else if (msg.includes('network') || msg.includes('fetch')) {
        statusCode = 502;
        errorMessage = 'Gagal menghubungi server Gemini. Pastikan koneksi internet stabil.';
      } else {
        try {
          const parsed = JSON.parse(rawMsg);
          const nestedMsg = parsed?.error?.message || parsed?.message;
          if (nestedMsg) {
            errorMessage = `Kendala AI: ${nestedMsg}`;
          } else {
            errorMessage = 'Terjadi kesalahan saat memproses permintaan ke model AI.';
          }
        } catch {
          errorMessage = `Gagal memproses AI: ${rawMsg}`;
        }
      }
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
}
