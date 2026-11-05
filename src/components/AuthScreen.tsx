import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  LogIn,
  LogOut,
  Mail,
  PawPrint,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  Wallet,
  Wheat,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { DEFAULT_ADMIN_PASSWORD } from '../utils/farmLogic';
import farmShowcaseImg from '../assets/images/farm_pasture_showcase_1793629273558.jpg';

export const AuthScreen: React.FC = () => {
  const {
    user,
    profile,
    isDefaultPassword,
    loginAdminWithPassword,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
  } = useFarm();

  // Primary Admin Gate Password State
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [busyUnlock, setBusyUnlock] = useState(false);

  // Secondary Cloud Account Sync Section
  const [showCloudPanel, setShowCloudPanel] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cloudPassword, setCloudPassword] = useState('');
  const [cloudError, setCloudError] = useState('');
  const [showProviderGuide, setShowProviderGuide] = useState(false);
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const handleAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!adminPassword) {
      setAdminError('প্রবেশ করতে অ্যাডমিন পাসওয়ার্ড লিখুন।');
      return;
    }
    setBusyUnlock(true);
    try {
      const res = await loginAdminWithPassword(adminPassword);
      if (!res.ok) {
        setAdminError(res.error || 'পাসওয়ার্ড সঠিক নয়।');
      } else {
        setAdminPassword('');
      }
    } finally {
      setBusyUnlock(false);
    }
  };

  const handleFillDefaultPassword = () => {
    setAdminPassword(DEFAULT_ADMIN_PASSWORD);
    setAdminError('');
  };

  const handleGoogleSignIn = async () => {
    setCloudError('');
    setBusyGoogle(true);
    const res = await loginWithGoogle();
    setBusyGoogle(false);
    if (!res.ok && res.error) {
      setCloudError('Google ক্লাউড সংযোগ সম্পন্ন হয়নি। পুনরায় চেষ্টা করুন।');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloudError('');
    if (!email.trim() || !cloudPassword) {
      setCloudError('ইমেইল এবং পাসওয়ার্ড উভয়ই পূরণ করুন।');
      return;
    }
    setBusyEmail(true);
    if (authTab === 'login') {
      const res = await loginWithEmail(email, cloudPassword);
      if (!res.ok) {
        setCloudError(res.error || 'ক্লাউড সংযোগ ব্যর্থ হয়েছে।');
        if (res.code === 'auth/operation-not-allowed') setShowProviderGuide(true);
      }
    } else {
      if (!name.trim()) {
        setBusyEmail(false);
        setCloudError('আপনার নাম লিখুন।');
        return;
      }
      const res = await registerWithEmail(name, email, cloudPassword);
      if (!res.ok) {
        setCloudError(res.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
        if (res.code === 'auth/operation-not-allowed') setShowProviderGuide(true);
      }
    }
    setBusyEmail(false);
  };

  return (
    <div className="min-h-screen bg-[#080C0A] text-[#EFF5F1] flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Executive Top Navigation Bar */}
      <header className="w-full border-b border-[#16231B] bg-[#0A100C]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#EFF5F1]">
                  সবুজ খামার ইআরপি
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-[#7A9184]">
                {profile.farmName || 'সবুজ অ্যাগ্রো ও ডেইরি খামার'} · কেন্দ্রীয় অডিট পোর্টাল
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex items-center gap-2 text-[#7E9689]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>ক্লাউড সিস্টেম প্রস্তুত</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111A15] border border-[#1E2E25] text-[#9CB0A4]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">এনক্রিপ্টেড প্রবেশদ্বার</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Column Executive Balanced Split */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Authentic Agro-Operations Showcase */}
        <section className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#1A2A20] bg-[#0C140F] min-h-[420px] lg:min-h-[640px] flex flex-col justify-between shadow-2xl">
          {/* Authentic Farm Background Image with Vignette Scrim */}
          {!imgFailed ? (
            <img
              src={farmShowcaseImg}
              alt="সবুজ চারণভূমিতে খামারের পশু ও প্রাকৃতিক দৃশ্য"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-90"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D2116] via-[#0A1610] to-[#080C0A]" />
          )}

          {/* Deep Architectural Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080C0A] via-[#080C0A]/70 to-[#080C0A]/35" />

          {/* Top Brand Watermark & Status */}
          <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A120E]/80 backdrop-blur-md border border-[#203427] text-xs font-medium text-emerald-300">
              <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>সমন্বিত খামার ব্যবস্থাপনা প্ল্যাটফর্ম</span>
            </div>
            <span className="text-xs text-[#89A394] font-mono tabular-nums hidden sm:inline">
              Ver 2.6.4 · Cloud Active
            </span>
          </div>

          {/* Bottom Executive Snapshot Card */}
          <div className="relative z-10 p-6 sm:p-8 space-y-6">
            <div className="space-y-2 max-w-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                স্মার্ট খামার পরিচালনা ও স্বয়ংক্রিয় আর্থিক অডিট প্ল্যাটফর্ম
              </h1>
              <p className="text-sm text-[#BFD4C7] leading-relaxed">
                পশুর ডিজিটাল ডাটাবেস, খাদ্য মজুদ নিরীক্ষা, দৈনিক লাভ-ক্ষতির খতিয়ান এবং বিক্রয় চালান—একক সমন্বিত ড্যাশবোর্ডে সম্পূর্ণ সুরক্ষিত।
              </p>
            </div>

            {/* 4 Clean Glassmorphic Module Capability Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[#0B1410]/80 backdrop-blur-md border border-[#1E3025] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PawPrint className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-[#EFF5F1]">পশু ও ডেইরি প্রোফাইল</h2>
                  <p className="text-[11px] text-[#869E90] leading-snug mt-0.5">
                    ট্যাগ নম্বর, প্রজাতি, জাত, ওজন ও স্বাস্থ্য নিয়মিত ট্র্যাক করুন
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1410]/80 backdrop-blur-md border border-[#1E3025] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wheat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-[#EFF5F1]">খাদ্য মজুত ও রেশন</h2>
                  <p className="text-[11px] text-[#869E90] leading-snug mt-0.5">
                    মজুদ হ্রাস-বৃদ্ধি এবং লো-স্টক স্বয়ংক্রিয় সতর্কতা নিয়ন্ত্রণ
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1410]/80 backdrop-blur-md border border-[#1E3025] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-[#EFF5F1]">আয়-ব্যয় হিসাব ও অডিট</h2>
                  <p className="text-[11px] text-[#869E90] leading-snug mt-0.5">
                    দৈনিক লেনদেন, খাতওয়ারি খরচ ও লাভ-ক্ষতির স্পষ্ট চিত্র
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1410]/80 backdrop-blur-md border border-[#1E3025] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-[#EFF5F1]">বিক্রয় ও বকেয়া খাতা</h2>
                  <p className="text-[11px] text-[#869E90] leading-snug mt-0.5">
                    দুধ ও পশু বিক্রয় চালান, ক্রেতার তথ্য এবং বকেয়া আদায়
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="pt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-[#82998C]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ক্লাউড ফায়ারস্টোরে সিঙ্কড</span>
              </span>
              <span>·</span>
              <span>অফলাইন ব্রাউজার মেমোরি ব্যাকআপ</span>
              <span>·</span>
              <span>যেকোনো ডিভাইস থেকে ব্যবহারযোগ্য</span>
            </div>
          </div>
        </section>

        {/* Right Column: High-Grade Professional Login Card */}
        <section className="lg:col-span-5 bg-[#0F1713] border border-[#1C2C23] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-6">
            {/* Form Title & Context */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#15221B] border border-[#22352B] text-[#9CB0A4]">
                  এডমিন গেটওয়ে
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#EFF5F1]">অ্যাডমিন প্রমাণীকরণ</h2>
              <p className="text-xs sm:text-sm text-[#8CA094] leading-relaxed">
                খামারের ড্যাশবোর্ড ও সকল মডিউল নিয়ন্ত্রণে আপনার সিকিউরিটি পাসওয়ার্ড দিন।
              </p>
            </div>

            {/* Initial Default Password Helper (Subtle, professional, with 1-click Auto-Fill) */}
            {isDefaultPassword && (
              <div className="p-3.5 rounded-xl bg-[#0A130E] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#D2E4DA]">
                    <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>সিস্টেম ডিফল্ট কোড:</span>
                    <code className="font-mono tabular-nums font-bold text-sm text-emerald-300">
                      {DEFAULT_ADMIN_PASSWORD}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDefaultPassword}
                    className="px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-600 rounded-md border border-emerald-500/30 transition-colors whitespace-nowrap"
                  >
                    স্বয়ংক্রিয় পূরণ
                  </button>
                </div>
                <p className="text-[11px] text-[#7A9184] leading-relaxed">
                  লগইন করার পর <strong>অ্যাডমিন প্যানেল</strong> থেকে যেকোনো সময় আপনার মনমতো পাসওয়ার্ড পরিবর্তন করতে পারবেন।
                </p>
              </div>
            )}

            {/* Password Login Form */}
            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-gate-password"
                  className="block text-xs font-medium text-[#C8D8CE]"
                >
                  অ্যাডমিন পাসওয়ার্ড *
                </label>
                <div className="relative">
                  <input
                    id="admin-gate-password"
                    type={showAdminPass ? 'text' : 'password'}
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন..."
                    className="w-full min-h-[46px] pl-4 pr-12 py-2.5 bg-[#090F0C] border border-[#213329] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none rounded-xl text-sm text-[#EFF5F1] placeholder-[#536B5E] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass((prev) => !prev)}
                    aria-label={showAdminPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[38px] min-h-[38px] flex items-center justify-center text-[#7E9689] hover:text-[#EFF5F1] rounded-lg transition-colors"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {adminError && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 leading-relaxed"
                >
                  {adminError}
                </div>
              )}

              <button
                type="submit"
                disabled={busyUnlock}
                className="w-full min-h-[46px] px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/30 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 cursor-pointer"
              >
                <span>{busyUnlock ? 'যাচাই করা হচ্ছে...' : 'অ্যাডমিন প্যানেলে প্রবেশ করুন'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </form>
          </div>

          {/* Cloud Multi-Device Account Sync Section */}
          <div className="pt-5 border-t border-[#18261E] space-y-3">
            {user ? (
              <div className="p-3 rounded-xl bg-[#0C140F] border border-[#1C2C23] flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2 text-[#A8BEB1]">
                  <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">সংযুক্ত ক্লাউড: {user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="px-2.5 py-1 text-[11px] font-medium text-[#8EA496] hover:text-[#EFF5F1] bg-[#121C16] border border-[#1E2E25] rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowCloudPanel((prev) => !prev)}
                  aria-expanded={showCloudPanel}
                  className="w-full min-h-[40px] px-3.5 py-2 bg-[#0C140F] hover:bg-[#121D17] border border-[#1C2B22] rounded-xl text-xs font-medium text-[#A6BBAE] flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">ক্লাউড ডাটা সিঙ্ক ও ব্যাকআপ (ঐচ্ছিক)</span>
                  </span>
                  {showCloudPanel ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#7A9184] shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#7A9184] shrink-0" />
                  )}
                </button>

                {showCloudPanel && (
                  <div className="space-y-3 pt-1 p-3.5 rounded-xl bg-[#0A110D] border border-[#19271F]">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={busyGoogle}
                      className="w-full min-h-[42px] px-4 py-2 bg-[#121F17] hover:bg-[#192A20] border border-[#22362B] text-[#EFF5F1] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2.5 whitespace-nowrap disabled:opacity-60 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>{busyGoogle ? 'সংযোগ হচ্ছে...' : 'Google দিয়ে ক্লাউড সংযুক্ত করুন'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#070B09] border border-[#17241C] rounded-lg text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('login');
                          setCloudError('');
                        }}
                        className={`min-h-[32px] px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          authTab === 'login'
                            ? 'bg-[#15231A] text-emerald-300 font-semibold'
                            : 'text-[#7D9387] hover:text-[#EFF5F1]'
                        }`}
                      >
                        ইমেইল লগইন
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('register');
                          setCloudError('');
                        }}
                        className={`min-h-[32px] px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          authTab === 'register'
                            ? 'bg-[#15231A] text-emerald-300 font-semibold'
                            : 'text-[#7D9387] hover:text-[#EFF5F1]'
                        }`}
                      >
                        নতুন অ্যাকাউন্ট
                      </button>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                      {authTab === 'register' && (
                        <div className="space-y-1">
                          <label
                            htmlFor="auth-owner-name"
                            className="block text-[11px] font-medium text-[#A6BBAE]"
                          >
                            আপনার নাম
                          </label>
                          <input
                            id="auth-owner-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="যেমন: মোঃ ইউনুস আলী"
                            className="w-full min-h-[38px] px-3 py-1.5 bg-[#070C09] border border-[#1C2C22] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-[#EFF5F1]"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label
                          htmlFor="auth-email"
                          className="block text-[11px] font-medium text-[#A6BBAE]"
                        >
                          ইমেইল ঠিকানা
                        </label>
                        <input
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full min-h-[38px] px-3 py-1.5 bg-[#070C09] border border-[#1C2C22] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-[#EFF5F1]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="auth-password"
                          className="block text-[11px] font-medium text-[#A6BBAE]"
                        >
                          পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                        </label>
                        <input
                          id="auth-password"
                          type="password"
                          value={cloudPassword}
                          onChange={(e) => setCloudPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full min-h-[38px] px-3 py-1.5 bg-[#070C09] border border-[#1C2C22] focus:border-emerald-500 focus:outline-none rounded-lg text-xs text-[#EFF5F1]"
                        />
                      </div>

                      {cloudError && (
                        <div
                          role="alert"
                          className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-300 leading-relaxed"
                        >
                          {cloudError}
                        </div>
                      )}

                      {showProviderGuide && (
                        <div className="p-2.5 rounded-lg bg-[#0C1611] border border-[#203328] text-[11px] text-[#A6BBAE] space-y-1 leading-relaxed">
                          <div className="font-semibold text-emerald-300 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 shrink-0" />
                            <span>ইমেইল/পাসওয়ার্ড চালুর নিয়ম:</span>
                          </div>
                          <p>
                            Firebase Console → <strong>Authentication → Sign-in method</strong> থেকে Email/Password Enable করুন, অথবা Google দিয়ে লগইন করুন।
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={busyEmail}
                        className="w-full min-h-[38px] px-3 py-1.5 bg-[#14231A] hover:bg-[#1B2F23] border border-[#23382B] text-[#EFF5F1] text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 cursor-pointer"
                      >
                        {authTab === 'login' ? (
                          <>
                            <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{busyEmail ? 'সংযোগ হচ্ছে...' : 'ইমেইল দিয়ে সংযুক্ত করুন'}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{busyEmail ? 'তৈরি হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Subtle Professional Footer */}
      <footer className="w-full border-t border-[#141F18] py-4 px-6 text-center text-xs text-[#62776B]">
        সবুজ খামার ইআরপি · কৃষি ও পশুসম্পদ স্বয়ংক্রিয়করণ সিস্টেম · এনক্রিপ্টেড ডাটাবেস সিকিউরিটি
      </footer>
    </div>
  );
};
