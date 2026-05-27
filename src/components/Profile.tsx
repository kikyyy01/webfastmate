import React from 'react';
import { User, Mail, Award, CalendarDays, MapPin } from 'lucide-react';
import { LocationData, FastingLog } from '../types';

interface ProfileProps {
  email: string;
  selectedCity: LocationData;
  logs: FastingLog[];
  onLogout: () => void;
}

export default function Profile({ email, selectedCity, logs, onLogout }: ProfileProps) {
  const totalCompleted = logs.filter(log => log.completed).length;
  
  // Menghitung jumlah puasa beruntun (streak) - asumsi sederhana
  // Untuk implementasi lebih kompleks bisa menghitung berdasarkan tanggal yang berurutan
  const sortedLogs = [...logs].filter(l => l.completed).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  if (sortedLogs.length > 0) {
    streak = 1;
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const current = new Date(sortedLogs[i].date);
      const next = new Date(sortedLogs[i+1].date);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Jika puasa berjarak kurang dari 4 hari (Senin ke Kamis atau Kamis ke Senin)
      if (diffDays <= 4) {
        streak++;
      } else {
        break;
      }
    }
  }

  return (
    <div className="w-full">
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Dekorasi Latar Belakang */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
              Jamaah Aktif
            </div>
          </div>

          {/* Info Pengguna & Statistik */}
          <div className="flex-1 w-full">
            <div className="text-center md:text-left mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Profil Pengguna</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 text-sm">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Award className="w-6 h-6 text-amber-400 mb-2" />
                <span className="text-2xl font-bold text-white">{totalCompleted}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Puasa</span>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <CalendarDays className="w-6 h-6 text-emerald-400 mb-2" />
                <span className="text-2xl font-bold text-white">{streak}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Rentetan (Streak)</span>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <MapPin className="w-6 h-6 text-sky-400 mb-2" />
                <span className="text-lg font-bold text-white truncate w-full px-2" title={selectedCity.cityName}>
                  {selectedCity.cityName}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Lokasi Aktif</span>
              </div>

            </div>

            <div className="mt-8 border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={onLogout}
                className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
              >
                Keluar dari Akun (Logout)
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
