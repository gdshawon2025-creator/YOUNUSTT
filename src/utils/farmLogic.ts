import {
  Animal,
  AnimalGender,
  AnimalInput,
  AnimalSpecies,
  DashboardSummary,
  FarmProfile,
  FarmProfileUpdateInput,
  FeedCategory,
  FeedStock,
  FeedStockInput,
  FeedUnit,
  HealthCondition,
  PaymentMethod,
  SaleProductType,
  SaleRecord,
  SaleRecordInput,
  SaleUnit,
  Transaction,
  TransactionInput,
} from '../types/farm';

// Constants synchronized verbatim with firebase-blueprint.json & firestore.rules
export const ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;
export const ISO_DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export const ANIMAL_SPECIES_LIST: AnimalSpecies[] = [
  'গরু',
  'ছাগল',
  'ভেড়া',
  'মহিষ',
  'হাঁস',
  'মুরগি',
  'অন্যান্য',
];

export const ANIMAL_GENDER_LIST: AnimalGender[] = [
  'পুরুষ (ষাঁড়/পাঠা)',
  'স্ত্রী (গাভী/ছাগী)',
  'বাচ্চা',
];

export const HEALTH_CONDITION_LIST: HealthCondition[] = [
  'সুস্থ',
  'চিকিৎসাধীন',
  'গর্ভবতী',
  'পর্যবেক্ষণে',
];

export const FEED_CATEGORY_LIST: FeedCategory[] = [
  'দানাদার খাদ্য',
  'ভুষি ও খৈল',
  'কাঁচা ঘাস ও খড়',
  'ভিটামিন ও ওষুধ',
  'অন্যান্য',
];

export const FEED_UNIT_LIST: FeedUnit[] = [
  'কেজি',
  'বস্তা',
  'লিটার',
  'আঁটি',
  'প্যাকেট',
];

export const PAYMENT_METHOD_LIST: PaymentMethod[] = [
  'নগদ',
  'বিকাশ / নগদ অ্যাপ',
  'ব্যাংক ট্রান্সফার',
  'বাকি',
];

export const INCOME_CATEGORIES: string[] = [
  'দুধ বিক্রয়',
  'পশু বিক্রয়',
  'ডিম বিক্রয়',
  'মাংস বিক্রয়',
  'জৈব সার বিক্রয়',
  'অন্যান্য আয়',
];

export const EXPENSE_CATEGORIES: string[] = [
  'পশুখাদ্য ক্রয়',
  'চিকিৎসা ও টিকা',
  'শ্রমিকের মজুরি',
  'পশু ক্রয়',
  'বিদ্যুৎ ও পানি বিল',
  'খামার মেরামত ও সরঞ্জাম',
  'পরিবহন খরচ',
  'অন্যান্য ব্যয়',
];

export const SALE_PRODUCT_TYPES: SaleProductType[] = [
  'পশু বিক্রয়',
  'দুধ বিক্রয়',
  'ডিম বিক্রয়',
  'মাংস বিক্রয়',
  'জৈব সার',
  'অন্যান্য',
];

export const SALE_UNIT_LIST: SaleUnit[] = [
  'টি',
  'লিটার',
  'কেজি',
  'হালি',
  'বস্তা',
];

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateSafeId(prefix = 'rec'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64);
}

export function isValidDocumentId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_PATTERN.test(id);
}

export function formatBDT(amount: number, currency = '৳'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Math.abs(safe));
  return safe < 0 ? `-${currency}${formatted}` : `${currency}${formatted}`;
}

export function formatNumber(val: number): string {
  const safe = Number.isFinite(val) ? val : 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(safe);
}

