import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI Client Lazily
let genAIClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Peringatan: GEMINI_API_KEY tidak ditemukan di environment variables!");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_IF_ABSENT",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

// Fallback manual Prayer Times calculation for major Indonesian coordinates (approximate formula)
// This guarantees that the user ALWAYS receives functional prayer times even if the external API is offline or has issues.
function computeFallbackPrayerTimes(latitude: number, longitude: number, dateStr: string): any {
  // Approximate prayer times in WIB/WITA/WIT based on Indonesian geographic characteristics.
  // Standard Indonesia timezone UTC+7 (WIB), UTC+8 (WITA), UTC+9 (WIT)
  // Longitudinal timezone calculations
  const date = new Date(dateStr);
  const month = date.getMonth(); // 0 is Jan, 11 is Dec

  // Standard base times for Jakarta at local noon, adjusted for longitude.
  // We can calculate offset from meridian (UTC+7 uses 105 degrees meridian, UTC+8 uses 120, UTC+9 uses 135)
  let utcOffset = 7;
  if (longitude >= 115) utcOffset = 8; // Bali / Makassar / Kalimantan C/T
  if (longitude >= 130) utcOffset = 9; // Maluku / Papua

  // Equation of time approximation & solar declination
  // For a generic, clean experience we provide standard offsets centered around the longitude
  const meridian = utcOffset * 15;
  const lonDiff = (longitude - meridian) * 4; // minutes difference from meridian

  // Base prayer times at equator/low-latitudes (Minutes from midnight)
  // Standard solar times fluctuate slightly throughout the year
  const seasonalVary = Math.sin((dayOfYear(date) - 80) * 2 * Math.PI / 365) * 12; // fluctuation in minutes

  // Sunrise/sunset varies based on latitude
  let dayLengthFactor = -latitude * Math.sin((dayOfYear(date) - 172) * 2 * Math.PI / 365) * 1.2;

  // Midday is around 12:00 local time
  const dzuhurMinutes = 12 * 60 - lonDiff - seasonalVary;
  const subuhMinutes = 4 * 60 + 35 - lonDiff - seasonalVary - dayLengthFactor;
  const imsakMinutes = subuhMinutes - 10;
  const terbitMinutes = 5 * 60 + 55 - lonDiff - seasonalVary - dayLengthFactor * 1.5;
  const asharMinutes = 15 * 60 + 10 - lonDiff - seasonalVary + dayLengthFactor * 0.5;
  const maghribMinutes = 18 * 60 + 2 - lonDiff - seasonalVary + dayLengthFactor;
  const isyaMinutes = 19 * 60 + 12 - lonDiff - seasonalVary + dayLengthFactor;

  const minutesToTime = (min: number) => {
    let cleanMin = Math.round(min);
    if (cleanMin < 0) cleanMin += 24 * 60;
    if (cleanMin >= 24 * 60) cleanMin -= 24 * 60;
    const h = Math.floor(cleanMin / 60);
    const m = cleanMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return {
    imsak: minutesToTime(imsakMinutes),
    subuh: minutesToTime(subuhMinutes),
    terbit: minutesToTime(terbitMinutes),
    dzuhur: minutesToTime(dzuhurMinutes),
    ashar: minutesToTime(asharMinutes),
    maghrib: minutesToTime(maghribMinutes),
    isya: minutesToTime(isyaMinutes),
    date: dateStr,
    hijriDate: "Estimasi Hijriah",
    timezone: `UTC+${utcOffset}`
  };
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// ==========================================
// API Endpoints
// ==========================================

// 1. Endpoint Jadwal Sholat Berbasis Koordinat (Menggunakan Kemenag API Proxy)
app.get("/api/prayer-times", async (req, res) => {
  const { latitude, longitude, date } = req.query;
  const requestDate = (date as string) || new Date().toISOString().split('T')[0];

  // Pastikan parameter koordinat valid
  if (!latitude || !longitude) {
    // Default Jakarta
    return res.json(computeFallbackPrayerTimes(-6.2088, 106.8456, requestDate));
  }

  const latNum = parseFloat(latitude as string);
  const lngNum = parseFloat(longitude as string);

  try {
    // Aladhan API accepts DD-MM-YYYY format
    let formattedDateForApi = requestDate;
    if (requestDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = requestDate.split('-');
      formattedDateForApi = `${day}-${month}-${year}`;
    }

    const url = `https://api.aladhan.com/v1/timings/${formattedDateForApi}?latitude=${latNum}&longitude=${lngNum}&method=20`;
    
    // Gunakan timeout yang cukup untuk fetch proxy
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const apiResponse = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      throw new Error("Gagal mengambil jadwal dari server eksternal.");
    }

    const json = await apiResponse.json();
    const timings = json.data.timings;
    const hijri = json.data.date.hijri;

    // Bersihkan hasil format waktu (HH:MM saja, hilangkan penunjuk zona waktu yang berlebih dari Aladhan)
    const cleanTime = (t: string) => t.split(' ')[0];

    return res.json({
      imsak: cleanTime(timings.Imsak),
      subuh: cleanTime(timings.Fajr),
      terbit: cleanTime(timings.Sunrise),
      dzuhur: cleanTime(timings.Dhuhr),
      ashar: cleanTime(timings.Asr),
      maghrib: cleanTime(timings.Maghrib), // WAKTU BERBUKA!
      isya: cleanTime(timings.Isha),
      date: requestDate,
      hijriDate: `${hijri.day} ${hijri.month.ar} ${hijri.year} H`,
      timezone: json.data.meta.timezone
    });

  } catch (error) {
    console.warn("Menggunakan perhitungan lokal (fallback) karena:", (error as Error).message);
    const computed = computeFallbackPrayerTimes(latNum, lngNum, requestDate);
    return res.json(computed);
  }
});

// 2. Endpoint AI Chat Spiritual Puasa (Bertenaga Gemini 3.5-flash)
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Kolom 'messages' bertipe array wajib diisi." });
  }

  try {
    const ai = getGenAIClient();
    
    // Format struktur chat harian
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }]
    }));

    // Instruksi sistem agar asisten ramah, berpengetahuan Islami, bijak, memberikan anjuran medis dan gizi yang baik untuk sahur dan iftar
    const systemPrompt = `Anda adalah "Sahabat Ruhiyah AI", asisten spiritual & pendamping puasa sunnah Senin-Kamis yang bijaksana, ramah, dan berempati tinggi.
Tujuan Anda adalah membantu pengguna memperkuat komitmen puasa sunnah, memelihara kesehatan fisik, dan memberikan nasehat bergizi untuk menu Sahur dan Iftar (porsinya, jenis makanan hidrasi, menghindari maag, dsb).
Gunakan bahasa Indonesia yang santun, hangat, dan menyejukkan hati. Selalu dukung argumen Anda dengan keutamaan spiritual (hadits shahih) atau ilmu medis modern secara seimbang.

Informasi Pengguna Saat Ini:
- Tanggal hari ini: ${userContext?.todayDate || "Tidak diketahui"}
- Hari: ${userContext?.todayDayName || "Tidak diketahui"}
- Status Target Puasa Hari Ini: ${userContext?.isFastingDay ? "Hari ini adalah hari Puasa (" + userContext?.dayType + ")" : "Hari ini bukan Senin/Kamis, tapi pengguna bebas melakukan puasa ganti/sunnah lainnya"}
- Lokasi Pengguna: ${userContext?.cityName || "Indonesia"}
- Total Puasa Pekan Ini: ${userContext?.weekStreak || 0} kali
- Total Puasa yang Berhasil Dicatat: ${userContext?.totalCompleted || 0} kali

Aturan Tambahan:
1. Jika pengguna bertanya tentang Niat atau Doa berbuka, jelaskan dengan senang hati, sertakan tulisan Arab, transliterasi latin, dan terjemahan bahasa Indonesia yang anggun.
2. Jika pengguna meminta tips sahur atau buka, berikan 2-4 poin praktis (misalnya, pentingnya karbohidrat kompleks saat sahur dan hidrasi air hangat saat berbuka).
3. Buat tanggapan Anda tetap ringkas, menyejukkan, mudah dibaca, dan gunakan paragraf pendek yang rapi serta bullet points secukupnya. Jangan menulis terlalu panjang kecuali diminta.`;

    const chatResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedMessages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const replyText = chatResponse.text || "Mohon maaf, saya sedang merenung sejenak. Silakan coba kirim pesan Anda kembali.";
    
    return res.json({ text: replyText });

  } catch (error) {
    console.error("Kesalahan panggilan Gemini API:", error);
    return res.status(500).json({ 
      error: "Gagal memproses pesan AI.",
      details: (error as Error).message
    });
  }
});

// ==========================================
// Integrasi Vite (Development & Production)
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mode Development (Mengaktifkan Vite Middleware)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Mode Production (Menyajikan berkas statis dari folder /dist)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server "Tasbih - Puasa & Jadwal Shalat" beroperasi di port http://localhost:${PORT}`);
  });
}
if (!process.env.NETLIFY) {
  startServer();
}

export { app };
