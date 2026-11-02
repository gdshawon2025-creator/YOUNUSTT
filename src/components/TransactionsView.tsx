import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Transaction, TransactionInput, TransactionType } from '../types/farm';
import {
  EXPENSE_CATEGORIES,
  formatBDT,
  getTodayIsoDate,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LIST,
} from '../utils/farmLogic';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    profile,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFarm();

  const currency = profile.currency || '৳';

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionInput>({
    type: 'income',
    title: '',
    category: INCOME_CATEGORIES[0],
    amount: 1000,
    transactionDate: getTodayIsoDate(),
    paymentMethod: 'নগদ',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (!q) return true;
      return (
        tx.title.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.paymentMethod.toLowerCase().includes(q) ||
        tx.notes.toLowerCase().includes(q)
      );
    });
  }, [transactions, typeFilter, searchQuery]);

  const openNewModal = (initialType: TransactionType) => {
    setEditingTx(null);
    setForm({
      type: initialType,
      title: '',
      category: initialType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
      amount: 1000,
      transactionDate: getTodayIsoDate(),
      paymentMethod: 'নগদ',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setForm({
      type: tx.type,
      title: tx.title,
      category: tx.category,
      amount: tx.amount,
      transactionDate: tx.transactionDate,
      paymentMethod: tx.paymentMethod,
      notes: tx.notes,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleTypeSwitchInForm = (nextType: TransactionType) => {
    const defaultCat = nextType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
    setForm({
      ...form,
      type: nextType,
      category: defaultCat,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = editingTx
        ? await updateTransaction(editingTx.id, form)
        : await addTransaction(form);
      if (!res.ok) {
        setFormError(res.error || 'হিসাব সংরক্ষণ করা যায়নি।');
      } else {
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const activeCategoryOptions = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Financial Totals Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">সর্বমোট আয়</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {formatBDT(summary.totalIncome, currency)}
          </div>
        </div>
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">সর্বমোট ব্যয়</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-300">
            {formatBDT(summary.totalExpense, currency)}
          </div>
        </div>
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">নিট উদ্বৃত্ত / লাভ-ক্ষতি</span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              summary.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatBDT(summary.netBalance, currency)}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Interactive Type Segmented Control */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#101814] border border-[#1C2B22] rounded-xl self-start">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#9CB0A4] hover:text-[#EFF5F1]'
              }`}
            >
              সকল হিসাব
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#9CB0A4] hover:text-[#EFF5F1]'
              }`}
            >
              শুধু আয়
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === 'expense'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#9CB0A4] hover:text-[#EFF5F1]'
              }`}
            >
              শুধু ব্যয়
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#789083] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="আয় বা ব্যয়ের হিসাব খুঁজুন"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বিবরণ বা খাতের নাম দিয়ে খুঁজুন..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-[#101814] border border-[#1E2E26] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => openNewModal('income')}
            className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>আয় যোগ করুন</span>
          </button>
          <button
            type="button"
            onClick={() => openNewModal('expense')}
            className="min-h-[44px] px-4 py-2.5 bg-[#16241D] hover:bg-[#1E3228] border border-[#284235] text-[#EFF5F1] text-sm font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-amber-400 shrink-0" />
            <span>ব্যয় যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Ledger Table / Mobile List */}
      <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-base font-medium text-[#DFECE4]">কোনো লেনদেনের হিসাব পাওয়া যায়নি</p>
            <p className="text-xs text-[#899E92]">
              উপরের "আয় যোগ করুন" বা "ব্যয় যোগ করুন" বাটনে ক্লিক করে নতুন হিসাব যুক্ত করুন।
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1C2B22] text-xs font-semibold text-[#8EA497] bg-[#0D1410]">
                    <th className="py-3.5 px-5">তারিখ</th>
                    <th className="py-3.5 px-4">বিবরণ ও নোট</th>
                    <th className="py-3.5 px-4">ধরন ও খাত</th>
                    <th className="py-3.5 px-4">পেমেন্ট মাধ্যম</th>
                    <th className="py-3.5 px-4 text-right">পরিমাণ</th>
                    <th className="py-3.5 px-5 text-right">পরিবর্তন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18261E] text-sm">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#14201A] transition-colors">
                      <td className="py-3.5 px-5 font-mono tabular-nums text-xs text-[#B6C9BE] whitespace-nowrap">
                        {tx.transactionDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#EFF5F1]">{tx.title}</div>
                        {tx.notes && <div className="text-xs text-[#899E92]">{tx.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#C8D8CE]">
                        <span className="inline-flex items-center gap-1.5">
                          {tx.type === 'income' ? (
                            <>
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-emerald-300 font-medium">আয়</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-amber-300 font-medium">ব্যয়</span>
                            </>
                          )}
                          <span>· {tx.category}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#9CB0A4]">{tx.paymentMethod}</td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatBDT(tx.amount, currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(tx)}
                            aria-label={`${tx.title} সম্পাদনা করুন`}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 hover:bg-[#1A2B22] rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTarget(tx)}
                            aria-label={`${tx.title} মুছে ফেলুন`}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Rows */}
            <div className="md:hidden divide-y divide-[#18261E]">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#EFF5F1] truncate">{tx.title}</p>
                      <p className="text-xs text-[#899E92]">
                        {tx.type === 'income' ? 'আয়' : 'ব্যয়'} · {tx.category} ·{' '}
                        <span className="font-mono tabular-nums">{tx.transactionDate}</span>
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold font-mono tabular-nums shrink-0 ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatBDT(tx.amount, currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#899E92]">মাধ্যম: {tx.paymentMethod}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(tx)}
                        aria-label={`${tx.title} সম্পাদনা করুন`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTarget(tx)}
                        aria-label={`${tx.title} মুছে ফেলুন`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Transaction Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#1A2921] pb-3">
              <h2 id="tx-modal-title" className="text-lg font-bold text-[#EFF5F1]">
                {editingTx ? 'আয়-ব্যয়ের হিসাব সম্পাদনা করুন' : 'নতুন আয় বা ব্যয়ের হিসাব যোগ করুন'}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B110E] border border-[#1E2E26] rounded-xl">
                <button
                  type="button"
                  onClick={() => handleTypeSwitchInForm('income')}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
                    form.type === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'text-[#8FA599] hover:text-[#EFF5F1]'
                  }`}
                >
                  আয় (Income)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitchInForm('expense')}
                  className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors ${
                    form.type === 'expense'
                      ? 'bg-amber-600 text-white'
                      : 'text-[#8FA599] hover:text-[#EFF5F1]'
                  }`}
                >
                  ব্যয় (Expense)
                </button>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tx-title" className="block text-xs font-medium text-[#C8D8CE]">
                  বিবরণ *
                </label>
                <input
                  id="tx-title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    form.type === 'income'
                      ? 'যেমন: সকালের দুধ বিক্রয় / খাসি বিক্রয়'
                      : 'যেমন: ভুষি ক্রয় / শ্রমিকের বেতন'
                  }
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="tx-category" className="block text-xs font-medium text-[#C8D8CE]">
                    হিসাবের খাত *
                  </label>
                  <select
                    id="tx-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {activeCategoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tx-amount" className="block text-xs font-medium text-[#C8D8CE]">
                    টাকার পরিমাণ ({currency}) *
                  </label>
                  <input
                    id="tx-amount"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tx-date" className="block text-xs font-medium text-[#C8D8CE]">
                    তারিখ *
                  </label>
                  <input
                    id="tx-date"
                    type="date"
                    required
                    value={form.transactionDate}
                    onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tx-method" className="block text-xs font-medium text-[#C8D8CE]">
                    পেমেন্ট মাধ্যম *
                  </label>
                  <select
                    id="tx-method"
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value as TransactionInput['paymentMethod'] })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {PAYMENT_METHOD_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tx-notes" className="block text-xs font-medium text-[#C8D8CE]">
                  ভাউচার বা অতিরিক্ত নোট (ঐচ্ছিক)
                </label>
                <input
                  id="tx-notes"
                  type="text"
                  maxLength={500}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="রশিদ নম্বর বা প্রাসঙ্গিক তথ্য..."
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                />
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
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingTx ? 'আপডেট সংরক্ষণ করুন' : 'হিসাব সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTarget)}
        title="আয়-ব্যয়ের হিসাব মুছে ফেলুন"
        itemLabel={deletingTarget ? deletingTarget.title : ''}
        onCancel={() => setDeletingTarget(null)}
        onConfirm={async () => {
          if (deletingTarget) {
            await deleteTransaction(deletingTarget.id);
          }
        }}
      />
    </div>
  );
};
