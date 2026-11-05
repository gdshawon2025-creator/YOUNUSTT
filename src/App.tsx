import React, { useState } from 'react';
import {
  Bot,
  Calendar,
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
  Sparkles,
  Wallet,
  Wheat,
  X,
} from 'lucide-react';
import { AdminPanelView } from './components/AdminPanelView';
import { AiAdvisorView } from './components/AiAdvisorView';
import { AnimalsView } from './components/AnimalsView';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeedStockView } from './components/FeedStockView';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';
import { SalesView } from './components/SalesView';
import { TransactionsView } from './components/TransactionsView';
import { FarmProvider, useFarm } from './context/FarmContext';
import { ActiveTab } from './types/farm';

interface NavGroup {
  groupTitle: string;
  items: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'মূল কার্যক্রম',
    items: [
      { id: ActiveTab.DASHBOARD, label: 'ড্যাশবোর্ড', shortLabel: 'ড্যাশবোর্ড', icon: LayoutDashboard },
      { id: ActiveTab.ANIMALS, label: 'পশুর তালিকা', shortLabel: 'পশু', icon: PawPrint },
      { id: ActiveTab.FEED_STOCK, label: 'খাবারের স্টক', shortLabel: 'খাবার', icon: Wheat },
    ],
  },
  {
    groupTitle: 'আর্থিক ও বাণিজ্য',
    items: [
      { id: ActiveTab.TRANSACTIONS, label: 'আয়-ব্যয় হিসাব', shortLabel: 'আয়-ব্যয়', icon: Wallet },
      { id: ActiveTab.SALES, label: 'বিক্রয় ও বকেয়া', shortLabel: 'বিক্রয়', icon: ShoppingBag },
    ],
  },
  {
    groupTitle: 'স্মার্ট এআই ও প্রশাসন',
    items: [
      { id: ActiveTab.AI_ADVISOR, label: 'এআই খামার গাইড', shortLabel: 'এআই গাইড', icon: Bot },
      { id: ActiveTab.ADMIN_PANEL, label: 'অ্যাডমিন প্যানেল', shortLabel: 'অ্যাডমিন', icon: ShieldCheck },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

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
      <div className="min-h-screen bg-[#080C0A] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#9CB0A4]">খামারের তথ্য ও ডাটাবেস লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // Unverified email gate when Cloud Email/Password account is awaiting verification
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-[#080C0A] text-[#EFF5F1] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#101713] border border-[#1E2E26] rounded-2xl p-7 space-y-5 shadow-2xl">
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
              className="w-full min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>ভেরিফাই করেছি — সামনে এগিয়ে যান</span>
            </button>
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="w-full min-h-[44px] px-4 py-2 bg-[#16231C] hover:bg-[#1E3127] border border-[#243B2E] text-xs font-medium text-[#D6E5DC] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              ভেরিফিকেশন ইমেইল পুনরায় পাঠান
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full min-h-[40px] px-4 py-2 text-xs text-[#899E92] hover:text-[#EFF5F1] transition-colors whitespace-nowrap cursor-pointer"
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

  const currentNav = ALL_NAV_ITEMS.find((n) => n.id === activeTab) || ALL_NAV_ITEMS[0];
  const mobileBottomTabs = ALL_NAV_ITEMS.slice(0, 5);

  const formattedDate = new Intl.DateTimeFormat('bn-BD', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const farmInitials = (profile.farmName || 'সবুজ খামার')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || 'সখ';

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#EFF5F1] flex">
      {/* Desktop Sidebar Navigation (270px fixed) */}
      <aside className="hidden lg:flex lg:w-[270px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B120E] border-r border-[#17251D] z-30">
        {/* Brand Lockup */}
        <div className="px-5 py-4 border-b border-[#17251D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wheat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-[#EFF5F1] truncate">
                  সবুজ খামার ইআরপি
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-[#7A9184] truncate">
                স্মার্ট লাইভস্টক ও হিসাব
              </p>
            </div>
          </div>
        </div>

        {/* Farm & Manager Profile Badge */}
        <div className="px-5 py-3 border-b border-[#142019] bg-[#0E1612]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#14261D] border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
              {farmInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#EFF5F1] truncate">
                {profile.farmName}
              </div>
              <div className="text-[11px] text-[#7E9689] truncate">
                পরিচালক: {profile.ownerName}
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav aria-label="প্রধান মেনু" className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider text-[#647C6E] uppercase">
                {group.groupTitle}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                        : 'text-[#92A79B] hover:text-[#EFF5F1] hover:bg-[#121D17]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active ? 'text-emerald-400' : 'text-[#71897C]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Cloud status & Quick Lock */}
        <div className="p-3.5 border-t border-[#17251D] space-y-2 bg-[#090E0B]">
          <div className="px-3 py-2 rounded-xl bg-[#0F1713] border border-[#192820] text-[11px] text-[#8EA396] flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {user ? user.email : 'অফলাইন মোড (লোকাল সেভ)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={lockWorkspace}
              className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#C8DCD0] bg-[#132019] hover:bg-[#192A21] border border-[#203429] rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>লক করুন</span>
            </button>
            {user && (
              <button
                type="button"
                onClick={() => void logout()}
                aria-label="ক্লাউড লগআউট"
                className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-[#869E90] hover:text-[#EFF5F1] bg-[#111915] hover:bg-[#17231D] border border-[#1C2C22] rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>লগআউট</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[270px] flex flex-col min-w-0">
        {/* Mobile Compact Top Header (48px height -> adheres strictly to <=15% sticky cap) */}
        <header className="lg:hidden sticky top-0 z-30 h-12 px-4 bg-[#0A100C]/95 backdrop-blur-md border-b border-[#18261E] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wheat className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-[#EFF5F1] truncate">
              {profile.farmName}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={lockWorkspace}
              aria-label="খামার লক করুন"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#8EA496] hover:text-emerald-400 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(ActiveTab.ADMIN_PANEL)}
              aria-label="অ্যাডমিন প্যানেল"
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg cursor-pointer ${
                activeTab === ActiveTab.ADMIN_PANEL ? 'text-emerald-400' : 'text-[#8EA496]'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop Contextual Executive Top Header */}
        <header className="hidden lg:flex items-center justify-between gap-6 px-8 py-3.5 bg-[#0A100C]/70 backdrop-blur-md border-b border-[#16231B] sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-medium text-[#7C9386] truncate">
              {profile.farmName}
            </span>
            <span className="text-[#3A4E43] font-mono">/</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#EFF5F1]">{currentNav.label}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#121E17] text-emerald-300 border border-[#1E3025]">
                সচল
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Live Bangla Date */}
            <div className="flex items-center gap-1.5 text-xs text-[#82998C]">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            <div className="h-4 w-px bg-[#1A2920]" />

            <button
              type="button"
              onClick={lockWorkspace}
              className="min-h-[34px] px-3 py-1.5 text-xs font-medium text-[#BDD0C5] hover:text-white bg-[#101A14] hover:bg-[#16241C] border border-[#1E2E25] rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>খামার লক</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(ActiveTab.ADMIN_PANEL)}
              className={`min-h-[34px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === ActiveTab.ADMIN_PANEL
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300 hover:text-white bg-[#122119] hover:bg-emerald-600 border border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>অ্যাডমিন প্যানেল</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-8 z-50 max-w-sm bg-[#0E1A14] border border-emerald-500/40 text-[#EFF5F1] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs backdrop-blur-md"
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
              className="p-1 text-[#82998C] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Viewport Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24 lg:pb-12">
          {activeTab === ActiveTab.DASHBOARD && <DashboardView onNavigate={setActiveTab} />}
          {activeTab === ActiveTab.ANIMALS && <AnimalsView />}
          {activeTab === ActiveTab.FEED_STOCK && <FeedStockView />}
          {activeTab === ActiveTab.TRANSACTIONS && <TransactionsView />}
          {activeTab === ActiveTab.SALES && <SalesView />}
          {activeTab === ActiveTab.AI_ADVISOR && <AiAdvisorView onNavigate={setActiveTab} />}
          {activeTab === ActiveTab.ADMIN_PANEL && <AdminPanelView onNavigate={setActiveTab} />}
        </main>

        {/* Ambient Omnipresent AI Assistant Widget */}
        <FloatingAiAssistant onNavigateToAiAdvisor={() => setActiveTab(ActiveTab.AI_ADVISOR)} />

        {/* Mobile Bottom Tab Bar (60px height; 48px + 60px = 108px = 12.8% <= 15% mobile sticky cap) */}
        <nav
          aria-label="মোবাইল নেভিগেশন"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-[60px] bg-[#0A100C]/95 backdrop-blur-md border-t border-[#18261E] grid grid-cols-5 items-center"
        >
          {mobileBottomTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-emerald-400 font-semibold' : 'text-[#7D9387]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[11px] whitespace-nowrap">{tab.shortLabel}</span>
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