// Validation helpers synchronized with firebase-blueprint.json & firestore.rules
export function validateAnimalInput(input: AnimalInput): string | null {
  const name = input.name.trim();
  const tag = input.tagNumber.trim();
  if (name.length < 1 || name.length > 100) {
    return 'পশুর নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (tag.length < 1 || tag.length > 50) {
    return 'ট্যাগ বা পরিচিতি নম্বর ১ থেকে ৫০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (!ANIMAL_SPECIES_LIST.includes(input.species)) {
    return 'সঠিক পশুর প্রজাতি নির্বাচন করুন।';
  }
  if (input.breed.trim().length > 80) {
    return 'জাতের নাম সর্বোচ্চ ৮০ অক্ষর হতে পারে।';
  }
  if (!ANIMAL_GENDER_LIST.includes(input.gender)) {
    return 'সঠিক লিঙ্গ বা শ্রেণি নির্বাচন করুন।';
  }
  if (!Number.isFinite(input.ageMonths) || input.ageMonths < 0 || input.ageMonths > 600) {
    return 'বয়স ০ থেকে ৬০০ মাসের মধ্যে হতে হবে।';
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 0 || input.weightKg > 5000) {
    return 'ওজন ০ থেকে ৫০০০ কেজির মধ্যে হতে হবে।';
  }
  if (!Number.isFinite(input.purchasePrice) || input.purchasePrice < 0 || input.purchasePrice > 100000000) {
    return 'ক্রয়মূল্য সঠিক সংখ্যায় লিখুন।';
  }
  if (!HEALTH_CONDITION_LIST.includes(input.healthCondition)) {
    return 'সঠিক স্বাস্থ্য অবস্থা নির্বাচন করুন।';
  }
  if (input.notes.trim().length > 500) {
    return 'নোট সর্বোচ্চ ৫০০ অক্ষর হতে পারে।';
  }
  return null;
}

export function sanitizeAnimalInput(input: AnimalInput): AnimalInput {
  return {
    name: input.name.trim().slice(0, 100),
    tagNumber: input.tagNumber.trim().slice(0, 50),
    species: input.species,
    breed: input.breed.trim().slice(0, 80),
    gender: input.gender,
    ageMonths: Math.max(0, Math.min(600, Number(input.ageMonths) || 0)),
    weightKg: Math.max(0, Math.min(5000, Number(input.weightKg) || 0)),
    purchasePrice: Math.max(0, Math.min(100000000, Number(input.purchasePrice) || 0)),
    healthCondition: input.healthCondition,
    notes: input.notes.trim().slice(0, 500),
  };
}

export function validateFeedStockInput(input: FeedStockInput): string | null {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 100) {
    return 'খাবারের নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (!FEED_CATEGORY_LIST.includes(input.category)) {
    return 'খাবারের ধরন নির্বাচন করুন।';
  }
  if (!Number.isFinite(input.currentStock) || input.currentStock < 0 || input.currentStock > 10000000) {
    return 'বর্তমান স্টকের পরিমাণ ০ বা তার বেশি হতে হবে।';
  }
  if (!FEED_UNIT_LIST.includes(input.unit)) {
    return 'সঠিক একক নির্বাচন করুন।';
  }
  if (!Number.isFinite(input.minStockAlert) || input.minStockAlert < 0 || input.minStockAlert > 10000000) {
    return 'ন্যূনতম সতর্কতা স্টক ০ বা তার বেশি হতে হবে।';
  }
  if (!Number.isFinite(input.unitCost) || input.unitCost < 0 || input.unitCost > 100000000) {
    return 'একক মূল্য ০ বা তার বেশি হতে হবে।';
  }
  if (!ISO_DATE_PATTERN.test(input.lastRestockedDate)) {
    return 'সঠিক তারিখ (YYYY-MM-DD) নির্বাচন করুন।';
  }
  if (input.notes.trim().length > 500) {
    return 'নোট সর্বোচ্চ ৫০০ অক্ষর হতে পারে।';
  }
  return null;
}

export function sanitizeFeedStockInput(input: FeedStockInput): FeedStockInput {
  return {
    name: input.name.trim().slice(0, 100),
    category: input.category,
    currentStock: Math.max(0, Math.min(10000000, Number(input.currentStock) || 0)),
    unit: input.unit,
    minStockAlert: Math.max(0, Math.min(10000000, Number(input.minStockAlert) || 0)),
    unitCost: Math.max(0, Math.min(100000000, Number(input.unitCost) || 0)),
    lastRestockedDate: input.lastRestockedDate.trim(),
    notes: input.notes.trim().slice(0, 500),
  };
}

export function adjustFeedStockQuantity(
  currentStock: number,
  delta: number
): { ok: true; nextStock: number } | { ok: false; error: string } {
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: 'পরিবর্তনের পরিমাণ ০ এর বেশি হতে হবে।' };
  }
  const next = Math.round((currentStock + delta) * 100) / 100;
  if (next < 0) {
    return { ok: false, error: 'বর্তমান স্টকের চেয়ে বেশি পরিমাণ কমানো যাবে না।' };
  }
  if (next > 10000000) {
    return { ok: false, error: 'স্টকের পরিমাণ অনুমোদিত সীমা অতিক্রম করেছে।' };
  }
  return { ok: true, nextStock: next };
}

