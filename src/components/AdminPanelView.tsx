import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Cloud,
  DatabaseBackup,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  PawPrint,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Wallet,
  Wheat,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { ActiveTab, BulkCollectionKey } from '../types/farm';
import { buildCsvContent, DEFAULT_ADMIN_PASSWORD, formatBDT, formatNumber } from '../utils/farmLogic';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AdminPanelViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

type AdminSectionTab = 'control' | 'security' | 'settings';

interface UnifiedRecordRow {
  id: string;
  collection: BulkCollectionKey;
  primaryTitle: string;
  metaLine: string;
  metricText: string;
  metricTone: 'neutral' | 'positive' | 'warning';
  targetTab: ActiveTab;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({ onNavigate }) => {
  const {
    user,
    isDefaultPassword,
    profile,
    animals,
    feedStocks,
    transactions,
    sales,
    summary,
    saveFarmProfile,
    updateAppLockPassword,
    changeFirebasePassword,
    lockWorkspace,
    loginWithGoogle,
    logout,
    deleteAnimal,
    deleteFeedStock,
    deleteTransaction,
    deleteSaleRecord,
    clearModuleRecords,
    resetOrSeedSampleData,
    showToast,
  } = useFarm();

  const currency = profile.currency || '৳';

  const [sectionTab, setSectionTab] = useState<AdminSectionTab>('control');
  const [ledgerFilter, setLedgerFilter] = useState<BulkCollectionKey>('animals');
  const [searchQuery, setSearchQuery] = useState('');

  // Single record or bulk module deletion confirmation state
  const [pendingDelete, setPendingDelete] = useState<{
    mode: 'single' | 'bulk';
    collection: BulkCollectionKey;
    id?: string;
    title: string;
    itemLabel: string;
  } | null>(null);

  // Farm profile state (migrated from Settings)
  const [farmName, setFarmName] = useState(profile.farmName);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [location, setLocation] = useState(profile.location);
  const [phone, setPhone] = useState(profile.phone);
  const [currencySymbol, setCurrencySymbol] = useState(profile.currency || '৳');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setFarmName(profile.farmName);
    setOwnerName(profile.ownerName);
    setLocation(profile.location);
    setPhone(profile.phone);
    setCurrencySymbol(profile.currency || '৳');
  }, [profile]);

  // Admin Password Change state
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [showPassFields, setShowPassFields] = useState(false);
  const [adminPassError, setAdminPassError] = useState('');
  const [adminPassBusy, setAdminPassBusy] = useState(false);

  // Firebase Cloud Email Account Password state
  const [acctCurrentPass, setAcctCurrentPass] = useState('');
  const [acctNewPass, setAcctNewPass] = useState('');
  const [acctConfirmPass, setAcctConfirmPass] = useState('');
  const [acctPassError, setAcctPassError] = useState('');
  const [acctPassBusy, setAcctPassBusy] = useState(false);

  // Cloud connect & sample seed busy states
  const [cloudConnecting, setCloudConnecting] = useState(false);
  const [seedingBusy, setSeedingBusy] = useState(false);

  const hasPasswordProvider = Boolean(
    user?.providerData.some((p) => p.providerId === 'password')
  );

  const totalRecordsCount =
    animals.length + feedStocks.length + transactions.length + sales.length;

  // Build centralized control table rows for the selected module
  const filteredRows = useMemo<UnifiedRecordRow[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows: UnifiedRecordRow[] = [];

    if (ledgerFilter === 'animals') {
      rows = animals.map((a) => ({
        id: a.id,
        collection: 'animals',
        primaryTitle: a.name,
        metaLine: `ট্যাগ: ${a.tagNumber} · ${a.species} · ${a.healthCondition}`,
        metricText: formatBDT(a.purchasePrice, currency),
        metricTone: a.healthCondition === 'সুস্থ' || a.healthCondition === 'গর্ভবতী' ? 'positive' : 'warning',
        targetTab: ActiveTab.ANIMALS,
      }));
    } else if (ledgerFilter === 'feedStocks') {
      rows = feedStocks.map((f) => ({
        id: f.id,
        collection: 'feedStocks',
        primaryTitle: f.name,
        metaLine: `${f.category} · ন্যূনতম সীমা ${formatNumber(f.minStockAlert)} ${f.unit}`,
        metricText: `${formatNumber(f.currentStock)} ${f.unit}`,
        metricTone: f.currentStock <= f.minStockAlert ? 'warning' : 'positive',
        targetTab: ActiveTab.FEED_STOCK,
      }));
    } else if (ledgerFilter === 'transactions') {
      rows = transactions.map((t) => ({
        id: t.id,
        collection: 'transactions',
        primaryTitle: t.title,
        metaLine: `${t.type === 'income' ? 'আয়' : 'ব্যয়'} · ${t.category} · ${t.transactionDate}`,
        metricText: `${t.type === 'income' ? '+' : '-'}${formatBDT(t.amount, currency)}`,
        metricTone: t.type === 'income' ? 'positive' : 'warning',
        targetTab: ActiveTab.TRANSACTIONS,
      }));
    } else {
      rows = sales.map((s) => ({
        id: s.id,
        collection: 'sales',
        primaryTitle: s.itemName,
        metaLine: `${s.productType} · ক্রেতা: ${s.buyerName} · ${s.saleDate}`,
        metricText:
          s.dueAmount > 0
            ? `${formatBDT(s.totalAmount, currency)} (বকেয়া ${formatBDT(s.dueAmount, currency)})`
            : formatBDT(s.totalAmount, currency),
        metricTone: s.dueAmount > 0 ? 'warning' : 'positive',
        targetTab: ActiveTab.SALES,
      }));
    }

    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.primaryTitle.toLowerCase().includes(q) ||
        r.metaLine.toLowerCase().includes(q)
    );
  }, [animals, currency, feedStocks, ledgerFilter, sales, searchQuery, transactions]);

  const handleConfirmDeleteAction = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.mode === 'bulk') {
      await clearModuleRecords(pendingDelete.collection);
      return;
    }
    if (!pendingDelete.id) return;
    if (pendingDelete.collection === 'animals') {
      await deleteAnimal(pendingDelete.id);
    } else if (pendingDelete.collection === 'feedStocks') {
      await deleteFeedStock(pendingDelete.id);
    } else if (pendingDelete.collection === 'transactions') {
      await deleteTransaction(pendingDelete.id);
    } else {
      await deleteSaleRecord(pendingDelete.id);
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassError('');

    if (!currentAdminPass) {
      setAdminPassError('বর্তমান অ্যাডমিন পাসওয়ার্ড লিখুন।');
      return;
    }
    if (newAdminPass.trim().length < 4) {
      setAdminPassError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      setAdminPassError('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।');
      return;
    }

    setAdminPassBusy(true);
    try {
      const res = await updateAppLockPassword(currentAdminPass, newAdminPass);
      if (!res.ok) {
        setAdminPassError(res.error || 'পাসওয়ার্ড পরিবর্তন সম্ভব হয়নি।');
      } else {
        setCurrentAdminPass('');
        setNewAdminPass('');
        setConfirmAdminPass('');
      }
    } finally {
      setAdminPassBusy(false);
    }
  };

  const handleAccountPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcctPassError('');
    if (hasPasswordProvider && !acctCurrentPass) {
      setAcctPassError('বর্তমান লগইন পাসওয়ার্ড লিখুন।');
      return;
    }
    if (acctNewPass.length < 6) {
      setAcctPassError('নতুন লগইন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (acctNewPass !== acctConfirmPass) {
      setAcctPassError('নতুন পাসওয়ার্ড দুটি মিলছে না।');
      return;
    }
    setAcctPassBusy(true);
    try {
      const res = await changeFirebasePassword(acctCurrentPass, acctNewPass);
      if (!res.ok) {
        setAcctPassError(res.error || 'লগইন পাসওয়ার্ড পরিবর্তন হয়নি।');
      } else {
        setAcctCurrentPass('');
        setAcctNewPass('');
        setAcctConfirmPass('');
      }
    } finally {
      setAcctPassBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const res = await saveFarmProfile({
        farmName,
        ownerName,
        location,
        phone,
        currency: currencySymbol,
      });
      if (!res.ok) {
        setProfileError(res.error || 'প্রোফাইল সংরক্ষণ করা যায়নি।');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleConnectGoogle = async () => {
    setCloudConnecting(true);
    try {
      await loginWithGoogle();
    } finally {
      setCloudConnecting(false);
    }
  };

  const handleReloadSeed = async () => {
    setSeedingBusy(true);
    try {
      await resetOrSeedSampleData();
    } finally {
      setSeedingBusy(false);
    }
  };

  const triggerDownloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${filename} ডাউনলোড সম্পন্ন হয়েছে।`);
  };

  const exportAnimalsCsv = () => {
    const csv = buildCsvContent(
      ['নাম', 'ট্যাগ', 'প্রজাতি', 'জাত', 'লিঙ্গ', 'বয়স (মাস)', 'ওজন (কেজি)', 'মূল্য', 'স্বাস্থ্য অবস্থা', 'নোট'],
      animals.map((a) => [
        a.name,
        a.tagNumber,
        a.species,
        a.breed,
        a.gender,
        a.ageMonths,
        a.weightKg,
        a.purchasePrice,
        a.healthCondition,
        a.notes,
      ])
    );
    triggerDownloadCsv('pashur-talika.csv', csv);
  };

  const exportFeedCsv = () => {
    const csv = buildCsvContent(
      ['খাবারের নাম', 'ধরন', 'বর্তমান স্টক', 'একক', 'সতর্কতা সীমা', 'একক দর', 'সর্বশেষ সংযোজন', 'নোট'],
      feedStocks.map((f) => [
        f.name,
        f.category,
        f.currentStock,
        f.unit,
        f.minStockAlert,
        f.unitCost,
        f.lastRestockedDate,
        f.notes,
      ])
    );
    triggerDownloadCsv('khabarer-stock.csv', csv);
  };

  const exportTransactionsCsv = () => {
    const csv = buildCsvContent(
      ['তারিখ', 'ধরন', 'বিবরণ', 'খাত', 'পরিমাণ', 'পেমেন্ট মাধ্যম', 'নোট'],
      transactions.map((t) => [
        t.transactionDate,
        t.type === 'income' ? 'আয়' : 'ব্যয়',
        t.title,
        t.category,
        t.amount,
        t.paymentMethod,
        t.notes,
      ])
    );
    triggerDownloadCsv('aay-bay-hisab.csv', csv);
  };

  const exportSalesCsv = () => {
    const csv = buildCsvContent(
      ['তারিখ', 'ধরন', 'পণ্য/পশু', 'রেফারেন্স', 'পরিমাণ', 'একক', 'দর', 'মোট মূল্য', 'পরিশোধিত', 'বকেয়া', 'ক্রেতা', 'ফোন'],
      sales.map((s) => [
        s.saleDate,
        s.productType,
        s.itemName,
        s.referenceTag,
        s.quantity,
        s.unit,
        s.unitPrice,
        s.totalAmount,
        s.paidAmount,
        s.dueAmount,
        s.buyerName,
        s.buyerPhone,
      ])
    );
    triggerDownloadCsv('bikroy-talika.csv', csv);
  };

  const moduleTabLabel: Record<BulkCollectionKey, ActiveTab> = {
    animals: ActiveTab.ANIMALS,
    feedStocks: ActiveTab.FEED_STOCK,
    transactions: ActiveTab.TRANSACTIONS,
    sales: ActiveTab.SALES,
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Status & Quick Lock Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#1A2921]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#9CB0A4]">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>অ্যাডমিন সেশন সচল</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              মোট সংরক্ষিত রেকর্ড:{' '}
              <strong className="font-mono tabular-nums text-[#EFF5F1]">
                {formatNumber(totalRecordsCount)}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {isDefaultPassword
                ? 'প্রাথমিক পাসওয়ার্ড সক্রিয়'
                : 'কাস্টম পাসওয়ার্ড সক্রিয়'}
            </span>
          </div>
          <p className="text-sm text-[#A6BBAE]">
            এখান থেকে খামারের সকল মডিউল, তথ্য সংযোজন-বিয়োজন, পাসওয়ার্ড পরিবর্তন এবং সেটিংস সম্পূর্ণ নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={lockWorkspace}
            className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-[#111F18] hover:bg-[#192E23] border border-[#20362A] rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>এখনই সেশন লক করুন</span>
          </button>
        </div>
      </div>

      {/* Segmented Admin Panel Navigation */}
      <div
        role="tablist"
        aria-label="অ্যাডমিন প্যানেল বিভাগসমূহ"
        className="flex flex-wrap sm:inline-flex items-center gap-1 p-1 bg-[#0B110E] border border-[#18261E] rounded-xl"
      >
        <button
          type="button"
          role="tab"
          aria-selected={sectionTab === 'control'}
          onClick={() => setSectionTab('control')}
          className={`min-h-[38px] px-4 py-2 text-xs font-medium rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            sectionTab === 'control'
              ? 'bg-[#15251D] text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
              : 'text-[#8EA496] hover:text-[#EFF5F1] hover:bg-[#101814]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          <span>সার্বিক নিয়ন্ত্রণ কেন্দ্র</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={sectionTab === 'security'}
          onClick={() => setSectionTab('security')}
          className={`min-h-[38px] px-4 py-2 text-xs font-medium rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            sectionTab === 'security'
              ? 'bg-[#15251D] text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
              : 'text-[#8EA496] hover:text-[#EFF5F1] hover:bg-[#101814]'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 shrink-0" />
          <span>পাসওয়ার্ড ও নিরাপত্তা</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={sectionTab === 'settings'}
          onClick={() => setSectionTab('settings')}
          className={`min-h-[38px] px-4 py-2 text-xs font-medium rounded-lg transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
            sectionTab === 'settings'
              ? 'bg-[#15251D] text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
              : 'text-[#8EA496] hover:text-[#EFF5F1] hover:bg-[#101814]'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 shrink-0" />
          <span>খামারের তথ্য ও ক্লাউড ব্যাকআপ</span>
        </button>
      </div>

      {/* TAB 1: MASTER CONTROL CENTER */}
      {sectionTab === 'control' && (
        <div className="space-y-8">
          {/* 4 Module Master Control Cards */}
          <section
            aria-label="খামারের মডিউল নিয়ন্ত্রণ"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {/* Animals Control Card */}
            <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
                  <span className="font-medium flex items-center gap-1.5">
                    <PawPrint className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>পশুর তালিকা</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#D4E3DA]">
                    {formatNumber(animals.length)}টি
                  </span>
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-[#EFF5F1]">
                  {formatBDT(summary.livestockValuation, currency)}
                </div>
                <p className="text-xs text-[#899E92]">
                  সুস্থ {formatNumber(summary.healthyAnimals)} · যত্ন প্রয়োজন{' '}
                  {formatNumber(summary.careNeededAnimals)}
                </p>
              </div>
              <div className="pt-3 border-t border-[#1A2921] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(ActiveTab.ANIMALS)}
                  className="flex-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <span>নিয়ন্ত্রণ</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={animals.length === 0}
                  onClick={() =>
                    setPendingDelete({
                      mode: 'bulk',
                      collection: 'animals',
                      title: 'সকল পশুর তথ্য মুছুন',
                      itemLabel: `পশুর তালিকার সকল (${animals.length}টি) রেকর্ড`,
                    })
                  }
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-500/25 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
                >
                  সব মুছুন
                </button>
              </div>
            </div>

            {/* Feed Stock Control Card */}
            <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
                  <span className="font-medium flex items-center gap-1.5">
                    <Wheat className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>খাবারের স্টক</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#D4E3DA]">
                    {formatNumber(feedStocks.length)} আইটেম
                  </span>
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-[#EFF5F1]">
                  {formatBDT(summary.feedInventoryValue, currency)}
                </div>
                <p className="text-xs text-[#899E92]">
                  কম স্টক সতর্কতা: {formatNumber(summary.lowStockCount)}টি আইটেম
                </p>
              </div>
              <div className="pt-3 border-t border-[#1A2921] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(ActiveTab.FEED_STOCK)}
                  className="flex-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <span>নিয়ন্ত্রণ</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={feedStocks.length === 0}
                  onClick={() =>
                    setPendingDelete({
                      mode: 'bulk',
                      collection: 'feedStocks',
                      title: 'সকল খাবারের স্টক মুছুন',
                      itemLabel: `খাবারের স্টকের সকল (${feedStocks.length}টি) রেকর্ড`,
                    })
                  }
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-500/25 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
                >
                  সব মুছুন
                </button>
              </div>
            </div>

            {/* Income & Expense Control Card */}
            <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
                  <span className="font-medium flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>আয়-ব্যয় হিসাব</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#D4E3DA]">
                    {formatNumber(transactions.length)}টি
                  </span>
                </div>
                <div
                  className={`text-xl font-bold font-mono tabular-nums ${
                    summary.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatBDT(summary.netBalance, currency)}
                </div>
                <p className="text-xs text-[#899E92]">
                  আয় {formatBDT(summary.totalIncome, currency)} · ব্যয়{' '}
                  {formatBDT(summary.totalExpense, currency)}
                </p>
              </div>
              <div className="pt-3 border-t border-[#1A2921] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(ActiveTab.TRANSACTIONS)}
                  className="flex-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <span>নিয়ন্ত্রণ</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={transactions.length === 0}
                  onClick={() =>
                    setPendingDelete({
                      mode: 'bulk',
                      collection: 'transactions',
                      title: 'সকল আয়-ব্যয় হিসাব মুছুন',
                      itemLabel: `আয়-ব্যয় খাতার সকল (${transactions.length}টি) লেনদেন`,
                    })
                  }
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-500/25 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
                >
                  সব মুছুন
                </button>
              </div>
            </div>

            {/* Sales Control Card */}
            <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-[#9CB0A4]">
                  <span className="font-medium flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>বিক্রয় হিসাব</span>
                  </span>
                  <span className="font-mono tabular-nums text-[#D4E3DA]">
                    {formatNumber(sales.length)}টি
                  </span>
                </div>
                <div className="text-xl font-bold font-mono tabular-nums text-[#EFF5F1]">
                  {formatBDT(summary.totalSalesAmount, currency)}
                </div>
                <p className="text-xs text-[#899E92]">
                  আদায়যোগ্য বকেয়া: {formatBDT(summary.totalSalesDue, currency)}
                </p>
              </div>
              <div className="pt-3 border-t border-[#1A2921] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(ActiveTab.SALES)}
                  className="flex-1 min-h-[38px] px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <span>নিয়ন্ত্রণ</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
                <button
                  type="button"
                  disabled={sales.length === 0}
                  onClick={() =>
                    setPendingDelete({
                      mode: 'bulk',
                      collection: 'sales',
                      title: 'সকল বিক্রয় তথ্য মুছুন',
                      itemLabel: `বিক্রয় তালিকার সকল (${sales.length}টি) রেকর্ড`,
                    })
                  }
                  className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-500/25 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40"
                >
                  সব মুছুন
                </button>
              </div>
            </div>
          </section>

          {/* Centralized All-Records Master Control Table */}
          <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1A2921] pb-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-[#EFF5F1]">
                  সকল তথ্যের কেন্দ্রীয় নিয়ন্ত্রণ তালিকা
                </h2>
                <p className="text-xs text-[#899E92]">
                  যেকোনো বিভাগের তথ্য এক জায়গা থেকে খুঁজুন, সরাসরি মুছে ফেলুন অথবা মডিউলে গিয়ে এডিট করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate(moduleTabLabel[ledgerFilter])}
                  className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-[#14251D] hover:bg-emerald-600 border border-emerald-500/30 rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>এই বিভাগে নতুন যোগ / এডিট করুন</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0B110E] border border-[#1B2A22] rounded-xl">
                {(
                  [
                    { key: 'animals', label: `পশু (${animals.length})` },
                    { key: 'feedStocks', label: `খাবার (${feedStocks.length})` },
                    { key: 'transactions', label: `আয়-ব্যয় (${transactions.length})` },
                    { key: 'sales', label: `বিক্রয় (${sales.length})` },
                  ] as Array<{ key: BulkCollectionKey; label: string }>
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setLedgerFilter(item.key)}
                    className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      ledgerFilter === item.key
                        ? 'bg-[#192B22] text-emerald-300'
                        : 'text-[#8FA599] hover:text-[#EFF5F1]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <label htmlFor="admin-record-search" className="sr-only">
                  তথ্য খুঁজুন
                </label>
                <Search className="w-4 h-4 text-[#789083] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-record-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম, ট্যাগ বা ক্রেতা খুঁজুন..."
                  className="w-full min-h-[40px] pl-9 pr-3.5 py-1.5 bg-[#0B110E] border border-[#21332A] focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-[#EFF5F1]"
                />
              </div>
            </div>

            {/* High-Density Data Table */}
            {filteredRows.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-[#1E2F26] rounded-xl">
                <p className="text-sm font-medium text-[#D6E5DC]">কোনো তথ্য পাওয়া যায়নি</p>
                <p className="text-xs text-[#869D90]">
                  এই বিভাগে এখনো কোনো রেকর্ড নেই অথবা আপনার খোঁজার শব্দের সাথে মিল পাওয়া যায়নি।
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1B2B22] text-[11px] font-semibold text-[#899E92]">
                      <th className="py-2.5 pr-4">বিবরণ ও নাম</th>
                      <th className="py-2.5 px-4 hidden md:table-cell">বিস্তারিত তথ্য</th>
                      <th className="py-2.5 px-4 text-right">পরিমাণ / মূল্য</th>
                      <th className="py-2.5 pl-4 text-right">অ্যাডমিন অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#18261E] text-sm">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-[#131E18]/70 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-[#EFF5F1]">{row.primaryTitle}</div>
                          <div className="text-xs text-[#899E92] md:hidden mt-0.5">
                            {row.metaLine}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#9CB0A4] hidden md:table-cell">
                          {row.metaLine}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono tabular-nums text-xs sm:text-sm font-semibold whitespace-nowrap ${
                            row.metricTone === 'positive'
                              ? 'text-emerald-400'
                              : row.metricTone === 'warning'
                              ? 'text-amber-300'
                              : 'text-[#EFF5F1]'
                          }`}
                        >
                          {row.metricText}
                        </td>
                        <td className="py-3 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onNavigate(row.targetTab)}
                              className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-[#D6E5DC] hover:text-white bg-[#16241D] hover:bg-[#1E3128] border border-[#243B2E] rounded-lg transition-colors whitespace-nowrap"
                            >
                              এডিট মডিউল
                            </button>
                            <button
                              type="button"
                              aria-label={`${row.primaryTitle} মুছে ফেলুন`}
                              onClick={() =>
                                setPendingDelete({
                                  mode: 'single',
                                  collection: row.collection,
                                  id: row.id,
                                  title: 'তথ্য মুছে ফেলুন',
                                  itemLabel: row.primaryTitle,
                                })
                              }
                              className="min-w-[36px] min-h-[36px] px-2.5 py-1 text-xs font-medium text-red-300 hover:text-white bg-red-950/30 hover:bg-red-600 border border-red-500/25 rounded-lg transition-colors inline-flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: ADMIN PASSWORD & SECURITY */}
      {sectionTab === 'security' && (
        <div className="space-y-8 max-w-4xl">
          <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="space-y-1.5 border-b border-[#1A2921] pb-4">
              <h2 className="text-lg font-bold text-[#EFF5F1] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>অ্যাডমিন পাসওয়ার্ড পরিবর্তন</span>
              </h2>
              <p className="text-xs text-[#899E92] leading-relaxed">
                এই পাসওয়ার্ড ছাড়া কেউ ওয়েবসাইটের ড্যাশবোর্ড বা অন্য কোনো তথ্যে প্রবেশ করতে পারবে না। আপনি যেকোনো সময় আপনার মনমতো নতুন পাসওয়ার্ড সেট করতে পারবেন।
              </p>
            </div>

            {isDefaultPassword && (
              <div className="p-3.5 rounded-xl bg-[#0C1812] border border-emerald-500/30 text-xs text-[#C8D8CE] flex flex-wrap items-center justify-between gap-2">
                <span>
                  বর্তমানে প্রাথমিক পাসওয়ার্ড সক্রিয় আছে:{' '}
                  <code className="font-mono tabular-nums font-bold text-emerald-300">
                    {DEFAULT_ADMIN_PASSWORD}
                  </code>
                </span>
                <span className="text-[#8CA396]">নিরাপত্তার জন্য নিচের ফর্ম থেকে পাসওয়ার্ড পরিবর্তন করুন</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#C8D8CE]">
                  পাসওয়ার্ড স্ট্যাটাস:{' '}
                  <strong className="text-emerald-400">
                    {isDefaultPassword ? 'প্রাথমিক পাসওয়ার্ড সচল' : 'কাস্টম অ্যাডমিন পাসওয়ার্ড সচল'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassFields((prev) => !prev)}
                  className="min-h-[36px] px-3 py-1 text-xs text-[#9CB0A4] hover:text-[#EFF5F1] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {showPassFields ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassFields ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="current-admin-pass" className="block text-xs font-medium text-[#C8D8CE]">
                    বর্তমান পাসওয়ার্ড *
                  </label>
                  <input
                    id="current-admin-pass"
                    type={showPassFields ? 'text' : 'password'}
                    value={currentAdminPass}
                    onChange={(e) => setCurrentAdminPass(e.target.value)}
                    placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-admin-pass" className="block text-xs font-medium text-[#C8D8CE]">
                    নতুন পাসওয়ার্ড (মনমতো দিন) *
                  </label>
                  <input
                    id="new-admin-pass"
                    type={showPassFields ? 'text' : 'password'}
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    placeholder="কমপক্ষে ৪ অক্ষর"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-admin-pass" className="block text-xs font-medium text-[#C8D8CE]">
                    নতুন পাসওয়ার্ড নিশ্চিত করুন *
                  </label>
                  <input
                    id="confirm-admin-pass"
                    type={showPassFields ? 'text' : 'password'}
                    value={confirmAdminPass}
                    onChange={(e) => setConfirmAdminPass(e.target.value)}
                    placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>
              </div>

              {adminPassError && (
                <p role="alert" className="text-xs text-red-400">
                  {adminPassError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={adminPassBusy}
                  className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{adminPassBusy ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
                </button>
              </div>
            </form>

            {/* Firebase Cloud Email Account Password Update when logged into Cloud */}
            {user && (
              <form onSubmit={handleAccountPasswordChange} className="pt-6 border-t border-[#1A2921] space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#DFECE4]">
                    {hasPasswordProvider
                      ? 'ক্লাউড ইমেইল অ্যাকাউন্ট পাসওয়ার্ড পরিবর্তন'
                      : 'Google ক্লাউড অ্যাকাউন্টের সাথে ইমেইল পাসওয়ার্ড যুক্ত করুন'}
                  </h3>
                  <p className="text-xs text-[#899E92]">
                    সংযুক্ত ক্লাউড ইমেইল: <span className="font-mono text-[#C8D8CE]">{user.email}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {hasPasswordProvider && (
                    <div className="space-y-1.5">
                      <label htmlFor="acct-curr-pass" className="block text-xs font-medium text-[#C8D8CE]">
                        বর্তমান ক্লাউড পাসওয়ার্ড *
                      </label>
                      <input
                        id="acct-curr-pass"
                        type="password"
                        value={acctCurrentPass}
                        onChange={(e) => setAcctCurrentPass(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] rounded-xl text-sm text-[#EFF5F1]"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="acct-new-pass" className="block text-xs font-medium text-[#C8D8CE]">
                      নতুন ক্লাউড পাসওয়ার্ড (৬+ অক্ষর) *
                    </label>
                    <input
                      id="acct-new-pass"
                      type="password"
                      value={acctNewPass}
                      onChange={(e) => setAcctNewPass(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] rounded-xl text-sm text-[#EFF5F1]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="acct-conf-pass" className="block text-xs font-medium text-[#C8D8CE]">
                      নতুন পাসওয়ার্ড নিশ্চিত করুন *
                    </label>
                    <input
                      id="acct-conf-pass"
                      type="password"
                      value={acctConfirmPass}
                      onChange={(e) => setAcctConfirmPass(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] rounded-xl text-sm text-[#EFF5F1]"
                    />
                  </div>
                </div>

                {acctPassError && (
                  <p role="alert" className="text-xs text-red-400">
                    {acctPassError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={acctPassBusy}
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-[#EFF5F1] bg-[#16271F] hover:bg-[#1E342A] border border-emerald-500/30 rounded-xl transition-colors whitespace-nowrap"
                >
                  {acctPassBusy
                    ? 'আপডেট হচ্ছে...'
                    : hasPasswordProvider
                    ? 'ক্লাউড পাসওয়ার্ড আপডেট করুন'
                    : 'ইমেইল পাসওয়ার্ড যুক্ত করুন'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: FARM PROFILE SETTINGS, CLOUD SYNC & CSV BACKUP */}
      {sectionTab === 'settings' && (
        <div className="space-y-8 max-w-4xl">
          {/* Farm Profile Details */}
          <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="space-y-1 border-b border-[#1A2921] pb-4">
              <h2 className="text-lg font-bold text-[#EFF5F1]">খামারের সাধারণ তথ্য ও সেটিংস</h2>
              <p className="text-xs text-[#899E92]">
                খামারের নাম, মালিকের নাম, ঠিকানা, ফোন নম্বর এবং মুদ্রা চিহ্ন পরিবর্তন করুন।
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="setting-farm-name" className="block text-xs font-medium text-[#C8D8CE]">
                    খামারের নাম *
                  </label>
                  <input
                    id="setting-farm-name"
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="setting-owner-name" className="block text-xs font-medium text-[#C8D8CE]">
                    মালিক বা পরিচালকের নাম *
                  </label>
                  <input
                    id="setting-owner-name"
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="setting-location" className="block text-xs font-medium text-[#C8D8CE]">
                    খামারের ঠিকানা
                  </label>
                  <input
                    id="setting-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="গ্রাম/উপজেলা, জেলা"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label htmlFor="setting-phone" className="block text-xs font-medium text-[#C8D8CE]">
                      মোবাইল নম্বর
                    </label>
                    <input
                      id="setting-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="setting-currency" className="block text-xs font-medium text-[#C8D8CE]">
                      মুদ্রা চিহ্ন
                    </label>
                    <select
                      id="setting-currency"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full min-h-[44px] px-3 py-2 bg-[#0B110E] border border-[#22352B] rounded-xl text-sm text-[#EFF5F1]"
                    >
                      <option value="৳">৳ (BDT)</option>
                      <option value="Tk ">Tk</option>
                      <option value="₹">₹</option>
                      <option value="$">$</option>
                    </select>
                  </div>
                </div>
              </div>

              {profileError && (
                <p role="alert" className="text-xs text-red-400">
                  {profileError}
                </p>
              )}

              <button
                type="submit"
                disabled={profileSaving}
                className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>{profileSaving ? 'সংরক্ষণ হচ্ছে...' : 'তথ্য সংরক্ষণ করুন'}</span>
              </button>
            </form>
          </section>

          {/* Cloud Server Sync & CSV Export */}
          <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A2921] pb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#EFF5F1] flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>ক্লাউড সার্ভার সংরক্ষণ ও রিপোর্ট ব্যাকআপ</span>
                </h2>
                <p className="text-xs text-[#899E92]">
                  {user
                    ? `আপনার সকল ডাটা (${user.email}) ক্লাউড সার্ভারে রিয়েল-টাইমে সংরক্ষিত হচ্ছে।`
                    : 'সব ডিভাইসে স্বয়ংক্রিয়ভাবে ডাটা সিঙ্ক করতে Google ক্লাউড অ্যাকাউন্ট সংযুক্ত করুন।'}
                </p>
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="min-h-[42px] px-4 py-2 text-xs font-medium text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>ক্লাউড লগআউট ও লক</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={cloudConnecting}
                  onClick={() => void handleConnectGoogle()}
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0 disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>{cloudConnecting ? 'সংযোগ হচ্ছে...' : 'Google দিয়ে ক্লাউড সংযুক্ত করুন'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={exportAnimalsCsv}
                className="min-h-[42px] px-3.5 py-2 text-xs font-medium text-[#D6E5DC] bg-[#15231C] hover:bg-[#1D3127] border border-[#243B2E] rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>পশুর তালিকা CSV</span>
              </button>

              <button
                type="button"
                onClick={exportFeedCsv}
                className="min-h-[42px] px-3.5 py-2 text-xs font-medium text-[#D6E5DC] bg-[#15231C] hover:bg-[#1D3127] border border-[#243B2E] rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>খাবারের স্টক CSV</span>
              </button>

              <button
                type="button"
                onClick={exportTransactionsCsv}
                className="min-h-[42px] px-3.5 py-2 text-xs font-medium text-[#D6E5DC] bg-[#15231C] hover:bg-[#1D3127] border border-[#243B2E] rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>আয়-ব্যয় হিসাব CSV</span>
              </button>

              <button
                type="button"
                onClick={exportSalesCsv}
                className="min-h-[42px] px-3.5 py-2 text-xs font-medium text-[#D6E5DC] bg-[#15231C] hover:bg-[#1D3127] border border-[#243B2E] rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>বিক্রয় তালিকা CSV</span>
              </button>

              <button
                type="button"
                disabled={seedingBusy}
                onClick={() => void handleReloadSeed()}
                className="min-h-[42px] px-3.5 py-2 text-xs font-medium text-emerald-300 bg-[#12221A] hover:bg-[#193024] border border-emerald-500/30 rounded-xl transition-colors inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                <DatabaseBackup className="w-3.5 h-3.5 shrink-0" />
                <span>{seedingBusy ? 'লোড হচ্ছে...' : 'নমুনা তথ্য লোড করুন'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(pendingDelete)}
        title={pendingDelete?.title || 'তথ্য মুছে ফেলুন'}
        itemLabel={pendingDelete?.itemLabel || ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDeleteAction}
      />
    </div>
  );
};
