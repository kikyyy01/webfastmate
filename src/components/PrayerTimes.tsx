import React, { useState, useEffect } from 'react';
import { PrayerTimeData, LocationData } from '../types';
import { DEFAULT_CITIES, getCountdownString, getHijriCalendarFallback, computeFallbackPrayerTimes } from '../utils';
import { MapPin, Navigation, Clock, Moon, Sunrise, Sunset, Loader } from 'lucide-react';

interface PrayerTimesProps {
  onPrayerTimesFetched: (times: PrayerTimeData) => void;
  selectedCity: LocationData;
  setSelectedCity: (city: LocationData) => void;
}

export default function PrayerTimes({ onPrayerTimesFetched, selectedCity, setSelectedCity }: PrayerTimesProps) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);

  // Perbarui jam setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch jadwal sholat dari server proxy backend
  const fetchPrayerTimes = async (city: LocationData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const d = new Date();
      const tzoffset = d.getTimezoneOffset() * 60000;
      const todayLocal = new Date(d.getTime() - tzoffset).toISOString().split('T')[0];
      
      const params = new URLSearchParams({
        latitude: String(city.latitude),
        longitude: String(city.longitude),
        date: todayLocal,
      });

      const response = await fetch(`/api/prayer-times?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Gagal mengambil jadwal sholat.');
      }
      const data: PrayerTimeData = await response.json();
      setPrayerTimes(data);
      onPrayerTimesFetched(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Koneksi bermasalah. Menggunakan simulasi waktu lokal.');
      
      // Gunakan fallback perhitungan di sisi klien jika server mati atau tidak terjangkau
      const d = new Date();
      const tzoffset = d.getTimezoneOffset() * 60000;
      const todayLocal = new Date(d.getTime() - tzoffset).toISOString().split('T')[0];
      const fallbackData = computeFallbackPrayerTimes(city.latitude, city.longitude, todayLocal);
      setPrayerTimes(fallbackData);
      onPrayerTimesFetched(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetch jika koordinat kota berubah
  useEffect(() => {
    fetchPrayerTimes(selectedCity);
  }, [selectedCity]);

  // Handler menggunakan deteksi lokasi GPS browser
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung layanan koordinat lokasi.');
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const customLoc: LocationData = {
          cityName: 'Lokasi GPS Saya',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          method: 'GPS',
        };
        setSelectedCity(customLoc);
        setGeoLocating(false);
      },
      (error) => {
        console.warn('Geolocation Error:', error);
        alert('Gagal mengakses koordinat. Pastikan izin lokasi aktif.');
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const dayNameIndo = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(currentTime);
  const calendarHijri = prayerTimes?.hijriDate || getHijriCalendarFallback(currentTime);

  // Dapatkan sisa waktu untuk sholat / puasa berikutnya
  const getNextEvent = () => {
    if (!prayerTimes) return null;

    const events = [
      { name: 'Imsak', time: prayerTimes.imsak, isFastingLimit: true },
      { name: 'Subuh', time: prayerTimes.subuh },
      { name: 'Terbit', time: prayerTimes.terbit },
      { name: 'Dzuhur', time: prayerTimes.dzuhur },
      { name: 'Ashar', time: prayerTimes.ashar },
      { name: 'Maghrib', time: prayerTimes.maghrib, isBukaPuasa: true },
      { name: 'Isya', time: prayerTimes.isya },
    ];

    const benchmark = currentTime;
    const currentHrs = benchmark.getHours();
    const currentMins = benchmark.getMinutes();
    const currentSecs = benchmark.getSeconds();
    const currentTotalSecs = currentHrs * 3600 + currentMins * 60 + currentSecs;

    // Cari jadwal berikutnya di hari ini
    for (const ev of events) {
      const [h, m] = ev.time.split(':');
      const evTotalSecs = parseInt(h, 10) * 3600 + parseInt(m, 10) * 60;
      if (evTotalSecs > currentTotalSecs) {
        const countdown = getCountdownString(ev.time, benchmark);
        return { ...ev, countdownStr: countdown.stringVal, secondsLeft: countdown.totalSeconds };
      }
    }

    // Jika melewati hari, event berikutnya adalah Imsak besok
    const firstEv = events[0];
    const countdown = getCountdownString(firstEv.time, benchmark);
    return { ...firstEv, countdownStr: countdown.stringVal, secondsLeft: countdown.totalSeconds, isTomorrow: true };
  };

  const nextEvent = getNextEvent();

  // Dapatkan ikon penunjuk waktu shalat
  const getEventIcon = (name: string) => {
    switch (name) {
      case 'Imsak': return <Clock className="w-4 h-4 text-orange-400" />;
      case 'Subuh': return <Moon className="w-4 h-4 text-emerald-400" />;
      case 'Terbit': return <Sunrise className="w-4 h-4 text-amber-400" />;
      case 'Dzuhur': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'Ashar': return <Clock className="w-4 h-4 text-orange-400" />;
      case 'Maghrib': return <Sunset className="w-4 h-4 text-amber-500" />;
      case 'Isya': return <Moon className="w-4 h-4 text-indigo-400" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div id="prayer-times-section" className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800/80">
      
      {/* Header Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-dashed border-slate-800 mb-6 font-sans">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            Waktu Setempat
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-mono text-3xl font-bold text-white tracking-tight">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <span className="text-xs text-slate-400 font-semibold font-mono">WIB</span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            {dayNameIndo}, {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} / <span className="text-emerald-400 font-medium">{calendarHijri}</span>
          </p>
        </div>

        {/* Pemilih Lokasi / GPS */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400 pointer-events-none" />
            <select
              value={selectedCity.cityName}
              onChange={(e) => {
                const targetCity = DEFAULT_CITIES.find(c => c.cityName === e.target.value);
                if (targetCity) setSelectedCity(targetCity);
              }}
              className="pl-9 pr-8 py-2 text-xs font-semibold bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 select-none cursor-pointer text-slate-200 appearance-none h-9 inline-flex align-middle"
            >
              <option disabled>{selectedCity.method === 'GPS' ? 'Lokasi GPS Saya' : 'Pilih Wilayah'}</option>
              {selectedCity.method === 'GPS' && <option value="Lokasi GPS Saya">📍 Lokasi GPS Saya</option>}
              {DEFAULT_CITIES.map((c) => (
                <option key={c.cityName} value={c.cityName}>
                  {c.cityName}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGPSLocation}
            disabled={geoLocating}
            className="p-2 bg-slate-950 text-emerald-400 hover:bg-slate-900 border border-slate-800 disabled:opacity-50 rounded-xl transition duration-200 cursor-pointer"
            title="Gunakan GPS Browser"
          >
            {geoLocating ? <Loader className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Countdown Widget Utama */}
      {prayerTimes && nextEvent && (
        <div className="bg-gradient-to-tr from-emerald-950/50 to-slate-950 border border-emerald-500/20 text-white rounded-2xl p-5 mb-6 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                {nextEvent.isFastingLimit ? 'BATAS SAHUR (IMSAK)' : (nextEvent.isBukaPuasa ? 'WAKTU BERBUKA PUASA' : 'SHALAT BERIKUTNYA')}
              </p>
              <h3 className="text-lg font-bold font-sans mt-0.5 text-white">
                {nextEvent.name} &bull; <span className="font-mono text-emerald-300">{nextEvent.time}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {nextEvent.isBukaPuasa ? 'Persiapkan takjil sehat untuk membatalkan puasa Anda.' : 'Pelihara fokus spiritual dan kondisi jasmani yang mulia.'}
              </p>
            </div>
            
            <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 px-4 py-3 rounded-xl text-center md:min-w-[140px] shadow-sm shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Mundur</span>
              <div className="font-mono text-2xl font-bold tracking-tight mt-0.5 text-white">
                {nextEvent.countdownStr}
              </div>
              <span className="text-[9px] text-slate-400 lowercase">kemajuan harian</span>
            </div>
          </div>
          
          {/* Background overlay design details */}
          <div className="absolute right-[-40px] bottom-[-40px] w-40 h-40 rounded-full bg-emerald-500/5 blur-xl"></div>
        </div>
      )}

      {/* Tabel Jadwal Sholat Lengkap */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
          <Loader className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs">Menyinkronkan jadwal shalat dari Kemenag...</p>
        </div>
      ) : prayerTimes ? (
        <div className="space-y-2">
          {[
            { label: 'Imsak', value: prayerTimes.imsak, note: 'Batas sahur' },
            { label: 'Subuh', value: prayerTimes.subuh, note: 'Shalat fardhu' },
            { label: 'Terbit', value: prayerTimes.terbit, note: 'Batas subuh' },
            { label: 'Dzuhur', value: prayerTimes.dzuhur, note: 'Shalat fardhu' },
            { label: 'Ashar', value: prayerTimes.ashar, note: 'Shalat fardhu' },
            { label: 'Maghrib', value: prayerTimes.maghrib, note: 'Waktu Berbuka!', isFastingTarget: true },
            { label: 'Isya', value: prayerTimes.isya, note: 'Shalat fardhu' },
          ].map((item) => {
            const isNext = nextEvent?.name === item.label;
            return (
              <div
                key={item.label}
                className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${
                  isNext
                    ? 'bg-emerald-500/10 border border-emerald-500/35 shadow-sm'
                    : 'bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isNext ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-350'}`}>
                    {getEventIcon(item.label)}
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${isNext ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {item.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">{item.note}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.isFastingTarget && (
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Buka Puasa
                    </span>
                  )}
                  <div className={`font-mono text-sm font-bold ${isNext ? 'text-emerald-300 text-base' : 'text-slate-300'}`}>
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl">
          {errorMsg || 'Gagal memuat jadwal shalat.'}
        </div>
      )}
    </div>
  );
}
