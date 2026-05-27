import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getQiblaDirection } from '../utils';
import { Compass, AlertTriangle } from 'lucide-react';

interface QiblaCompassProps {
  selectedCity: LocationData;
}

export default function QiblaCompass({ selectedCity }: QiblaCompassProps) {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number>(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Kalkulasi sudut kiblat saat kota berubah
  useEffect(() => {
    const angle = getQiblaDirection(selectedCity.latitude, selectedCity.longitude);
    setQiblaAngle(angle);
  }, [selectedCity]);

  const requestCompassPermission = async () => {
    try {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        } else {
          setErrorMsg('Izin akses sensor kompas ditolak.');
          setPermissionGranted(false);
        }
      } else {
        // Untuk perangkat Android atau peramban yang tidak memerlukan requestPermission
        setPermissionGranted(true);
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        
        // Fallback untuk browser yang tidak mendukung absolute
        window.addEventListener('deviceorientation', handleOrientationFallback, true);
      }
    } catch (e) {
      setErrorMsg('Perangkat ini tidak mendukung fitur sensor kompas. Pastikan Anda menggunakan gawai seluler.');
      setPermissionGranted(false);
    }
  };

  const handleOrientation = (event: any) => {
    // Pada iOS (WebKit) sensor memberikan webkitCompassHeading langsung (relatif terhadap Utara sebenarnya)
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      setDeviceHeading(event.webkitCompassHeading);
    } else if (event.alpha !== null && event.absolute) {
      // Pada Android dengan deviceorientationabsolute, alpha adalah offset dari Utara (0-360, terbalik)
      const heading = 360 - event.alpha;
      setDeviceHeading(heading);
    }
  };

  const handleOrientationFallback = (event: any) => {
    if (deviceHeading !== null) return; // Jika metode absolute sudah berfungsi
    if (event.alpha !== null) {
      const heading = 360 - event.alpha;
      setDeviceHeading(heading);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientationFallback);
    };
  }, [deviceHeading]);

  // Rotasi kompas
  // Jika deviceHeading ada, putar jarum penunjuk menyesuaikan orientasi gawai
  const compassRotation = deviceHeading !== null ? -deviceHeading : 0;
  // Derajat posisi ka'bah
  const kaabaRotation = qiblaAngle;

  return (
    <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800/80 flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white mb-2 font-sans flex items-center justify-center gap-2">
          <Compass className="w-6 h-6 text-emerald-400" />
          Kompas Arah Kiblat
        </h2>
        <p className="text-xs text-slate-400 max-w-md">
          Arah kiblat untuk wilayah <strong className="text-slate-200">{selectedCity.cityName}</strong> adalah 
          <span className="font-mono font-bold text-emerald-400 ml-1">{qiblaAngle.toFixed(1)}°</span> dari Utara Sejati.
        </p>
      </div>

      {/* Visual Kompas Utama */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
        {/* Latar Belakang Kompas Berputar (Menunjuk Utara) */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${compassRotation}deg)` }}
        >
          {/* Tanda Mata Angin */}
          <span className="absolute top-2 text-rose-500 font-bold text-sm">U</span>
          <span className="absolute bottom-2 text-slate-400 font-bold text-sm">S</span>
          <span className="absolute right-3 text-slate-400 font-bold text-sm">T</span>
          <span className="absolute left-3 text-slate-400 font-bold text-sm">B</span>

          {/* Indikator Jarum Kabah */}
          <div 
            className="absolute inset-0 flex items-start justify-center transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${kaabaRotation}deg)` }}
          >
            <div className="w-1.5 h-1/2 bg-gradient-to-t from-transparent to-emerald-500 relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-950 border border-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <div className="w-4 h-4 bg-black border border-amber-600/50">
                  <div className="w-full h-1/3 bg-amber-600/20 mt-0.5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lingkaran Pusat Statis (Acuan) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-800 rounded-full border border-slate-700 z-10 shadow-sm"></div>
      </div>

      {/* Tombol Akses Sensor */}
      <div className="mt-10 w-full max-w-sm">
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/30 border border-rose-900/50 rounded-xl flex items-start gap-2 text-rose-400 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {permissionGranted === null && (
          <button
            onClick={requestCompassPermission}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-sans transition cursor-pointer shadow-md"
          >
            🧭 Aktifkan Kompas Dinamis (HP/Tablet)
          </button>
        )}
        
        {permissionGranted && deviceHeading === null && !errorMsg && (
          <p className="text-xs text-center text-amber-400 animate-pulse font-medium">
            Mencari sensor putaran... Pastikan HP/Tablet Anda memiliki sensor kompas magnetik.
          </p>
        )}

        {permissionGranted && deviceHeading !== null && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Kompas Aktif</span>
            <p className="text-xs text-slate-400 text-center">
              Arahkan perangkat hingga garis hijau sejajar lurus ke depan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
