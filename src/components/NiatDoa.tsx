import React, { useState } from 'react';
import { ISLAMIC_TEXTS } from '../utils';
import { BookOpen, Copy, Check, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function NiatDoa() {
  const [activeTab, setActiveTab] = useState<'senin' | 'kamis' | 'buka'>('senin');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'senin':
        return {
          title: 'Niat Puasa Hari Senin',
          text: ISLAMIC_TEXTS.niatSenin,
          color: 'from-emerald-600 to-teal-700',
        };
      case 'kamis':
        return {
          title: 'Niat Puasa Hari Kamis',
          text: ISLAMIC_TEXTS.niatKamis,
          color: 'from-emerald-700 to-emerald-800',
        };
      case 'buka':
        return {
          title: 'Doa Berbuka Puasa',
          text: ISLAMIC_TEXTS.doaBuka,
          color: 'from-amber-600 to-amber-700',
        };
    }
  };

  const activeData = getActiveData();

  return (
    <div id="niat-doa-section" className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800/80">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-sans font-semibold text-lg text-white tracking-tight">Lafal Niat &amp; Doa</h2>
            <p className="text-xs text-slate-400">Panduan lafal dan niat puasa sunnah</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 border border-slate-850 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab('senin')}
          className={`py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer border ${
            activeTab === 'senin' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Puasa Senin
        </button>
        <button
          onClick={() => setActiveTab('kamis')}
          className={`py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer border ${
            activeTab === 'kamis' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Puasa Kamis
        </button>
        <button
          onClick={() => setActiveTab('buka')}
          className={`py-2.5 text-xs font-semibold rounded-xl transition-all duration-300 cursor-pointer border ${
            activeTab === 'buka' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Buka Puasa
        </button>
      </div>

      {/* Content Card with animation transitions */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Calligraphy Box */}
        <div className="relative bg-slate-950/80 p-6 rounded-2xl text-center overflow-hidden border border-slate-850">
          <div className="absolute top-2.5 right-2.5">
            <button
               onClick={() => handleCopy(`${activeData.text.arabic}\n\n${activeData.text.latin}\n\nTerjemahan: ${activeData.text.translation}`)}
              className="p-2 text-emerald-450 hover:text-emerald-350 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl transition-all shadow-sm cursor-pointer"
              title="Salin Lafal Lengkap"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="font-arabic text-2xl md:text-3xl font-medium text-emerald-300 leading-normal tracking-wide py-4 select-all">
            {activeData.text.arabic}
          </p>
        </div>

        {/* Transliteration */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Transliterasi</h4>
            <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
              &ldquo;{activeData.text.latin}&rdquo;
            </p>
          </div>

          <hr className="border-slate-800" />

          {/* Translation */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Artinya</h4>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              &ldquo;{activeData.text.translation}&rdquo;
            </p>
          </div>

          {/* Keutamaan / Tambahan */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-emerald-300 font-sans">Keutamaan &amp; Hikmah</h5>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {'virtue' in activeData.text ? activeData.text.virtue : ('additional' in activeData.text ? activeData.text.additional : '')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
