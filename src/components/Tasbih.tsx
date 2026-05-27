import React, { useState, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, Check, ChevronDown } from 'lucide-react';

interface DhikrItem {
  arabic: string;
  latin: string;
  translation: string;
}

const DHIKR_PRESETS: { [key: string]: DhikrItem } = {
  subhanallah: {
    arabic: 'سُبْحَانَ اللَّهِ',
    latin: 'Subhanallah',
    translation: 'Maha Suci Allah',
  },
  alhamdulillah: {
    arabic: 'الْحَمْدُ لِلَّهِ',
    latin: 'Alhamdulillah',
    translation: 'Segala puji bagi Allah',
  },
  allahuakbar: {
    arabic: 'اللَّهُ أَكْبَرُ',
    latin: 'Allahu Akbar',
    translation: 'Allah Maha Besar',
  },
  istighfar: {
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    latin: 'Astaghfirullah',
    translation: 'Aku memohon ampun kepada Allah',
  },
  sholawat: {
    arabic: 'صَلَّى اللَّهُ عَلَى مُحَمَّدٍ',
    latin: 'Shallallahu ' + 'Ala Muhammad',
    translation: 'Semoga Allah bershalawat atas Muhammad',
  },
};

export default function Tasbih() {
  const [count, setCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState<keyof typeof DHIKR_PRESETS>('subhanallah');
  const [target, setTarget] = useState<number>(33); // 33, 99, or 0 (unlimited)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDhikrDropdownOpen, setIsDhikrDropdownOpen] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a soft tactile tone using Web Audio API (to avoid external file dependencies)
  const playBeep = (frequency: number = 800, duration: number = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  const handleIncrement = () => {
    const nextCount = count + 1;
    setCount(nextCount);

    // Haptic feedback (Vibration API)
    if (navigator.vibrate) {
      navigator.vibrate(45);
    }

    // Play target completion bell/beep or regular tick
    if (target > 0 && nextCount === target) {
      playBeep(1200, 0.4); // Longer, higher beep for completion
    } else {
      playBeep(880, 0.06); // Tactile tick sound
    }
  };

  const handleReset = () => {
    setCount(0);
    playBeep(440, 0.15);
  };

  const activeDhikr = DHIKR_PRESETS[selectedDhikr];

  return (
    <div id="tasbih-section" className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800/80">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-lg text-white tracking-tight">Tasbih Digital</h2>
            <p className="text-xs text-slate-400">Sarana dzikir &amp; pengingat spiritual harian</p>
          </div>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            setSoundEnabled(!soundEnabled);
            if (!soundEnabled) playBeep(900, 0.1);
          }}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            soundEnabled 
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-slate-950 border-slate-850 text-slate-500 hover:bg-slate-900'
          }`}
          title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Target Selector */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-950 border border-slate-850 rounded-2xl mb-6">
        {[33, 99, 0].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTarget(t);
              setCount(0);
              playBeep(700, 0.1);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
              target === t ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'text-slate-400 border-transparent hover:text-slate-100'
            }`}
          >
            {t === 0 ? 'Bebas' : `${t} Kali`}
          </button>
        ))}
      </div>

      {/* Dhikr Selector Dropdown */}
      <div className="relative mb-6">
        <button
          onClick={() => setIsDhikrDropdownOpen(!isDhikrDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-left text-xs text-slate-200 hover:bg-slate-900 transition duration-200 font-medium cursor-pointer"
        >
          <span>Lafal Dzikir: <strong className="text-emerald-400 ml-1">{activeDhikr.latin}</strong></span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDhikrDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDhikrDropdownOpen && (
          <div className="absolute z-20 top-full inset-x-0 mt-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden py-1 max-h-[220px] overflow-y-auto">
            {Object.entries(DHIKR_PRESETS).map(([key, value]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedDhikr(key as any);
                  setIsDhikrDropdownOpen(false);
                  playBeep(800, 0.08);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-xs text-left transition duration-150 cursor-pointer ${
                  selectedDhikr === key ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-950'
                }`}
              >
                <div>
                  <p className="font-semibold">{value.latin}</p>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">{value.translation}</p>
                </div>
                <span className="font-arabic text-sm text-emerald-400">{value.arabic}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Dhikr Center Canvas Display */}
      <div className="flex flex-col items-center justify-center py-6 text-center select-none bg-slate-950/60 rounded-3xl border border-slate-850 mb-6 px-4">
        <p className="font-arabic text-3xl font-bold text-emerald-305 mb-3 min-h-[36px] tracking-wide" style={{ direction: 'rtl' }}>
          {activeDhikr.arabic}
        </p>
        <p className="text-xs text-emerald-405 font-bold mb-1 italic tracking-wide">{activeDhikr.latin}</p>
        <p className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed">&ldquo;{activeDhikr.translation}&rdquo;</p>
      </div>

      {/* Interactive Counter Ring Button */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative">
          
          {/* Progress Circular Aura */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-950/50"></div>
          {target > 0 && (
            <svg className="w-48 h-48 transform -rotate-90 absolute top-0 left-0">
              <circle
                cx="96"
                cy="96"
                r="92"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-emerald-500 transition-all duration-300"
                strokeDasharray={2 * Math.PI * 92}
                strokeDashoffset={2 * Math.PI * 92 * (1 - Math.min(count, target) / target)}
              />
            </svg>
          )}

          {/* Actual Touch Click Area */}
          <button
            onClick={handleIncrement}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex flex-col items-center justify-center shadow-lg hover:shadow-xl hover:brightness-105 active:scale-95 transition-all duration-150 cursor-pointer relative z-10 select-none pb-2 group"
          >
            <span className="text-xs uppercase font-medium text-emerald-200 tracking-wider">Tasbih</span>
            <span className="font-mono text-5xl font-extrabold tracking-tight my-1 group-active:scale-110 transition duration-100">
              {count}
            </span>
            <span className="text-[10px] text-emerald-100/75">
              {target > 0 ? `Target ${target}` : 'Dzikir Bebas'}
            </span>
          </button>
        </div>

        {/* Bottom Controls / Reset Button */}
        <div className="flex items-center justify-center mt-6 gap-6">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors py-2 px-3 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 rounded-xl cursor-pointer"
            title="Ulangi Hitungan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Hitungan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
