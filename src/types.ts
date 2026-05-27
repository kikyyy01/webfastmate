export interface PrayerTimeData {
  imsak: string;
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  date: string;
  hijriDate?: string;
  gregorianDate?: string;
  timezone?: string;
}

export interface LocationData {
  cityName: string;
  latitude: number;
  longitude: number;
  method?: string;
}

export interface FastingLog {
  id: string;
  date: string; // ISO format string (YYYY-MM-DD)
  dayType: 'Senin' | 'Kamis' | 'Lainnya';
  completed: boolean;
  notes?: string;
  sahurCompleted?: boolean;
  mood?: string; // e.g., 'Sangat Baik', 'Biasa Saja', 'Lelah'
}

export interface FastingQuote {
  text: string;
  source: string;
  category: 'Keutamaan' | 'Kesehatan' | 'Motivasi';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
