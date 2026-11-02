import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../lib/firebase';
import {
  Animal,
  AnimalInput,
  BulkCollectionKey,
  DashboardSummary,
  FarmProfile,
  FarmProfileUpdateInput,
  FeedStock,
  FeedStockInput,
  OperationType,
  SaleRecord,
  SaleRecordInput,
  Transaction,
  TransactionInput,
} from '../types/farm';
import {
  adjustFeedStockQuantity,
  calculateDashboardSummary,
  createDefaultFarmProfile,
  createInitialSeedData,
  DEFAULT_ADMIN_HASH,
  DEFAULT_ADMIN_SALT,
  generateSafeId,
  generateSaltHex,
  getTodayIsoDate,
  hashPasswordSha256,
  isDefaultAdminPasswordProfile,
  sanitizeAnimalInput,
  sanitizeFeedStockInput,
  sanitizeSaleRecordInput,
  sanitizeTransactionInput,
  validateAnimalInput,
  validateFarmProfileInput,
  validateFeedStockInput,
  validateSaleRecordInput,
  validateTransactionInput,
  verifyPasswordSha256,
} from '../utils/farmLogic';

const DEMO_STORAGE_KEY = 'sobuj_khamar_demo_v1';
const ADMIN_SESSION_HASH_KEY = 'sobuj_khamar_admin_session_hash';

interface DemoStoreShape {
  profile: FarmProfile;
  animals: Animal[];
  feedStocks: FeedStock[];
  transactions: Transaction[];
  sales: SaleRecord[];
}

function toIsoTimestamp(val: unknown): string {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' && val.length > 0) {
    return val;
  }
  return new Date().toISOString();
}

function loadDemoStore(): DemoStoreShape {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoStoreShape;
      if (parsed && parsed.profile && Array.isArray(parsed.animals)) {
        const hasValidHash =
          parsed.profile.hasAppPassword === true &&
          typeof parsed.profile.appPasswordHash === 'string' &&
          parsed.profile.appPasswordHash.length === 64 &&
          typeof parsed.profile.appPasswordSalt === 'string' &&
          parsed.profile.appPasswordSalt.length >= 16;

        return {
          ...parsed,
          profile: hasValidHash
            ? parsed.profile
            : {
                ...parsed.profile,
                hasAppPassword: true,
                appPasswordHash: DEFAULT_ADMIN_HASH,
                appPasswordSalt: DEFAULT_ADMIN_SALT,
              },
        };
      }
    }
  } catch {
    // fallback to fresh seed
  }
  const ownerId = 'demo_farmer';
  const profile = createDefaultFarmProfile(ownerId, 'আব্দুর রহমান');
  const seed = createInitialSeedData(ownerId);
  return {
    profile,
    ...seed,
  };
}

function loadInitialSessionHash(): string {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_HASH_KEY) || '';
  } catch {
    return '';
  }
}

interface FarmContextValue {
  user: User | null;
  isAuthReady: boolean;
  isDataLoading: boolean;
  isDemoMode: boolean;
  isAdminUnlocked: boolean;
  isDefaultPassword: boolean;
  profile: FarmProfile;
  animals: Animal[];
  feedStocks: FeedStock[];
  transactions: Transaction[];
  sales: SaleRecord[];
  summary: DashboardSummary;
  toastMessage: { text: string; tone: 'success' | 'error' } | null;
  clearToast: () => void;
  showToast: (text: string, tone?: 'success' | 'error') => void;

  // Cloud Account Connection
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  resendVerificationEmail: () => Promise<{ ok: boolean; error?: string }>;
  refreshAuthUser: () => Promise<void>;
  logout: () => Promise<void>;

