import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { PaymentMethod, SaleRecord, SaleRecordInput } from '../types/farm';
import {
  computeSaleTotals,
  formatBDT,
  formatNumber,
  getTodayIsoDate,
  PAYMENT_METHOD_LIST,
  SALE_PRODUCT_TYPES,
  SALE_UNIT_LIST,
} from '../utils/farmLogic';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const SalesView: React.FC = () => {
  const {
    sales,
    animals,
    profile,
    summary,
    addSaleRecord,
    updateSaleRecord,
    collectSaleDue,
    deleteSaleRecord,
  } = useFarm();

  const currency = profile.currency || '৳';

  const [filterMode, setFilterMode] = useState<string>('সকল');
  const [searchQuery, setSearchQuery] = useState('');

  const createEmptySaleForm = (): SaleRecordInput => ({
    productType: 'দুধ বিক্রয়',
    itemName: '',
    referenceTag: '',
    quantity: 10,
    unit: 'লিটার',
    unitPrice: 80,
    totalAmount: 800,
    paidAmount: 800,
    dueAmount: 0,
    buyerName: '',
    buyerPhone: '',
    saleDate: getTodayIsoDate(),
    notes: '',
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [form, setForm] = useState<SaleRecordInput>(createEmptySaleForm);
  const [autoRecordIncome, setAutoRecordIncome] = useState<boolean>(true);
  const [incomeMethod, setIncomeMethod] = useState<PaymentMethod>('নগদ');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [dueCollectTarget, setDueCollectTarget] = useState<SaleRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<PaymentMethod>('নগদ');
  const [collectAutoIncome, setCollectAutoIncome] = useState<boolean>(true);
  const [collectError, setCollectError] = useState('');
  const [collectBusy, setCollectBusy] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<SaleRecord | null>(null);

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      if (filterMode === 'বকেয়া আছে' && s.dueAmount <= 0) return false;
      if (
        filterMode !== 'সকল' &&
        filterMode !== 'বকেয়া আছে' &&
        s.productType !== filterMode
      ) {
        return false;
      }
      if (!q) return true;
      return (
        s.itemName.toLowerCase().includes(q) ||
        s.buyerName.toLowerCase().includes(q) ||
        s.buyerPhone.toLowerCase().includes(q) ||
        s.referenceTag.toLowerCase().includes(q)
      );
    });
  }, [sales, filterMode, searchQuery]);

  const openAddModal = () => {
    setEditingSale(null);
    setForm(createEmptySaleForm());
    setAutoRecordIncome(true);
    setIncomeMethod('নগদ');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (sale: SaleRecord) => {
    setEditingSale(sale);
    setForm({
      productType: sale.productType,
      itemName: sale.itemName,
      referenceTag: sale.referenceTag,
      quantity: sale.quantity,
      unit: sale.unit,
      unitPrice: sale.unitPrice,
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      buyerName: sale.buyerName,
      buyerPhone: sale.buyerPhone,
      saleDate: sale.saleDate,
      notes: sale.notes,
    });
    setFormError('');
    setModalOpen(true);
  };

  const updateQtyOrPrice = (nextQty: number, nextUnitPrice: number, syncFullPaid = false) => {
    const rawTotal = Math.round(Math.max(0, nextQty) * Math.max(0, nextUnitPrice) * 100) / 100;
    const desiredPaid = syncFullPaid ? rawTotal : form.paidAmount;
    const totals = computeSaleTotals(nextQty, nextUnitPrice, desiredPaid);
    setForm({
      ...form,
      quantity: nextQty,
      unitPrice: nextUnitPrice,
      ...totals,
    });
  };

  const updatePaidField = (nextPaid: number) => {
    const totals = computeSaleTotals(form.quantity, form.unitPrice, nextPaid);
    setForm({
      ...form,
      ...totals,
    });
  };

  const handleQuickPickAnimal = (animalId: string) => {
    const picked = animals.find((a) => a.id === animalId);
    if (!picked) return;
    const price = picked.purchasePrice > 0 ? picked.purchasePrice : 50000;
    const totals = computeSaleTotals(1, price, price);
    setForm({
      ...form,
      productType: 'পশু বিক্রয়',
      itemName: `${picked.name} (${picked.species})`,
      referenceTag: picked.tagNumber,
      quantity: 1,
      unit: 'টি',
      unitPrice: price,
      ...totals,
    });
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = editingSale
        ? await updateSaleRecord(editingSale.id, form)
        : await addSaleRecord(form, {
            autoRecordIncome,
            paymentMethod: incomeMethod,
          });
      if (!res.ok) {
        setFormError(res.error || 'বিক্রয়ের তথ্য সংরক্ষণ করা যায়নি।');
      } else {
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const openDueCollect = (sale: SaleRecord) => {
    setDueCollectTarget(sale);
    setCollectAmount(sale.dueAmount);
    setCollectMethod('নগদ');
    setCollectAutoIncome(true);
    setCollectError('');
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueCollectTarget) return;
    setCollectError('');
    setCollectBusy(true);
    try {
      const res = await collectSaleDue(
        dueCollectTarget.id,
        collectAmount,
        collectAutoIncome,
        collectMethod
      );
      if (!res.ok) {
        setCollectError(res.error || 'বকেয়া আদায় সংরক্ষণ করা যায়নি।');
      } else {
        setDueCollectTarget(null);
      }
    } finally {
      setCollectBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sales Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">সর্বমোট বিক্রয় মূল্য</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#EFF5F1]">
            {formatBDT(summary.totalSalesAmount, currency)}
          </div>
        </div>
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">মোট নগদ প্রাপ্তি</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {formatBDT(summary.totalSalesPaid, currency)}
          </div>
        </div>
        <div className="bg-[#101814] border border-[#1C2B22] rounded-2xl p-4 space-y-1">
          <span className="text-xs text-[#899E92]">ক্রেতাদের কাছে মোট বকেয়া</span>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              summary.totalSalesDue > 0 ? 'text-amber-300' : 'text-emerald-400'
            }`}
          >
            {formatBDT(summary.totalSalesDue, currency)}
          </div>
        </div>
      </div>

      {/* Search & Add Sale Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#789083] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="বিক্রয় বা ক্রেতার নাম খুঁজুন"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পণ্যের নাম, ক্রেতার নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-[#101814] border border-[#1E2E26] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>নতুন বিক্রয় তথ্য যোগ করুন</span>
        </button>
      </div>

      {/* Segmented Product Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['সকল', 'বকেয়া আছে', ...SALE_PRODUCT_TYPES].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilterMode(item)}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              filterMode === item
                ? 'bg-emerald-600 text-white'
                : 'bg-[#101814] text-[#9CB0A4] hover:text-[#EFF5F1] border border-[#1C2B22]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Sales Table / Mobile List */}
      <section className="bg-[#101814] border border-[#1C2B22] rounded-2xl overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-base font-medium text-[#DFECE4]">কোনো বিক্রয়ের তথ্য পাওয়া যায়নি</p>
            <p className="text-xs text-[#899E92]">
              পশু, দুধ, ডিম বা অন্যান্য পণ্য বিক্রয়ের হিসাব যুক্ত করতে উপরের বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1C2B22] text-xs font-semibold text-[#8EA497] bg-[#0D1410]">
                    <th className="py-3.5 px-5">তারিখ</th>
                    <th className="py-3.5 px-4">বিক্রিত পণ্য / পশু</th>
                    <th className="py-3.5 px-4">ক্রেতার তথ্য</th>
                    <th className="py-3.5 px-4 text-right">পরিমাণ ও দর</th>
                    <th className="py-3.5 px-4 text-right">মোট মূল্য</th>
                    <th className="py-3.5 px-4">পরিশোধ অবস্থা</th>
                    <th className="py-3.5 px-5 text-right">পরিবর্তন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18261E] text-sm">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-[#14201A] transition-colors">
                      <td className="py-3.5 px-5 font-mono tabular-nums text-xs text-[#B6C9BE] whitespace-nowrap">
                        {sale.saleDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#EFF5F1]">{sale.itemName}</div>
                        <div className="text-xs text-[#899E92]">
                          {sale.productType}
                          {sale.referenceTag ? ` · ${sale.referenceTag}` : ''}
                          {sale.notes ? ` · ${sale.notes}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[#D6E5DC]">{sale.buyerName}</div>
                        {sale.buyerPhone && (
                          <div className="text-xs font-mono tabular-nums text-[#899E92]">
                            {sale.buyerPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-[#C8D8CE]">
                        <div>
                          {formatNumber(sale.quantity)} {sale.unit}
                        </div>
                        <div className="text-[#899E92]">
                          দর: {formatBDT(sale.unitPrice, currency)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-[#EFF5F1]">
                        {formatBDT(sale.totalAmount, currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        {sale.dueAmount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="font-mono tabular-nums">
                                বকেয়া {formatBDT(sale.dueAmount, currency)}
                              </span>
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => openDueCollect(sale)}
                                className="min-h-[30px] px-2.5 py-1 text-[11px] font-medium text-emerald-300 bg-[#14261D] hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                              >
                                <Wallet className="w-3 h-3 shrink-0" />
                                <span>বকেয়া আদায়</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>সম্পূর্ণ পরিশোধিত</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(sale)}
                            aria-label={`${sale.itemName} বিক্রয় সম্পাদনা করুন`}
                            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 hover:bg-[#1A2B22] rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTarget(sale)}
                            aria-label={`${sale.itemName} বিক্রয় মুছে ফেলুন`}
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
              {filteredSales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-[#EFF5F1] truncate">{sale.itemName}</p>
                      <p className="text-xs text-[#899E92]">
                        {sale.productType} · ক্রেতা: {sale.buyerName} ·{' '}
                        <span className="font-mono tabular-nums">{sale.saleDate}</span>
                      </p>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <p className="text-sm font-bold text-[#EFF5F1]">
                        {formatBDT(sale.totalAmount, currency)}
                      </p>
                      <p className={`text-xs ${sale.dueAmount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                        {sale.dueAmount > 0
                          ? `বকেয়া ${formatBDT(sale.dueAmount, currency)}`
                          : 'পরিশোধিত'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {sale.dueAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => openDueCollect(sale)}
                          className="min-h-[40px] px-3 py-1.5 text-xs font-medium text-emerald-300 bg-[#14261D] border border-emerald-500/30 rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>বকেয়া আদায়</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(sale)}
                        aria-label={`${sale.itemName} বিক্রয় সম্পাদনা করুন`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#9CB0A4] hover:text-emerald-300 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTarget(sale)}
                        aria-label={`${sale.itemName} বিক্রয় মুছে ফেলুন`}
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

      {/* Add / Edit Sale Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sale-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between gap-4 border-b border-[#1A2921] pb-3">
              <h2 id="sale-modal-title" className="text-lg font-bold text-[#EFF5F1]">
                {editingSale ? 'বিক্রয়ের তথ্য সম্পাদনা করুন' : 'নতুন বিক্রয় তথ্য যোগ করুন'}
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

            <form onSubmit={handleSaveSale} className="space-y-4">
              {!editingSale && animals.length > 0 && (
                <div className="p-3 rounded-xl bg-[#0C1410] border border-[#1B2B22] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label htmlFor="quick-pick-animal" className="text-xs text-[#9CB0A4]">
                    খামারের পশু বিক্রয় হলে তালিকা থেকে দ্রুত নির্বাচন করুন (ঐচ্ছিক):
                  </label>
                  <select
                    id="quick-pick-animal"
                    defaultValue=""
                    onChange={(e) => handleQuickPickAnimal(e.target.value)}
                    className="min-h-[38px] px-3 py-1.5 bg-[#101814] border border-[#24382E] rounded-lg text-xs text-[#EFF5F1]"
                  >
                    <option value="">-- পশু বাছাই করুন --</option>
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.tagNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="sale-product-type" className="block text-xs font-medium text-[#C8D8CE]">
                    বিক্রয়ের ধরন *
                  </label>
                  <select
                    id="sale-product-type"
                    value={form.productType}
                    onChange={(e) =>
                      setForm({ ...form, productType: e.target.value as SaleRecordInput['productType'] })
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  >
                    {SALE_PRODUCT_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-date" className="block text-xs font-medium text-[#C8D8CE]">
                    বিক্রয়ের তারিখ *
                  </label>
                  <input
                    id="sale-date"
                    type="date"
                    required
                    value={form.saleDate}
                    onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-item-name" className="block text-xs font-medium text-[#C8D8CE]">
                    পণ্য বা পশুর বিবরণ *
                  </label>
                  <input
                    id="sale-item-name"
                    type="text"
                    required
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    placeholder="যেমন: গরুর দুধ / দেশি ষাঁড়"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-ref-tag" className="block text-xs font-medium text-[#C8D8CE]">
                    ট্যাগ বা চালান নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    id="sale-ref-tag"
                    type="text"
                    value={form.referenceTag}
                    onChange={(e) => setForm({ ...form, referenceTag: e.target.value })}
                    placeholder="যেমন: COW-102 / INV-12"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono text-[#EFF5F1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label htmlFor="sale-qty" className="block text-xs font-medium text-[#C8D8CE]">
                      পরিমাণ *
                    </label>
                    <input
                      id="sale-qty"
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={form.quantity}
                      onChange={(e) =>
                        updateQtyOrPrice(Number(e.target.value), form.unitPrice, !editingSale)
                      }
                      className="w-full min-h-[44px] px-3 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="sale-unit" className="block text-xs font-medium text-[#C8D8CE]">
                      একক *
                    </label>
                    <select
                      id="sale-unit"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value as SaleRecordInput['unit'] })}
                      className="w-full min-h-[44px] px-3 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                    >
                      {SALE_UNIT_LIST.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-unit-price" className="block text-xs font-medium text-[#C8D8CE]">
                    একক দর ({currency}) *
                  </label>
                  <input
                    id="sale-unit-price"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={form.unitPrice}
                    onChange={(e) =>
                      updateQtyOrPrice(form.quantity, Number(e.target.value), !editingSale)
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-paid" className="block text-xs font-medium text-[#C8D8CE]">
                    নগদ প্রাপ্ত টাকা ({currency}) *
                  </label>
                  <input
                    id="sale-paid"
                    type="number"
                    min="0"
                    max={form.totalAmount}
                    step="any"
                    required
                    value={form.paidAmount}
                    onChange={(e) => updatePaidField(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#0C130F] border border-[#1A2921] flex flex-col justify-center space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#9CB0A4]">
                    <span>মোট বিল:</span>
                    <strong className="font-mono tabular-nums text-[#EFF5F1]">
                      {formatBDT(form.totalAmount, currency)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#9CB0A4]">
                    <span>বকেয়া থাকবে:</span>
                    <strong
                      className={`font-mono tabular-nums ${
                        form.dueAmount > 0 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {formatBDT(form.dueAmount, currency)}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-buyer-name" className="block text-xs font-medium text-[#C8D8CE]">
                    ক্রেতার নাম *
                  </label>
                  <input
                    id="sale-buyer-name"
                    type="text"
                    required
                    value={form.buyerName}
                    onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                    placeholder="ক্রেতা বা প্রতিষ্ঠানের নাম"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sale-buyer-phone" className="block text-xs font-medium text-[#C8D8CE]">
                    ক্রেতার মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    id="sale-buyer-phone"
                    type="tel"
                    value={form.buyerPhone}
                    onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                    placeholder="017XX-XXXXXX"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono text-[#EFF5F1]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="sale-notes" className="block text-xs font-medium text-[#C8D8CE]">
                    মন্তব্য / নোট
                  </label>
                  <input
                    id="sale-notes"
                    type="text"
                    maxLength={500}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="পরিশোধের শর্ত বা ডেলিভারি নোট..."
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[#EFF5F1]"
                  />
                </div>
              </div>

              {!editingSale && form.paidAmount > 0 && (
                <div className="p-3.5 rounded-xl bg-[#0C130F] border border-[#1B2B22] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 text-xs text-[#D2E2D8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRecordIncome}
                      onChange={(e) => setAutoRecordIncome(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span>
                      নগদ প্রাপ্ত টাকা ({formatBDT(form.paidAmount, currency)}) স্বয়ংক্রিয়ভাবে আয়ের খাতায় যুক্ত করুন
                    </span>
                  </label>
                  {autoRecordIncome && (
                    <select
                      aria-label="আয়ের পেমেন্ট মাধ্যম"
                      value={incomeMethod}
                      onChange={(e) => setIncomeMethod(e.target.value as PaymentMethod)}
                      className="min-h-[38px] px-3 py-1.5 bg-[#101814] border border-[#24382E] rounded-lg text-xs text-[#EFF5F1]"
                    >
                      {PAYMENT_METHOD_LIST.filter((m) => m !== 'বাকি').map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

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
                  {saving ? 'সংরক্ষণ হচ্ছে...' : editingSale ? 'আপডেট সংরক্ষণ করুন' : 'বিক্রয় সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {dueCollectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="due-collect-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-[#101814] border border-[#1E2E26] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 id="due-collect-title" className="text-lg font-bold text-[#EFF5F1]">
                বকেয়া টাকা আদায়
              </h2>
              <button
                type="button"
                onClick={() => setDueCollectTarget(null)}
                aria-label="বন্ধ করুন"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#8CA295] hover:text-[#EFF5F1] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#9CB0A4]">
              ক্রেতা: <strong className="text-[#EFF5F1]">{dueCollectTarget.buyerName}</strong> · বর্তমান বকেয়া:{' '}
              <span className="font-mono tabular-nums text-amber-300">
                {formatBDT(dueCollectTarget.dueAmount, currency)}
              </span>
            </p>

            <form onSubmit={handleCollectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="collect-amount" className="block text-xs font-medium text-[#C8D8CE]">
                  আদায়কৃত টাকার পরিমাণ ({currency}) *
                </label>
                <input
                  id="collect-amount"
                  type="number"
                  min="0.01"
                  max={dueCollectTarget.dueAmount}
                  step="any"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] focus:border-emerald-500 focus:outline-none rounded-xl text-sm font-mono tabular-nums text-[#EFF5F1]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="collect-method" className="block text-xs font-medium text-[#C8D8CE]">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  id="collect-method"
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as PaymentMethod)}
                  className="w-full min-h-[44px] px-3.5 py-2 bg-[#0B110E] border border-[#22352B] rounded-xl text-sm text-[#EFF5F1]"
                >
                  {PAYMENT_METHOD_LIST.filter((m) => m !== 'বাকি').map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[#D2E2D8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectAutoIncome}
                  onChange={(e) => setCollectAutoIncome(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>আয়ের খাতায় এই আদায়কৃত টাকা যোগ করুন</span>
              </label>

              {collectError && (
                <p role="alert" className="text-xs text-red-400">
                  {collectError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDueCollectTarget(null)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#C8D8CE] bg-[#16221C] border border-[#24382E] rounded-xl whitespace-nowrap"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={collectBusy}
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl whitespace-nowrap disabled:opacity-60"
                >
                  {collectBusy ? 'সংরক্ষণ হচ্ছে...' : 'আদায় সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTarget)}
        title="বিক্রয়ের তথ্য মুছে ফেলুন"
        itemLabel={deletingTarget ? `${deletingTarget.itemName} (${deletingTarget.buyerName})` : ''}
        onCancel={() => setDeletingTarget(null)}
        onConfirm={async () => {
          if (deletingTarget) {
            await deleteSaleRecord(deletingTarget.id);
          }
        }}
      />
    </div>
  );
};