export function validateTransactionInput(input: TransactionInput): string | null {
  if (input.type !== 'income' && input.type !== 'expense') {
    return 'লেনদেনের ধরন (আয় বা ব্যয়) নির্বাচন করুন।';
  }
  const title = input.title.trim();
  if (title.length < 1 || title.length > 140) {
    return 'বিবরণ ১ থেকে ১৪০ অক্ষরের মধ্যে হতে হবে।';
  }
  const category = input.category.trim();
  if (category.length < 1 || category.length > 80) {
    return 'খাত নির্বাচন করুন।';
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 1000000000) {
    return 'টাকার পরিমাণ ০ এর বেশি হতে হবে।';
  }
  if (!ISO_DATE_PATTERN.test(input.transactionDate)) {
    return 'সঠিক তারিখ নির্বাচন করুন।';
  }
  if (!PAYMENT_METHOD_LIST.includes(input.paymentMethod)) {
    return 'পেমেন্ট মাধ্যম নির্বাচন করুন।';
  }
  if (input.notes.trim().length > 500) {
    return 'নোট সর্বোচ্চ ৫০০ অক্ষর হতে পারে।';
  }
  return null;
}

export function sanitizeTransactionInput(input: TransactionInput): TransactionInput {
  return {
    type: input.type,
    title: input.title.trim().slice(0, 140),
    category: input.category.trim().slice(0, 80),
    amount: Math.round(Math.min(1000000000, Number(input.amount)) * 100) / 100,
    transactionDate: input.transactionDate.trim(),
    paymentMethod: input.paymentMethod,
    notes: input.notes.trim().slice(0, 500),
  };
}

export function computeSaleTotals(
  quantity: number,
  unitPrice: number,
  paidAmount: number
): { totalAmount: number; paidAmount: number; dueAmount: number } {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
  const totalAmount = Math.round(safeQty * safeUnitPrice * 100) / 100;
  const clampedPaid = Math.max(0, Math.min(totalAmount, Math.round((Number(paidAmount) || 0) * 100) / 100));
  const dueAmount = Math.max(0, Math.round((totalAmount - clampedPaid) * 100) / 100);
  return { totalAmount, paidAmount: clampedPaid, dueAmount };
}

export function validateSaleRecordInput(input: SaleRecordInput): string | null {
  if (!SALE_PRODUCT_TYPES.includes(input.productType)) {
    return 'বিক্রয়ের ধরন নির্বাচন করুন।';
  }
  if (input.itemName.trim().length < 1 || input.itemName.trim().length > 120) {
    return 'পণ্য বা পশুর নাম ১ থেকে ১২০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (input.referenceTag.trim().length > 50) {
    return 'ট্যাগ বা রেফারেন্স সর্বোচ্চ ৫০ অক্ষর হতে পারে।';
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0 || input.quantity > 1000000) {
    return 'পরিমাণ ০ এর বেশি হতে হবে।';
  }
  if (!SALE_UNIT_LIST.includes(input.unit)) {
    return 'সঠিক একক নির্বাচন করুন।';
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0 || input.unitPrice > 1000000000) {
    return 'একক দর সঠিক সংখ্যায় লিখুন।';
  }
  if (!Number.isFinite(input.totalAmount) || input.totalAmount < 0 || input.totalAmount > 1000000000) {
    return 'মোট মূল্য সঠিক সংখ্যায় লিখুন।';
  }
  if (!Number.isFinite(input.paidAmount) || input.paidAmount < 0 || input.paidAmount > input.totalAmount) {
    return 'পরিশোধিত টাকা মোট মূল্যের বেশি হতে পারবে না।';
  }
  if (!Number.isFinite(input.dueAmount) || input.dueAmount < 0 || input.dueAmount > input.totalAmount) {
    return 'বকেয়া টাকার হিসাব সঠিক নয়।';
  }
  if (input.buyerName.trim().length < 1 || input.buyerName.trim().length > 100) {
    return 'ক্রেতার নাম ১ থেকে ১০০ অক্ষরের মধ্যে লিখুন।';
  }
  if (input.buyerPhone.trim().length > 30) {
    return 'মোবাইল নম্বর সর্বোচ্চ ৩০ অক্ষর হতে পারে।';
  }
  if (!ISO_DATE_PATTERN.test(input.saleDate)) {
    return 'সঠিক বিক্রয়ের তারিখ নির্বাচন করুন।';
  }
  if (input.notes.trim().length > 500) {
    return 'নোট সর্বোচ্চ ৫০০ অক্ষর হতে পারে।';
  }
  return null;
}

