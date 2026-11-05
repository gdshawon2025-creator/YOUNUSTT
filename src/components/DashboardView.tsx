import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  DatabaseBackup,
  Layers,
  PawPrint,
  Plus,
  Receipt,
  Scale,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wheat,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab } from '../types/farm';
import { formatBDT, formatNumber } from '../utils/farmLogic';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    user,
    profile,
    animals,
    feedStocks,
    transactions,
    sales,
    summary,
    isDataLoading,
    seedCloudData,
  } = useFarm();

  const [seeding, setSeeding] = useState(false);

  const currency = profile.currency || '৳';
  const lowStockItems = feedStocks.filter((f) => f.currentStock <= f.minStockAlert);
  const recentTransactions = transactions.slice(0, 5);
  const recentSales = sales.slice(0, 4);

  const isBrandNewEmpty =
    !isDataLoading &&
    animals.length === 0 &&
    feedStocks.length === 0 &&
    transactions.length === 0 &&
    sales.length === 0;

  const totalFlow = summary.totalIncome + summary.totalExpense;
  const incomePct = totalFlow > 0 ? Math.round((summary.totalIncome / totalFlow) * 100) : 50;
  const expensePct = totalFlow > 0 ? 100 - incomePct : 50;

  const profitMargin =
    summary.totalIncome > 0
      ? Math.round((summary.netBalance / summary.totalIncome) * 100)
      : 0;

  const salesCollectionRate =
    summary.totalSalesAmount > 0
      ? Math.round((summary.totalSalesPaid / summary.totalSalesAmount) * 100)
      : 100;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCloudData();
    } finally {
      setSeeding(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-[140px] rounded-2xl bg-[#0F1713] border border-[#1A2A20] animate-pulse"
            />
          ))}
        </div>
        <div className="h-[280px] rounded-2xl bg-[#0F1713] border border-[#1A2A20] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Executive Welcome & Quick-Action Hub */}
      <section className="bg-gradient-to-r from-[#0E1712] via-[#111C16] to-[#0D1510] border border-[#1A2C21] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
              লাইভ খামার পোর্টাল
            </span>
            <span className="text-xs text-[#5D7366]">·</span>
            <span className="text-xs text-[#8BA193]">{profile.farmName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#EFF5F1] tracking-tight">
            স্বাগতম, {profile.ownerName || 'পরিচালক'}
          </h1>
          <p className="text-xs sm:text-sm text-[#8DA396] leading-relaxed">
            খামারের সার্বিক পশুস্বাস্থ্য, খাদ্য মজুদ ও আর্থিক খতিয়ানের সর্বশেষ হালনাগাদ তথ্য।
          </p>
        </div>

        {/* Executive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate(ActiveTab.ANIMALS)}
            className="min-h-[38px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>নতুন পশু নথিভুক্ত</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
            className="min-h-[38px] px-3.5 py-2 bg-[#14231A] hover:bg-[#1B2F23] border border-[#21352A] text-[#D8E6DD] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>আয়-ব্যয় এন্ট্রি</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(ActiveTab.AI_ADVISOR)}
            className="min-h-[38px] px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap cursor-pointer border border-emerald-400/30"
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span>এআই খামার গাইড</span>
          </button>
        </div>
      </section>

      {/* Proactive AI Live Farm Advisor Banner */}
      <section className="bg-gradient-to-r from-[#0C1A13] via-[#0E1E16] to-[#0A150F] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#EFF5F1]">এআই সার্বক্ষণিক পরামর্শক</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300">
                স্বয়ংক্রিয় অডিট
              </span>
            </div>
            <p className="text-xs text-[#9BB1A3] leading-relaxed">
              {summary.careNeededAnimals > 0 || summary.lowStockCount > 0
                ? `সতর্কতা: ${summary.careNeededAnimals} টি পশুর চিকিৎসা ও ${summary.lowStockCount} টি খাদ্যের মজুদ পুনর্ভরণ দরকার।`
                : 'খামারের সকল পশুর স্বাস্থ্য ও খাদ্য মজুদ বর্তমানে স্বাভাবিক ও সন্তোষজনক রয়েছে।'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(ActiveTab.AI_ADVISOR)}
          className="min-h-[34px] px-3.5 py-1.5 bg-[#14281E] hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/35 text-xs font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
        >
          <span>পূর্ণ এআই গাইড দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Empty State Prompt if Brand New */}
      {isBrandNewEmpty && (
        <section className="bg-[#0F1914] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-lg font-bold text-[#EFF5F1]">
              আপনার ক্লাউড খামার ডাটাবেস প্রস্তুত রয়েছে
            </h2>
            <p className="text-xs sm:text-sm text-[#94A99C] leading-relaxed">
              আপনার খামারে এখনো কোনো তথ্য নথিভুক্ত হয়নি। আপনি নতুন পশু ও খাদ্য তালিকা যোগ করতে পারেন, অথবা এক ক্লিকে প্রাথমিক নমুনা তথ্য লোড করে সব ফিচার পরখ করতে পারেন।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {user && (
              <button
                type="button"
                onClick={() => void handleSeed()}
                disabled={seeding}
                className="min-h-[40px] px-4 py-2 bg-[#16271E] hover:bg-[#1E3428] border border-[#274032] text-[#D8E6DD] text-xs font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-60 cursor-pointer"
              >
                <DatabaseBackup className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{seeding ? 'লোড হচ্ছে...' : 'নমুনা ডাটা লোড করুন'}</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* 4-Column Executive KPI Cards */}
      <section aria-label="খামারের মূল পরিসংখ্যান" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Animals & Valuation */}
        <div className="bg-[#0E1612] border border-[#19271F] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#22352A] transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8EA496]">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <PawPrint className="w-3.5 h-3.5" />
              </div>
              <span>মোট পশু ও পাখি</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.ANIMALS)}
              aria-label="পশুর তালিকা দেখুন"
              className="text-[#647C6E] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-[#EFF5F1]">
                {formatNumber(summary.totalAnimals)}
              </span>
              <span className="text-xs text-[#7A9184]">টি নথিভুক্ত</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#899E92]">
              <span className="text-emerald-400">সুস্থ: {formatNumber(summary.healthyAnimals)}</span>
              <span>·</span>
              <span className={summary.careNeededAnimals > 0 ? 'text-amber-300' : 'text-[#899E92]'}>
                পর্যবেক্ষণে: {formatNumber(summary.careNeededAnimals)}
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#15221B] flex items-center justify-between text-[11px] text-[#71877A]">
            <span>আনুমানিক পশুসম্পদ:</span>
            <span className="font-mono tabular-nums text-[#C8DCD0] font-semibold">
              {formatBDT(summary.livestockValuation, currency)}
            </span>
          </div>
        </div>

        {/* KPI 2: Net Balance & Margin */}
        <div className="bg-[#0E1612] border border-[#19271F] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#22352A] transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8EA496]">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span>নিট ক্যাশফ্লো / উদ্বৃত্ত</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
              aria-label="আয়-ব্যয় হিসাব দেখুন"
              className="text-[#647C6E] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono tabular-nums ${
                  summary.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatBDT(summary.netBalance, currency)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#899E92]">
              <span>আয়: {formatBDT(summary.totalIncome, currency)}</span>
              <span>·</span>
              <span>ব্যয়: {formatBDT(summary.totalExpense, currency)}</span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#15221B] flex items-center justify-between text-[11px] text-[#71877A]">
            <span>লাভের অনুপাত (Margin):</span>
            <span
              className={`font-mono tabular-nums font-semibold ${
                profitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {profitMargin}%
            </span>
          </div>
        </div>

        {/* KPI 3: Sales & Due Collection */}
        <div className="bg-[#0E1612] border border-[#19271F] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#22352A] transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8EA496]">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span>মোট বিক্রয় ও বকেয়া</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.SALES)}
              aria-label="বিক্রয় হিসাব দেখুন"
              className="text-[#647C6E] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-[#EFF5F1]">
                {formatBDT(summary.totalSalesAmount, currency)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#899E92]">
              <span>আদায়: {formatBDT(summary.totalSalesPaid, currency)}</span>
              <span>({salesCollectionRate}%)</span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#15221B] flex items-center justify-between text-[11px] text-[#71877A]">
            <span>বকেয়া আদায়যোগ্য:</span>
            <span
              className={`font-mono tabular-nums font-semibold ${
                summary.totalSalesDue > 0 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {summary.totalSalesDue > 0
                ? formatBDT(summary.totalSalesDue, currency)
                : 'পরিশোধিত'}
            </span>
          </div>
        </div>

        {/* KPI 4: Feed Inventory & Stock Security */}
        <div className="bg-[#0E1612] border border-[#19271F] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#22352A] transition-colors shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8EA496]">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Wheat className="w-3.5 h-3.5" />
              </div>
              <span>খাদ্য মজুত ও নিরাপত্তা</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.FEED_STOCK)}
              aria-label="খাবারের স্টক দেখুন"
              className="text-[#647C6E] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-[#EFF5F1]">
                {formatNumber(summary.totalFeedItems)}
              </span>
              <span className="text-xs text-[#7A9184]">আইটেম</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {summary.lowStockCount > 0 ? (
                <span className="text-amber-300 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatNumber(summary.lowStockCount)}টি আইটেমের স্টক কম</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>পর্যাপ্ত মজুত রয়েছে</span>
                </span>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#15221B] flex items-center justify-between text-[11px] text-[#71877A]">
            <span>মজুদ খাদ্যমূল্য:</span>
            <span className="font-mono tabular-nums text-[#C8DCD0] font-semibold">
              {formatBDT(summary.feedInventoryValue, currency)}
            </span>
          </div>
        </div>
      </section>

      {/* Financial Ratios & Livestock Breakdown Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Financial Flow & Cash Flow Gauge */}
        <section className="lg:col-span-7 bg-[#0E1612] border border-[#19271F] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#EFF5F1]">আয় ও ব্যয়ের আর্থিক অনুপাত</h2>
                <p className="text-xs text-[#82998C]">খামারের সকল নথিভুক্ত লেনদেনের তুলনামূলক নিরীক্ষা</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
                className="min-h-[34px] px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-white bg-[#13231A] hover:bg-emerald-600 border border-[#20362A] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                হিসাব খতিয়ান
              </button>
            </div>

            {/* Visual Cash Flow Progress Gauge */}
            <div className="space-y-3">
              <div className="h-3.5 w-full rounded-full bg-[#15221B] overflow-hidden flex p-0.5">
                <div
                  style={{ width: `${incomePct}%` }}
                  className="bg-emerald-500 rounded-l-full transition-all duration-300"
                  title={`আয় ${incomePct}%`}
                />
                <div
                  style={{ width: `${expensePct}%` }}
                  className="bg-amber-500/80 rounded-r-full transition-all duration-300"
                  title={`ব্যয় ${expensePct}%`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[#0B120E] border border-[#17251C]">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    <span>মোট সংগৃহীত আয়</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#EFF5F1] mt-1">
                    {formatBDT(summary.totalIncome, currency)}
                  </div>
                  <p className="text-[11px] text-[#788E81] mt-0.5">সামগ্রিক ক্যাশফ্লোর {incomePct}%</p>
                </div>

                <div className="p-3 rounded-xl bg-[#0B120E] border border-[#17251C]">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <TrendingDown className="w-4 h-4 shrink-0" />
                    <span>মোট পরিচালন ব্যয়</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#EFF5F1] mt-1">
                    {formatBDT(summary.totalExpense, currency)}
                  </div>
                  <p className="text-[11px] text-[#788E81] mt-0.5">সামগ্রিক খরচের {expensePct}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Species Distribution Breakdown */}
          <div className="pt-5 border-t border-[#17251C] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#C8DCD0] uppercase tracking-wider">
                প্রজাতিভিত্তিক খামার বণ্টন
              </h3>
              <span className="text-xs text-[#7A9184]">
                মোট মূল্যায়ন: <strong className="font-mono tabular-nums text-[#EFF5F1]">{formatBDT(summary.livestockValuation, currency)}</strong>
              </span>
            </div>

            {Object.keys(summary.speciesCounts).length === 0 ? (
              <p className="text-xs text-[#6F8578]">এখনো কোনো পশুর তথ্য যুক্ত করা হয়নি।</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {Object.entries(summary.speciesCounts).map(([species, count]) => (
                  <div
                    key={species}
                    className="p-2.5 rounded-xl bg-[#0B120E] border border-[#17251C] flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-[#95A89E] truncate">{species}</span>
                    <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                      {formatNumber(count)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Low Feed Stock Watchlist */}
        <section className="lg:col-span-5 bg-[#0E1612] border border-[#19271F] rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#EFF5F1]">খাদ্য মজুত সতর্কতা</h2>
                <p className="text-xs text-[#82998C]">
                  বর্তমান গুদাম খাদ্যমূল্য:{' '}
                  <span className="font-mono tabular-nums text-[#D0E0D6] font-medium">
                    {formatBDT(summary.feedInventoryValue, currency)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(ActiveTab.FEED_STOCK)}
                className="min-h-[34px] px-3 py-1.5 text-xs font-medium text-[#C8DCD0] hover:text-white bg-[#13231A] hover:bg-[#1A2E22] border border-[#20362A] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                স্টক রেজিস্ট্রি
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Wheat className="w-8 h-8 text-emerald-400/80 mx-auto" />
                <p className="text-sm font-medium text-[#D6E6DC]">খাদ্য ঘাটতি নেই</p>
                <p className="text-xs text-[#7B9384] max-w-xs mx-auto">
                  খামারের সকল খাবারের মজুদ পর্যাপ্ত এবং সতর্কীকরণ সীমার উপরে রয়েছে।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#16231B]">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#EFF5F1] truncate">{item.name}</p>
                      <p className="text-xs text-[#7E9688]">
                        {item.category} · সীমা: {formatNumber(item.minStockAlert)} {item.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono tabular-nums text-amber-300 flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {formatNumber(item.currentStock)} {item.unit}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-medium">রি-স্টক প্রয়োজন</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#16231B] text-xs text-[#7A9183] flex items-center justify-between">
            <span>স্টক নিরীক্ষা স্ট্যাটাস:</span>
            <span className="text-emerald-400 font-medium">রিয়েল-টাইম সিঙ্ক</span>
          </div>
        </section>
      </div>

      {/* Bottom 2-Column Activity Mini-Ledgers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Recent Sales Ledger */}
        <section className="lg:col-span-6 bg-[#0E1612] border border-[#19271F] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#EFF5F1]">সাম্প্রতিক বিক্রয় লেনদেন</h2>
              <p className="text-xs text-[#7A9184]">পশু ও খামারজাত পণ্যের বিক্রয় রেকর্ড</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.SALES)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>সকল বিক্রয়</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShoppingBag className="w-7 h-7 text-[#587063] mx-auto" />
              <p className="text-xs text-[#7E9689]">এখনো কোনো বিক্রয়ের তথ্য নথিভুক্ত হয়নি।</p>
            </div>
          ) : (
            <div className="divide-y divide-[#16231B]">
              {recentSales.map((sale) => (
                <div key={sale.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#EFF5F1] truncate">{sale.itemName}</p>
                    <p className="text-xs text-[#7C9385] truncate">
                      {sale.productType} · ক্রেতা: {sale.buyerName} · <span className="font-mono tabular-nums">{sale.saleDate}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono tabular-nums text-[#EFF5F1]">
                      {formatBDT(sale.totalAmount, currency)}
                    </p>
                    <p className="text-xs">
                      {sale.dueAmount > 0 ? (
                        <span className="text-amber-300 font-mono tabular-nums font-medium">
                          বকেয়া {formatBDT(sale.dueAmount, currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">পরিশোধিত</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Income & Expense Entries */}
        <section className="lg:col-span-6 bg-[#0E1612] border border-[#19271F] rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#EFF5F1]">সাম্প্রতিক আয়-ব্যয় খতিয়ান</h2>
              <p className="text-xs text-[#7A9184]">দৈনিক ক্যাশ ও ব্যাংক লেনদেন বিবরণী</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>পূর্ণাঙ্গ হিসাব</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Receipt className="w-7 h-7 text-[#587063] mx-auto" />
              <p className="text-xs text-[#7E9689]">এখনো কোনো আয় বা ব্যয়ের হিসাব এন্ট্রি হয়নি।</p>
            </div>
          ) : (
            <div className="divide-y divide-[#16231B]">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#EFF5F1] truncate">{tx.title}</p>
                    <p className="text-xs text-[#7C9385] truncate">
                      {tx.type === 'income' ? 'আয়' : 'ব্যয়'} · {tx.category} · <span className="font-mono tabular-nums">{tx.transactionDate}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold font-mono tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatBDT(tx.amount, currency)}
                    </p>
                    <p className="text-xs text-[#6F8679]">{tx.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
