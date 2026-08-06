import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, Clock, RefreshCw, Shield, Sparkles, Database, Menu, X, Lock } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';

interface MaintenancePageProps {
  onOpenAdmin: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onOpenAdmin }) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [badgeText, setBadgeText] = useState('SEDANG PERBAIKAN • FITUR');
  const [headingText, setHeadingText] = useState('SISTEM DALAM PERBAIKAN');
  const { websiteName } = useAppSettings();
  const [announcement, setAnnouncement] = useState(
    `Aplikasi ${websiteName} sedang dalam perbaikan berkala untuk peningkatan server. Silakan coba beberapa saat lagi`
  );

  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load configuration from localStorage
  const loadConfig = () => {
    try {
      const bText = localStorage.getItem('alight_maint_badge_text');
      const hText = localStorage.getItem('alight_maint_heading_text');
      const aText = localStorage.getItem('alight_maint_announcement');

      if (bText) setBadgeText(bText);
      if (hText) setHeadingText(hText);
      if (aText) setAnnouncement(aText);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConfig();

    window.addEventListener('alight_settings_updated', loadConfig);
    window.addEventListener('storage', loadConfig);

    return () => {
      window.removeEventListener('alight_settings_updated', loadConfig);
      window.removeEventListener('storage', loadConfig);
    };
  }, []);

  // Update current live date & clock formatted in Indonesian
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const formatted = now.toLocaleDateString('id-ID', options).replace('.', ':');
      setCurrentTimeStr(formatted);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown logic based on alight_maint_target_time
  useEffect(() => {
    const updateCountdown = () => {
      try {
        const targetStr = localStorage.getItem('alight_maint_target_time');
        if (!targetStr) {
          setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
          return;
        }

        const targetTime = parseInt(targetStr, 10);
        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
          // Timer finished, automatically disable maintenance mode
          localStorage.setItem('alight_maintenance', 'false');
          window.dispatchEvent(new CustomEvent('alight_settings_updated'));
          setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft({
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualCheck = () => {
    setIsRefreshing(true);
    loadConfig();

    // Re-check maintenance state
    setTimeout(() => {
      setIsRefreshing(false);
      const isMaint = localStorage.getItem('alight_maintenance') === 'true';
      if (!isMaint) {
        window.location.reload();
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#140e24] text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-rose-500 selection:text-white">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-2xl bg-[#1e1732] border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3 px-4 flex items-center justify-between mb-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center font-black text-white text-base shadow-md">
            A
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-white tracking-tight">{websiteName}</span>
              <span className="bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase">
                ★ PRO
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ALIGHT MOTION VERIFIER
            </p>
          </div>
        </div>

        {/* Admin Login Button disguised as Menu */}
        <button
          onClick={onOpenAdmin}
          className="w-10 h-10 rounded-xl bg-[#2a2240] hover:bg-[#352b52] border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-200 hover:text-white transition-all cursor-pointer shadow-md"
          title="Login Admin / Access Control"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Main Maintenance Card Overlay */}
      <div className="w-full max-w-2xl bg-[#1d162e] border-4 border-slate-900 dark:border-slate-600 rounded-[32px] p-4 sm:p-7 shadow-[8px_8px_0px_#07050d] flex flex-col items-center text-center space-y-6 relative overflow-hidden">
        
        {/* Top Live Timestamp Pill */}
        <div className="bg-[#120d20] border border-slate-700/80 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold text-slate-300 shadow-inner">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{currentTimeStr || 'Memuat waktu...'}</span>
        </div>

        {/* Large Wrench Icon Box */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#3d2415] border-4 border-slate-900 dark:border-slate-600 flex items-center justify-center text-amber-500 shadow-[4px_4px_0px_#07050d] transform -rotate-1">
            <Wrench className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
          </div>
          {/* Warning Circle Badge */}
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-rose-600 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-white shadow-md">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Status Red Pill */}
        <div className="bg-rose-600 border-2 border-slate-900 dark:border-slate-600 text-white font-extrabold text-xs px-5 py-2 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_#07050d]">
          {badgeText}
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase max-w-lg leading-tight">
          {headingText}
        </h1>

        {/* Countdown Box */}
        <div className="w-full bg-[#130e21] border-2 border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-inner">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>WAKTU MUNDUR ESTIMASI SELESAI OTOMATIS</span>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1732] border-2 border-slate-700 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-cyan-400 shadow-md">
                {timeLeft.hours}
              </div>
              <span className="text-[10px] font-extrabold text-amber-400 mt-1 tracking-widest uppercase">
                JAM
              </span>
            </div>

            <span className="text-2xl font-black text-slate-500 dark:text-slate-400 mb-5">:</span>

            {/* Minutes */}
            <div className="flex flex-col items-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1732] border-2 border-slate-700 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-cyan-400 shadow-md">
                {timeLeft.minutes}
              </div>
              <span className="text-[10px] font-extrabold text-amber-400 mt-1 tracking-widest uppercase">
                MENIT
              </span>
            </div>

            <span className="text-2xl font-black text-slate-500 dark:text-slate-400 mb-5">:</span>

            {/* Seconds */}
            <div className="flex flex-col items-center">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-[#1e1732] border-2 border-slate-700 rounded-2xl flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-rose-400 shadow-md animate-pulse">
                {timeLeft.seconds}
              </div>
              <span className="text-[10px] font-extrabold text-amber-400 mt-1 tracking-widest uppercase">
                DETIK
              </span>
            </div>
          </div>
        </div>

        {/* Developer Announcement Message Card */}
        <div className="w-full bg-[#130e21] border-2 border-slate-700/80 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
            <span className="text-base">📜</span>
            <span>PESAN TIM PENGEMBANG:</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {announcement}
          </p>
        </div>

        {/* Feature status badges */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="bg-[#181227] border border-slate-700/70 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-extrabold text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Selesai Otomatis: Aktif</span>
          </div>

          <div className="bg-[#181227] border border-slate-700/70 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-300">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Status Data: Aman 100%</span>
          </div>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={handleManualCheck}
          disabled={isRefreshing}
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-[4px_4px_0px_#07050d] active:translate-y-0.5 active:shadow-[2px_2px_0px_#07050d] transition-all cursor-pointer flex items-center justify-center gap-2.5 uppercase tracking-wider"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>CEK STATUS OTOMATIS</span>
        </button>

        {/* Admin Access Shortcut Link */}
        <div className="pt-2">
          <button
            onClick={onOpenAdmin}
            className="text-[11px] font-bold text-slate-400 hover:text-amber-400 underline underline-offset-4 transition-colors flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Akses Admin Control Center dapat dijangkau dari menu Login Admin.</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-6 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 tracking-widest uppercase text-center">
        {websiteName} MAINTENANCE & SYSTEM UPGRADE ENGINE • 2026
      </footer>
    </div>
  );
};
