import React, { useState, useEffect } from 'react';
import { FastingLog } from '../types';
import { getFastingDaysInMonth, getFastingDayType, formatFullLocalDate } from '../utils';
import { Calendar, CheckCircle2, Award, CheckCircle, ChevronLeft, ChevronRight, Bookmark, Circle, Clock, Smile } from 'lucide-react';

interface FastingTrackerProps {
  logs: FastingLog[];
  onLogsChanged: (updatedLogs: FastingLog[]) => void;
  onLogSaved?: (log: FastingLog) => void;
}

export default function FastingTracker({ logs, onLogsChanged, onLogSaved }: FastingTrackerProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  
  // States untuk edit log puasa hari ini yang aktif / terpilih
  const getLocalDateString = (d: Date = new Date()) => {
    const tzoffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().split('T')[0];
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    getLocalDateString()
  );
  
  // Form input states untuk tgl terpilih
  const [completed, setCompleted] = useState<boolean>(false);
  const [sahurCompleted, setSahurCompleted] = useState<boolean>(false);
  const [mood, setMood] = useState<string>('Sangat Baik');
  const [notes, setNotes] = useState<string>('');

  // Periksa atau muat log ke form saat tanggal pilihan berubah
  useEffect(() => {
    const existingLog = logs.find(log => log.date === selectedDateStr);
    if (existingLog) {
      setCompleted(existingLog.completed);
      setSahurCompleted(existingLog.sahurCompleted || false);
      setMood(existingLog.mood || 'Sangat Baik');
      setNotes(existingLog.notes || '');
    } else {
      // Default reset
      setCompleted(false);
      setSahurCompleted(false);
      setMood('Sangat Baik');
      setNotes('');
    }
  }, [selectedDateStr, logs]);

  const autoSaveLog = (overrides: Partial<FastingLog>) => {
    const dateObj = new Date(selectedDateStr);
    const dayType = getFastingDayType(dateObj);
    const newLog: FastingLog = {
      id: selectedDateStr,
      date: selectedDateStr,
      dayType,
      completed: overrides.completed !== undefined ? overrides.completed : completed,
      sahurCompleted: overrides.sahurCompleted !== undefined ? overrides.sahurCompleted : sahurCompleted,
      mood: overrides.mood !== undefined ? overrides.mood : mood,
      notes: overrides.notes !== undefined ? overrides.notes : notes.trim(),
    };
    const isExistingIdx = logs.findIndex(log => log.date === selectedDateStr);
    let updatedLogs = [...logs];
    if (isExistingIdx > -1) {
      updatedLogs[isExistingIdx] = newLog;
    } else {
      updatedLogs.push(newLog);
    }
    onLogsChanged(updatedLogs);
    if (onLogSaved) onLogSaved(newLog);
  };

  const handleSaveLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateObj = new Date(selectedDateStr);
    const dayType = getFastingDayType(dateObj);

    const newLog: FastingLog = {
      id: selectedDateStr,
      date: selectedDateStr,
      dayType,
      completed,
      sahurCompleted,
      mood,
      notes: notes.trim(),
    };

    const isExistingIdx = logs.findIndex(log => log.date === selectedDateStr);
    let updatedLogs = [...logs];

    if (isExistingIdx > -1) {
      updatedLogs[isExistingIdx] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    onLogsChanged(updatedLogs);
    if (onLogSaved) onLogSaved(newLog);
  };

  const handleQuickLogToday = (isCompleted: boolean) => {
    const todayStr = getLocalDateString();
    const dayType = getFastingDayType(new Date());

    const newLog: FastingLog = {
      id: todayStr,
      date: todayStr,
      dayType,
      completed: isCompleted,
      sahurCompleted: true,
      mood: 'Sangat Baik',
      notes: 'Dicatat via pintasan cepat',
    };

    const isExistingIdx = logs.findIndex(log => log.date === todayStr);
    let updatedLogs = [...logs];

    if (isExistingIdx > -1) {
      newLog.completed = isCompleted;
      newLog.sahurCompleted = updatedLogs[isExistingIdx].sahurCompleted;
      newLog.mood = updatedLogs[isExistingIdx].mood;
      newLog.notes = updatedLogs[isExistingIdx].notes;
      updatedLogs[isExistingIdx] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    onLogsChanged(updatedLogs);
    if (onLogSaved) onLogSaved(newLog);
  };

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const monthName = currentMonthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  // Dapatkan seluruh Senin-Kamis di bulan terpilih
  const fastingDays = getFastingDaysInMonth(currentMonthDate.getFullYear(), currentMonthDate.getMonth());

  // Statistik pencapaian
  const totalCompletedCount = logs.filter(log => log.completed).length;
  const mondayCount = logs.filter(log => log.completed && log.dayType === 'Senin').length;
  const thursdayCount = logs.filter(log => log.completed && log.dayType === 'Kamis').length;

  // Menentukan streak (pengulangan suksestuntutan puasa berkelanjutan)
  const calculateStreak = () => {
    // Urutkan tanggal yang diselesaikan dari yang terbaru
    const completedDates = logs
      .filter(l => l.completed)
      .map(l => l.date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (completedDates.length === 0) return 0;
    
    let streakCount = 1;
    let prev = new Date(completedDates[0]);

    for (let i = 1; i < completedDates.length; i++) {
      const current = new Date(completedDates[i]);
      // Hitung selisih hari. Puasa Senin-Kamis berjarak 3 atau 4 hari.
      // Jika jaraknya berkisar <= 4 hari, streak spiritual berlanjut
      const diffTime = Math.abs(prev.getTime() - current.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 4) {
        streakCount++;
        prev = current;
      } else {
        break;
      }
    }
    return streakCount;
  };

  const currentStreak = calculateStreak();

  return (
    <div id="fasting-tracker-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Left Grid Col: Stats & Quick Log Form (8 Spans on Desktop) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* Statistics Panels (Bento Layout style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Puasa</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">{totalCompletedCount}</span>
              <span className="text-xs text-slate-400 font-medium">Hari</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Senin</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">{mondayCount}</span>
              <span className="text-xs text-slate-400 font-medium">Kali</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between shadow-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kamis</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">{thursdayCount}</span>
              <span className="text-xs text-slate-400 font-medium">Kali</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-550/20 to-slate-900 border border-amber-500/30 rounded-2xl p-4 text-amber-400 flex flex-col justify-between shadow-lg">
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Streak Aktif</span>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-mono">{currentStreak}</span>
              <span className="text-xs text-amber-400 font-medium font-mono">Pekan</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid for Selected Month */}
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-sans font-semibold text-base text-white tracking-tight">Kalender Puasa Sunah</h2>
                <p className="text-xs text-slate-400">Jadwal puasa Senin &amp; Kamis bulan ini</p>
              </div>
            </div>

            {/* Month Navigators */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 self-stretch sm:self-auto">
              <button
                onClick={prevMonth}
                type="button"
                className="p-2 bg-slate-950 hover:bg-slate-900 rounded-xl border border-slate-800 text-slate-300 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-200 w-[110px] text-center font-sans uppercase tracking-wider">
                {monthName}
              </span>
              <button
                onClick={nextMonth}
                type="button"
                className="p-2 bg-slate-950 hover:bg-slate-900 rounded-xl border border-slate-800 text-slate-300 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calender Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fastingDays.map((dateItem) => {
              const dtStr = getLocalDateString(dateItem);
              const log = logs.find(l => l.date === dtStr);
              const isSelected = selectedDateStr === dtStr;
              const isFuture = dateItem > new Date();
              const isToday = dtStr === getLocalDateString();
              const dayLabel = dateItem.getDay() === 1 ? 'Senin' : 'Kamis';

              return (
                <button
                  key={dtStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dtStr)}
                  className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-lg'
                      : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-850/80'
                  }`}
                >
                  {/* Status Indicator check */}
                  <div className="absolute top-3 right-3">
                    {log?.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950/40" />
                    ) : isFuture ? (
                      <Circle className="w-4 h-4 text-slate-800 stroke-dashed" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-700" />
                    )}
                  </div>

                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    dayLabel === 'Senin' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {dayLabel}
                  </span>

                  <h4 className="text-base font-bold font-mono text-white mt-2">
                    {dateItem.getDate()}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    <p className="text-[10px] text-slate-400 font-sans">
                      {dateItem.toLocaleDateString('id-ID', { month: 'short' })}
                    </p>
                    {isToday && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Hari ini"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Right Grid Col: Custom Quick Log Form (4 Spans on Desktop) */}
      <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-6 border border-slate-800/80 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-dashed border-slate-800 mb-5 font-sans">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-semibold text-base text-white">Catat Aktivitas Puasa</h2>
              <p className="text-xs text-slate-400">Log atau perbarui rincian ibadah</p>
            </div>
          </div>

          <form onSubmit={handleSaveLogSubmit} className="space-y-4 font-sans">
            
            {/* Input Selected Date Display */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal Ibadah</label>
              <input
                type="date"
                value={selectedDateStr}
                onChange={(e) => setSelectedDateStr(e.target.value)}
                className="w-full font-mono text-xs font-semibold px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200"
              />
              <p className="text-[11px] text-emerald-400 font-sans italic mt-1 font-medium">
                {formatFullLocalDate(new Date(selectedDateStr))}
              </p>
            </div>

            {/* Checkbox: Completed Fasting */}
            <label className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <CheckCircle className={`w-5 h-5 ${completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Puasa Selesai &amp; Kondusif?</h4>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Membatalkan puasa tepat saat Maghrib</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => {
                  setCompleted(e.target.checked);
                  autoSaveLog({ completed: e.target.checked });
                }}
                className="w-5 h-5 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
              />
            </label>

            {/* Checkbox: Sahur Completed */}
            <label className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Clock className={`w-5 h-5 ${sahurCompleted ? 'text-amber-400' : 'text-slate-600'}`} />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Apakah Anda Sahur?</h4>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Sunah sahur melancarkan metabolisme</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sahurCompleted}
                onChange={(e) => {
                  setSahurCompleted(e.target.checked);
                  autoSaveLog({ sahurCompleted: e.target.checked });
                }}
                className="w-5 h-5 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
              />
            </label>

            {/* Select Mood Spinner */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Kondisi Fisik / Mood</label>
              <div className="relative">
                <Smile className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 h-10 select-none appearance-none cursor-pointer"
                >
                  <option value="Sangat Baik">Sangat Baik / Bugar</option>
                  <option value="Biasa Saja">Cukup Kuat / Biasa</option>
                  <option value="Lemas">Lemas / Mengantuk</option>
                  <option value="Sakit">Sakit / Terpaksa Batal</option>
                </select>
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Catatan Refleksi Diri</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misalnya: target menu sayur untuk sahur, keluhan maag, atau target tilawah..."
                rows={3}
                className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-200 font-sans resize-none placeholder-slate-500"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white font-bold text-xs rounded-xl hover:brightness-105 active:scale-95 transition-all duration-150 cursor-pointer shadow-md"
            >
              Simpan Catatan Harian
            </button>
          </form>
        </div>

        {/* Quick Shortcut Buttons for Today */}
        <div className="mt-6 pt-4 border-t border-dashed border-slate-800 font-sans">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center mb-3">Pintasan Cepat Hari Ini</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogToday(true)}
              type="button"
              className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-[10px] text-center cursor-pointer transition"
            >
              👍 Puasa Sukses!
            </button>
            <button
              onClick={() => handleQuickLogToday(false)}
              type="button"
              className="py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold rounded-xl text-[10px] text-center cursor-pointer transition"
            >
              👎 Tidak Berpuasa
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
