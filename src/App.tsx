import React, { useState, useEffect } from 'react';
import { FastingLog, LocationData, PrayerTimeData } from './types';
import { DEFAULT_CITIES, getFastingStatus, getRandomQuote } from './utils';
import PrayerTimes from './components/PrayerTimes';
import FastingTracker from './components/FastingTracker';
import NiatDoa from './components/NiatDoa';
import Tasbih from './components/Tasbih';
import AIChat from './components/AIChat';
import Profile from './components/Profile';
import Login from './components/Login';
import QiblaCompass from './components/QiblaCompass';
import { Sparkles, Calendar, BookOpen, Clock, Heart, MessageSquare, LogOut, User, Compass } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getFastingLogsForUser, upsertFastingLog } from './firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  // Muat data wilayah default
  const [selectedCity, setSelectedCity] = useState<LocationData>(DEFAULT_CITIES[0]);
  
  // Muat data logs puasa dari localStorage jika ada
  const [logs, setLogs] = useState<FastingLog[]>([]);
  const [quote, setQuote] = useState(() => getRandomQuote());
  const [todayPrayerTimes, setTodayPrayerTimes] = useState<PrayerTimeData | null>(null);
  
  // Tab Aktif harian
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tracker' | 'niat' | 'tasbih' | 'chat' | 'profile' | 'kiblat'>('dashboard');

  // Cek sesi login tersimpan menggunakan Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setCurrentUser(user.email);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Muat riwayat logs puasa ketika currentUser berubah
  useEffect(() => {
    if (!currentUser) return;
    
    getFastingLogsForUser(currentUser)
      .then((firestoreLogs) => {
        setLogs(firestoreLogs);
        // Backup ke localStorage
        localStorage.setItem(`tasbih_fasting_logs_${currentUser}`, JSON.stringify(firestoreLogs));
      })
      .catch((e) => {
        console.error('Error loading logs from Firestore:', e);
        // Fallback ke localStorage jika gagal memuat dari Firestore
        try {
          const stored = localStorage.getItem(`tasbih_fasting_logs_${currentUser}`);
          if (stored) {
            setLogs(JSON.parse(stored));
          } else {
            setLogs([]); // Reset logs if new user
          }
        } catch (err) {
          console.error('Error loading logs from localStorage:', err);
        }
      });
  }, [currentUser]);

  // Perbarui state lokal dan backup ke localStorage
  const handleLogsChanged = (updatedLogs: FastingLog[]) => {
    setLogs(updatedLogs);
    if (!currentUser) return;
    try {
      localStorage.setItem(`tasbih_fasting_logs_${currentUser}`, JSON.stringify(updatedLogs));
    } catch (e) {
      console.error('Error saving logs to localStorage:', e);
    }
  };

  // Simpan spesifik log ke Firestore
  const handleLogSaved = async (newLog: FastingLog) => {
    if (!currentUser) return;
    try {
      await upsertFastingLog(currentUser, newLog);
    } catch (e) {
      console.error('Error saving log to Firestore:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Firebase onAuthStateChanged akan menangani reset state currentUser
      setLogs([]);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = (email: string) => {
    // onAuthStateChanged akan menangani ini, tapi kita set optimistically
    setCurrentUser(email);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const todayStatus = getFastingStatus(new Date());

  // Statistik ringan pekan ini
  const statsThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Set to Monday
    startOfWeek.setHours(0,0,0,0);

    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek && log.completed;
    });

    return weekLogs.length;
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans antialiased">
      
      {/* 1. Header Hero Area dengan Tema Bento Premium */}
      <header className="max-w-7xl mx-auto pt-8 pb-3 px-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-900 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">{todayStatus.label}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mt-1">
            Fast<span className="font-extrabold text-emerald-400">Mate</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">Asisten spiritual &amp; pelacak puasa sunnah bertenaga AI</p>
        </div>
        
        <div className="text-left md:text-right flex flex-col md:items-end gap-3">
          <div>
            <p className="text-base md:text-lg font-semibold text-slate-200">
              {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
            <p className="text-emerald-500 text-xs md:text-sm font-mono mt-0.5">
              Dzulqadah 1447 H • {selectedCity.cityName}, ID
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800/80 rounded-lg cursor-pointer transition-colors"
              title="Lihat Profil"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300 max-w-[120px] md:max-w-[200px] truncate">{currentUser}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quote Harian Inspiratif */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
        <div className="bg-emerald-950/20 border border-emerald-950/20 rounded-2xl px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            <strong className="text-emerald-400 mr-1">Hikmah Hari Ini &bull;</strong> &ldquo;{quote.text}&rdquo; <span className="text-slate-400 font-medium">({quote.source})</span>
          </p>
          <span className="text-[9px] font-bold uppercase shrink-0 py-1 px-2.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            {quote.category}
          </span>
        </div>
      </div>

      {/* 2. Primary Navigation Bar */}
      <nav className="bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between overflow-x-auto h-14 scrollbar-none gap-2">
            
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  activeTab === 'dashboard' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>Jadwal Shalat</span>
              </button>

              <button
                onClick={() => setActiveTab('tracker')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  activeTab === 'tracker' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Tracker Puasa</span>
              </button>

              <button
                onClick={() => setActiveTab('niat')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  activeTab === 'niat' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Niat &amp; Doa</span>
              </button>

              <button
                onClick={() => setActiveTab('tasbih')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  activeTab === 'tasbih' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Heart className="w-4 h-4 shrink-0" />
                <span>Tasbih Digital</span>
              </button>

              <button
                onClick={() => setActiveTab('kiblat')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  activeTab === 'kiblat' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Kiblat</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                  activeTab === 'chat' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5'
                }`}
                title="Konsultasi Nutrisi & Gizi AI"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Asisten Gizi AI</span>
              </button>
            </div>

            {/* Sub Info Status Tracker & Waktu Puasa */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {todayPrayerTimes && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Imsak</span>
                    <span className="text-xs font-mono font-bold text-orange-300">{todayPrayerTimes.imsak}</span>
                  </div>
                  <div className="w-px h-3 bg-slate-700 mx-1"></div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Buka</span>
                    <span className="text-xs font-mono font-bold text-emerald-300">{todayPrayerTimes.maghrib}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-xl shrink-0">
                <span>Pekan Ini: {statsThisWeek()} Puasa</span>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* 3. Main Dashboard Contents Grid */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Dynamic Display based on selection */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Fasting times & Prayer Times calendar (Left Pane) */}
            <div className="md:col-span-8">
              <PrayerTimes
                onPrayerTimesFetched={setTodayPrayerTimes}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
              />
            </div>

            {/* Quick Niat & Small Tasbih shortcut column (Right Pane) */}
            <div className="md:col-span-4 flex flex-col gap-6">
              
              {/* Box Fasting Guidance Widget */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/25 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase">Panduan Puasa Hari Ini</span>
                <h3 className="text-base font-bold text-white mt-1.5 mb-2">Mengapa Puasa Senin-Kamis?</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-4">
                  Rasulullah SAW bersabda: &ldquo;Amalan-amalan dihadapkan kepada Allah pada hari Senin dan Kamis, maka aku suka jika amalanku dihadapkan saat aku sedang berpuasa.&rdquo; (HR. Tirmidzi)
                </p>
                <button
                  onClick={() => setActiveTab('niat')}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition duration-150 cursor-pointer"
                >
                  Lihat Lafal Niat Lengkap
                </button>
              </div>

              {/* Direct Quick Tasbih mini view */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800/80 hover:border-emerald-500/30 transition-colors shadow-lg">
                <h4 className="font-semibold text-sm text-slate-100">Butuh Dzikir Cepat?</h4>
                <p className="text-slate-400 text-xs mt-1 mb-4">Gunakan digital tasbih untuk memperbanyak istighfar.</p>
                <button
                  onClick={() => setActiveTab('tasbih')}
                  className="w-full py-2 bg-slate-950 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold font-sans transition cursor-pointer"
                >
                  🚀 Buka Tasbih Digital
                </button>
              </div>

              {/* Direct Quick Gizi AI shortcut */}
              <div className="bg-gradient-to-tr from-slate-900 to-slate-950 rounded-3xl p-6 border border-slate-850 flex flex-col justify-between shadow-lg">
                <div>
                  <h4 className="font-semibold text-sm text-emerald-400">Nutrisi Sahur &amp; Iftar</h4>
                  <p className="text-slate-400 text-xs mt-2 mb-4 font-sans leading-relaxed">Konsultasikan porsi air minum dan menu rendah maag bertenaga AI.</p>
                </div>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-sans transition cursor-pointer"
                >
                  💬 Tanya Sahabat AI
                </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div>
            <FastingTracker 
              logs={logs} 
              onLogsChanged={handleLogsChanged} 
              onLogSaved={handleLogSaved}
            />
          </div>
        )}

        {activeTab === 'niat' && (
          <div className="max-w-2xl mx-auto">
            <NiatDoa />
          </div>
        )}

        {activeTab === 'tasbih' && (
          <div className="max-w-xl mx-auto">
            <Tasbih />
          </div>
        )}

        {activeTab === 'kiblat' && (
          <div className="max-w-2xl mx-auto">
            <QiblaCompass selectedCity={selectedCity} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto">
            <AIChat
              selectedCity={selectedCity}
              totalCompleted={logs.filter(l => l.completed).length}
              weekStreak={statsThisWeek()}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto">
            <Profile 
              email={currentUser} 
              selectedCity={selectedCity} 
              logs={logs} 
              onLogout={handleLogout} 
            />
          </div>
        )}

      </main>

      {/* 4. Elegant Footer */}
      <footer className="bg-slate-950/40 border-t border-slate-900 py-8 text-center text-slate-500 text-xs shrink-0 select-none pb-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p className="font-semibold text-slate-400 font-sans">
            Aplikasi Puasa Senin-Kamis &bull; Tasbih &bull; Jadwal Shalat Kemenag
          </p>
          <p className="text-[10px] leading-relaxed max-w-md mx-auto text-slate-500">
            Didesain sebagai sarana pembinaan rohani harian dan gizi yang ideal bagi Muslim di Indonesia. Informasi jadwal ditentukan dengan formula Kemenag RI dan koordinasi global Aladhan API.
          </p>
          <div className="pt-2 text-[10px] text-emerald-500 font-semibold font-sans">
            Waktu Server: 2026 &bull; Salam Kebajikan
          </div>
        </div>
      </footer>

    </div>
  );
}
