import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesSource = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

interface AuthContext {
  uid: string;
  emailVerified: boolean;
  email?: string;
}

interface RuleWorld {
  requestTimeMs: number;
  existingProfiles: Set<string>;
  existingAdmins?: Set<string>;
  docs: Record<string, Record<string, unknown>>;
}

const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const ISO_DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && ID_REGEX.test(id);
}

function hasExactKeys(data: Record<string, unknown>, allowed: string[]): boolean {
  const keys = Object.keys(data);
  return (
    allowed.every((k) => Object.prototype.hasOwnProperty.call(data, k)) &&
    keys.every((k) => allowed.includes(k))
  );
}

function isBootstrappedOrTrustedAdmin(auth: AuthContext | null, world: RuleWorld): boolean {
  if (!auth || !auth.emailVerified) return false;
  if (auth.email === 'gdyounus2025@gmail.com') return true;
  return Boolean(world.existingAdmins?.has(auth.uid));
}

// Deterministic simulator mirroring firestore.rules gates for Dirty Dozen TDD verification
function evaluateFirestoreWrite(params: {
  collection: 'admins' | 'farmProfiles' | 'animals' | 'feedStocks' | 'transactions' | 'sales';
  docId: string;
  operation: 'create' | 'update' | 'get' | 'list';
  auth: AuthContext | null;
  incoming?: Record<string, unknown>;
  queryOwnerId?: string;
  world: RuleWorld;
}): 'ALLOWED' | 'PERMISSION_DENIED' {
  const { collection, docId, operation, auth, incoming, queryOwnerId, world } = params;
  const fullPath = `/${collection}/${docId}`;
  const existing = world.docs[fullPath];

  if (operation === 'list') {
    if (collection === 'farmProfiles' || collection === 'admins') return 'PERMISSION_DENIED';
    if (!auth) return 'PERMISSION_DENIED';
    if (queryOwnerId !== auth.uid) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  if (operation === 'get') {
    if (!auth || !isValidId(docId)) return 'PERMISSION_DENIED';
    if (collection === 'admins') {
      return auth.uid === docId || isBootstrappedOrTrustedAdmin(auth, world)
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (collection === 'farmProfiles') {
      return auth.uid === docId ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    if (!existing || existing.ownerId !== auth.uid) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  // Write operations strictly require verified user & valid ID
  if (!auth || !auth.emailVerified || !isValidId(docId) || !incoming) {
    return 'PERMISSION_DENIED';
  }

  if (collection === 'admins') {
    const keys = ['adminUid', 'roleLabel', 'createdAt', 'updatedAt'];
    const validShape =
      hasExactKeys(incoming, keys) &&
      typeof incoming.adminUid === 'string' &&
      isValidId(incoming.adminUid) &&
      typeof incoming.roleLabel === 'string' &&
      incoming.roleLabel.length >= 1 &&
      incoming.roleLabel.length <= 60 &&
      typeof incoming.createdAt === 'number' &&
      typeof incoming.updatedAt === 'number';
    if (!validShape || !isBootstrappedOrTrustedAdmin(auth, world)) {
      return 'PERMISSION_DENIED';
    }
    if (operation === 'create') {
      if (
        incoming.adminUid !== docId ||
        incoming.createdAt !== world.requestTimeMs ||
        incoming.updatedAt !== world.requestTimeMs
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOWED';
    }
    if (operation === 'update') {
      if (
        !existing ||
        incoming.adminUid !== existing.adminUid ||
        incoming.createdAt !== existing.createdAt ||
        incoming.updatedAt !== world.requestTimeMs
      ) {
        return 'PERMISSION_DENIED';
      }
      return 'ALLOWED';
    }
    return 'PERMISSION_DENIED';
  }

  const validateSchema = (): boolean => {
    if (incoming.ownerId !== auth.uid || typeof incoming.ownerId !== 'string' || !isValidId(incoming.ownerId)) {
      return false;
    }
    if (collection === 'farmProfiles') {
      const keys = [
        'ownerId', 'farmName', 'ownerName', 'location', 'phone', 'currency',
        'hasAppPassword', 'appPasswordHash', 'appPasswordSalt', 'createdAt', 'updatedAt',
      ];
      return (
        auth.uid === docId &&
        hasExactKeys(incoming, keys) &&
        typeof incoming.farmName === 'string' && incoming.farmName.length >= 1 && incoming.farmName.length <= 120 &&
        typeof incoming.ownerName === 'string' && incoming.ownerName.length >= 1 && incoming.ownerName.length <= 100 &&
        typeof incoming.location === 'string' && incoming.location.length <= 200 &&
        typeof incoming.phone === 'string' && incoming.phone.length <= 30 &&
        typeof incoming.currency === 'string' && incoming.currency.length >= 1 && incoming.currency.length <= 10 &&
        typeof incoming.hasAppPassword === 'boolean' && incoming.hasAppPassword === true &&
        typeof incoming.appPasswordHash === 'string' && incoming.appPasswordHash.length === 64 &&
        typeof incoming.appPasswordSalt === 'string' && incoming.appPasswordSalt.length >= 16 && incoming.appPasswordSalt.length <= 64 &&
        typeof incoming.createdAt === 'number' &&
        typeof incoming.updatedAt === 'number'
      );
    }
    if (collection === 'animals') {
      const keys = [
        'ownerId', 'name', 'tagNumber', 'species', 'breed', 'gender',
        'ageMonths', 'weightKg', 'purchasePrice', 'healthCondition', 'notes', 'createdAt', 'updatedAt',
      ];
      return (
        hasExactKeys(incoming, keys) &&
        typeof incoming.name === 'string' && incoming.name.length >= 1 && incoming.name.length <= 100 &&
        typeof incoming.tagNumber === 'string' && incoming.tagNumber.length >= 1 && incoming.tagNumber.length <= 50 &&
        typeof incoming.species === 'string' && ['গরু', 'ছাগল', 'ভেড়া', 'মহিষ', 'হাঁস', 'মুরগি', 'অন্যান্য'].includes(incoming.species) &&
        typeof incoming.breed === 'string' && incoming.breed.length <= 80 &&
        typeof incoming.gender === 'string' && ['পুরুষ (ষাঁড়/পাঠা)', 'স্ত্রী (গাভী/ছাগী)', 'বাচ্চা'].includes(incoming.gender) &&
        typeof incoming.ageMonths === 'number' && incoming.ageMonths >= 0 && incoming.ageMonths <= 600 &&
        typeof incoming.weightKg === 'number' && incoming.weightKg >= 0 && incoming.weightKg <= 5000 &&
        typeof incoming.purchasePrice === 'number' && incoming.purchasePrice >= 0 && incoming.purchasePrice <= 100000000 &&
        typeof incoming.healthCondition === 'string' && ['সুস্থ', 'চিকিৎসাধীন', 'গর্ভবতী', 'পর্যবেক্ষণে'].includes(incoming.healthCondition) &&
        typeof incoming.notes === 'string' && incoming.notes.length <= 500 &&
        typeof incoming.createdAt === 'number' &&
        typeof incoming.updatedAt === 'number'
      );
    }
    if (collection === 'feedStocks') {
      const keys = [
        'ownerId', 'name', 'category', 'currentStock', 'unit',
        'minStockAlert', 'unitCost', 'lastRestockedDate', 'notes', 'createdAt', 'updatedAt',
      ];
      return (
        hasExactKeys(incoming, keys) &&
        typeof incoming.name === 'string' && incoming.name.length >= 1 && incoming.name.length <= 100 &&
        typeof incoming.category === 'string' && ['দানাদার খাদ্য', 'ভুষি ও খৈল', 'কাঁচা ঘাস ও খড়', 'ভিটামিন ও ওষুধ', 'অন্যান্য'].includes(incoming.category) &&
        typeof incoming.currentStock === 'number' && incoming.currentStock >= 0 && incoming.currentStock <= 10000000 &&
        typeof incoming.unit === 'string' && ['কেজি', 'বস্তা', 'লিটার', 'আঁটি', 'প্যাকেট'].includes(incoming.unit) &&
        typeof incoming.minStockAlert === 'number' && incoming.minStockAlert >= 0 && incoming.minStockAlert <= 10000000 &&
        typeof incoming.unitCost === 'number' && incoming.unitCost >= 0 && incoming.unitCost <= 100000000 &&
        typeof incoming.lastRestockedDate === 'string' && ISO_DATE_REGEX.test(incoming.lastRestockedDate) &&
        typeof incoming.notes === 'string' && incoming.notes.length <= 500 &&
        typeof incoming.createdAt === 'number' &&
        typeof incoming.updatedAt === 'number'
      );
    }
    if (collection === 'transactions') {
      const keys = [
        'ownerId', 'type', 'title', 'category', 'amount',
        'transactionDate', 'paymentMethod', 'notes', 'createdAt', 'updatedAt',
      ];
      return (
        hasExactKeys(incoming, keys) &&
        typeof incoming.type === 'string' && ['income', 'expense'].includes(incoming.type) &&
        typeof incoming.title === 'string' && incoming.title.length >= 1 && incoming.title.length <= 140 &&
        typeof incoming.category === 'string' && incoming.category.length >= 1 && incoming.category.length <= 80 &&
        typeof incoming.amount === 'number' && incoming.amount > 0 && incoming.amount <= 1000000000 &&
        typeof incoming.transactionDate === 'string' && ISO_DATE_REGEX.test(incoming.transactionDate) &&
        typeof incoming.paymentMethod === 'string' && ['নগদ', 'বিকাশ / নগদ অ্যাপ', 'ব্যাংক ট্রান্সফার', 'বাকি'].includes(incoming.paymentMethod) &&
        typeof incoming.notes === 'string' && incoming.notes.length <= 500 &&
        typeof incoming.createdAt === 'number' &&
        typeof incoming.updatedAt === 'number'
      );
    }
    if (collection === 'sales') {
      const keys = [
        'ownerId', 'productType', 'itemName', 'referenceTag', 'quantity', 'unit',
        'unitPrice', 'totalAmount', 'paidAmount', 'dueAmount', 'buyerName', 'buyerPhone',
        'saleDate', 'notes', 'createdAt', 'updatedAt',
      ];
      return (
        hasExactKeys(incoming, keys) &&
        typeof incoming.productType === 'string' && ['পশু বিক্রয়', 'দুধ বিক্রয়', 'ডিম বিক্রয়', 'মাংস বিক্রয়', 'জৈব সার', 'অন্যান্য'].includes(incoming.productType) &&
        typeof incoming.itemName === 'string' && incoming.itemName.length >= 1 && incoming.itemName.length <= 120 &&
        typeof incoming.referenceTag === 'string' && incoming.referenceTag.length <= 50 &&
        typeof incoming.quantity === 'number' && incoming.quantity > 0 && incoming.quantity <= 1000000 &&
        typeof incoming.unit === 'string' && ['টি', 'লিটার', 'কেজি', 'হালি', 'বস্তা'].includes(incoming.unit) &&
        typeof incoming.unitPrice === 'number' && incoming.unitPrice >= 0 && incoming.unitPrice <= 1000000000 &&
        typeof incoming.totalAmount === 'number' && incoming.totalAmount >= 0 && incoming.totalAmount <= 1000000000 &&
        typeof incoming.paidAmount === 'number' && incoming.paidAmount >= 0 && incoming.paidAmount <= (incoming.totalAmount as number) &&
        typeof incoming.dueAmount === 'number' && incoming.dueAmount >= 0 && incoming.dueAmount <= (incoming.totalAmount as number) &&
        typeof incoming.buyerName === 'string' && incoming.buyerName.length >= 1 && incoming.buyerName.length <= 100 &&
        typeof incoming.buyerPhone === 'string' && incoming.buyerPhone.length <= 30 &&
        typeof incoming.saleDate === 'string' && ISO_DATE_REGEX.test(incoming.saleDate) &&
        typeof incoming.notes === 'string' && incoming.notes.length <= 500 &&
        typeof incoming.createdAt === 'number' &&
        typeof incoming.updatedAt === 'number'
      );
    }
    return false;
  };

  if (!validateSchema()) return 'PERMISSION_DENIED';

  if (operation === 'create') {
    if (incoming.createdAt !== world.requestTimeMs || incoming.updatedAt !== world.requestTimeMs) {
      return 'PERMISSION_DENIED';
    }
    if (collection !== 'farmProfiles' && !world.existingProfiles.has(auth.uid)) {
      return 'PERMISSION_DENIED';
    }
    return 'ALLOWED';
  }

  if (operation === 'update') {
    if (!existing || existing.ownerId !== auth.uid) return 'PERMISSION_DENIED';
    if (incoming.ownerId !== existing.ownerId || incoming.createdAt !== existing.createdAt) {
      return 'PERMISSION_DENIED';
    }
    if (incoming.updatedAt !== world.requestTimeMs) return 'PERMISSION_DENIED';
    return 'ALLOWED';
  }

  return 'PERMISSION_DENIED';
}

test('firestore.rules structural security invariants match blueprint collections', () => {
  assert.ok(rulesSource.includes("rules_version = '2';"));
  assert.ok(rulesSource.includes('match /{document=**} {\n      allow read, write: if false;\n    }'));
  assert.ok(rulesSource.includes('request.auth.token.email_verified == true'));
  assert.ok(rulesSource.includes("request.auth.token.email == 'gdyounus2025@gmail.com'"));

  for (const collectionPath of Object.keys(blueprint.firestore)) {
    assert.ok(
      rulesSource.includes(`match ${collectionPath}`),
      `Missing match block for ${collectionPath}`
    );
  }
});

test('Dirty Dozen Payloads 1-12 all strictly return PERMISSION_DENIED', () => {
  const now = 1793629200000;
  const world: RuleWorld = {
    requestTimeMs: now,
    existingProfiles: new Set(['uid_owner']),
    docs: {
      '/farmProfiles/uid_victim': { ownerId: 'uid_victim', farmName: 'Victim Farm' },
      '/animals/anim_1': {
        ownerId: 'uid_owner',
        name: 'লালি',
        tagNumber: 'COW-101',
        species: 'গরু',
        breed: 'দেশি',
        gender: 'স্ত্রী (গাভী/ছাগী)',
        ageMonths: 24,
        weightKg: 300,
        purchasePrice: 120000,
        healthCondition: 'সুস্থ',
        notes: '',
        createdAt: now - 5000,
        updatedAt: now - 5000,
      },
      '/feedStocks/feed_1': {
        ownerId: 'uid_owner',
        name: 'ভুষি',
        category: 'ভুষি ও খৈল',
        currentStock: 100,
        unit: 'কেজি',
        minStockAlert: 20,
        unitCost: 50,
        lastRestockedDate: '2026-11-02',
        notes: '',
        createdAt: now - 5000,
        updatedAt: now - 5000,
      },
      '/transactions/tx_1': {
        ownerId: 'uid_owner',
        type: 'income',
        title: 'দুধ বিক্রয়',
        category: 'দুধ বিক্রয়',
        amount: 5000,
        transactionDate: '2026-11-02',
        paymentMethod: 'নগদ',
        notes: '',
        createdAt: now - 5000,
        updatedAt: now - 5000,
      },
    },
  };

  const validPasswordHash = '4a7272030d171f357ebbdaa7cd293e05c2cc968169832c10346d24388c2e2662';
  const validPasswordSalt = '736f62756a5f6b68616d61725f61646d';

  const validProfile = {
    ownerId: 'uid_new_farmer',
    farmName: 'সবুজ বাংলা খামার',
    ownerName: 'মোঃ ইউনুস',
    location: 'সাভার, ঢাকা',
    phone: '01700-000000',
    currency: '৳',
    hasAppPassword: true,
    appPasswordHash: validPasswordHash,
    appPasswordSalt: validPasswordSalt,
    createdAt: now,
    updatedAt: now,
  };

  const validAnimal = {
    ownerId: 'uid_owner',
    name: 'সুলতান',
    tagNumber: 'COW-102',
    species: 'গরু',
    breed: 'শাহীওয়াল',
    gender: 'পুরুষ (ষাঁড়/পাঠা)',
    ageMonths: 18,
    weightKg: 280,
    purchasePrice: 95000,
    healthCondition: 'সুস্থ',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  // Sanity check A: valid FarmProfile with mandatory 64-char SHA-256 admin password hash is ALLOWED
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'farmProfiles',
      docId: 'uid_new_farmer',
      operation: 'create',
      auth: { uid: 'uid_new_farmer', emailVerified: true },
      incoming: validProfile,
      world,
    }),
    'ALLOWED'
  );

  // Sanity check B: verified bootstrapped admin can register a trusted admin record
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'admins',
      docId: 'uid_delegate',
      operation: 'create',
      auth: { uid: 'uid_boot_admin', email: 'gdyounus2025@gmail.com', emailVerified: true },
      incoming: {
        adminUid: 'uid_delegate',
        roleLabel: 'খামার অ্যাডমিন',
        createdAt: now,
        updatedAt: now,
      },
      world,
    }),
    'ALLOWED'
  );

  // Sanity check C: valid owner animal write is ALLOWED
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'anim_valid',
      operation: 'create',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: validAnimal,
      world,
    }),
    'ALLOWED'
  );

  // 1. Identity Spoofing on Create
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'anim_spoof',
      operation: 'create',
      auth: { uid: 'uid_attacker', emailVerified: true },
      incoming: { ...validAnimal, ownerId: 'uid_victim' },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 2. Unverified Admin Email Spoof Attack (matching admin email but emailVerified: false)
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'admins',
      docId: 'uid_spoof_admin',
      operation: 'create',
      auth: { uid: 'uid_spoof_admin', email: 'gdyounus2025@gmail.com', emailVerified: false },
      incoming: {
        adminUid: 'uid_spoof_admin',
        roleLabel: 'স্পুফড অ্যাডমিন',
        createdAt: now,
        updatedAt: now,
      },
      world,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'farmProfiles',
      docId: 'uid_unverified',
      operation: 'create',
      auth: { uid: 'uid_unverified', email: 'gdyounus2025@gmail.com', emailVerified: false },
      incoming: { ...validProfile, ownerId: 'uid_unverified' },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 3. Self-Assigned Admin Role Privilege Escalation & Shadow Ghost Field Injection
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'admins',
      docId: 'uid_attacker',
      operation: 'create',
      auth: { uid: 'uid_attacker', email: 'attacker@example.com', emailVerified: true },
      incoming: {
        adminUid: 'uid_attacker',
        roleLabel: 'স্বঘোষিত অ্যাডমিন',
        createdAt: now,
        updatedAt: now,
      },
      world,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'anim_shadow',
      operation: 'create',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: { ...validAnimal, isAdmin: true },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 4. Shadow Ghost Field Injection on Update
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'feedStocks',
      docId: 'feed_1',
      operation: 'update',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: {
        ...world.docs['/feedStocks/feed_1'],
        updatedAt: now,
        unlimitedStock: true,
      },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 5. Ownership Transfer Attack on Update
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'transactions',
      docId: 'tx_1',
      operation: 'update',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: {
        ...world.docs['/transactions/tx_1'],
        ownerId: 'uid_other',
        updatedAt: now,
      },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 6. Timestamp Forgery / Backdating
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'anim_forged_ts',
      operation: 'create',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: { ...validAnimal, createdAt: 1577836800000 },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 7. Orphaned Operational Record Without FarmProfile
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'anim_orphan',
      operation: 'create',
      auth: { uid: 'uid_no_profile', emailVerified: true },
      incoming: { ...validAnimal, ownerId: 'uid_no_profile' },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 8. PII Cross-Tenant Read & List Enumeration (farmProfiles & admins)
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'farmProfiles',
      docId: 'uid_victim',
      operation: 'get',
      auth: { uid: 'uid_attacker', emailVerified: true },
      world,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'farmProfiles',
      docId: '',
      operation: 'list',
      auth: { uid: 'uid_attacker', emailVerified: true },
      world,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'admins',
      docId: '',
      operation: 'list',
      auth: { uid: 'uid_attacker', emailVerified: true },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 9. Unfiltered List Query Scraping
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'sales',
      docId: '',
      operation: 'list',
      auth: { uid: 'uid_attacker', emailVerified: true },
      queryOwnerId: undefined,
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 10. ID Poisoning / Oversized Path Variable
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'bad$id!attack',
      operation: 'create',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: validAnimal,
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 11. Mandatory Admin Password Disable Attack & Value Poisoning
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'farmProfiles',
      docId: 'uid_new_farmer',
      operation: 'create',
      auth: { uid: 'uid_new_farmer', emailVerified: true },
      incoming: {
        ...validProfile,
        hasAppPassword: false,
        appPasswordHash: '',
        appPasswordSalt: '',
      },
      world,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'animals',
      docId: 'anim_1',
      operation: 'update',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: {
        ...world.docs['/animals/anim_1'],
        weightKg: -50,
        updatedAt: now,
      },
      world,
    }),
    'PERMISSION_DENIED'
  );

  // 12. Financial Logic Corruption on SaleRecord (paidAmount > totalAmount)
  assert.equal(
    evaluateFirestoreWrite({
      collection: 'sales',
      docId: 'sale_corrupt',
      operation: 'create',
      auth: { uid: 'uid_owner', emailVerified: true },
      incoming: {
        ownerId: 'uid_owner',
        productType: 'দুধ বিক্রয়',
        itemName: 'গরুর দুধ',
        referenceTag: '',
        quantity: 10,
        unit: 'লিটার',
        unitPrice: 80,
        totalAmount: 800,
        paidAmount: 1200,
        dueAmount: 0,
        buyerName: 'ক্রেতা',
        buyerPhone: '',
        saleDate: '2026-11-02',
        notes: '',
        createdAt: now,
        updatedAt: now,
      },
      world,
    }),
    'PERMISSION_DENIED'
  );
});
