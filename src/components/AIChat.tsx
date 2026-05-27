import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LocationData } from '../types';
import { Send, Sparkles, MessageSquare, Loader, User } from 'lucide-react';

interface AIChatProps {
  selectedCity: LocationData;
  totalCompleted: number;
  weekStreak: number;
}

const CHIPS_PRESETS = [
  'Tips sahur agar tidak gampang lemas?',
  'Rekomendasi takjil & hidrasi saat berbuka',
  'Hadits keutamaan puasa Senin-Kamis',
  'Cara mengatasi maag kambuh pas puasa',
];

export default function AIChat({ selectedCity, totalCompleted, weekStreak }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Assalamualaikum! Saya Sahabat Ruhiyah AI. Saya siap mendampingi perjalanan puasa sunah Senin-Kamis Anda dengan panduan medis, rujukan gizi sahur/buka, dan keutamaan ibadah. Apa yang bisa saya bantu hari ini?',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputVal('');
    setLoading(true);

    try {
      const today = new Date();
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            text: msg.text
          })),
          userContext: {
            todayDate: today.toISOString().split('T')[0],
            todayDayName: new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(today),
            cityName: selectedCity.cityName,
            totalCompleted,
            weekStreak,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal terhubung dengan server Sahabat Ruhiyah AI.');
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'model',
        text: 'Nampaknya sistem sedang menyebarkan kedamaian secara offline. Silakan coba kembali sesaat lagi atau gunakan panduan niat/jadwal sholat yang sudah disediakan.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-chat-section" className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800/80 flex flex-col h-[520px] font-sans text-slate-300">
      
      {/* Thread Header */}
      <div className="flex items-center justify-between pb-4 border-b border-dashed border-slate-800 mb-4 shrink-0 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h2 className="font-sans font-semibold text-base text-white tracking-tight">Sahabat Ruhiyah AI</h2>
            <p className="text-xs text-slate-400">Asisten gizi sahur, iftar &amp; motivasi harian</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 scroll-smooth max-h-[300px] mb-4">
        {messages.map((msg) => {
          const isBot = msg.role === 'model';
          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isBot ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              
              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isBot 
                    ? 'bg-slate-950 border border-slate-800/85 text-slate-200 rounded-tl-none' 
                    : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-tr-none'
                }`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <p className={`text-[9px] text-slate-400 ${isBot ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
              <span>Mencari rujukan gizi dan hikmah...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 shrink-0 scrollbar-none max-w-full">
        {CHIPS_PRESETS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/20 text-[10px] text-slate-300 font-medium rounded-full transition duration-150 whitespace-nowrap cursor-pointer active:scale-95"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Pad */}
      <div className="pt-3 border-t border-slate-800 shrink-0 select-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loading}
            placeholder="Tanyakan resep sahur bugar, takjil sehat, dsb..."
            className="flex-1 text-xs px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="p-3 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-xl shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
