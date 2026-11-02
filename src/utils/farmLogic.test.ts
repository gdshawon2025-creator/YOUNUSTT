import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustFeedStockQuantity,
  calculateDashboardSummary,
  computeSaleTotals,
  createDefaultFarmProfile,
  createInitialSeedData,
  DEFAULT_ADMIN_HASH,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_SALT,
  generateSaltHex,
  hashPasswordSha256,
  isDefaultAdminPasswordProfile,
  isValidDocumentId,
  validateAnimalInput,
  validateFeedStockInput,
  validateSaleRecordInput,
  validateTransactionInput,
  verifyPasswordSha256,
} from './farmLogic';

test('calculateDashboardSummary computes animal counts, low stock alerts, net balance, and sales receivables accurately', () => {
  const seed = createInitialSeedData('user_test_1');
  const summary = calculateDashboardSummary(
    seed.animals,
    seed.feedStocks,
    seed.transactions,
    seed.sales
  );

  assert.equal(summary.totalAnimals, 4);
  assert.equal(summary.healthyAnimals, 3); // 2 সুস্থ + 1 গর্ভবতী
  assert.equal(summary.careNeededAnimals, 1); // 1 পর্যবেক্ষণে
  assert.equal(summary.lowStockCount, 2); // সরিষার খৈল (18 <= 30) & ক্যালসিয়াম (4 <= 5)
  assert.equal(summary.totalIncome, 25300); // 6800 + 18500
  assert.equal(summary.totalExpense, 11050); // 9400 + 1650
  assert.equal(summary.netBalance, 14250); // 25300 - 11050
  assert.equal(summary.totalSalesAmount, 25300);
  assert.equal(summary.totalSalesPaid, 21800);
  assert.equal(summary.totalSalesDue, 3500);
  assert.equal(summary.speciesCounts['গরু'], 2);
});

test('adjustFeedStockQuantity handles restock and rejects overdrafts below zero', () => {
  const added = adjustFeedStockQuantity(40, 25);
  assert.equal(added.ok, true);
  if (added.ok) assert.equal(added.nextStock, 65);

  const consumed = adjustFeedStockQuantity(40, -15.5);
  assert.equal(consumed.ok, true);
  if (consumed.ok) assert.equal(consumed.nextStock, 24.5);

  const overdraft = adjustFeedStockQuantity(10, -12);
  assert.equal(overdraft.ok, false);

  const zeroDelta = adjustFeedStockQuantity(10, 0);
  assert.equal(zeroDelta.ok, false);
});

test('computeSaleTotals calculates total, clamped paid amount, and remaining due cleanly', () => {
  const normal = computeSaleTotals(25, 80, 1500);
  assert.equal(normal.totalAmount, 2000);
  assert.equal(normal.paidAmount, 1500);
  assert.equal(normal.dueAmount, 500);

  const overpaid = computeSaleTotals(10, 100, 1500);
  assert.equal(overpaid.totalAmount, 1000);
  assert.equal(overpaid.paidAmount, 1000);
  assert.equal(overpaid.dueAmount, 0);
});

