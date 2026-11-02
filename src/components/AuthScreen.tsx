import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cloud,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  UserPlus,
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
    <div className="min-h-screen bg-[#090D0B] text-[#EFF5F1] flex flex-col">
      {/* Strict Zero-Bypass Top Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between gap-8 px-5 sm:px-8 py-4 border-b border-[#18251E]">
        <span className="text-lg font-bold tracking-tight text-[#EFF5F1] whitespace-nowrap shrink-0">
          সবুজ খামার ব্যবস্থাপনা
        </span>

        <span className="hidden md:inline text-xs text-[#8CA295] whitespace-nowrap shrink-0">
          {profile.farmName} · অ্যাডমিন নিয়ন্ত্রিত প্রবেশদ্বার
        </span>

        <div className="flex items-center gap-2 text-xs text-emerald-300 whitespace-nowrap shrink-0">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>পাসওয়ার্ড সুরক্ষিত</span>
        </div>
      </header>

      {/* Main 2-Column Balanced Split */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-5 sm:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Editorial Farm Showcase */}
        <section className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#1C2C23] bg-[#0E1712] min-h-[320px] lg:min-h-[600px] flex flex-col justify-end">
          {!imgFailed ? (
            <img
              src={farmShowcaseImg}
              alt="সবুজ চারণভূমিতে খামারের গরু ও ছাগল"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F261A] via-[#0B1711] to-[#090D0B]" />
          )}

          {/* Measured Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />

          <div className="relative z-10 p-6 sm:p-10 space-y-5 max-w-2xl">
            <p className="text-xs font-medium text-emerald-300 tracking-wide">
              সুরক্ষিত অ্যাডমিন কন্ট্রোল প্যানেল · ক্লাউড সার্ভার সংরক্ষণ · সকল ডিভাইসে সচল
            </p>
            <h1
              className="text-2xl sm:text-4xl font-bold text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              পাসওয়ার্ড ছাড়া প্রবেশ সম্পূর্ণ নিষিদ্ধ — এক প্যানেল থেকেই পুরো খামার নিয়ন্ত্রণ করুন
            </h1>
            <p className="text-sm sm:text-base text-[#D0E0D6] leading-relaxed">
              সঠিক অ্যাডমিন পাসওয়ার্ড দিয়ে লগইন করলেই ড্যাশবোর্ড, পশুর তালিকা, খাবারের স্টক, আয়-ব্যয়, বিক্রয় এবং অ্যাডমিন প্যানেলের সকল নিয়ন্ত্রণ উন্মুক্ত হবে।
            </p>

            <div className="pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#D5E4DA]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>কঠোর পাসওয়ার্ড লক</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>পূর্ণাঙ্গ অ্যাডমিন প্যানেল</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>নিরাপদ ক্লাউড ব্যাকআপ</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Mandatory Admin Password Gate + Cloud Sync */}
        <section className="lg:col-span-5 bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#EFF5F1]">অ্যাডমিন পাসওয়ার্ড লগইন</h2>
              <p className="text-sm text-[#95ABA0] leading-relaxed">
                নির্দিষ্ট অ্যাডমিন পাসওয়ার্ড দিয়ে লগইন করুন। পাসওয়ার্ড ছাড়া ড্যাশবোর্ড বা অন্য কোনো অংশে প্রবেশ করা যাবে না।
              </p>
            </div>

            {/* Initial Default Password Helper (Automatically disappears once user sets custom password) */}
            {isDefaultPassword && (
              <div className="p-3.5 rounded-xl bg-[#0C1812] border border-emerald-500/30 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2 text-[#D5E6DC]">
                  <span>নির্দিষ্ট প্রাথমিক পাসওয়ার্ড:</span>
                  <code className="font-mono tabular-nums font-bold text-sm text-emerald-300 select-all">
                    {DEFAULT_ADMIN_PASSWORD}
                  </code>
                </div>
                <p className="text-[#8CA396] leading-relaxed">
                  লগইন করার পর <strong>অ্যাডমিন প্যানেল</strong> থেকে পাসওয়ার্ড আপনার মনমতো পরিবর্তন করতে পারবেন।
                </p>
              </div>
            )}

            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="admin-gate-password" className="block text-xs font-medium text-[#C8D8CE]">
                  অ্যাডমিন পাসওয়ার্ড *
                </label>
                <div className="relative">
                  <input
                    id="admin-gate-password"
                    type={showAdminPass ? 'text' : 'password'}
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="আপনার অ্যাডমিন পাসওয়ার্ড লিখুন"
                    className="w-full min-h-[48px] pl-4 pr-12 py-2.5 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass((prev) => !prev)}
                    aria-label={showAdminPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#8CA295] hover:text-[#EFF5F1] rounded-lg transition-colors"
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
                className="w-full min-h-[48px] px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{busyUnlock ? 'যাচাই করা হচ্ছে...' : 'পাসওয়ার্ড দিয়ে লগইন করুন'}</span>
              </button>
            </form>
          </div>

          {/* Cloud Multi-Device Account Sync Section (Does NOT bypass Admin Password Gate) */}
          <div className="pt-5 border-t border-[#1A2921] space-y-4">
            {user ? (
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2 text-[#B8CCC0]">
                  <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">ক্লাউড সংযুক্ত: {user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#9CB0A4] hover:text-white bg-[#131F19] border border-[#21332A] rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>অ্যাকাউন্ট পরিবর্তন</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowCloudPanel((prev) => !prev)}
                  aria-expanded={showCloudPanel}
                  className="w-full min-h-[42px] px-3.5 py-2 bg-[#0D1612] hover:bg-[#13201A] border border-[#1E3027] rounded-xl text-xs font-medium text-[#BDCEC4] flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">সব ডিভাইসে সিঙ্ক করতে ক্লাউড অ্যাকাউন্ট যুক্ত করুন</span>
                  </span>
                  {showCloudPanel ? (
                    <ChevronUp className="w-4 h-4 text-[#8CA295] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#8CA295] shrink-0" />
                  )}
                </button>

                {showCloudPanel && (
                  <div className="space-y-3 pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={busyGoogle}
                      className="w-full min-h-[44px] px-4 py-2.5 bg-[#15251D] hover:bg-[#1C3227] border border-emerald-500/30 text-[#EFF5F1] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
                    >
                      <LogIn className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{busyGoogle ? 'সংযোগ করা হচ্ছে...' : 'Google দিয়ে ক্লাউড সংযুক্ত করুন'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B110E] border border-[#1B2A22] rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('login');
                          setCloudError('');
                        }}
                        className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                          authTab === 'login'
                            ? 'bg-[#182820] text-emerald-300'
                            : 'text-[#8FA599] hover:text-[#EFF5F1]'
                        }`}
                      >
                        ক্লাউড ইমেইল লগইন
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab('register');
                          setCloudError('');
                        }}
                        className={`min-h-[36px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                          authTab === 'register'
                            ? 'bg-[#182820] text-emerald-300'
                            : 'text-[#8FA599] hover:text-[#EFF5F1]'
                        }`}
                      >
                        নতুন ক্লাউড অ্যাকাউন্ট
                      </button>
                    </div>

                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      {authTab === 'register' && (
                        <div className="space-y-1">
                          <label htmlFor="auth-owner-name" className="block text-xs font-medium text-[#BDCEC4]">
                            আপনার নাম
                          </label>
                          <input
                            id="auth-owner-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="যেমন: মোঃ ইউনুস আলী"
                            className="w-full min-h-[42px] px-3.5 py-2 bg-[#0B110E] border border-[#21332A] focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-[#EFF5F1]"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label htmlFor="auth-email" className="block text-xs font-medium text-[#BDCEC4]">
                          ইমেইল ঠিকানা
                        </label>
                        <input
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full min-h-[42px] px-3.5 py-2 bg-[#0B110E] border border-[#21332A] focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-[#EFF5F1]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="auth-password" className="block text-xs font-medium text-[#BDCEC4]">
                          ক্লাউড অ্যাকাউন্ট পাসওয়ার্ড
                        </label>
                        <input
                          id="auth-password"
                          type="password"
                          value={cloudPassword}
                          onChange={(e) => setCloudPassword(e.target.value)}
                          placeholder="কমপক্ষে ৬ অক্ষর"
                          className="w-full min-h-[42px] px-3.5 py-2 bg-[#0B110E] border border-[#21332A] focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-[#EFF5F1]"
                        />
                      </div>

                      {cloudError && (
                        <div
                          role="alert"
                          className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 leading-relaxed"
                        >
                          {cloudError}
                        </div>
                      )}

                      {showProviderGuide && (
                        <div className="p-3 rounded-xl bg-[#0C1511] border border-[#23382D] text-xs text-[#B4C8BC] space-y-1 leading-relaxed">
                          <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>ইমেইল/পাসওয়ার্ড চালুর নিয়ম:</span>
                          </div>
                          <p>
                            Firebase Console → <strong>Authentication → Sign-in method</strong> থেকে Email/Password Enable করুন, অথবা Google সংযোগ ব্যবহার করুন।
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={busyEmail}
                        className="w-full min-h-[42px] px-4 py-2 bg-[#172820] hover:bg-[#1F352B] border border-[#263E32] text-[#EFF5F1] text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
                      >
                        {authTab === 'login' ? (
                          <>
                            <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{busyEmail ? 'সংযোগ হচ্ছে...' : 'ক্লাউড ইমেইল সংযুক্ত করুন'}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{busyEmail ? 'তৈরি হচ্ছে...' : 'ক্লাউড অ্যাকাউন্ট তৈরি করুন'}</span>
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
    </div>
  );
};