export function sanitizeSaleRecordInput(input: SaleRecordInput): SaleRecordInput {
  const { totalAmount, paidAmount, dueAmount } = computeSaleTotals(
    input.quantity,
    input.unitPrice,
    input.paidAmount
  );
  return {
    productType: input.productType,
    itemName: input.itemName.trim().slice(0, 120),
    referenceTag: input.referenceTag.trim().slice(0, 50),
    quantity: Math.round(Math.min(1000000, Number(input.quantity)) * 100) / 100,
    unit: input.unit,
    unitPrice: Math.round(Math.min(1000000000, Number(input.unitPrice)) * 100) / 100,
    totalAmount,
    paidAmount,
    dueAmount,
    buyerName: input.buyerName.trim().slice(0, 100),
    buyerPhone: input.buyerPhone.trim().slice(0, 30),
    saleDate: input.saleDate.trim(),
    notes: input.notes.trim().slice(0, 500),
  };
}

export function validateFarmProfileInput(input: FarmProfileUpdateInput): string | null {
  if (input.farmName.trim().length < 1 || input.farmName.trim().length > 120) {
    return 'খামারের নাম ১ থেকে ১২০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (input.ownerName.trim().length < 1 || input.ownerName.trim().length > 100) {
    return 'মালিকের নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।';
  }
  if (input.location.trim().length > 200) {
    return 'ঠিকানা সর্বোচ্চ ২০০ অক্ষর হতে পারে।';
  }
  if (input.phone.trim().length > 30) {
    return 'মোবাইল নম্বর সর্বোচ্চ ৩০ অক্ষর হতে পারে।';
  }
  if (input.currency.trim().length < 1 || input.currency.trim().length > 10) {
    return 'মুদ্রা চিহ্ন ১ থেকে ১০ অক্ষরের মধ্যে হতে হবে।';
  }
  return null;
}