test('validators reject empty or out-of-bounds payloads and accept valid farm inputs', () => {
  assert.notEqual(
    validateAnimalInput({
      name: '',
      tagNumber: 'COW-1',
      species: 'গরু',
      breed: 'দেশি',
      gender: 'স্ত্রী (গাভী/ছাগী)',
      ageMonths: 12,
      weightKg: 150,
      purchasePrice: 50000,
      healthCondition: 'সুস্থ',
      notes: '',
    }),
    null
  );

  assert.equal(
    validateAnimalInput({
      name: 'কালা মানিক',
      tagNumber: 'COW-109',
      species: 'গরু',
      breed: 'শাহীওয়াল',
      gender: 'পুরুষ (ষাঁড়/পাঠা)',
      ageMonths: 20,
      weightKg: 320,
      purchasePrice: 125000,
      healthCondition: 'সুস্থ',
      notes: 'সুস্থ ষাঁড়',
    }),
    null
  );

  assert.notEqual(
    validateFeedStockInput({
      name: 'ভুষি',
      category: 'ভুষি ও খৈল',
      currentStock: -5,
      unit: 'কেজি',
      minStockAlert: 10,
      unitCost: 55,
      lastRestockedDate: '2026-11-02',
      notes: '',
    }),
    null
  );

  assert.notEqual(
    validateTransactionInput({
      type: 'income',
      title: 'দুধ বিক্রয়',
      category: 'দুধ বিক্রয়',
      amount: 0,
      transactionDate: '2026-11-02',
      paymentMethod: 'নগদ',
      notes: '',
    }),
    null
  );

  assert.notEqual(
    validateSaleRecordInput({
      productType: 'দুধ বিক্রয়',
      itemName: 'গরুর দুধ',
      referenceTag: '',
      quantity: 10,
      unit: 'লিটার',
      unitPrice: 80,
      totalAmount: 800,
      paidAmount: 950, // exceeds totalAmount
      dueAmount: 0,
      buyerName: 'করিম মিয়া',
      buyerPhone: '',
      saleDate: '2026-11-02',
      notes: '',
    }),
    null
  );
});

test('salted SHA-256 farm password hashing verifies correct password and rejects wrong password', async () => {
  const salt = generateSaltHex(16);
  assert.equal(salt.length, 32);
  const hash = await hashPasswordSha256('MyFarm#2026', salt);
  assert.equal(hash.length, 64);

  const ok = await verifyPasswordSha256('MyFarm#2026', salt, hash);
  assert.equal(ok, true);

  const wrong = await verifyPasswordSha256('WrongPass123', salt, hash);
  assert.equal(wrong, false);
});

test('default Admin Password (admin1234) is mandatory on new profile and custom password replaces it', async () => {
  const computedDefault = await hashPasswordSha256(DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_SALT);
  assert.equal(computedDefault, DEFAULT_ADMIN_HASH);

  const profile = createDefaultFarmProfile('farmer_admin_1');
  assert.equal(profile.hasAppPassword, true);
  assert.equal(profile.appPasswordHash.length, 64);
  assert.equal(isDefaultAdminPasswordProfile(profile), true);

  // Initial specific password unlocks
  assert.equal(
    await verifyPasswordSha256('admin1234', profile.appPasswordSalt, profile.appPasswordHash),
    true
  );
  // Empty or wrong password cannot enter
  assert.equal(
    await verifyPasswordSha256('', profile.appPasswordSalt, profile.appPasswordHash),
    false
  );
  assert.equal(
    await verifyPasswordSha256('wrongpass', profile.appPasswordSalt, profile.appPasswordHash),
    false
  );

  // Custom password change invalidates initial password
  const customSalt = generateSaltHex(16);
  const customHash = await hashPasswordSha256('khamar2026', customSalt);
  const updatedProfile = {
    ...profile,
    appPasswordSalt: customSalt,
    appPasswordHash: customHash,
  };
  assert.equal(isDefaultAdminPasswordProfile(updatedProfile), false);
  assert.equal(
    await verifyPasswordSha256('admin1234', updatedProfile.appPasswordSalt, updatedProfile.appPasswordHash),
    false
  );
  assert.equal(
    await verifyPasswordSha256('khamar2026', updatedProfile.appPasswordSalt, updatedProfile.appPasswordHash),
    true
  );
});

test('isValidDocumentId blocks path traversal, special chars, and oversized IDs', () => {
  assert.equal(isValidDocumentId('anim_abc_123-xyz'), true);
  assert.equal(isValidDocumentId('bad/slash'), false);
  assert.equal(isValidDocumentId('bad$char!'), false);
  assert.equal(isValidDocumentId(''), false);
  assert.equal(isValidDocumentId('a'.repeat(129)), false);
});
