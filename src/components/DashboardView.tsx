import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  DatabaseBackup,
  Plus,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
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
              className="h-[126px] rounded-2xl bg-[#101814] border border-[#1C2B22] animate-pulse"
            />
          ))}
        </div>
        <div className="h-[260px] rounded-2xl bg-[#101814] border border-[#1C2B22] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Empty Cloud Onboarding Prompt */}
      {isBrandNewEmpty && (
        <section className="bg-[#101A15] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-xl font-bold text-[#EFF5F1]">
              স্বাগতম! আপনার ক্লাউড খামার প্রস্তুত রয়েছে
            </h2>
            <p className="text-sm text-[#9FB3A7] leading-relaxed">
              আপনার খামারে এখনো কোনো পশু বা হিসাব যুক্ত করা হয়নি। আপনি নতুন পশু যোগ করে শুরু করতে পারেন, অথবা এক ক্লিকে নমুনা তথ্য যোগ করে সব ফিচার দেখে পরে ইচ্ছেমতো এডিট বা ডিলিট করতে পারেন।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.ANIMALS)}
              className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>নতুন পশু যোগ করুন</span>
            </button>
            {user && (
              <button
                type="button"
                onClick={() => void handleSeed()}
                disabled={seeding}
                className="min-h-[44px] px-4 py-2.5 bg-[#16241D] hover:bg-[#1E3127] border border-[#273F33] text-[#D8E6DD] text-sm font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                <DatabaseBackup className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{seeding ? 'যোগ হচ্ছে...' : 'নমুনা তথ্য যোগ করুন'}</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* 4-Column KPI Strip (2-col on mobile, 4-col on desktop, Single-Elevation, Tabular Numerals) */}
      <section aria-label="খামারের মূল পরিসংখ্যান" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-[#9CB0A4]">মোট পশু ও পাখি</span>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.ANIMALS)}
              aria-label="পশুর তালিকা দেখুন"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums text-[#EFF5F1]">
              {formatNumber(summary.totalAnimals)}
            </div>
            <p className="text-[11px] sm:text-xs text-[#899E92]">
              সুস্থ: <span className="font-mono tabular-nums text-emerald-400">{formatNumber(summary.healthyAnimals)}</span>
              {' · '}
              যত্ন: <span className="font-mono tabular-nums text-amber-300">{formatNumber(summary.careNeededAnimals)}</span>
            </p>
          </div>
        </div>

        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-[#9CB0A4]">নিট লাভ / উদ্বৃত্ত</span>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
              aria-label="আয়-ব্যয় হিসাব দেখুন"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <div
              className={`text-xl sm:text-3xl font-bold font-mono tabular-nums ${
                summary.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatBDT(summary.netBalance, currency)}
            </div>
            <p className="text-[11px] sm:text-xs text-[#899E92]">
              আয়: <span className="font-mono tabular-nums text-[#D4E3DA]">{formatBDT(summary.totalIncome, currency)}</span>
              {' · '}
              ব্যয়: <span className="font-mono tabular-nums text-[#D4E3DA]">{formatBDT(summary.totalExpense, currency)}</span>
            </p>
          </div>
        </div>

        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-[#9CB0A4]">মোট বিক্রয় ও বকেয়া</span>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.SALES)}
              aria-label="বিক্রয় হিসাব দেখুন"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums text-[#EFF5F1]">
              {formatBDT(summary.totalSalesAmount, currency)}
            </div>
            <p className="text-[11px] sm:text-xs text-[#899E92]">
              বকেয়া: <span className="font-mono tabular-nums text-amber-300">{formatBDT(summary.totalSalesDue, currency)}</span>
            </p>
          </div>
        </div>

        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-medium text-[#9CB0A4]">খাবারের স্টক</span>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.FEED_STOCK)}
              aria-label="খাবারের স্টক দেখুন"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-3xl font-bold font-mono tabular-nums text-[#EFF5F1]">
              {formatNumber(summary.totalFeedItems)} <span className="text-xs sm:text-base font-normal text-[#899E92]">আইটেম</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs">
              {summary.lowStockCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-300">
                    <span className="font-mono tabular-nums">{formatNumber(summary.lowStockCount)}</span>টি স্টক কম
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">পর্যাপ্ত স্টক</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Financial Balance & Feed Alerts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Financial Ratio Overview + Species Breakdown */}
        <section className="lg:col-span-7 bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#EFF5F1]">আয় ও ব্যয়ের অনুপাত</h2>
                <p className="text-xs text-[#899E92]">সকল নথিভুক্ত লেনদেনের তুলনামূলক চিত্র</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
                className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-white bg-[#15241C] hover:bg-emerald-600 border border-[#243B2E] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                নতুন হিসাব যোগ করুন
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="h-3 w-full rounded-full bg-[#18251E] overflow-hidden flex">
                <div
                  style={{ width: `${incomePct}%` }}
                  className="bg-emerald-500 transition-all duration-200"
                  title={`আয় ${incomePct}%`}
                />
                <div
                  style={{ width: `${expensePct}%` }}
                  className="bg-amber-500/80 transition-all duration-200"
                  title={`ব্যয় ${expensePct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#A5B9AD]">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>মোট আয় ({incomePct}%):</span>
                  <strong className="font-mono tabular-nums text-[#EFF5F1]">
                    {formatBDT(summary.totalIncome, currency)}
                  </strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>মোট ব্যয় ({expensePct}%):</span>
                  <strong className="font-mono tabular-nums text-[#EFF5F1]">
                    {formatBDT(summary.totalExpense, currency)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-[#1A2921] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#D6E5DC]">প্রজাতি অনুযায়ী পশুর সংখ্যা</h3>
              <span className="text-xs text-[#899E92]">
                আনুমানিক পশু সম্পদ মূল্য:{' '}
                <strong className="font-mono tabular-nums text-[#EFF5F1]">
                  {formatBDT(summary.livestockValuation, currency)}
                </strong>
              </span>
            </div>

            {Object.keys(summary.speciesCounts).length === 0 ? (
              <p className="text-xs text-[#7E9488]">এখনো কোনো পশুর তালিকা যুক্ত করা হয়নি।</p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
                {Object.entries(summary.speciesCounts).map(([species, count]) => (
                  <div
                    key={species}
                    className="flex items-baseline gap-2 border-b border-[#1D2D24] pb-1.5 min-w-[96px] justify-between"
                  >
                    <span className="text-xs text-[#B8CCC0]">{species}</span>
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
        <section className="lg:col-span-5 bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#EFF5F1]">খাবারের স্টক সতর্কতা</h2>
                <p className="text-xs text-[#899E92]">
                  মোট মজুদ মূল্য:{' '}
                  <span className="font-mono tabular-nums text-[#D0E0D6]">
                    {formatBDT(summary.feedInventoryValue, currency)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(ActiveTab.FEED_STOCK)}
                className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-[#C8D8CE] hover:text-white bg-[#15241C] border border-[#243B2E] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                সকল স্টক
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Wheat className="w-7 h-7 text-emerald-400 mx-auto" />
                <p className="text-sm font-medium text-[#DFECE4]">কোনো খাবারের স্টক সংকট নেই</p>
                <p className="text-xs text-[#859B8F]">
                  খামারের সকল খাবারের মজুদ ন্যূনতম সতর্কতা সীমার উপরে আছে।
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#192720]">
                {lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#EFF5F1] truncate">{item.name}</p>
                      <p className="text-xs text-[#899E92]">
                        {item.category} · ন্যূনতম প্রয়োজন {formatNumber(item.minStockAlert)} {item.unit}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold font-mono tabular-nums text-amber-300 flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {formatNumber(item.currentStock)} {item.unit}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-400/90">দ্রুত স্টক বাড়ান</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom 2-Column Activity Tables: Recent Sales & Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Recent Sales */}
        <section className="lg:col-span-6 bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#EFF5F1]">সাম্প্রতিক বিক্রয় তথ্য</h2>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.SALES)}
              className="text-xs font-medium text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              সব বিক্রয় দেখুন
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShoppingBag className="w-6 h-6 text-[#688073] mx-auto" />
              <p className="text-xs text-[#899E92]">এখনো কোনো বিক্রয়ের তথ্য যুক্ত হয়নি।</p>
            </div>
          ) : (
            <div className="divide-y divide-[#192720]">
              {recentSales.map((sale) => (
                <div key={sale.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#EFF5F1] truncate">{sale.itemName}</p>
                    <p className="text-xs text-[#899E92] truncate">
                      {sale.productType} · ক্রেতা: {sale.buyerName} · <span className="font-mono tabular-nums">{sale.saleDate}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold font-mono tabular-nums text-[#EFF5F1]">
                      {formatBDT(sale.totalAmount, currency)}
                    </p>
                    <p className="text-xs text-[#899E92]">
                      {sale.dueAmount > 0 ? (
                        <span className="text-amber-300 font-mono tabular-nums">
                          বকেয়া {formatBDT(sale.dueAmount, currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-400">পরিশোধিত</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Income / Expense Transactions */}
        <section className="lg:col-span-6 bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-[#EFF5F1]">সাম্প্রতিক আয় ও ব্যয়</h2>
            <button
              type="button"
              onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
              className="text-xs font-medium text-emerald-400 hover:underline whitespace-nowrap shrink-0"
            >
              সব হিসাব দেখুন
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-[#899E92]">এখনো কোনো আয় বা ব্যয়ের হিসাব যুক্ত হয়নি।</p>
            </div>
          ) : (
            <div className="divide-y divide-[#192720]">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#EFF5F1] truncate">{tx.title}</p>
                    <p className="text-xs text-[#899E92] truncate">
                      {tx.type === 'income' ? 'আয়' : 'ব্যয়'} · {tx.category} · <span className="font-mono tabular-nums">{tx.transactionDate}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold font-mono tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatBDT(tx.amount, currency)}
                    </p>
                    <p className="text-xs text-[#899E92]">{tx.paymentMethod}</p>
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
