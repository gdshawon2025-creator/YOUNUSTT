import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  LayoutDashboard,
  Lock,
  LogOut,
  MailCheck,
  PawPrint,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  Wheat,
  X,
} from 'lucide-react';
import { AdminPanelView } from './components/AdminPanelView';
import { AnimalsView } from './components/AnimalsView';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeedStockView } from './components/FeedStockView';
import { SalesView } from './components/SalesView';
import { TransactionsView } from './components/TransactionsView';
import { FarmProvider, useFarm } from './context/FarmContext';
import { ActiveTab } from './types/farm';

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: ActiveTab.DASHBOARD, label: 'ড্যাশবোর্ড', shortLabel: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { id: ActiveTab.ANIMALS, label: 'পশুর তালিকা', shortLabel: 'পশু', icon: PawPrint },
  { id: ActiveTab.FEED_STOCK, label: 'খাবারের স্টক', shortLabel: 'খাবার', icon: Wheat },
  { id: ActiveTab.TRANSACTIONS, label: 'আয়-ব্যয় হিসাব', shortLabel: 'আয়-ব্যয়', icon: Wallet },
  { id: ActiveTab.SALES, label: 'বিক্রয় হিসাব', shortLabel: 'বিক্রয়', icon: ShoppingBag },
  { id: ActiveTab.ADMIN_PANEL, label: 'অ্যাডমিন প্যানেল', shortLabel: 'অ্যাডমিন', icon: ShieldCheck },
];

