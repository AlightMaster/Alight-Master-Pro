import React, { useState, useEffect } from 'react';
import { Mail, Link2, CheckCircle2, ArrowRight, Loader2, RefreshCw, Copy, ExternalLink, ShieldCheck, Clock, Key, Video, Award, Layers, Calendar, Sparkles, X, Check, Zap, Wrench, AlertTriangle, Database } from 'lucide-react';
import { VerificationRecord } from '../types';
import { HCaptchaModal } from './HCaptchaModal';

interface VerificationPanelProps {
  onSuccess: (record: VerificationRecord) => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [oobLink, setOobLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successRecord, setSuccessRecord] = useState<VerificationRecord | null>(null);
  const [showLinkSentToast, setShowLinkSentToast] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Global Maintenance Mode state & config inside Verification Panel
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(() => {
    return localStorage.getItem('alight_maintenance') === 'true';
  });
  const [badgeText, setBadgeText] = useState('SEDANG PERBAIKAN • FITUR');
  const [headingText, setHeadingText] = useState('SISTEM DALAM PERBAIKAN');
  const [announcement, setAnnouncement] = useState(
    'Aplikasi AlightMaster sedang dalam perbaikan berkala untuk peningkatan server. Silakan coba beberapa saat lagi'
  );
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [maintCountdown, setMaintCountdown] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMaintConfig = () => {
    try {
      const maint = localStorage.getItem('alight_maintenance') === 'true';
      setIsMaintenanceActive(maint);

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
    loadMaintConfig();

    window.addEventListener('alight_settings_updated', loadMaintConfig);
    window.addEventListener('storage', loadMaintConfig);

    return () => {
      window.removeEventListener('alight_settings_updated', loadMaintConfig);
      window.removeEventListener('storage', loadMaintConfig);
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

  // Countdown timer logic
  useEffect(() => {
    const updateCountdown = () => {
      try {
        let targetStr = localStorage.getItem('alight_maint_target_time');
        const isMaint = localStorage.getItem('alight_maintenance') === 'true';

        // If maintenance is active but target time is missing or invalid or in the past, initialize a default 15 min countdown
        if (isMaint) {
          const parsed = targetStr ? parseInt(targetStr, 10) : 0;
          if (!parsed || parsed <= Date.now()) {
            const defaultTarget = Date.now() + 15 * 60 * 1000; // default 15 mins
            localStorage.setItem('alight_maint_target_time', String(defaultTarget));
            targetStr = String(defaultTarget);
          }
        }

        if (!targetStr) {
          setMaintCountdown({ hours: '00', minutes: '00', seconds: '00' });
          return;
        }

        const targetTime = parseInt(targetStr, 10);
        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
          if (isMaint) {
            localStorage.setItem('alight_maintenance', 'false');
            window.dispatchEvent(new CustomEvent('alight_settings_updated'));
          }
          setMaintCountdown({ hours: '00', minutes: '00', seconds: '00' });
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setMaintCountdown({
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

    window.addEventListener('alight_settings_updated', updateCountdown);
    window.addEventListener('storage', updateCountdown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alight_settings_updated', updateCountdown);
      window.removeEventListener('storage', updateCountdown);
    };
  }, []);

  const handleManualCheck = () => {
    setIsRefreshing(true);
    loadMaintConfig();

    setTimeout(() => {
      setIsRefreshing(false);
      const isMaint = localStorage.getItem('alight_maintenance') === 'true';
      if (!isMaint) {
        window.location.reload();
      }
    }, 600);
  };

  useEffect(() => {
    if (currentStep === 2) {
      setShowLinkSentToast(true);
      const timer = setTimeout(() => {
        setShowLinkSentToast(false);
      }, 5000); // Disappears automatically after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Timer for Step 2
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180s
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check quota limit and maintenance status before processing
  const checkQuotaAndMaintenance = (): string | null => {
    try {
      const isMaint = localStorage.getItem('alight_maintenance') === 'true';
      if (isMaint) {
        return '⛔ Server Alight Motion Verifier sedang dalam mode Maintenance. Layanan verifikasi dihentikan sementara oleh Admin.';
      }

      const limitStr = localStorage.getItem('alight_quota_limit');
      const remStr = localStorage.getItem('alight_remaining_quota');
      const periodStr = localStorage.getItem('alight_quota_period') || 'harian';
      const resetHoursStr = localStorage.getItem('alight_reset_hours') || '24';

      let limit = limitStr !== null && limitStr !== '' ? parseFloat(limitStr) : 50;
      let rem = remStr !== null && remStr !== '' ? parseFloat(remStr) : 45;
      const resetHours = parseFloat(resetHoursStr) || 24;

      // Auto-reset check based on elapsed reset hours
      const lastResetStr = localStorage.getItem('alight_last_reset_time');
      const lastReset = lastResetStr ? parseInt(lastResetStr, 10) : Date.now();
      if (!lastResetStr) {
        localStorage.setItem('alight_last_reset_time', String(Date.now()));
      } else if (Date.now() - lastReset >= resetHours * 3600 * 1000) {
        // Reset remaining quota to admin-configured limit
        rem = limit;
        localStorage.setItem('alight_remaining_quota', String(rem));
        localStorage.setItem('alight_last_reset_time', String(Date.now()));
        window.dispatchEvent(new CustomEvent('alight_settings_updated'));
      }

      if (!isNaN(limit) && limit <= 0) {
        return `⚠️ Batas kuota ${periodStr} diatur 0 oleh Admin. Verifikasi tidak dapat diproses.`;
      }

      if (!isNaN(rem) && rem <= 0) {
        return `⚠️ Sisa kuota verifikasi (${periodStr}) telah habis (0 sisa). Silakan tunggu hingga direset oleh Admin atau waktu hitung mundur habis.`;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Step 1: Send OOB Link Request
  const handleSendOob = async (e: React.FormEvent) => {
    e.preventDefault();

    const quotaErr = checkQuotaAndMaintenance();
    if (quotaErr) {
      setErrorMsg(quotaErr);
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    setErrorMsg('');
    setShowCaptcha(true);
  };

  const executeSendOob = async () => {
    setShowCaptcha(false);
    setIsLoading(true);
    setLoadingText('Sistem sedang menginstruksikan server Alight Creative...');

    try {
      const res = await fetch('/api/oob/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server Vercel memberikan respons non-JSON. Silakan coba lagi beberapa saat lagi.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses permintaan OOB');
      }

      setIsLoading(false);
      setCurrentStep(2);
      setTimeLeft(data.expiresInSeconds || 180);
      setTimerActive(true);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Terjadi kesalahan server.');
    }
  };

  // Step 2: Verify OOB Link Token
  const handleVerifyOob = async (e: React.FormEvent) => {
    e.preventDefault();

    const quotaErr = checkQuotaAndMaintenance();
    if (quotaErr) {
      setErrorMsg(quotaErr);
      return;
    }

    if (!oobLink || oobLink.length < 5) {
      setErrorMsg('Masukkan link OOB atau token autentikasi yang valid dari email kamu.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setLoadingText('Memverifikasi token OOB dengan Firebase Auth Server...');

    try {
      const res = await fetch('/api/oob/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, oobLink })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server Vercel memberikan respons non-JSON. Silakan coba lagi beberapa saat lagi.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Verifikasi Token OOB Gagal.');
      }

      // Deduct remaining quota upon successful verification
      try {
        const remStr = localStorage.getItem('alight_remaining_quota');
        const rem = remStr !== null && remStr !== '' ? parseFloat(remStr) : 45;
        if (!isNaN(rem) && rem > 0) {
          const newRem = Math.max(0, rem - 1);
          localStorage.setItem('alight_remaining_quota', String(newRem));
          window.dispatchEvent(new CustomEvent('alight_settings_updated'));
        }
        window.dispatchEvent(new CustomEvent('alight_new_activation', { detail: data.record }));
      } catch (e) {
        console.error(e);
      }

      setIsLoading(false);
      setSuccessRecord(data.record);
      setCurrentStep(3);
      onSuccess(data.record);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Gagal memverifikasi token OOB.');
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setEmail('');
    setOobLink('');
    setErrorMsg('');
    setSuccessRecord(null);
  };

  const copyLicense = () => {
    if (successRecord) {
      navigator.clipboard.writeText(
        `SERTIFIKAT AlightMaster VERIFICATION\nEmail: ${successRecord.email}\nStatus: PRO 1 TAHUN (ACTIVE)\nID Lisensi: ${successRecord.id}\nTanggal: ${successRecord.timestamp}\nKadaluarsa: ${successRecord.expiresAt}`
      );
      alert('Sertifikat Verifikasi berhasil disalin!');
    }
  };

  if (isMaintenanceActive) {
    return (
      <section id="verification-panel" className="px-3 max-w-lg mx-auto w-full my-3 select-none">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] flex flex-col items-center text-center space-y-3 text-slate-900 dark:text-white relative overflow-hidden">
          
          {/* Top Live Timestamp Pill */}
          <div className="bg-amber-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 px-3 py-0.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold text-amber-900 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
            <Clock className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />
            <span>{currentTimeStr || 'Memuat waktu...'}</span>
          </div>

          {/* Icon + Badge */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-amber-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transform -rotate-1">
                <Wrench className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-white shadow-sm">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-rose-500 border-2 border-slate-900 dark:border-slate-600 text-white font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              {badgeText}
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase max-w-md leading-snug">
            {headingText}
          </h2>

          {/* Countdown Box */}
          <div className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 space-y-1.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
            <div className="flex items-center justify-center gap-1.5 text-amber-800 text-[10px] font-black uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              <span>ESTIMASI SELESAI OTOMATIS</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg flex items-center justify-center font-mono font-black text-base text-indigo-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  {maintCountdown.hours}
                </div>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">JAM</span>
              </div>

              <span className="text-base font-black text-slate-400 mb-2">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg flex items-center justify-center font-mono font-black text-base text-indigo-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  {maintCountdown.minutes}
                </div>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">MENIT</span>
              </div>

              <span className="text-base font-black text-slate-400 mb-2">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg flex items-center justify-center font-mono font-black text-base text-rose-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] animate-pulse">
                  {maintCountdown.seconds}
                </div>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 mt-0.5 tracking-widest uppercase">DETIK</span>
              </div>
            </div>
          </div>

          {/* Developer Announcement Message Card */}
          <div className="w-full bg-amber-50/90 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 text-left space-y-0.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
            <div className="flex items-center gap-1 text-amber-900 text-[10px] font-black uppercase tracking-wider">
              <span>📜</span>
              <span>PESAN TIM PENGEMBANG:</span>
            </div>
            <p className="text-[11px] text-slate-800 dark:text-slate-100 leading-snug font-semibold">
              {announcement}
            </p>
          </div>

          {/* Feature status badges */}
          <div className="w-full grid grid-cols-2 gap-1.5">
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-1.5 flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-indigo-900 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>Auto Selesai</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-1.5 flex items-center justify-center gap-1.5 text-[10px] font-extrabold text-emerald-900 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              <Database className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Data Aman</span>
            </div>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualCheck}
            disabled={isRefreshing}
            className="w-full bg-[#6366f1] dark:bg-indigo-700 hover:bg-[#4f46e5] text-white font-black text-[11px] py-2.5 px-4 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[2.5px_2.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>CEK STATUS OTOMATIS</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="verification-panel" className="px-3 max-w-2xl mx-auto w-full my-4 select-none">
      {currentStep === 2 && showLinkSentToast && (
        <div className="fixed top-[72px] right-3 sm:right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300 bg-[#6EE7B7] dark:bg-emerald-700 border-2 border-slate-900 dark:border-slate-600 rounded-2xl px-3 py-2 flex items-center justify-between gap-2.5 shadow-[3.5px_3.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] max-w-[320px]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              <div className="w-4 h-4 border-2 border-slate-900 dark:border-slate-600 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-slate-900 dark:text-white stroke-[3]" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">Link Dikirim!</p>
              <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-tight truncate">Cek inbox/spam email kamu.</p>
            </div>
          </div>
          <button
            onClick={() => setShowLinkSentToast(false)}
            className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-600 rounded-[22px] p-4 sm:p-5 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
        {/* Panel Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] dark:bg-red-700 border border-slate-900 dark:border-slate-600 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] dark:bg-yellow-600 border border-slate-900 dark:border-slate-600 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] dark:bg-green-600 border border-slate-900 dark:border-slate-600 inline-block"></span>
          </div>
          <span className="text-xs sm:text-[13px] font-black tracking-wider uppercase ml-1.5 text-slate-900 dark:text-white">
            PANEL VERIFIKASI PRO
          </span>
        </div>

        {/* Header Line Divider */}
        <div className="h-[1.5px] bg-slate-900 w-full mb-4" />

        {/* Step Navigation Tabs */}
        <div className="bg-[#f0f4f8] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[16px] p-1 mb-5">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(1)}
              className={`py-1.5 px-1 text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                currentStep === 1
                  ? 'bg-[#93c5fd] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-[12px] shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                  : 'bg-transparent text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>1. Email</span>
            </button>

            <button
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              disabled={currentStep < 2}
              className={`py-1.5 px-1 text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                currentStep === 2
                  ? 'bg-[#93c5fd] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-[12px] shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                  : 'bg-transparent text-slate-400 font-bold disabled:opacity-50'
              }`}
            >
              <span>2. Tempel OOB</span>
            </button>

            <button
              disabled={currentStep < 3}
              className={`py-1.5 px-1 text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
                currentStep === 3
                  ? 'bg-[#6ee7b7] dark:bg-emerald-700 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white rounded-[12px] shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                  : 'bg-transparent text-slate-400 font-bold disabled:opacity-50'
              }`}
            >
              <span>3. Hasil Pro</span>
            </button>
          </div>
        </div>

        {/* Panel Content Body */}
        <div>
          {errorMsg && (
            <div className="mb-3.5 bg-red-100 border-[1.5px] border-slate-900 dark:border-slate-600 text-red-900 p-2.5 rounded-xl font-bold text-xs shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1 FORM */}
          {currentStep === 1 && (
            <form onSubmit={handleSendOob} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider mb-2">
                  ALAMAT EMAIL ALIGHT CREATIVE
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh: emailkamu@gmail.com"
                    className="w-full bg-[#f8fafc] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white text-xs sm:text-sm rounded-[12px] pl-9 pr-3 py-2.5 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <p className="mt-2 text-[11px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 leading-normal">
                  Sistem akan menginstruksikan server Alight Creative untuk mengirimkan link login OOB.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#93c5fd] dark:bg-slate-900 hover:bg-blue-400 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm py-2.5 px-4 rounded-[12px] border-[1.5px] border-slate-900 dark:border-slate-600 shadow-[2.5px_2.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-white" />
                    <span>{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Link OOB (Langkah 1)</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2 FORM */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyOob} className="space-y-3">
              {/* Success Notification Banner */}
              <div className="bg-[#d1fae5] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 flex items-center gap-2.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                <div className="w-6 h-6 rounded-full bg-[#a7f3d0] dark:bg-slate-900 border border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
                </div>
                <span className="font-extrabold text-[11px] sm:text-xs text-slate-900 dark:text-white">
                  Link OOB Alight Creative berhasil dikirim ke email kamu!
                </span>
              </div>

              {/* Countdown Timer Banner */}
              <div className="bg-[#fce7f3] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 flex items-center justify-between shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                  <span className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-white">
                    {timeLeft > 0 ? 'Masa Berlaku OOB (3 Menit):' : 'Waktu OOB Telah Habis!'}
                  </span>
                </div>
                {timeLeft > 0 ? (
                  <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white font-mono bg-[#bbf7d0] dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    {formatTime(timeLeft)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/oob/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setTimeLeft(data.expiresInSeconds || 180);
                          setTimerActive(true);
                          alert('Link OOB berhasil dikirim ulang ke email kamu!');
                        } else {
                          alert(data.error || 'Gagal mengirim ulang link OOB');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Gagal menghubungi server.');
                      }
                    }}
                    className="bg-[#bbf7d0] dark:bg-slate-900 hover:bg-emerald-300 text-slate-900 dark:text-white font-black text-xs px-2.5 py-1 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Kirim Ulang</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-wider">
                    TEMPEL LINK OOB EMAIL
                  </label>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{email}</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Link2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                  </div>
                  <input
                    type="text"
                    required
                    value={oobLink}
                    onChange={(e) => setOobLink(e.target.value)}
                    placeholder="https://alight-creative.firebaseapp.com/__/auth/links?link=https://alightcreative.com/auth_action/..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 text-slate-900 dark:text-white text-xs rounded-xl pl-10 pr-3 py-2.5 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]"
                  />
                </div>
                <p className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Salin link login dari email Alight Creative secara utuh.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-[#e2e8f0] dark:bg-slate-700 hover:bg-slate-300 text-slate-900 dark:text-white font-extrabold text-xs py-2.5 px-3 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Ganti Email</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#fbcfe8] dark:bg-slate-900 hover:bg-[#f472b6] text-slate-900 dark:text-white font-extrabold text-xs py-2.5 px-3 rounded-xl border-2 border-slate-900 dark:border-slate-600 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900 dark:text-white" />
                      <span>{loadingText}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-slate-900 dark:text-white fill-slate-900" />
                      <span>Konfirmasi Order 1 Tahun</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}


          {/* STEP 3 SUCCESS RESULT */}
          {currentStep === 3 && successRecord && (
            <div className="relative bg-white dark:bg-slate-900 border-[2.5px] border-slate-900 dark:border-slate-600 rounded-[28px] p-5 sm:p-6 shadow-[5px_5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] space-y-4 animate-in fade-in zoom-in-95 duration-300">
              
              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-4 right-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-[2px] border-slate-900 dark:border-slate-600 rounded-xl p-1.5 transition-all shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5"
                title="Tutup / Reset"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Top Header Badge & Checkmark Icon */}
              <div className="flex flex-col items-center justify-center pt-2">
                {/* PRO ACTIVE Badge */}
                <div className="bg-[#fef08a] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-full px-3 py-0.5 text-[11px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] z-10">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>PRO ACTIVE</span>
                </div>

                {/* Double Ring Green Checkmark Circle */}
                <div className="relative mt-[-8px]">
                  <div className="w-16 h-16 rounded-full bg-[#86efac] dark:bg-green-800 border-[2.5px] border-slate-900 dark:border-slate-600 flex items-center justify-center p-1.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <div className="w-full h-full rounded-full bg-[#22c55e] dark:bg-green-600 border-[1.5px] border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white">
                      <Check className="w-8 h-8 stroke-[3.5] text-slate-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Headline & Subtitle */}
              <div className="text-center space-y-1">
                <h3 className="font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
                  <span>Verifikasi Berhasil!</span>
                  <span className="text-2xl">🎉</span>
                </h3>
                <p className="text-xs sm:text-[13px] font-bold text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Selamat! Akun Alight Motion kamu resmi aktif versi Pro 1 Tahun.
                </p>
              </div>

              {/* 3 Feature Pills Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#dbeafe] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[18px] p-2.5 sm:p-3 flex flex-col items-center text-center gap-1 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Video className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.25]" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight">
                    No Watermark
                  </span>
                </div>

                <div className="bg-[#dcfce7] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[18px] p-2.5 sm:p-3 flex flex-col items-center text-center gap-1 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Award className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.25]" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight">
                    1 Tahun Full
                  </span>
                </div>

                <div className="bg-[#fef9c3] dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[18px] p-2.5 sm:p-3 flex flex-col items-center text-center gap-1 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Layers className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.25]" />
                  <span className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white leading-tight">
                    Full XML Preset
                  </span>
                </div>
              </div>

              {/* Details Box */}
              <div className="bg-white dark:bg-slate-900 border-[1.5px] border-slate-900 dark:border-slate-600 rounded-[20px] p-4 space-y-3 text-xs shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Email Terdaftar:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-[220px]">
                    {successRecord.email}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Masa Berlaku Lisensi:</span>
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                    <span>{successRecord.expiresAt}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Status Akun:</span>
                  <span className="bg-[#86efac] dark:bg-green-800 text-slate-950 font-black text-[10.5px] tracking-wide px-2.5 py-0.5 rounded-full border border-slate-900 dark:border-slate-600 uppercase shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    LINKED & VERIFIED
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400 text-[11.5px]">Auto Renewal:</span>
                  <div className="flex items-center gap-1 font-extrabold text-[#16a34a]">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>Aktif</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={copyLicense}
                  className="w-full bg-[#fef08a] dark:bg-slate-900 hover:bg-yellow-300 dark:hover:bg-yellow-700 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-[14px] border-[2px] border-slate-900 dark:border-slate-600 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Salin Bukti Verifikasi</span>
                </button>

                <a
                  href="https://alightmotion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#93c5fd] dark:bg-slate-900 hover:bg-blue-400 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-[14px] border-[2px] border-slate-900 dark:border-slate-600 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <span>Mulai Gunakan Alight Motion Pro</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <HCaptchaModal 
        isOpen={showCaptcha} 
        onClose={() => setShowCaptcha(false)} 
        onVerify={() => executeSendOob()} 
      />
    </section>
  );
};