  // Mandatory Admin Gate & Password Control
  loginAdminWithPassword: (password: string) => Promise<{ ok: boolean; error?: string }>;
  lockWorkspace: () => void;
  updateAppLockPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  changeFirebasePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; error?: string; code?: string }>;

  // Profile, Master Admin Controls & Seed
  saveFarmProfile: (input: FarmProfileUpdateInput) => Promise<{ ok: boolean; error?: string }>;
  seedCloudData: () => Promise<{ ok: boolean; error?: string }>;
  resetOrSeedSampleData: () => Promise<{ ok: boolean; error?: string }>;
  clearModuleRecords: (target: BulkCollectionKey) => Promise<{ ok: boolean; error?: string }>;

  // Animals CRUD
  addAnimal: (input: AnimalInput) => Promise<{ ok: boolean; error?: string }>;
  updateAnimal: (id: string, input: AnimalInput) => Promise<{ ok: boolean; error?: string }>;
  deleteAnimal: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Feed Stock CRUD
  addFeedStock: (input: FeedStockInput) => Promise<{ ok: boolean; error?: string }>;
  updateFeedStock: (id: string, input: FeedStockInput) => Promise<{ ok: boolean; error?: string }>;
  adjustFeedStock: (
    id: string,
    delta: number,
    recordExpense?: boolean,
    paymentMethod?: Transaction['paymentMethod']
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteFeedStock: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Transactions CRUD
  addTransaction: (input: TransactionInput) => Promise<{ ok: boolean; error?: string }>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<{ ok: boolean; error?: string }>;
  deleteTransaction: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Sales CRUD
  addSaleRecord: (
    input: SaleRecordInput,
    options?: { autoRecordIncome?: boolean; paymentMethod?: Transaction['paymentMethod'] }
  ) => Promise<{ ok: boolean; error?: string }>;
  updateSaleRecord: (id: string, input: SaleRecordInput) => Promise<{ ok: boolean; error?: string }>;
  collectSaleDue: (
    id: string,
    amountReceived: number,
    recordIncome: boolean,
    paymentMethod: Transaction['paymentMethod']
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteSaleRecord: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [unlockedSessionHash, setUnlockedSessionHash] = useState<string>(() => loadInitialSessionHash());

  const [demoStore, setDemoStore] = useState<DemoStoreShape>(() => loadDemoStore());
  const demoStoreRef = useRef<DemoStoreShape>(demoStore);
  useEffect(() => {
    demoStoreRef.current = demoStore;
  }, [demoStore]);

  const [cloudProfile, setCloudProfile] = useState<FarmProfile>(() =>
    createDefaultFarmProfile('pending')
  );
  const [cloudAnimals, setCloudAnimals] = useState<Animal[]>([]);
  const [cloudFeedStocks, setCloudFeedStocks] = useState<FeedStock[]>([]);
  const [cloudTransactions, setCloudTransactions] = useState<Transaction[]>([]);
  const [cloudSales, setCloudSales] = useState<SaleRecord[]>([]);

  const [toastMessage, setToastMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  const showToast = useCallback((text: string, tone: 'success' | 'error' = 'success') => {
    setToastMessage({ text, tone });
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const persistSessionHash = useCallback((hash: string) => {
    setUnlockedSessionHash(hash);
    try {
      if (hash) {
        sessionStorage.setItem(ADMIN_SESSION_HASH_KEY, hash);
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_HASH_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Persist local farm store & custom admin password hash across reloads
  useEffect(() => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoStore));
    } catch {
      // ignore storage quota errors
    }
  }, [demoStore]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setIsDemoMode(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Cloud Firestore synchronization once user is authenticated and verified
  useEffect(() => {
    if (!isAuthReady || !user || !user.emailVerified) {
      setCloudAnimals([]);
      setCloudFeedStocks([]);
      setCloudTransactions([]);
      setCloudSales([]);
      setIsDataLoading(false);
      return;
    }

    let cancelled = false;
    const unsubscribers: Array<() => void> = [];
    setIsDataLoading(true);

    async function bootstrapAndSubscribe(currentUser: User) {
      const uid = currentUser.uid;
      const profileRef = doc(db, 'farmProfiles', uid);
      const localProfile = demoStoreRef.current.profile;
      const fallbackHash =
        localProfile.appPasswordHash?.length === 64 ? localProfile.appPasswordHash : DEFAULT_ADMIN_HASH;
      const fallbackSalt =
        localProfile.appPasswordSalt?.length >= 16 ? localProfile.appPasswordSalt : DEFAULT_ADMIN_SALT;

      try {
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          const initialName = (currentUser.displayName || currentUser.email?.split('@')[0] || 'খামার পরিচালক')
            .trim()
            .slice(0, 100);
          await setDoc(profileRef, {
            ownerId: uid,
            farmName: localProfile.farmName || 'সবুজ অ্যাগ্রো ও ডেইরি খামার',
            ownerName: initialName || 'খামার পরিচালক',
            location: localProfile.location || '',
            phone: localProfile.phone || '',
            currency: localProfile.currency || '৳',
            hasAppPassword: true,
            appPasswordHash: fallbackHash,
            appPasswordSalt: fallbackSalt,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const existingData = snap.data();
          const hasValidCloudHash =
            existingData.hasAppPassword === true &&
            typeof existingData.appPasswordHash === 'string' &&
            existingData.appPasswordHash.length === 64 &&
            typeof existingData.appPasswordSalt === 'string' &&
            existingData.appPasswordSalt.length >= 16;

          if (!hasValidCloudHash) {
            await updateDoc(profileRef, {
              hasAppPassword: true,
              appPasswordHash: fallbackHash,
              appPasswordSalt: fallbackSalt,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (error) {
        if (!cancelled) setIsDataLoading(false);
        handleFirestoreError(error, OperationType.WRITE, `farmProfiles/${uid}`);
      }

      if (cancelled) return;

      // 1. Farm Profile listener
      unsubscribers.push(
        onSnapshot(
          profileRef,
          (snap) => {
            if (snap.exists()) {
              const d = snap.data();
              const cloudHash =
                typeof d.appPasswordHash === 'string' && d.appPasswordHash.length === 64
                  ? d.appPasswordHash
                  : DEFAULT_ADMIN_HASH;
              const cloudSalt =
                typeof d.appPasswordSalt === 'string' && d.appPasswordSalt.length >= 16
                  ? d.appPasswordSalt
                  : DEFAULT_ADMIN_SALT;
              setCloudProfile({
                id: snap.id,
                ownerId: String(d.ownerId || uid),
                farmName: String(d.farmName || 'সবুজ অ্যাগ্রো ও ডেইরি খামার'),
                ownerName: String(d.ownerName || 'খামার পরিচালক'),
                location: String(d.location || ''),
                phone: String(d.phone || ''),
                currency: String(d.currency || '৳'),
                hasAppPassword: true,
                appPasswordHash: cloudHash,
                appPasswordSalt: cloudSalt,
                createdAt: toIsoTimestamp(d.createdAt),
                updatedAt: toIsoTimestamp(d.updatedAt),
              });
            }
          },
          (error) => handleFirestoreError(error, OperationType.GET, `farmProfiles/${uid}`)
        )
      );

      // 2. Animals listener
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'animals'), where('ownerId', '==', uid)),
          (snap) => {
            const list: Animal[] = snap.docs.map((item) => {
              const d = item.data();
              return {
                id: item.id,
                ownerId: String(d.ownerId),
                name: String(d.name),
                tagNumber: String(d.tagNumber),
                species: d.species,
                breed: String(d.breed || ''),
                gender: d.gender,
                ageMonths: Number(d.ageMonths) || 0,
                weightKg: Number(d.weightKg) || 0,
                purchasePrice: Number(d.purchasePrice) || 0,
                healthCondition: d.healthCondition,
                notes: String(d.notes || ''),
                createdAt: toIsoTimestamp(d.createdAt),
                updatedAt: toIsoTimestamp(d.updatedAt),
              };
            });
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setCloudAnimals(list);
            setIsDataLoading(false);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'animals')
        )
      );

      // 3. FeedStock listener
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'feedStocks'), where('ownerId', '==', uid)),
          (snap) => {
            const list: FeedStock[] = snap.docs.map((item) => {
              const d = item.data();
              return {
                id: item.id,
                ownerId: String(d.ownerId),
                name: String(d.name),
                category: d.category,
                currentStock: Number(d.currentStock) || 0,
                unit: d.unit,
                minStockAlert: Number(d.minStockAlert) || 0,
                unitCost: Number(d.unitCost) || 0,
                lastRestockedDate: String(d.lastRestockedDate),
                notes: String(d.notes || ''),
                createdAt: toIsoTimestamp(d.createdAt),
                updatedAt: toIsoTimestamp(d.updatedAt),
              };
            });
            list.sort((a, b) => a.name.localeCompare(b.name));
            setCloudFeedStocks(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'feedStocks')
        )
      );

      // 4. Transactions listener
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'transactions'), where('ownerId', '==', uid)),
          (snap) => {
            const list: Transaction[] = snap.docs.map((item) => {
              const d = item.data();
              return {
                id: item.id,
                ownerId: String(d.ownerId),
                type: d.type,
                title: String(d.title),
                category: String(d.category),
                amount: Number(d.amount) || 0,
                transactionDate: String(d.transactionDate),
                paymentMethod: d.paymentMethod,
                notes: String(d.notes || ''),
                createdAt: toIsoTimestamp(d.createdAt),
                updatedAt: toIsoTimestamp(d.updatedAt),
              };
            });
            list.sort(
              (a, b) =>
                b.transactionDate.localeCompare(a.transactionDate) ||
                b.createdAt.localeCompare(a.createdAt)
            );
            setCloudTransactions(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'transactions')
        )
      );

      // 5. Sales listener
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'sales'), where('ownerId', '==', uid)),
          (snap) => {
            const list: SaleRecord[] = snap.docs.map((item) => {
              const d = item.data();
              return {
                id: item.id,
                ownerId: String(d.ownerId),
                productType: d.productType,
                itemName: String(d.itemName),
                referenceTag: String(d.referenceTag || ''),
                quantity: Number(d.quantity) || 0,
                unit: d.unit,
                unitPrice: Number(d.unitPrice) || 0,
                totalAmount: Number(d.totalAmount) || 0,
                paidAmount: Number(d.paidAmount) || 0,
                dueAmount: Number(d.dueAmount) || 0,
                buyerName: String(d.buyerName),
                buyerPhone: String(d.buyerPhone || ''),
                saleDate: String(d.saleDate),
                notes: String(d.notes || ''),
                createdAt: toIsoTimestamp(d.createdAt),
                updatedAt: toIsoTimestamp(d.updatedAt),
              };
            });
            list.sort(
              (a, b) =>
                b.saleDate.localeCompare(a.saleDate) ||
                b.createdAt.localeCompare(a.createdAt)
            );
            setCloudSales(list);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'sales')
        )
      );
    }

    void bootstrapAndSubscribe(user);

    return () => {
      cancelled = true;
      unsubscribers.forEach((fn) => fn());
    };
  }, [isAuthReady, user]);

  const activeProfile = user ? cloudProfile : demoStore.profile;
  const activeAnimals = user ? cloudAnimals : demoStore.animals;
  const activeFeedStocks = user ? cloudFeedStocks : demoStore.feedStocks;
  const activeTransactions = user ? cloudTransactions : demoStore.transactions;
  const activeSales = user ? cloudSales : demoStore.sales;

  const isAdminUnlocked = Boolean(
    unlockedSessionHash &&
      activeProfile.appPasswordHash &&
      unlockedSessionHash === activeProfile.appPasswordHash
  );

  const isDefaultPassword = useMemo(
    () => isDefaultAdminPasswordProfile(activeProfile),
    [activeProfile]
  );

  const summary = useMemo(
    () =>
      calculateDashboardSummary(
        activeAnimals,
        activeFeedStocks,
        activeTransactions,
        activeSales
      ),
    [activeAnimals, activeFeedStocks, activeTransactions, activeSales]
  );

  // Auth Actions
  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('ক্লাউড অ্যাকাউন্টে সফলভাবে সংযুক্ত হয়েছেন।');
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'লগইন সম্পন্ন হয়নি।';
      return { ok: false, error: msg };
    }
  }, [showToast]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        showToast('লগইন সফল হয়েছে।');
        return { ok: true };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            code,
            error: 'Firebase Console থেকে Email/Password প্রোভাইডার চালু করা নেই। নিচের নির্দেশনা দেখুন অথবা Google দিয়ে লগইন করুন।',
          };
        }
        return {
          ok: false,
          code,
          error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।',
        };
      }
    },
    [showToast]
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim().slice(0, 100) });
        }
        await sendEmailVerification(cred.user);
        showToast('অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইলে পাঠানো ভেরিফিকেশন লিংকে ক্লিক করুন।');
        return { ok: true };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            code,
            error: 'Firebase Console থেকে Email/Password প্রোভাইডার চালু করা নেই। নিচের নির্দেশনা দেখুন অথবা Google দিয়ে লগইন করুন।',
          };
        }
        if (code === 'auth/email-already-in-use') {
          return { ok: false, code, error: 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে।' };
        }
        if (code === 'auth/weak-password') {
          return { ok: false, code, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
        }
        return { ok: false, code, error: 'অ্যাকাউন্ট তৈরি করা যায়নি। তথ্য যাচাই করুন।' };
      }
    },
    [showToast]
  );

  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return { ok: false, error: 'লগইন করা নেই।' };
    try {
      await sendEmailVerification(auth.currentUser);
      showToast('ভেরিফিকেশন ইমেইল পুনরায় পাঠানো হয়েছে।');
      return { ok: true };
    } catch {
      return { ok: false, error: 'কিছুক্ষণ পর আবার চেষ্টা করুন।' };
    }
  }, [showToast]);

  const refreshAuthUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser } as User);
    if (auth.currentUser.emailVerified) {
      showToast('ইমেইল ভেরিফিকেশন নিশ্চিত হয়েছে!');
    } else {
      showToast('ইমেইল এখনো ভেরিফাই হয়নি। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।', 'error');
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    persistSessionHash('');
    setIsDemoMode(false);
    if (user) {
      await signOut(auth);
      showToast('ক্লাউড অ্যাকাউন্ট থেকে লগআউট ও প্যানেল লক করা হয়েছে।');
    } else {
      showToast('খামার ও অ্যাডমিন প্যানেল লক করা হয়েছে।');
    }
  }, [persistSessionHash, user, showToast]);

  // Mandatory Admin Password Gate & Password Change
  const loginAdminWithPassword = useCallback(
    async (password: string) => {
      if (!password) {
        return { ok: false, error: 'অ্যাডমিন পাসওয়ার্ড লিখুন।' };
      }
      const valid = await verifyPasswordSha256(
        password,
        activeProfile.appPasswordSalt,
        activeProfile.appPasswordHash
      );
      if (!valid) {
        return { ok: false, error: 'পাসওয়ার্ড সঠিক নয়। সঠিক অ্যাডমিন পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।' };
      }
      persistSessionHash(activeProfile.appPasswordHash);
      if (!user) {
        setIsDemoMode(true);
      }
      showToast('অ্যাডমিন প্যানেল ও খামারে সফলভাবে প্রবেশ করেছেন।');
      return { ok: true };
    },
    [activeProfile.appPasswordHash, activeProfile.appPasswordSalt, persistSessionHash, user, showToast]
  );

  const lockWorkspace = useCallback(() => {
    persistSessionHash('');
    showToast('খামার ও অ্যাডমিন প্যানেল লক করা হয়েছে।');
  }, [persistSessionHash, showToast]);

  const updateAppLockPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!currentPassword) {
        return { ok: false, error: 'বর্তমান পাসওয়ার্ড লিখুন।' };
      }
      if (newPassword.trim().length < 4 || newPassword.trim().length > 64) {
        return { ok: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ থেকে ৬৪ অক্ষরের হতে হবে।' };
      }

      const matches = await verifyPasswordSha256(
        currentPassword,
        activeProfile.appPasswordSalt,
        activeProfile.appPasswordHash
      );
      if (!matches) {
        return { ok: false, error: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' };
      }

      const nextSalt = generateSaltHex(16);
      const nextHash = await hashPasswordSha256(newPassword, nextSalt);

      if (user) {
        const path = `farmProfiles/${user.uid}`;
        try {
          await updateDoc(doc(db, 'farmProfiles', user.uid), {
            hasAppPassword: true,
            appPasswordHash: nextHash,
            appPasswordSalt: nextSalt,
            updatedAt: serverTimestamp(),
          });
          setCloudProfile((prev) => ({
            ...prev,
            hasAppPassword: true,
            appPasswordHash: nextHash,
            appPasswordSalt: nextSalt,
            updatedAt: new Date().toISOString(),
          }));
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            hasAppPassword: true,
            appPasswordHash: nextHash,
            appPasswordSalt: nextSalt,
            updatedAt: new Date().toISOString(),
          },
        }));
      }

      persistSessionHash(nextHash);
      showToast('অ্যাডমিন পাসওয়ার্ড সফলভাবে আপনার মনমতো পরিবর্তন করা হয়েছে।');
      return { ok: true };
    },
    [activeProfile.appPasswordHash, activeProfile.appPasswordSalt, persistSessionHash, user, showToast]
  );

  const changeFirebasePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!auth.currentUser || !auth.currentUser.email) {
        return { ok: false, error: 'এই ফিচারের জন্য ক্লাউড ইমেইল অ্যাকাউন্টে লগইন থাকতে হবে।' };
      }
      if (newPassword.length < 6) {
        return { ok: false, error: 'অ্যাকাউন্ট পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
      }

      const hasPasswordProvider = auth.currentUser.providerData.some(
        (p) => p.providerId === 'password'
      );

      try {
        if (hasPasswordProvider) {
          const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, cred);
          await updatePassword(auth.currentUser, newPassword);
          showToast('অ্যাকাউন্ট লগইন পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।');
          return { ok: true };
        } else {
          const cred = EmailAuthProvider.credential(auth.currentUser.email, newPassword);
          await linkWithCredential(auth.currentUser, cred);
          showToast('আপনার Google অ্যাকাউন্টের সাথে ইমেইল পাসওয়ার্ড যুক্ত করা হয়েছে।');
          return { ok: true };
        }
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          return {
            ok: false,
            code,
            error: 'Firebase Console-এ Email/Password প্রোভাইডার চালু নেই। উপরের খামার নিরাপত্তা পাসওয়ার্ড ব্যবহার করুন অথবা কনসোল থেকে সক্রিয় করুন।',
          };
        }
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          return { ok: false, code, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' };
        }
        if (code === 'auth/requires-recent-login') {
          return { ok: false, code, error: 'নিরাপত্তার স্বার্থে একবার লগআউট করে পুনরায় লগইন করে চেষ্টা করুন।' };
        }
        return { ok: false, code, error: 'পাসওয়ার্ড পরিবর্তন সম্পন্ন হয়নি।' };
      }
    },
    [showToast]
  );

  // Farm Profile Update
  const saveFarmProfile = useCallback(
    async (input: FarmProfileUpdateInput) => {
      const validationError = validateFarmProfileInput(input);
      if (validationError) return { ok: false, error: validationError };

      const payload = {
        farmName: input.farmName.trim().slice(0, 120),
        ownerName: input.ownerName.trim().slice(0, 100),
        location: input.location.trim().slice(0, 200),
        phone: input.phone.trim().slice(0, 30),
        currency: input.currency.trim().slice(0, 10),
      };

      if (user) {
        const path = `farmProfiles/${user.uid}`;
        try {
          await updateDoc(doc(db, 'farmProfiles', user.uid), {
            ...payload,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            ...payload,
            updatedAt: new Date().toISOString(),
          },
        }));
      }

      showToast('খামারের প্রোফাইল তথ্য সংরক্ষিত হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  // Seed Sample Data into Cloud Firestore
  const seedCloudData = useCallback(async () => {
    if (!user) return { ok: false, error: 'ক্লাউডে লগইন করা নেই।' };
    const seed = createInitialSeedData(user.uid);
    const batch = writeBatch(db);

    for (const a of seed.animals) {
      const ref = doc(db, 'animals', generateSafeId('anim'));
      batch.set(ref, {
        ownerId: user.uid,
        name: a.name,
        tagNumber: a.tagNumber,
        species: a.species,
        breed: a.breed,
        gender: a.gender,
        ageMonths: a.ageMonths,
        weightKg: a.weightKg,
        purchasePrice: a.purchasePrice,
        healthCondition: a.healthCondition,
        notes: a.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const f of seed.feedStocks) {
      const ref = doc(db, 'feedStocks', generateSafeId('feed'));
      batch.set(ref, {
        ownerId: user.uid,
        name: f.name,
        category: f.category,
        currentStock: f.currentStock,
        unit: f.unit,
        minStockAlert: f.minStockAlert,
        unitCost: f.unitCost,
        lastRestockedDate: f.lastRestockedDate,
        notes: f.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const t of seed.transactions) {
      const ref = doc(db, 'transactions', generateSafeId('tx'));
      batch.set(ref, {
        ownerId: user.uid,
        type: t.type,
        title: t.title,
        category: t.category,
        amount: t.amount,
        transactionDate: t.transactionDate,
        paymentMethod: t.paymentMethod,
        notes: t.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const s of seed.sales) {
      const ref = doc(db, 'sales', generateSafeId('sale'));
      batch.set(ref, {
        ownerId: user.uid,
        productType: s.productType,
        itemName: s.itemName,
        referenceTag: s.referenceTag,
        quantity: s.quantity,
        unit: s.unit,
        unitPrice: s.unitPrice,
        totalAmount: s.totalAmount,
        paidAmount: s.paidAmount,
        dueAmount: s.dueAmount,
        buyerName: s.buyerName,
        buyerPhone: s.buyerPhone,
        saleDate: s.saleDate,
        notes: s.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    try {
      await batch.commit();
      showToast('নমুনা খামারের তথ্য ক্লাউডে সফলভাবে যুক্ত হয়েছে।');
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
    }
  }, [user, showToast]);

  const resetOrSeedSampleData = useCallback(async () => {
    if (user) {
      return seedCloudData();
    }
    setDemoStore((prev) => {
      const seed = createInitialSeedData(prev.profile.ownerId);
      return {
        profile: prev.profile,
        ...seed,
      };
    });
    showToast('নমুনা খামারের সকল তথ্য পুনরায় লোড করা হয়েছে।');
    return { ok: true };
  }, [seedCloudData, showToast, user]);

  const clearModuleRecords = useCallback(
    async (target: BulkCollectionKey) => {
      const labelMap: Record<BulkCollectionKey, string> = {
        animals: 'পশুর তালিকা',
        feedStocks: 'খাবারের স্টক',
        transactions: 'আয়-ব্যয় হিসাব',
        sales: 'বিক্রয় হিসাব',
      };

      if (user) {
        const itemsMap: Record<BulkCollectionKey, Array<{ id: string }>> = {
          animals: cloudAnimals,
          feedStocks: cloudFeedStocks,
          transactions: cloudTransactions,
          sales: cloudSales,
        };
        const list = itemsMap[target];
        if (list.length === 0) return { ok: true };

        const batch = writeBatch(db);
        for (const item of list) {
          batch.delete(doc(db, target, item.id));
        }
        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, target);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          [target]: [],
        }));
      }

      showToast(`${labelMap[target]} মডিউলের সকল তথ্য মুছে ফেলা হয়েছে।`);
      return { ok: true };
    },
    [cloudAnimals, cloudFeedStocks, cloudSales, cloudTransactions, showToast, user]
  );

  // Animals CRUD
  const addAnimal = useCallback(
    async (input: AnimalInput) => {
      const err = validateAnimalInput(input);
      if (err) return { ok: false, error: err };
      const clean = sanitizeAnimalInput(input);
      const id = generateSafeId('anim');

      if (user) {
        try {
          await setDoc(doc(db, 'animals', id), {
            ownerId: user.uid,
            ...clean,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `animals/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          animals: [
            { id, ownerId: prev.profile.ownerId, ...clean, createdAt: now, updatedAt: now },
            ...prev.animals,
          ],
        }));
      }

      showToast(`"${clean.name}" পশুর তালিকায় যুক্ত হয়েছে।`);
      return { ok: true };
    },
    [user, showToast]
  );

  const updateAnimal = useCallback(
    async (id: string, input: AnimalInput) => {
      const err = validateAnimalInput(input);
      if (err) return { ok: false, error: err };
      const clean = sanitizeAnimalInput(input);

      if (user) {
        try {
          await updateDoc(doc(db, 'animals', id), {
            ...clean,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `animals/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          animals: prev.animals.map((a) =>
            a.id === id ? { ...a, ...clean, updatedAt: now } : a
          ),
        }));
      }

      showToast(`"${clean.name}"-এর তথ্য আপডেট করা হয়েছে।`);
      return { ok: true };
    },
    [user, showToast]
  );

  const deleteAnimal = useCallback(
    async (id: string) => {
      if (user) {
        try {
          await deleteDoc(doc(db, 'animals', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `animals/${id}`);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          animals: prev.animals.filter((a) => a.id !== id),
        }));
      }
      showToast('পশুর তথ্য মুছে ফেলা হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  // Feed Stock CRUD
  const addFeedStock = useCallback(
    async (input: FeedStockInput) => {
      const err = validateFeedStockInput(input);
      if (err) return { ok: false, error: err };
      const clean = sanitizeFeedStockInput(input);
      const id = generateSafeId('feed');

      if (user) {
        try {
          await setDoc(doc(db, 'feedStocks', id), {
            ownerId: user.uid,
            ...clean,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `feedStocks/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          feedStocks: [
            { id, ownerId: prev.profile.ownerId, ...clean, createdAt: now, updatedAt: now },
            ...prev.feedStocks,
          ],
        }));
      }

      showToast(`"${clean.name}" খাবারের স্টকে যুক্ত হয়েছে।`);
      return { ok: true };
    },
    [user, showToast]
  );

  const updateFeedStock = useCallback(
    async (id: string, input: FeedStockInput) => {
      const err = validateFeedStockInput(input);
      if (err) return { ok: false, error: err };
      const clean = sanitizeFeedStockInput(input);

      if (user) {
        try {
          await updateDoc(doc(db, 'feedStocks', id), {
            ...clean,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `feedStocks/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          feedStocks: prev.feedStocks.map((f) =>
            f.id === id ? { ...f, ...clean, updatedAt: now } : f
          ),
        }));
      }

      showToast(`"${clean.name}" স্টকের তথ্য আপডেট হয়েছে।`);
      return { ok: true };
    },
    [user, showToast]
  );

  const adjustFeedStock = useCallback(
    async (
      id: string,
      delta: number,
      recordExpense = false,
      paymentMethod: Transaction['paymentMethod'] = 'নগদ'
    ) => {
      const target = activeFeedStocks.find((f) => f.id === id);
      if (!target) return { ok: false, error: 'খাবারের আইটেম পাওয়া যায়নি।' };

      const calc = adjustFeedStockQuantity(target.currentStock, delta);
      if (!calc.ok) return { ok: false, error: calc.error };

      const today = getTodayIsoDate();
      const nextDate = delta > 0 ? today : target.lastRestockedDate;
      const expenseCost = delta > 0 ? Math.round(delta * target.unitCost * 100) / 100 : 0;

      if (user) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'feedStocks', id), {
          currentStock: calc.nextStock,
          lastRestockedDate: nextDate,
          updatedAt: serverTimestamp(),
        });

        if (recordExpense && delta > 0 && expenseCost > 0) {
          const txId = generateSafeId('tx');
          batch.set(doc(db, 'transactions', txId), {
            ownerId: user.uid,
            type: 'expense',
            title: `${target.name} স্টক ক্রয় (${delta} ${target.unit})`,
            category: 'পশুখাদ্য ক্রয়',
            amount: expenseCost,
            transactionDate: today,
            paymentMethod,
            notes: 'খাবারের স্টক বৃদ্ধি থেকে স্বয়ংক্রিয়ভাবে যুক্ত।',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `feedStocks/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => {
          const updatedFeeds = prev.feedStocks.map((f) =>
            f.id === id
              ? { ...f, currentStock: calc.nextStock, lastRestockedDate: nextDate, updatedAt: now }
              : f
          );
          const nextTransactions =
            recordExpense && delta > 0 && expenseCost > 0
              ? [
                  {
                    id: generateSafeId('tx'),
                    ownerId: prev.profile.ownerId,
                    type: 'expense' as const,
                    title: `${target.name} স্টক ক্রয় (${delta} ${target.unit})`,
                    category: 'পশুখাদ্য ক্রয়',
                    amount: expenseCost,
                    transactionDate: today,
                    paymentMethod,
                    notes: 'খাবারের স্টক বৃদ্ধি থেকে স্বয়ংক্রিয়ভাবে যুক্ত।',
                    createdAt: now,
                    updatedAt: now,
                  },
                  ...prev.transactions,
                ]
              : prev.transactions;

          return {
            ...prev,
            feedStocks: updatedFeeds,
            transactions: nextTransactions,
          };
        });
      }

      showToast(
        delta > 0
          ? `${target.name}-এর স্টক বৃদ্ধি করা হয়েছে।`
          : `${target.name}-এর ব্যবহার নথিভুক্ত হয়েছে।`
      );
      return { ok: true };
    },
    [activeFeedStocks, user, showToast]
  );

  const deleteFeedStock = useCallback(
    async (id: string) => {
      if (user) {
        try {
          await deleteDoc(doc(db, 'feedStocks', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `feedStocks/${id}`);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          feedStocks: prev.feedStocks.filter((f) => f.id !== id),
        }));
      }
      showToast('খাবারের স্টক আইটেম মুছে ফেলা হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  // Transactions CRUD
  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      const err = validateTransactionInput(input);
      if (err) return { ok: false, error: err };
      const clean = sanitizeTransactionInput(input);
      const id = generateSafeId('tx');

      if (user) {
        try {
          await setDoc(doc(db, 'transactions', id), {
            ownerId: user.uid,
            ...clean,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `transactions/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          transactions: [
            { id, ownerId: prev.profile.ownerId, ...clean, createdAt: now, updatedAt: now },
            ...prev.transactions,
          ],
        }));
      }

      showToast(
        clean.type === 'income'
          ? 'আয়ের হিসাব সফলভাবে যুক্ত হয়েছে।'
          : 'ব্যয়ের হিসাব সফলভাবে যুক্ত হয়েছে।'
      );
      return { ok: true };
    },
    [user, showToast]
  );

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const err = validateTransactionInput(input);
      if (err) return { ok: false, error: err };
      const clean = sanitizeTransactionInput(input);

      if (user) {
        try {
          await updateDoc(doc(db, 'transactions', id), {
            ...clean,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === id ? { ...t, ...clean, updatedAt: now } : t
          ),
        }));
      }

      showToast('লেনদেনের হিসাব আপডেট করা হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (user) {
        try {
          await deleteDoc(doc(db, 'transactions', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        }));
      }
      showToast('লেনদেনের হিসাব মুছে ফেলা হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  // Sales CRUD
  const addSaleRecord = useCallback(
    async (
      input: SaleRecordInput,
      options?: { autoRecordIncome?: boolean; paymentMethod?: Transaction['paymentMethod'] }
    ) => {
      const clean = sanitizeSaleRecordInput(input);
      const err = validateSaleRecordInput(clean);
      if (err) return { ok: false, error: err };

      const saleId = generateSafeId('sale');
      const autoIncome = Boolean(options?.autoRecordIncome) && clean.paidAmount > 0;
      const paymentMethod = options?.paymentMethod || 'নগদ';

      if (user) {
        const batch = writeBatch(db);
        batch.set(doc(db, 'sales', saleId), {
          ownerId: user.uid,
          ...clean,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (autoIncome) {
          const txId = generateSafeId('tx');
          batch.set(doc(db, 'transactions', txId), {
            ownerId: user.uid,
            type: 'income',
            title: `${clean.itemName} বিক্রয় (${clean.buyerName})`,
            category: clean.productType === 'অন্যান্য' ? 'অন্যান্য আয়' : clean.productType,
            amount: clean.paidAmount,
            transactionDate: clean.saleDate,
            paymentMethod,
            notes: clean.dueAmount > 0 ? `আংশিক নগদ প্রাপ্তি, বকেয়া: ${clean.dueAmount}` : 'বিক্রয় খাতা থেকে স্বয়ংক্রিয়ভাবে যুক্ত।',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `sales/${saleId}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => {
          const newSale: SaleRecord = {
            id: saleId,
            ownerId: prev.profile.ownerId,
            ...clean,
            createdAt: now,
            updatedAt: now,
          };
          const nextTransactions = autoIncome
            ? [
                {
                  id: generateSafeId('tx'),
                  ownerId: prev.profile.ownerId,
                  type: 'income' as const,
                  title: `${clean.itemName} বিক্রয় (${clean.buyerName})`,
                  category: clean.productType === 'অন্যান্য' ? 'অন্যান্য আয়' : clean.productType,
                  amount: clean.paidAmount,
                  transactionDate: clean.saleDate,
                  paymentMethod,
                  notes:
                    clean.dueAmount > 0
                      ? `আংশিক নগদ প্রাপ্তি, বকেয়া: ${clean.dueAmount}`
                      : 'বিক্রয় খাতা থেকে স্বয়ংক্রিয়ভাবে যুক্ত।',
                  createdAt: now,
                  updatedAt: now,
                },
                ...prev.transactions,
              ]
            : prev.transactions;

          return {
            ...prev,
            sales: [newSale, ...prev.sales],
            transactions: nextTransactions,
          };
        });
      }

      showToast(
        autoIncome
          ? 'বিক্রয় ও আয়ের হিসাব সফলভাবে সংরক্ষিত হয়েছে।'
          : 'বিক্রয়ের তথ্য সফলভাবে সংরক্ষিত হয়েছে।'
      );
      return { ok: true };
    },
    [user, showToast]
  );

  const updateSaleRecord = useCallback(
    async (id: string, input: SaleRecordInput) => {
      const clean = sanitizeSaleRecordInput(input);
      const err = validateSaleRecordInput(clean);
      if (err) return { ok: false, error: err };

      if (user) {
        try {
          await updateDoc(doc(db, 'sales', id), {
            ...clean,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `sales/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          sales: prev.sales.map((s) =>
            s.id === id ? { ...s, ...clean, updatedAt: now } : s
          ),
        }));
      }

      showToast('বিক্রয়ের তথ্য আপডেট করা হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  const collectSaleDue = useCallback(
    async (
      id: string,
      amountReceived: number,
      recordIncome: boolean,
      paymentMethod: Transaction['paymentMethod']
    ) => {
      const sale = activeSales.find((s) => s.id === id);
      if (!sale) return { ok: false, error: 'বিক্রয়ের তথ্য পাওয়া যায়নি।' };
      if (!Number.isFinite(amountReceived) || amountReceived <= 0) {
        return { ok: false, error: 'আদায়কৃত টাকার পরিমাণ ০ এর বেশি হতে হবে।' };
      }
      if (amountReceived > sale.dueAmount) {
        return { ok: false, error: 'বকেয়া টাকার চেয়ে বেশি আদায় দেখানো যাবে না।' };
      }

      const nextPaid = Math.round((sale.paidAmount + amountReceived) * 100) / 100;
      const nextDue = Math.max(0, Math.round((sale.totalAmount - nextPaid) * 100) / 100);
      const today = getTodayIsoDate();

      if (user) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'sales', id), {
          paidAmount: nextPaid,
          dueAmount: nextDue,
          updatedAt: serverTimestamp(),
        });

        if (recordIncome) {
          const txId = generateSafeId('tx');
          batch.set(doc(db, 'transactions', txId), {
            ownerId: user.uid,
            type: 'income',
            title: `বকেয়া আদায়: ${sale.itemName} (${sale.buyerName})`,
            category: sale.productType === 'অন্যান্য' ? 'অন্যান্য আয়' : sale.productType,
            amount: amountReceived,
            transactionDate: today,
            paymentMethod,
            notes: 'বকেয়া বিক্রয় থেকে আদায়কৃত।',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        try {
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `sales/${id}`);
        }
      } else {
        const now = new Date().toISOString();
        setDemoStore((prev) => ({
          ...prev,
          sales: prev.sales.map((s) =>
            s.id === id ? { ...s, paidAmount: nextPaid, dueAmount: nextDue, updatedAt: now } : s
          ),
          transactions: recordIncome
            ? [
                {
                  id: generateSafeId('tx'),
                  ownerId: prev.profile.ownerId,
                  type: 'income',
                  title: `বকেয়া আদায়: ${sale.itemName} (${sale.buyerName})`,
                  category: sale.productType === 'অন্যান্য' ? 'অন্যান্য আয়' : sale.productType,
                  amount: amountReceived,
                  transactionDate: today,
                  paymentMethod,
                  notes: 'বকেয়া বিক্রয় থেকে আদায়কৃত।',
                  createdAt: now,
                  updatedAt: now,
                },
                ...prev.transactions,
              ]
            : prev.transactions,
        }));
      }

      showToast('বকেয়া টাকা সফলভাবে আদায় করা হয়েছে।');
      return { ok: true };
    },
    [activeSales, user, showToast]
  );

  const deleteSaleRecord = useCallback(
    async (id: string) => {
      if (user) {
        try {
          await deleteDoc(doc(db, 'sales', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
        }
      } else {
        setDemoStore((prev) => ({
          ...prev,
          sales: prev.sales.filter((s) => s.id !== id),
        }));
      }
      showToast('বিক্রয়ের তথ্য মুছে ফেলা হয়েছে।');
      return { ok: true };
    },
    [user, showToast]
  );

  const value = useMemo<FarmContextValue>(
    () => ({
      user,
      isAuthReady,
      isDataLoading,
      isDemoMode,
      isAdminUnlocked,
      isDefaultPassword,
      profile: activeProfile,
      animals: activeAnimals,
      feedStocks: activeFeedStocks,
      transactions: activeTransactions,
      sales: activeSales,
      summary,
      toastMessage,
      clearToast,
      showToast,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      resendVerificationEmail,
      refreshAuthUser,
      logout,
      loginAdminWithPassword,
      lockWorkspace,
      updateAppLockPassword,
      changeFirebasePassword,
      saveFarmProfile,
      seedCloudData,
      resetOrSeedSampleData,
      clearModuleRecords,
      addAnimal,
      updateAnimal,
      deleteAnimal,
      addFeedStock,
      updateFeedStock,
      adjustFeedStock,
      deleteFeedStock,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addSaleRecord,
      updateSaleRecord,
      collectSaleDue,
      deleteSaleRecord,
    }),
    [
      user,
      isAuthReady,
      isDataLoading,
      isDemoMode,
      isAdminUnlocked,
      isDefaultPassword,
      activeProfile,
      activeAnimals,
      activeFeedStocks,
      activeTransactions,
      activeSales,
      summary,
      toastMessage,
      clearToast,
      showToast,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      resendVerificationEmail,
      refreshAuthUser,
      logout,
      loginAdminWithPassword,
      lockWorkspace,
      updateAppLockPassword,
      changeFirebasePassword,
      saveFarmProfile,
      seedCloudData,
      resetOrSeedSampleData,
      clearModuleRecords,
      addAnimal,
      updateAnimal,
      deleteAnimal,
      addFeedStock,
      updateFeedStock,
      adjustFeedStock,
      deleteFeedStock,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addSaleRecord,
      updateSaleRecord,
      collectSaleDue,
      deleteSaleRecord,
    ]
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

export function useFarm(): FarmContextValue {
  const ctx = useContext(FarmContext);
  if (!ctx) {
    throw new Error('useFarm must be used inside FarmProvider');
  }
  return ctx;
}
