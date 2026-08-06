import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { InstructionCard } from './components/InstructionCard';
import { VerificationPanel } from './components/VerificationPanel';
import { LiveStatsCard } from './components/LiveStatsCard';
import { FeatureListSection } from './components/FeatureListSection';
import { FaqSection } from './components/FaqSection';
import { FooterSection } from './components/FooterSection';
import { SupportModal } from './components/SupportModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { AdminModal } from './components/AdminModal';
import { LiveNotificationToast } from './components/LiveNotificationToast';
import { WelcomeModal } from './components/WelcomeModal';
import { VerificationRecord } from './types';

export default function App() {
  const [orders, setOrders] = useState<VerificationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('alightpro_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(() => {
    return localStorage.getItem('alight_maintenance') === 'true';
  });

  useEffect(() => {
    const checkMaint = () => {
      setIsMaintenanceActive(localStorage.getItem('alight_maintenance') === 'true');
    };

    window.addEventListener('alight_settings_updated', checkMaint);
    window.addEventListener('storage', checkMaint);
    return () => {
      window.removeEventListener('alight_settings_updated', checkMaint);
      window.removeEventListener('storage', checkMaint);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('alightpro_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    const checkWelcome = () => {
      const hideExpiration = localStorage.getItem('alightpro_hide_welcome');
      if (hideExpiration) {
        const now = new Date().getTime();
        if (now < parseInt(hideExpiration, 10)) {
          return; // Still hidden
        } else {
          localStorage.removeItem('alightpro_hide_welcome');
        }
      }
      // Delay showing welcome modal slightly
      setTimeout(() => setIsWelcomeOpen(true), 500);
    };

    checkWelcome();
  }, []);

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddOrder = (newRecord: VerificationRecord) => {
    setOrders((prev) => [newRecord, ...prev]);
  };

  const handleClearOrders = () => {
    setOrders([]);
    localStorage.removeItem('alightpro_orders');
  };

  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-900 text-slate-900 dark:text-white transition-colors pb-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Sticky Header */}
      <Navbar
        onNavigate={handleNavigate}
        onOpenHistory={() => setIsHistoryOpen(true)}
        activeOrderCount={orders.length}
      />

      {/* Main Container */}
      <main className="space-y-2">
        {/* Hero Section */}
        <HeroSection />

        {/* How to Get OOB Link Instructions */}
        <InstructionCard />

        {/* 3-Step OOB Verification Panel */}
        <VerificationPanel onSuccess={handleAddOrder} />

        {/* Real-time Verification Statistics */}
        <LiveStatsCard />

        {/* Pro Features Breakdown */}
        <FeatureListSection />

        {/* FAQ Accordions */}
        <FaqSection />
      </main>

      {/* Footer */}
      <FooterSection 
        onNavigate={handleNavigate} 
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Support Modal */}
      <SupportModal />

      {/* Live Activation Toast Notification */}
      <LiveNotificationToast />

      {/* Order History Modal */}
      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={orders}
        onClear={handleClearOrders}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Admin Management Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        orders={orders}
        onClearOrders={handleClearOrders}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />
    </div>
  );
}