export function calculateDashboardSummary(
  animals: Animal[],
  feedStocks: FeedStock[],
  transactions: Transaction[],
  sales: SaleRecord[]
): DashboardSummary {
  const speciesCounts: Record<string, number> = {};
  let healthyAnimals = 0;
  let careNeededAnimals = 0;
  let livestockValuation = 0;

  for (const animal of animals) {
    speciesCounts[animal.species] = (speciesCounts[animal.species] || 0) + 1;
    if (animal.healthCondition === 'সুস্থ' || animal.healthCondition === 'গর্ভবতী') {
      healthyAnimals += 1;
    } else {
      careNeededAnimals += 1;
    }
    livestockValuation += animal.purchasePrice || 0;
  }

  let lowStockCount = 0;
  let feedInventoryValue = 0;
  for (const feed of feedStocks) {
    if (feed.currentStock <= feed.minStockAlert) {
      lowStockCount += 1;
    }
    feedInventoryValue += feed.currentStock * feed.unitCost;
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  }

  let totalSalesAmount = 0;
  let totalSalesPaid = 0;
  let totalSalesDue = 0;
  for (const sale of sales) {
    totalSalesAmount += sale.totalAmount;
    totalSalesPaid += sale.paidAmount;
    totalSalesDue += sale.dueAmount;
  }

  return {
    totalAnimals: animals.length,
    healthyAnimals,
    careNeededAnimals,
    livestockValuation: Math.round(livestockValuation * 100) / 100,
    totalFeedItems: feedStocks.length,
    lowStockCount,
    feedInventoryValue: Math.round(feedInventoryValue * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
    totalSalesAmount: Math.round(totalSalesAmount * 100) / 100,
    totalSalesPaid: Math.round(totalSalesPaid * 100) / 100,
    totalSalesDue: Math.round(totalSalesDue * 100) / 100,
    speciesCounts,
  };
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export function sha256PureJsHex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLen = bytes.length * 8;
  const totalBytes = (((bytes.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(totalBytes);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalBytes - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalBytes - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < totalBytes; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

// Salted SHA-256 hashing using Web Crypto API with pure-JS fallback
export function generateSaltHex(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPasswordSha256(password: string, salt: string): Promise<string> {
  const payload = `${salt}:${password}`;
  if (globalThis.crypto && globalThis.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return sha256PureJsHex(payload);
}

export async function verifyPasswordSha256(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!expectedHash || !salt) return false;
  const computed = await hashPasswordSha256(password, salt);
  return computed === expectedHash;
}

// Preconfigured default Admin Password ("admin1234") salted SHA-256 hash
// Allows immediate password-gated login out-of-the-box and custom password updates anytime
export const DEFAULT_ADMIN_PASSWORD = 'admin1234';
export const DEFAULT_ADMIN_SALT = '736f62756a5f6b68616d61725f61646d';
export const DEFAULT_ADMIN_HASH =
  '4a7272030d171f357ebbdaa7cd293e05c2cc968169832c10346d24388c2e2662';

export function isDefaultAdminPasswordProfile(
  profile: Pick<FarmProfile, 'appPasswordHash' | 'appPasswordSalt'>
): boolean {
  return (
    profile.appPasswordHash === DEFAULT_ADMIN_HASH &&
    profile.appPasswordSalt === DEFAULT_ADMIN_SALT
  );
}

export function createDefaultFarmProfile(ownerId: string, ownerName = 'খামার পরিচালক'): FarmProfile {
  const now = new Date().toISOString();
  return {
    id: ownerId,
    ownerId,
    farmName: 'সবুজ অ্যাগ্রো ও ডেইরি খামার',
    ownerName: ownerName.trim().slice(0, 100) || 'খামার পরিচালক',
    location: 'সাভার, ঢাকা',
    phone: '01700-000000',
    currency: '৳',
    hasAppPassword: true,
    appPasswordHash: DEFAULT_ADMIN_HASH,
    appPasswordSalt: DEFAULT_ADMIN_SALT,
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialSeedData(ownerId: string): {
  animals: Animal[];
  feedStocks: FeedStock[];
  transactions: Transaction[];
  sales: SaleRecord[];
} {
  const today = getTodayIsoDate();
  const now = new Date().toISOString();

  const animals: Animal[] = [
    {
      id: 'anim_seed_1',
      ownerId,
      name: 'লালি (গাভী)',
      tagNumber: 'COW-101',
      species: 'গরু',
      breed: 'শাহীওয়াল ক্রস',
      gender: 'স্ত্রী (গাভী/ছাগী)',
      ageMonths: 36,
      weightKg: 380,
      purchasePrice: 145000,
      healthCondition: 'সুস্থ',
      notes: 'দৈনিক গড়ে ১২ লিটার দুধ দেয়, ক্ষুরারোগের টিকা দেওয়া হয়েছে।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'anim_seed_2',
      ownerId,
      name: 'সুলতান (ষাঁড়)',
      tagNumber: 'COW-102',
      species: 'গরু',
      breed: 'দেশাল ষাঁড়',
      gender: 'পুরুষ (ষাঁড়/পাঠা)',
      ageMonths: 24,
      weightKg: 310,
      purchasePrice: 118000,
      healthCondition: 'সুস্থ',
      notes: 'মোটাতাজাকরণ প্রজেক্ট, নিয়মিত দানাদার খাদ্য দেওয়া হচ্ছে।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'anim_seed_3',
      ownerId,
      name: 'কাজল (ব্ল্যাক বেঙ্গল)',
      tagNumber: 'GOAT-201',
      species: 'ছাগল',
      breed: 'ব্ল্যাক বেঙ্গল',
      gender: 'স্ত্রী (গাভী/ছাগী)',
      ageMonths: 16,
      weightKg: 22,
      purchasePrice: 14500,
      healthCondition: 'গর্ভবতী',
      notes: 'আগামী মাসে বাচ্চা প্রসবের সম্ভাব্য সময়, বাড়তি যত্ন প্রয়োজন।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'anim_seed_4',
      ownerId,
      name: 'সোনালি মুরগি ব্যাচ-১ (১২০টি)',
      tagNumber: 'PLT-301',
      species: 'মুরগি',
      breed: 'সোনালি লেয়ার',
      gender: 'স্ত্রী (গাভী/ছাগী)',
      ageMonths: 7,
      weightKg: 165,
      purchasePrice: 42000,
      healthCondition: 'পর্যবেক্ষণে',
      notes: '১২০টি মুরগির ব্যাচ, ভিটামিন ও ক্যালসিয়াম কোর্স চলছে।',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const feedStocks: FeedStock[] = [
    {
      id: 'feed_seed_1',
      ownerId,
      name: 'গমের ভুষি (প্রিমিয়াম)',
      category: 'ভুষি ও খৈল',
      currentStock: 180,
      unit: 'কেজি',
      minStockAlert: 50,
      unitCost: 58,
      lastRestockedDate: today,
      notes: 'শুকনো গুদামে সংরক্ষিত।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'feed_seed_2',
      ownerId,
      name: 'সরিষার খৈল',
      category: 'ভুষি ও খৈল',
      currentStock: 18,
      unit: 'কেজি',
      minStockAlert: 30,
      unitCost: 65,
      lastRestockedDate: today,
      notes: 'স্টক কমে এসেছে, দ্রুত নতুন বস্তা অর্ডার করতে হবে।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'feed_seed_3',
      ownerId,
      name: 'নেপিয়ার কাঁচা ঘাস',
      category: 'কাঁচা ঘাস ও খড়',
      currentStock: 240,
      unit: 'আঁটি',
      minStockAlert: 60,
      unitCost: 15,
      lastRestockedDate: today,
      notes: 'নিজস্ব ঘাসের জমি থেকে সংগৃহীত।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'feed_seed_4',
      ownerId,
      name: 'ডেইরি ক্যালসিয়াম ও মিনারেল মিক্স',
      category: 'ভিটামিন ও ওষুধ',
      currentStock: 4,
      unit: 'লিটার',
      minStockAlert: 5,
      unitCost: 420,
      lastRestockedDate: today,
      notes: 'গাভীর দুধ বৃদ্ধির জন্য প্রতিদিন সকালে মিশ্রণ।',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx_seed_1',
      ownerId,
      type: 'income',
      title: 'সাপ্তাহিক তাজা দুধ বিক্রয় (৮৫ লিটার)',
      category: 'দুধ বিক্রয়',
      amount: 6800,
      transactionDate: today,
      paymentMethod: 'নগদ',
      notes: 'স্থানীয় মিষ্টির দোকানে সরবরাহ।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx_seed_2',
      ownerId,
      type: 'income',
      title: 'দেশি খাসি বিক্রয় (১টি)',
      category: 'পশু বিক্রয়',
      amount: 18500,
      transactionDate: today,
      paymentMethod: 'বিকাশ / নগদ অ্যাপ',
      notes: 'ক্রেতা: রফিকুল ইসলাম।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx_seed_3',
      ownerId,
      type: 'expense',
      title: 'গমের ভুষি ও দানাদার খাবার ক্রয়',
      category: 'পশুখাদ্য ক্রয়',
      amount: 9400,
      transactionDate: today,
      paymentMethod: 'নগদ',
      notes: 'আল-মদিনা ফিড স্টোর থেকে ক্রয়।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx_seed_4',
      ownerId,
      type: 'expense',
      title: 'পশুচিকিৎসক পরামর্শ ও কৃমিনাশক ওষুধ',
      category: 'চিকিৎসা ও টিকা',
      amount: 1650,
      transactionDate: today,
      paymentMethod: 'নগদ',
      notes: 'সকল গরু ও ছাগলের নিয়মিত চেকআপ।',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const sales: SaleRecord[] = [
    {
      id: 'sale_seed_1',
      ownerId,
      productType: 'দুধ বিক্রয়',
      itemName: 'খাঁটি গরুর দুধ',
      referenceTag: 'MILK-W44',
      quantity: 85,
      unit: 'লিটার',
      unitPrice: 80,
      totalAmount: 6800,
      paidAmount: 6800,
      dueAmount: 0,
      buyerName: 'ভাই ভাই মিষ্টান্ন ভাণ্ডার',
      buyerPhone: '01812-334455',
      saleDate: today,
      notes: 'সম্পূর্ণ মূল্য নগদে পরিশোধিত।',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sale_seed_2',
      ownerId,
      productType: 'পশু বিক্রয়',
      itemName: 'দেশি খাসি (২৪ কেজি)',
      referenceTag: 'GOAT-198',
      quantity: 1,
      unit: 'টি',
      unitPrice: 18500,
      totalAmount: 18500,
      paidAmount: 15000,
      dueAmount: 3500,
      buyerName: 'মোঃ রফিকুল ইসলাম',
      buyerPhone: '01715-998877',
      saleDate: today,
      notes: 'বাকি ৩,৫০০ টাকা আগামী সপ্তাহে পরিশোধ করবেন।',
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { animals, feedStocks, transactions, sales };
}

export function buildCsvContent(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  return '\uFEFF' + lines.join('\n');
}
