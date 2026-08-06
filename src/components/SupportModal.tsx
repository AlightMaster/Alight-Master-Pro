import React, { useState, useEffect } from 'react';
import { Headset, X, MessageSquare, MessageCircle, Radio, Send, UserCheck, ShieldCheck, ExternalLink, Activity, RefreshCw, Copy, Check, Lock, Server, MapPin, Wifi, Instagram, Eye, EyeOff } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';

interface GeoData {
  ip: string;
  country_name: string;
  country_code: string;
  region: string;
  city: string;
  org: string;
  asn?: string;
}

export const SupportModal: React.FC = () => {
  const { websiteName } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contact'>('dashboard');
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isLoadingIp, setIsLoadingIp] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullIp, setShowFullIp] = useState(false);

  const maskIp = (ipStr: string) => {
    if (!ipStr) return '***.***.***.***';
    if (ipStr.includes('.')) {
      const parts = ipStr.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
      }
    }
    if (ipStr.includes(':')) {
      const parts = ipStr.split(':');
      return `${parts[0]}:${parts[1]}:****:****`;
    }
    return '***.***.***.***';
  };

  // Quota & Reset State (synced with Admin settings in localStorage)
  const [usedCount, setUsedCount] = useState(0);
  const [timeLeftToReset, setTimeLeftToReset] = useState('');
  const [quotaLimitStr, setQuotaLimitStr] = useState('5');
  const [quotaPeriodStr, setQuotaPeriodStr] = useState('hari');
  const [remainingQuotaStr, setRemainingQuotaStr] = useState('5');
  const [resetHoursStr, setResetHoursStr] = useState('24');
  const [maintenanceActive, setMaintenanceActive] = useState(false);

  // CS & Social Links state (synced with Admin settings in localStorage)
  const [csLinks, setCsLinks] = useState({
    waGroup: localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com',
    waChannel: localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel',
    tgGroup: localStorage.getItem('alight_link_tg_group') || 'https://t.me',
    adminDirect: localStorage.getItem('alight_link_admin_direct') || 'https://wa.me',
    socialTg: localStorage.getItem('alight_link_social_tg') || 'https://t.me',
    socialTiktok: localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com',
    socialIg: localStorage.getItem('alight_link_social_ig') || 'https://instagram.com',
    socialHandle: localStorage.getItem('alight_social_handle') || '@AlightMaster',
  });

  const loadCsLinks = () => {
    setCsLinks({
      waGroup: localStorage.getItem('alight_link_wa_group') || 'https://chat.whatsapp.com',
      waChannel: localStorage.getItem('alight_link_wa_channel') || 'https://whatsapp.com/channel',
      tgGroup: localStorage.getItem('alight_link_tg_group') || 'https://t.me',
      adminDirect: localStorage.getItem('alight_link_admin_direct') || 'https://wa.me',
      socialTg: localStorage.getItem('alight_link_social_tg') || 'https://t.me',
      socialTiktok: localStorage.getItem('alight_link_social_tiktok') || 'https://tiktok.com',
      socialIg: localStorage.getItem('alight_link_social_ig') || 'https://instagram.com',
      socialHandle: localStorage.getItem('alight_social_handle') || '@AlightMaster',
    });
  };

  const fetchRealIpInfo = async () => {
    setIsLoadingIp(true);
    try {
      const res = await fetch('https://ipwho.is/').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setGeoData({
          ip: data.ip || '0.0.0.0',
          country_name: data.country || 'Unknown',
          country_code: data.country_code || '??',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          org: data.connection?.isp || data.connection?.org || 'Unknown',
        });
      } else {
        const res2 = await fetch('https://api.ipify.org?format=json').catch(() => null);
        if (res2 && res2.ok) {
          const data2 = await res2.json();
          setGeoData({
            ip: data2.ip || '0.0.0.0',
            country_name: 'Unknown',
            country_code: '??',
            region: 'Unknown',
            city: 'Unknown',
            org: 'Unknown',
          });
        } else {
          setGeoData({
            ip: '0.0.0.0',
            country_name: 'Unknown',
            country_code: '??',
            region: 'Unknown',
            city: 'Unknown',
            org: 'Unknown',
          });
        }
      }
    } catch {
      setGeoData({
        ip: '0.0.0.0',
        country_name: 'Unknown',
        country_code: '??',
        region: 'Unknown',
        city: 'Unknown',
        org: 'Unknown',
      });
    } finally {
      setIsLoadingIp(false);
    }
  };

  // Calculate real usage from localStorage and admin settings
  const loadSettings = () => {
    try {
      loadCsLinks();
      const limit = localStorage.getItem('alight_quota_limit');
      const period = localStorage.getItem('alight_quota_period');
      const rem = localStorage.getItem('alight_remaining_quota');
      const rHours = localStorage.getItem('alight_reset_hours');
      const maint = localStorage.getItem('alight_maintenance') === 'true';

      setQuotaLimitStr(limit !== null && limit !== '' ? limit : '5');
      setQuotaPeriodStr(period || 'hari');
      setRemainingQuotaStr(rem !== null && rem !== '' ? rem : '5');
      setResetHoursStr(rHours !== null && rHours !== '' ? rHours : '24');
      setMaintenanceActive(maint);

      const savedOrders = localStorage.getItem('alightpro_orders');
      if (savedOrders) {
        const orders = JSON.parse(savedOrders);
        const today = new Date().toDateString();
        const todayOrders = orders.filter((o: any) => new Date(o.createdAt || Date.now()).toDateString() === today);
        setUsedCount(todayOrders.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSettings();

    window.addEventListener('alight_settings_updated', loadSettings);
    window.addEventListener('storage', loadSettings);

    // Countdown timer based on reset hours
    const updateResetTimer = () => {
      const now = new Date();
      const rHoursNum = parseFloat(resetHoursStr) || 24;
      const diff = rHoursNum * 3600 * 1000 - (Date.now() % (rHoursNum * 3600 * 1000));

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeftToReset(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      } else {
        setTimeLeftToReset('00:00:00');
      }
    };

    updateResetTimer();
    const timer = setInterval(updateResetTimer, 1000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('alight_settings_updated', loadSettings);
      window.removeEventListener('storage', loadSettings);
    };
  }, [isOpen, resetHoursStr]);

  useEffect(() => {
    if (isOpen && activeTab === 'dashboard') {
      fetchRealIpInfo();
    }
  }, [isOpen, activeTab]);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const limitParsed = parseFloat(quotaLimitStr);
  const numericMaxQuota = !isNaN(limitParsed) ? limitParsed : 50;

  const remParsed = parseFloat(remainingQuotaStr);
  const numericRemainingQuota = !isNaN(remParsed) ? remParsed : Math.max(0, numericMaxQuota - usedCount);
  const usagePercentage = numericMaxQuota > 0 ? Math.min(100, Math.round((usedCount / numericMaxQuota) * 100)) : 0;

  return (
    <>
      {/* Floating Headset Support Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-yellow-300 hover:bg-yellow-400 text-slate-900 dark:text-white rounded-2xl border-2 border-slate-900 dark:border-slate-600 shadow-[4px_4px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 transition-all group cursor-pointer"
        aria-label="Pusat Bantuan & Komunitas"
      >
        <Headset className="w-6 h-6 stroke-[2.5] group-hover:scale-110 transition-transform" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 dark:border-slate-600"></span>
      </button>

      {/* Support Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-2xl max-w-md w-full shadow-[5px_5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] overflow-hidden select-none animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-200 dark:bg-slate-900 p-2.5 sm:p-3 border-b-2 border-slate-900 dark:border-slate-600 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                  <Headset className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">
                    Pusat Bantuan & Komunitas
                  </h3>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Pusat Layanan CS & Monitoring Dashboard</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="p-2 bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-900 dark:border-slate-600 grid grid-cols-2 gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-1.5 px-2.5 rounded-lg border-2 border-slate-900 dark:border-slate-600 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-white dark:bg-slate-950 dark:text-white shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-1.5 px-2.5 rounded-lg border-2 border-slate-900 dark:border-slate-600 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-slate-800 text-white dark:bg-slate-950 dark:text-white shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Kontak CS & Komunitas</span>
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
              {activeTab === 'dashboard' && (
                <div className="space-y-3">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                        <h4 className="font-black text-xs text-slate-900 dark:text-white">Dashboard</h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Status Limit & Informasi IP Realtime</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-emerald-100 border border-slate-900 dark:border-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-emerald-900">Status Aman</span>
                      </div>
                      <button
                        onClick={fetchRealIpInfo}
                        disabled={isLoadingIp}
                        className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] cursor-pointer"
                        title="Refresh IP Info"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIp ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Network Information Box (Real API Geolocation) */}
                  <div className="bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 space-y-2 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-wider">Detail Informasi Jaringan</span>
                      <span className="bg-emerald-100 border border-slate-900 dark:border-slate-600 text-emerald-900 dark:text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded">
                        Koneksi Aktif
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* IP Address */}
                      <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 flex items-center justify-between shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-200 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                            <Server className="w-4 h-4 text-slate-900 dark:text-white stroke-[2.5]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">ALAMAT IP</p>
                            <p className="font-mono font-extrabold text-[11px] text-slate-900 dark:text-white truncate">
                              {isLoadingIp
                                ? 'Mendeteksi IP...'
                                : showFullIp
                                ? (geoData?.ip || '')
                                : maskIp(geoData?.ip || '')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowFullIp(!showFullIp)}
                            title={showFullIp ? 'Sembunyikan IP' : 'Tampilkan IP Full'}
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
                          >
                            {showFullIp ? <EyeOff className="w-3 h-3 text-slate-700 dark:text-slate-200" /> : <Eye className="w-3 h-3 text-slate-700 dark:text-slate-200" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(geoData?.ip || '', 'ip')}
                            title="Salin IP"
                            className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
                          >
                            {copiedField === 'ip' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Country */}
                      <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 flex items-center justify-between shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                            <div className="w-4 h-2.5 rounded-xs flex flex-col overflow-hidden shrink-0 border border-slate-900 dark:border-slate-600">
                              <div className="h-1.5 bg-red-600 w-full"></div>
                              <div className="h-1 bg-white w-full"></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">NEGARA</p>
                            <p className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                              {isLoadingIp ? 'Memuat...' : `${geoData?.country_name || 'Indonesia'} (${geoData?.country_code || 'ID'})`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(`${geoData?.country_name} (${geoData?.country_code})`, 'country')}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer"
                        >
                          {copiedField === 'country' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Region & City */}
                      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 flex items-center justify-between shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-yellow-200 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                            <MapPin className="w-4 h-4 text-slate-900 dark:text-white stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">WILAYAH & KOTA</p>
                            <p className="font-extrabold text-[11px] text-slate-900 dark:text-white">
                              {isLoadingIp ? 'Memuat...' : `${geoData?.city || 'Jakarta'}, ${geoData?.region || 'Indonesia'}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(`${geoData?.city}, ${geoData?.region}`, 'city')}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer"
                        >
                          {copiedField === 'city' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* ISP / Provider */}
                      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 flex items-center justify-between shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-200 dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                            <Wifi className="w-4 h-4 text-slate-900 dark:text-white stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">ISP / PENYEDIA</p>
                            <p className="font-extrabold text-[11px] text-slate-900 dark:text-white truncate max-w-[170px] sm:max-w-[240px]">
                              {isLoadingIp ? 'Memuat...' : (geoData?.org || 'Internet Service Provider')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(geoData?.org || '', 'isp')}
                          className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer"
                        >
                          {copiedField === 'isp' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quota & Reset Stats (Real state from Admin settings & localStorage) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="bg-blue-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                      <p className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">BATAS {quotaPeriodStr.toUpperCase()}</p>
                      <p className="font-black text-xs text-slate-900 dark:text-white mt-0.5">{quotaLimitStr} <span className="text-[9px] font-bold">x/{quotaPeriodStr}</span></p>
                    </div>
                    <div className="bg-emerald-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                      <p className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">SISA KUOTA</p>
                      <p className="font-black text-xs text-slate-900 dark:text-white mt-0.5">{numericRemainingQuota} <span className="text-[9px] font-bold">terpakai {usedCount}X</span></p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                      <p className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase">RESET ({resetHoursStr}J)</p>
                      <p className="font-black text-[11px] text-slate-900 dark:text-white mt-0.5 font-mono">{timeLeftToReset || '00:00:00'}</p>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-2.5 space-y-1.5 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      <span>Penggunaan Kuota {quotaPeriodStr}</span>
                      <span className="font-black">{usedCount} dari {quotaLimitStr} ({usagePercentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 border border-slate-900 dark:border-slate-600 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, usagePercentage)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Notice Box */}
                  <div className="bg-slate-950 border-2 border-slate-900 dark:border-slate-600 rounded-lg p-2 flex items-start gap-2 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-slate-200 dark:text-slate-100 leading-snug">
                      Quota verifikasi hanya terpakai jika aktivasi Alight Motion Pro berhasil. Setiap IP mendapatkan 5 kali aktivasi sukses per 24 jam.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-3">
                  {/* Top Banner Box */}
                  <div className="bg-[#dbeafe] dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      Dapatkan informasi terbaru, solusi kendala, dan diskusi seputar Alight Motion Pro.
                    </p>
                  </div>

                  {/* Main Link Cards */}
                  <div className="space-y-2.5">
                    {/* 1. Grup WhatsApp Komunitas */}
                    <a
                      href={csLinks.waGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#22c55e] hover:bg-[#16a34a] border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-[#22c55e] shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                          <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-white leading-snug">Grup WhatsApp Komunitas</h4>
                          <p className="text-[10px] sm:text-[11px] font-semibold text-white/95">Diskusi & info update Alight Motion</p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-white stroke-[2.5] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>

                    {/* 2. Channel WhatsApp Resmi */}
                    <a
                      href={csLinks.waChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#00a884] hover:bg-[#008f70] border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-[#00a884] shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                          <Radio className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-white leading-snug">Channel WhatsApp Resmi</h4>
                          <p className="text-[10px] sm:text-[11px] font-semibold text-white/95">Pengumuman & kabar fitur terbaru</p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-white stroke-[2.5] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>

                    {/* 3. Grup Telegram Support */}
                    <a
                      href={csLinks.tgGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0088cc] hover:bg-[#0077b5] border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-[#0088cc] shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                          <Send className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-white leading-snug">Grup Telegram Support</h4>
                          <p className="text-[10px] sm:text-[11px] font-semibold text-white/95">Dukungan teknis cepat & file XML</p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-white stroke-[2.5] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>

                    {/* 4. Kontak Admin Direct */}
                    <a
                      href={csLinks.adminDirect}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#facc15] hover:bg-[#eab308] border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 flex items-center justify-center text-slate-900 dark:text-white shrink-0 shadow-[1px_1px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                          <MessageCircle className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">Kontak Admin Direct</h4>
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100">Konsultasi kendala verifikasi khusus</p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-900 dark:text-white stroke-[2.5] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>

                  {/* Section Title: KUNJUNGI MEDIA SOSIAL RESMI */}
                  <div className="text-center pt-2 pb-0.5">
                    <p className="font-black text-[11px] sm:text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                      KUNJUNGI MEDIA SOSIAL RESMI ({csLinks.socialHandle || '@JAKISOFT'})
                    </p>
                  </div>

                  {/* 3 Social Media Grid Buttons */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    <a
                      href={csLinks.socialTg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0088cc] hover:bg-[#0077b5] text-white border-2 border-slate-900 dark:border-slate-600 rounded-2xl py-2.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0.5 transition-all cursor-pointer text-center"
                    >
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span className="font-black text-xs">Telegram</span>
                    </a>

                    <a
                      href={csLinks.socialTiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-950 hover:bg-black text-white border-2 border-slate-900 dark:border-slate-600 rounded-2xl py-2.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0.5 transition-all cursor-pointer text-center"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.31 0 .61.05.89.15V9.77a5.7 5.7 0 0 0-.89-.07 5.68 5.68 0 1 0 5.68 5.68V8.69a7.35 7.35 0 0 0 4.29 1.38V7a4.29 4.29 0 0 1-3.23-1.18z" />
                      </svg>
                      <span className="font-black text-xs">TikTok</span>
                    </a>

                    <a
                      href={csLinks.socialIg}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#e1306c] hover:bg-[#c12a5b] text-white border-2 border-slate-900 dark:border-slate-600 rounded-2xl py-2.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] active:translate-y-0.5 transition-all cursor-pointer text-center"
                    >
                      <Instagram className="w-4 h-4 stroke-[2.5]" />
                      <span className="font-black text-xs">Instagram</span>
                    </a>
                  </div>

                  {/* Bottom Security Banner */}
                  <div className="bg-[#dcfce7] dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-600 rounded-2xl p-3 flex items-center gap-2.5 shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569]">
                    <div className="w-6 h-6 rounded-lg bg-emerald-200 border border-slate-900 dark:border-slate-600 flex items-center justify-center text-emerald-900 shrink-0">
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      Admin tidak pernah meminta password email atau kata sandi kamu.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-900 dark:border-slate-600 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{websiteName} Security v2.5.0</span>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-[11px] py-1.5 px-4 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[2px_2px_0px_#475569] transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
