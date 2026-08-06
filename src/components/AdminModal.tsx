import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, User, Key, CheckCircle, XCircle, Users, Activity, 
  Settings, LogOut, Search, RefreshCw, Bell, Database, ShieldCheck, 
  AlertTriangle, Check, X, Eye, EyeOff, Radio, Terminal, Server, Sparkles, Zap, Trash2, Ban, Sliders,
  Share2, MessageSquare, Send, UserCheck, Globe, Link, Smartphone, QrCode, KeyRound, Copy
} from 'lucide-react';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { VerificationRecord } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: VerificationRecord[];
  onClearOrders: () => void;
  onDeleteOrder?: (id: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, orders, onClearOrders, onDeleteOrder }) => {
  const [step, setStep] = useState<'login' | '2fa_login' | 'dashboard'>(() => {
    return localStorage.getItem('alight_admin_logged_in') === 'true' ? 'dashboard' : 'login';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('alight_admin_saved_username') || '';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('alight_admin_saved_password') || '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const val = localStorage.getItem('alight_admin_remember');
    return val !== null ? val === 'true' : true;
  });
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<'logs' | 'settings' | 'cs_links' | '2fa' | 'maintenance'>('logs');

  // 2FA state management
  const [twoFaEnabled, setTwoFaEnabled] = useState(() => localStorage.getItem('alight_2fa_enabled') === 'true');
  const [twoFaSecret, setTwoFaSecret] = useState(() => localStorage.getItem('alight_2fa_secret') || '');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [setup2FA, setSetup2FA] = useState(false);
  const [tempSecret, setTempSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [verifySetupCode, setVerifySetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCodeInput, setDisableCodeInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (localStorage.getItem('alight_admin_logged_in') === 'true') {
        setStep('dashboard');
      } else {
        setStep('login');
      }
      const savedUser = localStorage.getItem('alight_admin_saved_username');
      const savedPass = localStorage.getItem('alight_admin_saved_password');
      setUsername(savedUser || '');
      setPassword(savedPass || '');
    }
  }, [isOpen]);

  // CS & Social Links states (stored in localStorage)
  const [waGroupLink, setWaGroupLink] = useState(() => localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com');
  const [waChannelLink, setWaChannelLink] = useState(() => localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel');
  const [tgGroupLink, setTgGroupLink] = useState(() => localStorage.getItem('alight_link_tg_group') || 'https://t.me');
  const [adminDirectLink, setAdminDirectLink] = useState(() => localStorage.getItem('alight_link_admin_direct') || 'https://wa.me');
  const [socialTgLink, setSocialTgLink] = useState(() => localStorage.getItem('alight_link_social_tg') || 'https://t.me');
  const [socialTiktokLink, setSocialTiktokLink] = useState(() => localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com');
  const [socialIgLink, setSocialIgLink] = useState(() => localStorage.getItem('alight_link_social_ig') || 'https://instagram.com');
  const [socialGithubLink, setSocialGithubLink] = useState(() => localStorage.getItem('alight_link_social_github') || 'https://github.com');
  const [socialHandle, setSocialHandle] = useState(() => localStorage.getItem('alight_social_handle') || '@JAKISOFT');

  const handleSaveCsLinks = () => {
    localStorage.setItem('alight_link_wa_group', waGroupLink);
    localStorage.setItem('alight_link_wa_channel', waChannelLink);
    localStorage.setItem('alight_link_tg_group', tgGroupLink);
    localStorage.setItem('alight_link_admin_direct', adminDirectLink);
    localStorage.setItem('alight_link_social_tg', socialTgLink);
    localStorage.setItem('alight_link_social_tiktok', socialTiktokLink);
    localStorage.setItem('alight_link_social_ig', socialIgLink);
    localStorage.setItem('alight_link_social_github', socialGithubLink);
    localStorage.setItem('alight_social_handle', socialHandle);

    window.dispatchEvent(new CustomEvent('alight_settings_updated'));
    setSuccessToast('Link CS & Media Sosial berhasil disimpan!');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Quota & System Settings state (stored in localStorage)
  const [quotaLimit, setQuotaLimit] = useState(() => {
    const val = localStorage.getItem('alight_quota_limit');
    return val !== null && val !== '' ? val : '50';
  });
  const [quotaPeriod, setQuotaPeriod] = useState(() => {
    const val = localStorage.getItem('alight_quota_period');
    return val !== null && val !== '' ? val : 'harian';
  });
  const [remainingQuota, setRemainingQuota] = useState(() => {
    const val = localStorage.getItem('alight_remaining_quota');
    return val !== null && val !== '' ? val : '45';
  });
  const [resetHours, setResetHours] = useState(() => {
    const val = localStorage.getItem('alight_reset_hours');
    return val !== null && val !== '' ? val : '24';
  });
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('alight_maintenance') === 'true');
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('alight_announcement') || '🔥 Server Alight Motion Pro 2026 stabil & siap verifikasi 24/7.');

  const [websiteName, setWebsiteName] = useState(() => localStorage.getItem('alight_website_name') || 'AlightMaster');
  const [appName, setAppName] = useState(() => localStorage.getItem('alight_app_name') || 'Alight Motion Pro');
  const [appPublisher, setAppPublisher] = useState(() => localStorage.getItem('alight_app_publisher') || 'Alight Creative');

  // Global Maintenance Customization states
  const [maintHours, setMaintHours] = useState('0');
  const [maintMinutes, setMaintMinutes] = useState('15');
  const [maintBadgeText, setMaintBadgeText] = useState(() => localStorage.getItem('alight_maint_badge_text') || 'SEDANG PERBAIKAN • FITUR');
  const [maintHeadingText, setMaintHeadingText] = useState(() => localStorage.getItem('alight_maint_heading_text') || 'SISTEM DALAM PERBAIKAN');
  const [maintAnnouncementText, setMaintAnnouncementText] = useState(
    () => localStorage.getItem('alight_maint_announcement') || 'Aplikasi ' + (localStorage.getItem('alight_website_name') || 'AlightMaster') + ' sedang dalam perbaikan berkala untuk peningkatan server. Silakan coba beberapa saat lagi'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('alight_quota_limit', quotaLimit);
    localStorage.setItem('alight_quota_period', quotaPeriod);
    localStorage.setItem('alight_remaining_quota', remainingQuota);
    localStorage.setItem('alight_reset_hours', resetHours);
    localStorage.setItem('alight_maintenance', String(maintenanceMode));
    localStorage.setItem('alight_announcement', announcementText);
    localStorage.setItem('alight_maint_badge_text', maintBadgeText);
    localStorage.setItem('alight_maint_heading_text', maintHeadingText);
    localStorage.setItem('alight_maint_announcement', maintAnnouncementText);

    localStorage.setItem('alight_website_name', websiteName);
    localStorage.setItem('alight_app_name', appName);
    localStorage.setItem('alight_app_publisher', appPublisher);

    window.dispatchEvent(new CustomEvent('alight_settings_updated'));
  }, [quotaLimit, quotaPeriod, remainingQuota, resetHours, maintenanceMode, announcementText, maintBadgeText, maintHeadingText, maintAnnouncementText, websiteName, appName, appPublisher]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (username.trim().toLowerCase() === 'alightmotion' && password === 'alightpro66') {
      const is2faActive = localStorage.getItem('alight_2fa_enabled') === 'true';
      if (is2faActive) {
        setStep('2fa_login');
        setTwoFaCode('');
        setErrorMsg('');
      } else {
        completeAdminLogin();
      }
    } else {
      setErrorMsg('Username atau Password admin salah!');
    }
  };

  const completeAdminLogin = () => {
    setStep('dashboard');
    localStorage.setItem('alight_admin_remember', String(rememberMe));

    if (rememberMe) {
      localStorage.setItem('alight_admin_logged_in', 'true');
      localStorage.setItem('alight_admin_saved_username', username);
      localStorage.setItem('alight_admin_saved_password', password);
    } else {
      localStorage.removeItem('alight_admin_logged_in');
      localStorage.removeItem('alight_admin_saved_username');
      localStorage.removeItem('alight_admin_saved_password');
    }

    setSuccessToast('Berhasil login sebagai Administrator!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handle2FaLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const secret = localStorage.getItem('alight_2fa_secret') || '';
    if (!secret) {
      completeAdminLogin();
      return;
    }

    try {
      const res = verifySync({ token: twoFaCode.trim(), secret, epochTolerance: 30 });
      if (res.valid) {
        completeAdminLogin();
      } else {
        setErrorMsg('Kode yang anda masukkan kadaluarsa!');
      }
    } catch (err) {
      setErrorMsg('Gagal memproses kode 2FA. Coba lagi.');
    }
  };

  const startSetup2FA = async () => {
    try {
      setSetupError('');
      const secret = generateSecret();
      const otpauth = generateURI({ issuer: 'AlightMaster Admin', label: 'alightmotion', secret });
      const qrUrl = await QRCode.toDataURL(otpauth, {
        margin: 2,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setTempSecret(secret);
      setQrCodeDataUrl(qrUrl);
      setVerifySetupCode('');
      setSetup2FA(true);
    } catch (err) {
      setSetupError('Gagal membuat QR Code 2FA.');
    }
  };

  const handleVerifyAndEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    if (!verifySetupCode.trim()) {
      setSetupError('Masukkan 6 digit kode dari aplikasi Google Authenticator.');
      return;
    }

    try {
      const res = verifySync({ token: verifySetupCode.trim(), secret: tempSecret, epochTolerance: 30 });
      if (res.valid) {
        localStorage.setItem('alight_2fa_enabled', 'true');
        localStorage.setItem('alight_2fa_secret', tempSecret);
        setTwoFaEnabled(true);
        setTwoFaSecret(tempSecret);
        setSetup2FA(false);
        setSuccessToast('2FA Google Authenticator Berhasil Diaktifkan!');
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        setSetupError('Kode verifikasi tidak sesuai! Pastikan jam di smartphone kamu sudah otomatis/sinkron.');
      }
    } catch (err) {
      setSetupError('Gagal memverifikasi kode 2FA.');
    }
  };

  const handleDisable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    try {
      const res = verifySync({ token: disableCodeInput.trim(), secret: twoFaSecret, epochTolerance: 30 });
      if (res.valid) {
        localStorage.removeItem('alight_2fa_enabled');
        localStorage.removeItem('alight_2fa_secret');
        setTwoFaEnabled(false);
        setTwoFaSecret('');
        setShowDisableConfirm(false);
        setDisableCodeInput('');
        setSuccessToast('2FA Google Authenticator berhasil dinonaktifkan.');
        setTimeout(() => setSuccessToast(null), 3000);
      } else {
        setSetupError('Kode 2FA tidak valid untuk mematikan 2FA.');
      }
    } catch (err) {
      setSetupError('Gagal mematikan 2FA.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('alight_admin_logged_in');
    if (!rememberMe) {
      localStorage.removeItem('alight_admin_saved_username');
      localStorage.removeItem('alight_admin_saved_password');
      setUsername('');
      setPassword('');
    }
    setStep('login');
    setSuccessToast('Berhasil logout.');
    setTimeout(() => setSuccessToast(null), 2500);
  };

  const filteredOrders = orders.filter((o) => 
    o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.ip && o.ip.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-300">
      <div className={`bg-slate-950 border border-slate-800 rounded-3xl ${step === 'dashboard' ? 'max-w-6xl' : 'max-w-md'} w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col relative animate-in zoom-in-95 duration-300 transition-all`}>
        
        {/* Success Toast Notification */}
        {successToast && (
          <div className="bg-emerald-950 border-b border-emerald-800/80 px-4 py-2.5 flex items-center gap-2 text-emerald-200 text-xs font-semibold shrink-0 z-10 animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {step === 'login' ? (
          <div className="p-5 sm:p-6 relative">
            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-4 pt-1">
              {/* Shield Icon Top Badge */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Shield className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="font-black text-lg tracking-wider text-white">
                  ADMIN AKSES
                </h3>
              </div>

              {errorMsg && (
                <div className="bg-red-950/60 border border-red-800/60 rounded-xl p-2.5 flex items-start gap-2 text-red-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    USERNAME
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder:text-slate-600 dark:text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder:text-slate-600 dark:text-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="remember" className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                    Simpan Login
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-3 tracking-wide"
                >
                  LANJUTKAN
                </button>
              </form>
            </div>
          </div>
        ) : step === '2fa_login' ? (
          /* 2FA LOGIN SCREEN */
          <div className="p-5 sm:p-6 relative">
            <button
              onClick={() => setStep('login')}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Kembali ke login username"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                  <Smartphone className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-wider text-white uppercase">
                    Silahkan Masukkan Kode Dibawah
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Masukkan 6 Digit Kode
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-950/60 border border-red-800/60 rounded-xl p-2.5 flex items-start gap-2 text-red-200 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handle2FaLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    VERIFIKASI KODE 6-DIGIT ANDA DIBAWAH
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      autoFocus
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-lg font-mono tracking-[0.3em] font-bold text-emerald-400 placeholder:text-slate-700 dark:text-slate-200 placeholder:tracking-normal focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 tracking-wide uppercase"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>VERIFIKASI KODE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-center text-xs font-semibold text-slate-400 hover:text-white pt-1 transition-colors cursor-pointer"
                >
                  Kembali ke Form Login
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* DASHBOARD */
          <div className="flex flex-col h-[85vh] w-full">
            
            {/* Top Admin Control Center Header Banner */}
            <div className="m-4 mb-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden shrink-0">
              <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Shield className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                        ADMIN KONTROL
                      </h2>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Alight Motion Master
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleLogout}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[2.2]" />
                    <span>KELUAR</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
                    title="Tutup Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Sub-tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t border-slate-800/80 no-scrollbar">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'logs'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Monitoring ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Atur Batasan & Kuota</span>
                </button>

                <button
                  onClick={() => setActiveTab('cs_links')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'cs_links'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Kelola Link CS & Sosmed</span>
                </button>

                <button
                  onClick={() => setActiveTab('2fa')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === '2fa'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Keamanan 2FA</span>
                  {twoFaEnabled && (
                    <span className="bg-emerald-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full">AKTIF</span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'maintenance'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  <span>Maintenance Mode</span>
                  {maintenanceMode && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Dashboard Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* TAB: MONITORING / LOGS */}
              {activeTab === 'logs' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-400" /> Monitoring Aktivasi ({orders.length})
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Log lengkap riwayat permintaan token pro dari pengguna.</p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari email atau ID..."
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 dark:text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-60"
                      />
                      {orders.length > 0 && (
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus SELURUH database log aktivasi?')) {
                              onClearOrders();
                              setSuccessToast('Database log berhasil dibersihkan.');
                              setTimeout(() => setSuccessToast(null), 2000);
                            }
                          }}
                          className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl border border-rose-500/30 cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Clear All ({orders.length})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                        Belum ada log aktivasi tercatat.
                      </div>
                    ) : (
                      filteredOrders.map((o) => (
                        <div key={o.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-white">{o.email}</p>
                            <p className="font-mono text-[11px] text-slate-400">ID: {o.id} • IP: {o.ip || '127.0.0.1'}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Waktu: {o.timestamp} | Exp: {o.expiresAt}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-3 py-1 rounded-lg text-[10px]">
                              PRO 1 TAHUN (AKTIF)
                            </span>

                            {onDeleteOrder && (
                              <button
                                onClick={() => {
                                  onDeleteOrder(o.id);
                                  setSuccessToast(`Log ID ${o.id} berhasil dihapus.`);
                                  setTimeout(() => setSuccessToast(null), 2000);
                                }}
                                title="Hapus log ini"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ATUR BATASAN & KUOTA */}
              {activeTab === 'settings' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-400" /> Pengaturan Batasan & Kuota Sistem
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Atur batas maksimal, periode (harian/mingguan/bulanan/tahunan), sisa kuota, dan waktu reset via ketikan.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Quota Limit & Period */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Batas Kuota (Ketik Angka)</label>
                        <input
                          type="text"
                          value={quotaLimit}
                          onChange={(e) => setQuotaLimit(e.target.value)}
                          placeholder="Contoh: 100"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Periode (harian / mingguan / bulanan / tahunan)</label>
                        <input
                          type="text"
                          value={quotaPeriod}
                          onChange={(e) => setQuotaPeriod(e.target.value)}
                          placeholder="harian, mingguan, bulanan, atau tahunan"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Remaining Quota & Reset Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Atur Sisa Kuota Saat Ini</label>
                        <input
                          type="text"
                          value={remainingQuota}
                          onChange={(e) => setRemainingQuota(e.target.value)}
                          placeholder="Contoh: 45"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Reset Otomatis Setiap (Jam)</label>
                        <input
                          type="text"
                          value={resetHours}
                          onChange={(e) => setResetHours(e.target.value)}
                          placeholder="Contoh: 24 (artinya 24 jam sekali)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pengaturan Identitas & Merek (Branding)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Website</label>
                          <input
                            type="text"
                            value={websiteName}
                            onChange={(e) => setWebsiteName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder="AlightMaster"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Aplikasi</label>
                          <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder="Alight Motion Pro"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Publisher/Developer</label>
                          <input
                            type="text"
                            value={appPublisher}
                            onChange={(e) => setAppPublisher(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                            placeholder="Alight Creative"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pesan Toast Pengumuman Tambahan</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => {
                            setSuccessToast('Pengaturan batasan & kuota berhasil disimpan!');
                            setTimeout(() => setSuccessToast(null), 2500);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/30 shrink-0"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CS & SOCIAL MEDIA LINKS */}
              {activeTab === 'cs_links' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white tracking-wide uppercase">KELOLA LINK CS & MEDIA SOSIAL</h3>
                        <p className="text-xs text-slate-400">Atur tautan grup WhatsApp, Telegram, Kontak Admin, dan Media Sosial</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* CS Section */}
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-1">
                      1. KONTAK CUSTOMER SERVICE & KOMUNITAS
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          Link Grup WhatsApp Komunitas
                        </label>
                        <input
                          type="text"
                          value={waGroupLink}
                          onChange={(e) => setWaGroupLink(e.target.value)}
                          placeholder="https://chat.whatsapp.com/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-teal-400" />
                          Link Channel WhatsApp Resmi
                        </label>
                        <input
                          type="text"
                          value={waChannelLink}
                          onChange={(e) => setWaChannelLink(e.target.value)}
                          placeholder="https://whatsapp.com/channel/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-sky-400" />
                          Link Grup Telegram Support
                        </label>
                        <input
                          type="text"
                          value={tgGroupLink}
                          onChange={(e) => setTgGroupLink(e.target.value)}
                          placeholder="https://t.me/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                          Link Kontak Admin Direct (WhatsApp Admin)
                        </label>
                        <input
                          type="text"
                          value={adminDirectLink}
                          onChange={(e) => setAdminDirectLink(e.target.value)}
                          placeholder="https://wa.me/628xxx"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Social Media Section */}
                    <p className="text-xs font-black text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-1 pt-3">
                      2. MEDIA SOSIAL RESMI & USERNAME
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          Username / Handle Media Sosial (Judul)
                        </label>
                        <input
                          type="text"
                          value={socialHandle}
                          onChange={(e) => setSocialHandle(e.target.value)}
                          placeholder="Contoh: @JAKISOFT"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-sky-400" />
                          Link Social Telegram
                        </label>
                        <input
                          type="text"
                          value={socialTgLink}
                          onChange={(e) => setSocialTgLink(e.target.value)}
                          placeholder="https://t.me/jakisoft"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Link className="w-3.5 h-3.5 text-white" />
                          Link Social TikTok
                        </label>
                        <input
                          type="text"
                          value={socialTiktokLink}
                          onChange={(e) => setSocialTiktokLink(e.target.value)}
                          placeholder="https://tiktok.com/@jakisoft"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 text-rose-400" />
                          Link Social Instagram
                        </label>
                        <input
                          type="text"
                          value={socialIgLink}
                          onChange={(e) => setSocialIgLink(e.target.value)}
                          placeholder="https://instagram.com/jakisoft"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-white" />
                          Link Social GitHub
                        </label>
                        <input
                          type="text"
                          value={socialGithubLink}
                          onChange={(e) => setSocialGithubLink(e.target.value)}
                          placeholder="https://github.com/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={handleSaveCsLinks}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/30 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Simpan Link CS & Media Sosial</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: KEAMANAN 2FA ADMIN */}
              {activeTab === '2fa' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                  {/* Top Title Banner */}
                  <div className="flex items-start gap-3.5 border-b border-slate-800 pb-4">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
                      <Shield className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white tracking-wide uppercase">
                        KEAMANAN ADMIN 2FA
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Amankan akses dashboard admin dengan Autentikasi Dua Faktor (2FA) Google Authenticator / Authy.
                      </p>
                    </div>
                  </div>

                  {setupError && (
                    <div className="bg-red-950/70 border border-red-800/80 rounded-xl p-3 flex items-start gap-2.5 text-red-200 text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{setupError}</span>
                    </div>
                  )}

                  {!twoFaEnabled ? (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      {!setup2FA ? (
                        /* State 1: 2FA Belum Aktif */
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-amber-300 uppercase">2FA BELUM AKTIF</h4>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                Sangat disarankan untuk mengaktifkan 2FA guna melindungi dashboard admin dari akses yang tidak sah.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={startSetup2FA}
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                          >
                            <Key className="w-4 h-4" />
                            <span>MULAI SETUP 2FA</span>
                          </button>
                        </div>
                      ) : (
                        /* State 2: QR Code Scan & Verification Step */
                        <div className="space-y-5">
                          <div className="flex flex-col items-center justify-center text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                            {qrCodeDataUrl ? (
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border-2 border-slate-800 shadow-xl">
                                <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                              </div>
                            ) : (
                              <div className="w-48 h-48 rounded-2xl bg-slate-800 flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-slate-500 dark:text-slate-400 animate-spin" />
                              </div>
                            )}

                            <div className="space-y-2 text-left max-w-md w-full pt-2">
                              <p className="text-xs font-semibold text-slate-300">
                                1. Scan QR Code di atas menggunakan aplikasi <strong className="text-emerald-400">Google Authenticator</strong> atau <strong className="text-emerald-400">Authy</strong> di HP kamu.
                              </p>
                              <p className="text-xs font-semibold text-slate-300">
                                2. Atau masukkan kode rahasia secara manual:
                              </p>
                              
                              <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5">
                                <code className="flex-1 font-mono text-emerald-400 font-bold text-xs tracking-wider break-all text-center">
                                  {tempSecret}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tempSecret);
                                    setCopiedSecret(true);
                                    setTimeout(() => setCopiedSecret(false), 2000);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                                  title="Salin Kode Secret"
                                >
                                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3 max-w-md mx-auto">
                            <label className="block text-[11px] font-black text-slate-300 uppercase tracking-wider">
                              MASUKKAN KODE VERIFIKASI DARI APLIKASI:
                            </label>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={verifySetupCode}
                                onChange={(e) => setVerifySetupCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="Contoh: 123456"
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-emerald-400 placeholder:text-slate-600 dark:text-slate-300 focus:outline-none focus:border-emerald-500 text-center"
                              />

                              <button
                                type="submit"
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap uppercase tracking-wider"
                              >
                                VERIFIKASI & AKTIFKAN
                              </button>
                            </div>

                            <div className="pt-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSetup2FA(false);
                                  setSetupError('');
                                }}
                                className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                Batalkan Setup
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* State 3: 2FA Sudah Aktif */
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-emerald-400 uppercase">2FA AKTIF & DIPROTEKSI</h4>
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              VERIFIED
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Dashboard admin telah dilindungi dengan Google Authenticator. Setiap kali login, sistem akan meminta 6 digit kode dari HP kamu.
                          </p>
                        </div>
                      </div>

                      {!showDisableConfirm ? (
                        <div className="pt-2">
                          <button
                            onClick={() => setShowDisableConfirm(true)}
                            className="bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                          >
                            Nonaktifkan 2FA
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleDisable2FA} className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 space-y-3">
                          <h5 className="font-bold text-xs text-rose-200 uppercase">
                            Konfirmasi Penonaktifan 2FA
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            Masukkan kode 6 digit dari Google Authenticator untuk mematikan 2FA:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={disableCodeInput}
                              onChange={(e) => setDisableCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="6 Digit Kode"
                              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 text-center focus:outline-none focus:border-rose-500"
                            />
                            <button
                              type="submit"
                              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                            >
                              Matikan
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDisableConfirm(false)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: DEDICATED MAINTENANCE MODE TAB */}
              {activeTab === 'maintenance' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white tracking-wide uppercase">MAINTENANCE MODE</h3>
                        <p className="text-xs text-slate-400">Saklar penutup sementara aplikasi untuk perbaikan sistem</p>
                      </div>
                    </div>

                    <span className={`px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 border ${
                      maintenanceMode 
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                      {maintenanceMode ? 'OFFLINE' : 'ONLINE'}
                    </span>
                  </div>

                  {/* Card 1: Status Mode Perbaikan On/Off */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-xs text-slate-200 uppercase tracking-wide">STATUS MODE PERBAIKAN :</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Klik tombol untuk Mengaktifkan / Mematikan maintenance mode</p>
                    </div>
                    <button
                      onClick={() => {
                        const newMode = !maintenanceMode;
                        setMaintenanceMode(newMode);
                        localStorage.setItem('alight_maintenance', String(newMode));
                        
                        if (newMode) {
                          const h = parseInt(maintHours, 10) || 0;
                          const m = parseInt(maintMinutes, 10) || 0;
                          const durationMs = ((h * 3600) + (m > 0 ? m : 15) * 60) * 1000;
                          const targetTime = Date.now() + durationMs;
                          localStorage.setItem('alight_maint_target_time', String(targetTime));
                        }

                        window.dispatchEvent(new CustomEvent('alight_settings_updated'));
                        setSuccessToast(newMode ? 'Mode Maintenance Aktif.' : 'Mode Maintenance Dimatikan (Server Online).');
                        setTimeout(() => setSuccessToast(null), 2500);
                      }}
                      className={`font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                        maintenanceMode
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      }`}
                    >
                      {maintenanceMode ? 'MATIKAN' : 'AKTIFKAN'}
                    </button>
                  </div>

                  {/* Card 2: Atur Durasi Hitung Mundur */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
                    <p className="font-black text-xs text-slate-200 uppercase tracking-wide">
                      ATUR DURASI HITUNG MUNDUR SELESAI OTOMATIS
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JAM</label>
                        <input
                          type="number"
                          min="0"
                          value={maintHours}
                          onChange={(e) => setMaintHours(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MENIT</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={maintMinutes}
                          onChange={(e) => setMaintMinutes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Cepat Durasi Preset:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '5 Mnt', h: '0', m: '5' },
                          { label: '15 Mnt', h: '0', m: '15' },
                          { label: '30 Mnt', h: '0', m: '30' },
                          { label: '1 Jam', h: '1', m: '0' },
                          { label: '2 Jam', h: '2', m: '0' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setMaintHours(preset.h);
                              setMaintMinutes(preset.m);
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              maintHours === preset.h && maintMinutes === preset.m
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start Button */}
                    <button
                      onClick={() => {
                        const h = parseInt(maintHours, 10) || 0;
                        const m = parseInt(maintMinutes, 10) || 0;
                        const totalMins = (h * 60) + (m > 0 ? m : 15);
                        const durationMs = totalMins * 60 * 1000;
                        const targetTime = Date.now() + durationMs;

                        localStorage.setItem('alight_maintenance', 'true');
                        localStorage.setItem('alight_maint_target_time', String(targetTime));
                        setMaintenanceMode(true);
                        window.dispatchEvent(new CustomEvent('alight_settings_updated'));
                        setSuccessToast(`Mode Maintenance Dimulai (${Math.floor(totalMins / 60)} Jam ${totalMins % 60} Menit)!`);
                        setTimeout(() => setSuccessToast(null), 3000);
                      }}
                      className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider mt-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>MULAI MAINTENANCE ({maintHours || '0'} JAM {maintMinutes || '0'} MENIT)</span>
                    </button>

                    <p className="text-[10px] font-medium text-slate-400 leading-normal pt-1">
                      *Setelah durasi hitung mundur habis, mode pemeliharaan akan tertutup dan sistem kembali online secara otomatis.
                    </p>
                  </div>

                  {/* Card 3: Custom Titles & Announcement Text */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5">
                    <div>
                      <p className="font-black text-xs text-slate-200 uppercase tracking-wide">TEKS JUDUL MAINTENANCE</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Ubah teks badge status, judul utama, dan pesan pengumuman</p>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. TEKS BADGE STATUS MERAH</label>
                        <input
                          type="text"
                          value={maintBadgeText}
                          onChange={(e) => setMaintBadgeText(e.target.value)}
                          placeholder="Contoh: SEDANG PERBAIKAN • FITUR"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-rose-300 font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. JUDUL UTAMA HEADING BESAR</label>
                        <input
                          type="text"
                          value={maintHeadingText}
                          onChange={(e) => setMaintHeadingText(e.target.value)}
                          placeholder="Contoh: SISTEM DALAM PERBAIKAN"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-extrabold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. PESAN PENGUMUMAN PENGEMBANG:</label>
                        <textarea
                          rows={3}
                          value={maintAnnouncementText}
                          onChange={(e) => setMaintAnnouncementText(e.target.value)}
                          placeholder="Tulis pesan pengumuman..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        localStorage.setItem('alight_maint_badge_text', maintBadgeText);
                        localStorage.setItem('alight_maint_heading_text', maintHeadingText);
                        localStorage.setItem('alight_maint_announcement', maintAnnouncementText);
                        window.dispatchEvent(new CustomEvent('alight_settings_updated'));
                        setSuccessToast('Teks pesan perbaikan berhasil disimpan!');
                        setTimeout(() => setSuccessToast(null), 2500);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>SIMPAN TEKS PESAN PERBAIKAN</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
