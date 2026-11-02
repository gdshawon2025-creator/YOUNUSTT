import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { FeedStock, FeedStockInput, PaymentMethod } from '../types/farm';
import {
  FEED_CATEGORY_LIST,
  FEED_UNIT_LIST,
  formatBDT,
  formatNumber,
  getTodayIsoDate,
  PAYMENT_METHOD_LIST,
} from '../utils/farmLogic';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const FeedStockView: React.FC = () => {
  const {
    feedStocks,
    profile,
    summary,
    addFeedStock,
    updateFeedStock,
    adjustFeedStock,
    deleteFeedStock,
  } = useFarm();

  const currency = profile.currency || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('সকল');

  const emptyForm: FeedStockInput = {
    name: '',
    category: 'ভুষি ও খৈল',
    currentStock: 50,
    unit: 'কেজি',
    minStockAlert: 15,
    unitCost: 55,
    lastRestockedDate: getTodayIsoDate(),
    notes: '',
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedStock | null>(null);
  const [form, setForm] = useState<FeedStockInput>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [adjustTarget, setAdjustTarget] = useState<{
    item: FeedStock;
    direction: 'add' | 'consume';
  } | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [recordAsExpense, setRecordAsExpense] = useState<boolean>(true);
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('নগদ');
  const [adjustError, setAdjustError] = useState('');
  const [adjustBusy, setAdjustBusy] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<FeedStock | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return feedStocks.filter((item) => {
      if (filterMode === 'স্টক কম' && item.currentStock > item.minStockAlert) return false;
      if (
        filterMode !== 'সকল' &&
        filterMode !== 'স্টক কম' &&
        item.category !== filterMode
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [feedStocks, searchQuery, filterMode]);

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, lastRestockedDate: getTodayIsoDate() });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item: FeedStock) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      minStockAlert: item.minStockAlert,
      unitCost: item.unitCost,
      lastRestockedDate: item.lastRestockedDate,
      notes: item.notes,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = editingItem
        ? await updateFeedStock(editingItem.id, form)
        : await addFeedStock(form);
      if (!res.ok) {
        setFormError(res.error || 'তথ্য সংরক্ষণ করা যায়নি।');
      } else {
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const openAdjustModal = (item: FeedStock, direction: 'add' | 'consume') => {
    setAdjustTarget({ item, direction });
    setAdjustQty(direction === 'add' ? 20 : 5);
    setRecordAsExpense(direction === 'add');
    setExpenseMethod('নগদ');
    setAdjustError('');
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setAdjustError('');
    setAdjustBusy(true);
    try {
      const signedDelta = adjustTarget.direction === 'add' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
      const res = await adjustFeedStock(
        adjustTarget.item.id,
        signedDelta,
        adjustTarget.direction === 'add' && recordAsExpense,
        expenseMethod
      );
      if (!res.ok) {
        setAdjustError(res.error || 'স্টক পরিবর্তন সম্ভব হয়নি।');
      } else {
        setAdjustTarget(null);
      }
    } finally {
      setAdjustBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">মোট খাবারের আইটেম</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#EFF5F1]">
            {formatNumber(summary.totalFeedItems)}
          </div>
        </div>
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">কম স্টক সতর্কতা</span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              summary.lowStockCount > 0 ? 'text-amber-300' : 'text-emerald-400'
            }`}
          >
            {formatNumber(summary.lowStockCount)}টি আইটেম
          </div>
        </div>
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">মজুদ খাবারের মোট মূল্যমান</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {formatBDT(summary.feedInventoryValue, currency)}
          </div>
        </div>
      </div>

      {/* Search & Add Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#789083] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="খাবারের স্টক খুঁজুন"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="খাবারের নাম বা ধরন দিয়ে খুঁজুন..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-[#101814] border border-[#1E2E26] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
          />
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>নতুন খাবার স্টকে যোগ করুন</span>
        </button>
      </div>

      {/* Category & Low-Stock Segmented Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['সকল', 'স্টক কম', ...FEED_CATEGORY_LIST].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterMode(cat)}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filterMode === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-[#101814] text-[#9CB0A4] hover:text-[#EFF5F1] border border-[#1C2B22]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed Stock Table / Responsive List */}
      <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-base font-medium text-[#DFECE4]">কোনো খাবারের স্টক পাওয়া যায়নি</p>
            <p className="text-xs text-[#899E92]">
              উপরের "নতুন খাবার স্টকে যোগ করুন" বাটন থেকে খাবারের মজুদ যুক্ত করুন।
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1C2B22] text-xs font-semibold text-[#8EA497] bg-[#0D1410]">
                    <th className="py-3.5 px-5">খাবারের নাম ও ধরন</th>
                    <th className="py-3.5 px-4 text-right">বর্তমান মজুদ</th>
                    <th className="py-3.5 px-4 text-right">একক দর</th>
                    <th className="py-3.5 px-4 text-right">মোট মূল্য</th>
                    <th className="py-3.5 px-4">স্টক অবস্থা</th>
                    <th className="py-3.5 px-4">দ্রুত পরিবর্তন</th>
                    <th className="py-3.5 px-5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18261E] text-sm">
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.minStockAlert;
                    return (
                      <tr key={item.id} className="hover:bg-[#14201A] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#EFF5F1]">{item.name}</div>
                          <div className="text-xs text-[#899E92]">
                            {item.category} · সর্বশেষ ক্রয়:{' '}
                            <span className="font-mono tabular-nums">{item.lastRestockedDate}</span>
                            {item.notes ? ` · ${item.notes}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#EFF5F1]">
                          {formatNumber(item.currentStock)} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#C8D8CE]">
                          {formatBDT(item.unitCost, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[#D6E5DC]">
                          {formatBDT(item.currentStock * item.unitCost, currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>স্টক কম (সীমা {formatNumber(item.minStockAlert)})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>পর্যাপ্ত স্টক</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openAdjustModal(item, 'add')}
                              aria-label={`${item.name} স্টক বাড়ান`}
                              className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-emerald-300 bg-[#14261D] hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <span>বাড়ান</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openAdjustModal(item, 'consume')}
                              aria-label={`${item.name} খাবার ব্যবহার করুন`}
                              className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-[#C8D8CE] bg-[#16221C] hover:bg-[#203329] border border-[#24382E] rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <Minus className="w-3.5 h-3.5 shrink-0" />
                              <span>ব্যবহার</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              aria-label={`${item.name} সম্পাদনা করুন`}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 hover:bg-[#1A2B22] rounded-lg transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTarget(item)}
                              aria-label={`${item.name} মুছে ফেলুন`}
                              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Rows */}
            <div className="md:hidden divide-y divide-[#18261E]">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minStockAlert;
                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-[#EFF5F1] truncate">{item.name}</p>
                        <p className="text-xs text-[#899E92]">
                          {item.category} · {isLow ? 'স্টক কম' : 'পর্যাপ্ত স্টক'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono tabular-nums">
                        <p className={`text-sm font-bold ${isLow ? 'text-amber-300' : 'text-emerald-400'}`}>
                          {formatNumber(item.currentStock)} {item.unit}
                        </p>
                        <p className="text-xs text-[#899E92]">
                          {formatBDT(item.currentStock * item.unitCost, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openAdjustModal(item, 'add')}
                          aria-label={`${item.name} স্টক বাড়ান`}
                          className="min-h-[44px] px-3 py-2 text-xs font-medium text-emerald-300 bg-[#14261D] border border-emerald-500/30 rounded-xl inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>স্টক বাড়ান</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openAdjustModal(item, 'consume')}
                          aria-label={`${item.name} খাবার ব্যবহার করুন`}
                          className="min-h-[44px] px-3 py-2 text-xs font-medium text-[#C8D8CE] bg-[#16221C] border border-[#24382E] rounded-xl inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>ব্যবহার</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          aria-label={`${item.name} সম্পাদনা করুন`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTarget(item)}
                          aria-label={`${item.name} মুছে ফেলুন`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Feed Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feed-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#1A2921] pb-3">
              <h2 id="feed-modal-title" className="text-lg font-bold text-[#EFF5F1]">
                {editingItem ? 'খাবারের স্টক সম্পাদনা করুন' : 'নতুন খাবার স্টকে যোগ করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="বন্ধ করুন"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8CA295] hover:text-[#EFF5F1] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="feed-name" className="block text-xs font-medium text-[#C8D8CE]">
                    খাবারের নাম *
                  </label>
                  <input
                    id="feed-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="যেমন: ভুট্টা ভাঙা / গমের ভুষি"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feed-category" className="block text-xs font-medium text-[#C8D8CE]">
                    খাবারের ধরন *
                  </label>
                  <select
                    id="feed-category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as FeedStockInput['category'] })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {FEED_CATEGORY_LIST.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feed-unit" className="block text-xs font-medium text-[#C8D8CE]">
                    পরিমাপের একক *
                  </label>
                  <select
                    id="feed-unit"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value as FeedStockInput['unit'] })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {FEED_UNIT_LIST.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feed-stock" className="block text-xs font-medium text-[#C8D8CE]">
                    বর্তমান মজুদ পরিমাণ *
                  </label>
                  <input
                    id="feed-stock"
                    type="number"
                    min="0"
                    step="any"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feed-alert" className="block text-xs font-medium text-[#C8D8CE]">
                    ন্যূনতম সতর্কতা সীমা *
                  </label>
                  <input
                    id="feed-alert"
                    type="number"
                    min="0"
                    step="any"
                    value={form.minStockAlert}
                    onChange={(e) => setForm({ ...form, minStockAlert: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feed-cost" className="block text-xs font-medium text-[#C8D8CE]">
                    একক ক্রয়মূল্য ({currency}) *
                  </label>
                  <input
                    id="feed-cost"
                    type="number"
                    min="0"
                    step="any"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feed-date" className="block text-xs font-medium text-[#C8D8CE]">
                    সর্বশেষ মজুদের তারিখ *
                  </label>
                  <input
                    id="feed-date"
                    type="date"
                    value={form.lastRestockedDate}
                    onChange={(e) => setForm({ ...form, lastRestockedDate: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono text-[#EFF5F1]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="feed-notes" className="block text-xs font-medium text-[#C8D8CE]">
                    নোট / সরবরাহকারীর তথ্য
                  </label>
                  <input
                    id="feed-notes"
                    type="text"
                    maxLength={500}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="গুদাম বা দোকানের নাম..."
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-xs text-red-400">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#C8D8CE] bg-[#16221C] border border-[#24382E] rounded-xl whitespace-nowrap"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl whitespace-nowrap disabled:opacity-60"
                >
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingItem ? 'আপডেট সংরক্ষণ করুন' : 'স্টকে যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {adjustTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adjust-stock-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 id="adjust-stock-title" className="text-lg font-bold text-[#EFF5F1]">
                {adjustTarget.direction === 'add' ? 'নতুন স্টক যোগ করুন' : 'খাবার ব্যবহার নথিভুক্ত করুন'}
              </h2>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                aria-label="বন্ধ করুন"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8CA295] hover:text-[#EFF5F1] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9CB0A4]">
              আইটেম: <strong className="text-[#EFF5F1]">{adjustTarget.item.name}</strong> · বর্তমান স্টক:{' '}
              <span className="font-mono tabular-nums text-emerald-400">
                {formatNumber(adjustTarget.item.currentStock)} {adjustTarget.item.unit}
              </span>
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="adjust-qty-input" className="block text-xs font-medium text-[#C8D8CE]">
                  {adjustTarget.direction === 'add' ? 'কতটুকু যোগ করবেন' : 'কতটুকু ব্যবহৃত হয়েছে'} ({adjustTarget.item.unit}) *
                </label>
                <input
                  id="adjust-qty-input"
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                />
              </div>

              {adjustTarget.direction === 'add' && adjustTarget.item.unitCost > 0 && (
                <div className="space-y-3 p-3.5 rounded-xl bg-[#0C130F] border border-[#1A2921]">
                  <label className="flex items-center gap-2.5 text-xs text-[#D2E2D8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordAsExpense}
                      onChange={(e) => setRecordAsExpense(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span>
                      ব্যয়ের খাতায় স্বয়ংক্রিয়ভাবে যুক্ত করুন ({formatBDT(adjustQty * adjustTarget.item.unitCost, currency)})
                    </span>
                  </label>

                  {recordAsExpense && (
                    <div className="space-y-1">
                      <label htmlFor="adjust-pay-method" className="block text-[11px] text-[#8EA497]">
                        পেমেন্ট মাধ্যম
                      </label>
                      <select
                        id="adjust-pay-method"
                        value={expenseMethod}
                        onChange={(e) => setExpenseMethod(e.target.value as PaymentMethod)}
                        className="w-full min-h-[40px] px-3 py-1.5 bg-[#101814] border border-[#22352B] rounded-lg text-xs text-[#EFF5F1]"
                      >
                        {PAYMENT_METHOD_LIST.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {adjustError && (
                <p role="alert" className="text-xs text-red-400">
                  {adjustError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#C8D8CE] bg-[#16221C] border border-[#24382E] rounded-xl whitespace-nowrap"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={adjustBusy}
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl whitespace-nowrap disabled:opacity-60"
                >
                  {adjustBusy ? 'সংরক্ষণ হচ্ছে...' : 'নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTarget)}
        title="খাবারের স্টক মুছে ফেলুন"
        itemLabel={deletingTarget ? deletingTarget.name : ''}
        onCancel={() => setDeletingTarget(null)}
        onConfirm={async () => {
          if (deletingTarget) {
            await deleteFeedStock(deletingTarget.id);
          }
        }}
      />
    </div>
  );
};