const WorkspaceShell: React.FC = () => {
  const {
    user,
    isAuthReady,
    isAdminUnlocked,
    profile,
    toastMessage,
    clearToast,
    resendVerificationEmail,
    refreshAuthUser,
    lockWorkspace,
    logout,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.DASHBOARD);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#090D0B] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-[#9CB0A4]">খামারের তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Unverified email gate when Cloud Email/Password account is awaiting verification
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#090D0B] text-[#EFF5F1] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#101814] border border-[#1E2E26] rounded-2xl p-7 space-y-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <MailCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold">ইমেইল ভেরিফিকেশন সম্পন্ন করুন</h1>
            <p className="text-sm text-[#9CB0A4] leading-relaxed">
              ক্লাউডে নিরাপদে তথ্য সংরক্ষণের জন্য আপনার <strong className="text-[#EFF5F1]">{user.email}</strong> ঠিকানায় পাঠানো ভেরিফিকেশন লিংকে ক্লিক করুন।
            </p>
          </div>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => void refreshAuthUser()}
              className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>ভেরিফাই করেছি — সামনে এগিয়ে যান</span>
            </button>
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="w-full min-h-[44px] px-4 py-2 bg-[#16231C] hover:bg-[#1E3127] border border-[#243B2E] text-xs font-medium text-[#D6E5DC] rounded-xl transition-colors whitespace-nowrap"
            >
              ভেরিফিকেশন ইমেইল পুনরায় পাঠান
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full min-h-[40px] px-4 py-2 text-xs text-[#899E92] hover:text-[#EFF5F1] transition-colors whitespace-nowrap"
            >
              অন্য অ্যাকাউন্ট ব্যবহার করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Strict Mandatory Admin Password Gate: Nothing in the app can be entered without valid password
  if (!isAdminUnlocked) {
    return <AuthScreen />;
  }

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
  const mobileBottomTabs = NAV_ITEMS.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#090D0B] text-[#EFF5F1] flex">
      {/* Desktop Sidebar Navigation (264px fixed) */}
      <aside className="hidden lg:flex lg:w-[264px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#0C120F] border-r border-[#192820] z-30">
        <div className="px-6 py-5 border-b border-[#192820]">
          <div className="text-lg font-bold tracking-tight text-[#EFF5F1] truncate">
            {profile.farmName}
          </div>
          <div className="text-xs text-[#869D90] truncate mt-0.5">
            পরিচালক: {profile.ownerName}
          </div>
        </div>

        <nav aria-label="প্রধান মেনু" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-emerald-600 text-white'
                    : 'text-[#9CB0A4] hover:text-[#EFF5F1] hover:bg-[#131E18]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#192820] space-y-2.5">
          <div className="px-3 py-2 rounded-xl bg-[#101914] border border-[#1B2A22] text-xs text-[#9CB0A4] flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              {user ? user.email : 'অ্যাডমিন প্যানেল থেকে ক্লাউড সংযুক্ত করুন'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={lockWorkspace}
              className="flex-1 min-h-[40px] px-3 py-1.5 text-xs font-medium text-[#D6E5DC] bg-[#14221B] hover:bg-[#1B2E25] border border-[#23392E] rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>লক করুন</span>
            </button>
            {user && (
              <button
                type="button"
                onClick={() => void logout()}
                className="flex-1 min-h-[40px] px-3 py-1.5 text-xs font-medium text-[#9CB0A4] hover:text-[#EFF5F1] bg-[#121C17] hover:bg-[#1A2821] border border-[#1E2E26] rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>লগআউট</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[264px] flex flex-col min-w-0">
        {/* Mobile Compact Top Header (48px height -> adheres strictly to <=15% sticky cap) */}
        <header className="lg:hidden sticky top-0 z-30 h-12 px-4 bg-[#0C120F]/95 backdrop-blur-md border-b border-[#192820] flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#EFF5F1] truncate">
            {profile.farmName}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={lockWorkspace}
              aria-label="খামার লক করুন"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-400"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(ActiveTab.ADMIN_PANEL)}
              aria-label="অ্যাডমিন প্যানেল"
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg ${
                activeTab === ActiveTab.ADMIN_PANEL ? 'text-emerald-400' : 'text-[#9CB0A4]'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Contextual Top Header */}
        <header className="hidden lg:flex items-center justify-between gap-8 px-8 py-4 bg-[#090D0B] border-b border-[#18251E]">
          <div className="text-sm text-[#899E92] whitespace-nowrap truncate">
            <span>{profile.farmName}</span>
            <span className="mx-2 text-[#4D6357]">/</span>
            <strong className="font-semibold text-[#EFF5F1]">{currentNav.label}</strong>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={lockWorkspace}
              className="min-h-[38px] px-3.5 py-1.5 text-xs font-medium text-[#C8D8CE] hover:text-white bg-[#121D17] hover:bg-[#192920] border border-[#22352B] rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>খামার লক</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(ActiveTab.ADMIN_PANEL)}
              className={`min-h-[38px] px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === ActiveTab.ADMIN_PANEL
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-300 hover:text-white bg-[#13241B] hover:bg-emerald-600 border border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>অ্যাডমিন প্যানেল</span>
            </button>
          </div>
        </header>

        {/* Toast Notification (Positioned bottom-right above mobile tab bar so top header stays clear) */}
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-50 max-w-sm bg-[#12211A] border border-emerald-500/40 text-[#EFF5F1] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs"
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                toastMessage.tone === 'error' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
            <span className="flex-1 leading-snug">{toastMessage.text}</span>
            <button
              type="button"
              onClick={clearToast}
              aria-label="বার্তা বন্ধ করুন"
              className="p-1 text-[#899E92] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Viewport Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24 lg:pb-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#EFF5F1]">{currentNav.label}</h1>
          </div>

          {activeTab === ActiveTab.DASHBOARD && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === ActiveTab.ANIMALS && <AnimalsView />}
          {activeTab === ActiveTab.FEED_STOCK && <FeedStockView />}
          {activeTab === ActiveTab.TRANSACTIONS && <TransactionsView />}
          {activeTab === ActiveTab.SALES && <SalesView />}
          {activeTab === ActiveTab.ADMIN_PANEL && <AdminPanelView onNavigate={setActiveTab} />}
        </main>

        {/* Mobile Bottom Tab Bar (60px height; 48px + 60px = 108px = 12.8% <= 15% mobile sticky cap) */}
        <nav
          aria-label="মোবাইল নেভিগেশন"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-[60px] bg-[#0C120F]/95 backdrop-blur-md border-t border-[#192820] grid grid-cols-5 items-center"
        >
          {mobileBottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-emerald-400' : 'text-[#899E92]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[11px] font-medium whitespace-nowrap">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <FarmProvider>
        <WorkspaceShell />
      </FarmProvider>
    </ErrorBoundary>
  );
}
