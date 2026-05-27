import { LocationData, FastingLog, FastingQuote } from './types';

// Daftar Kota di Indonesia beserta koordinatnya
export const DEFAULT_CITIES: LocationData[] = [
  { cityName: 'Jakarta', latitude: -6.2088, longitude: 106.8456 },
  { cityName: 'Surabaya', latitude: -7.2575, longitude: 112.7521 },
  { cityName: 'Bandung', latitude: -6.9175, longitude: 107.6191 },
  { cityName: 'Pekanbaru', latitude: 0.5071, longitude: 101.4478 },
  { cityName: 'Indragiri Hilir', latitude: -0.3221, longitude: 103.1582 },
  { cityName: 'Medan', latitude: 3.5952, longitude: 98.6722 },
  { cityName: 'Makassar', latitude: -5.1477, longitude: 119.4327 },
  { cityName: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
  { cityName: 'Palembang', latitude: -2.9761, longitude: 104.7754 },
  { cityName: 'Denpasar', latitude: -8.6705, longitude: 115.2126 },
  { cityName: 'Balikpapan', latitude: -1.2654, longitude: 116.8312 },
  { cityName: 'Jayapura', latitude: -2.5488, longitude: 140.6690 },
];

// Deteksi hari Senin atau Kamis
export function getFastingDayType(date: Date): 'Senin' | 'Kamis' | 'Lainnya' {
  const day = date.getDay();
  if (day === 1) return 'Senin';
  if (day === 4) return 'Kamis';
  return 'Lainnya';
}

// Menghitung status puasa hari ini
export function getFastingStatus(date: Date = new Date()) {
  const dayType = getFastingDayType(date);
  const isFastingDay = dayType !== 'Lainnya';
  return {
    isFastingDay,
    dayType,
    label: isFastingDay ? `Hari Puasa Sunah ${dayType}` : 'Hari Biasa (Bukan Puasa)',
  };
}

// Fungsi pembantu untuk memformat tanggal masehi ke bahasa Indonesia
export function formatFullLocalDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Menghitung hitung mundur antara dua waktu (HH:MM:SS)
export function getCountdownString(targetTimeStr: string, benchmarkDate: Date = new Date()): { stringVal: string; totalSeconds: number } {
  const [hoursStr, minutesStr] = targetTimeStr.split(':');
  const target = new Date(benchmarkDate);
  target.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);

  // Jika waktu target sudah lewat di hari yang sama, buat target ke besok pagi/besok
  let diffMs = target.getTime() - benchmarkDate.getTime();
  if (diffMs < 0) {
    target.setDate(target.getDate() + 1);
    diffMs = target.getTime() - benchmarkDate.getTime();
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;

  const paddedHrs = String(hrs).padStart(2, '0');
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');

  return {
    stringVal: `${paddedHrs}:${paddedMins}:${paddedSecs}`,
    totalSeconds: diffSecs,
  };
}

// Kalender Hijriah Sederhana
export function getHijriCalendarFallback(date: Date = new Date()): string {
  // Metode ramalan lunar aritmatika sederhana untuk wilayah Indonesia
  // Referensi: Algoritma penyesuaian Hijriah
  const baseTime = new Date('2024-03-12T00:00:00Z').getTime(); // Contoh acuan 1 Ramadhan 1445 H
  const diffTime = date.getTime() - baseTime;
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Konversi kasar sekitar 29.53059 hari per bulan Hijriah
  // 354.367 hari per tahun Hijriah
  const hijriTotalDays = parseFloat((daysDiff + 510125).toFixed(0)); // Offset acuan ke kalender hijriah
  
  const hYear = Math.floor(hijriTotalDays / 354.367);
  const daysInYear = hijriTotalDays % 354.367;
  
  const months = [
    'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir', 'Jumadil Ula', 'Jumadil Akhir',
    'Rajab', 'Syaban', 'Ramadhan', 'Syawwal', 'Dzulqadah', 'Dzulhijjah'
  ];
  
  const hMonthIndex = Math.floor(daysInYear / 29.53);
  const hDay = Math.floor((daysInYear % 29.53) + 1);
  
  const hijriMonth = months[hMonthIndex] || 'Muharram';
  const hijriYear = 1447; // Dikunci sewajarnya pada estimasi tahun 2026 masehi (Hijriah 1447 H)
  
  // Hitung perkiraan tanggal Hijriah untuk 2026:
  // Mei 2026 bertepatan dengan Dzulqadah / Dzulhijjah 1447 H
  const monthMap2026: { [key: number]: { dayOffset: number, monthName: string, year: number } } = {
    0: { dayOffset: 12, monthName: 'Rajab', year: 1447 },
    1: { dayOffset: 11, monthName: 'Syaban', year: 1447 },
    2: { dayOffset: 10, monthName: 'Ramadhan', year: 1447 },
    3: { dayOffset: 9, monthName: 'Syawwal', year: 1447 },
    4: { dayOffset: 8, monthName: 'Dzulqadah', year: 1447 },
    5: { dayOffset: 7, monthName: 'Dzulhijjah', year: 1447 },
    6: { dayOffset: 6, monthName: 'Muharram', year: 1448 },
    7: { dayOffset: 5, monthName: 'Safar', year: 1448 },
    8: { dayOffset: 4, monthName: 'Rabiul Awwal', year: 1448 },
    9: { dayOffset: 3, monthName: 'Rabiul Akhir', year: 1448 },
    10: { dayOffset: 2, monthName: 'Jumadil Ula', year: 1448 },
    11: { dayOffset: 1, monthName: 'Jumadil Akhir', year: 1448 },
  };

  const currentMonthIdx = date.getMonth();
  const currentDay = date.getDate();
  const mapData = monthMap2026[currentMonthIdx] || { dayOffset: 8, monthName: 'Dzulqadah', year: 1447 };
  
  let convertedDay = (currentDay + mapData.dayOffset) % 30;
  if (convertedDay === 0) convertedDay = 30;
  
  return `${convertedDay} ${mapData.monthName} ${mapData.year} H`;
}

// Kalender puasa Senin: Mendapatkan daftar semua hari Senin-Kamis dalam bulan/tahun tertentu
export function getFastingDaysInMonth(year: number, month: number): Date[] {
  const result: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day === 1 || day === 4) { // Senin (1) atau Kamis (4)
      result.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return result;
}

// Niat dan Doa Puasa Senin-Kamis & Berbuka
export const ISLAMIC_TEXTS = {
  niatSenin: {
    arabic: 'نَوَيْتُ صَوْمَ يَوْمِ الِاثْنَيْنِ سُنَّةً لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma yaumil itsnaini sunnatan lillahi ta\'ala.',
    translation: 'Aku berniat puasa sunah hari Senin karena Allah Ta\'ala.',
    virtue: 'Hari Senin adalah hari di mana amal ibadah dihadapkan kepada Allah, dan hari kelahiran serta diturunkannya wahyu kepada Rasulullah SAW.'
  },
  niatKamis: {
    arabic: 'نَوَيْتُ صَوْمَ يَوْمِ الْخَمِيسِ سُنَّةً لِلَّهِ تَعَالَى',
    latin: 'Nawaitu shauma yaumil khamisi sunnatan lillahi ta\'ala.',
    translation: 'Aku berniat puasa sunah hari Kamis karena Allah Ta\'ala.',
    virtue: 'Hari Kamis juga merupakan hari pengangkatan amal manusia ke langit. Rasulullah SAW senang ketika amal beliau diangkat saat beliau sedang berpuasa.'
  },
  doaBuka: {
    arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
    latin: 'Dzahabaz-zhama’u wabtallatil-‘uruuqu wa tsabatal-ajru in syaa Allaah.',
    translation: 'Telah hilang rasa haus, telah basah urat-urat, dan telah ditetapkan pahala, insya Allah.',
    additional: 'اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ (Allahumma laka sumtu wa bika aamantu wa \'ala rizqika aftartu) juga lazim dibaca menjelang berbuka.'
  }
};

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function computeFallbackPrayerTimes(latitude: number, longitude: number, dateStr: string): PrayerTimeData {
  const date = new Date(dateStr);
  let utcOffset = 7;
  if (longitude >= 115) utcOffset = 8;
  if (longitude >= 130) utcOffset = 9;

  const meridian = utcOffset * 15;
  const lonDiff = (longitude - meridian) * 4;
  const seasonalVary = Math.sin((dayOfYear(date) - 80) * 2 * Math.PI / 365) * 12;
  let dayLengthFactor = -latitude * Math.sin((dayOfYear(date) - 172) * 2 * Math.PI / 365) * 1.2;

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

// Kutipan Inspirasi Puasa
export const FASTING_QUOTES: FastingQuote[] = [
  {
    text: 'Amal-amal manusia diperiksa di hadapan Allah dalam setiap pekan dua kali, yaitu pada hari Senin dan Kamis. Maka semua hamba yang beriman diampuni dosa-dosanya, kecuali seorang hamba yang antara dia dan saudaranya terjadi permusuhan.',
    source: 'HR. Muslim',
    category: 'Keutamaan'
  },
  {
    text: 'Puasa adalah tameng (perisai) dari api neraka.',
    source: 'HR. Bukhari & Muslim',
    category: 'Keutamaan'
  },
  {
    text: 'Bagi orang yang berpuasa akan mendapatkan dua kebahagiaan: kebahagiaan ketika dia berbuka dan kebahagiaan ketika dia bertemu dengan Rabb-nya.',
    source: 'HR. Bukhari',
    category: 'Keutamaan'
  },
  {
    text: 'Puasa Senin-Kamis membantu detoksifikasi tubuh, mengurangi inflamasi, serta meregenerasi sel-sel imun baru setiap minggunya.',
    source: 'Sains Medis Modern',
    category: 'Kesehatan'
  },
  {
    text: 'Puasa melatih kesabaran, memperkuat disiplin spiritual, dan meningkatkan empati sosial kita terhadap mereka yang lapar dan kekurangan.',
    source: 'Refleksi Spiritual',
    category: 'Motivasi'
  },
];

export function getRandomQuote(): FastingQuote {
  const index = Math.floor(Math.random() * FASTING_QUOTES.length);
  return FASTING_QUOTES[index];
}

// Menghitung arah kiblat relatif terhadap Utara Geografis
export function getQiblaDirection(latitude: number, longitude: number): number {
  const MECCA_LAT = 21.422487;
  const MECCA_LNG = 39.826206;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(latitude);
  const lat2 = toRad(MECCA_LAT);
  const dlng = toRad(MECCA_LNG - longitude);

  const y = Math.sin(dlng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);
  
  let qibla = toDeg(Math.atan2(y, x));
  return (qibla + 360) % 360;
}
