export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export enum ActiveTab {
  DASHBOARD = 'dashboard',
  ANIMALS = 'animals',
  FEED_STOCK = 'feed_stock',
  TRANSACTIONS = 'transactions',
  SALES = 'sales',
  AI_ADVISOR = 'ai_advisor',
  ADMIN_PANEL = 'admin_panel',
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface FarmAiGuidance {
  headline: string;
  healthAssessment: string;
  feedAssessment: string;
  financeAssessment: string;
  topRecommendations: string[];
}

export type BulkCollectionKey = 'animals' | 'feedStocks' | 'transactions' | 'sales';

export type AnimalSpecies =
  | 'গরু'
  | 'ছাগল'
  | 'ভেড়া'
  | 'মহিষ'
  | 'হাঁস'
  | 'মুরগি'
  | 'অন্যান্য';

export type AnimalGender =
  | 'পুরুষ (ষাঁড়/পাঠা)'
  | 'স্ত্রী (গাভী/ছাগী)'
  | 'বাচ্চা';

export type HealthCondition =
  | 'সুস্থ'
  | 'চিকিৎসাধীন'
  | 'গর্ভবতী'
  | 'পর্যবেক্ষণে';

export type FeedCategory =
  | 'দানাদার খাদ্য'
  | 'ভুষি ও খৈল'
  | 'কাঁচা ঘাস ও খড়'
  | 'ভিটামিন ও ওষুধ'
  | 'অন্যান্য';

export type FeedUnit = 'কেজি' | 'বস্তা' | 'লিটার' | 'আঁটি' | 'প্যাকেট';

export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'নগদ'
  | 'বিকাশ / নগদ অ্যাপ'
  | 'ব্যাংক ট্রান্সফার'
  | 'বাকি';

export type SaleProductType =
  | 'পশু বিক্রয়'
  | 'দুধ বিক্রয়'
  | 'ডিম বিক্রয়'
  | 'মাংস বিক্রয়'
  | 'জৈব সার'
  | 'অন্যান্য';

export type SaleUnit = 'টি' | 'লিটার' | 'কেজি' | 'হালি' | 'বস্তা';

export interface FarmProfile {
  id: string;
  ownerId: string;
  farmName: string;
  ownerName: string;
  location: string;
  phone: string;
  currency: string;
  hasAppPassword: boolean;
  appPasswordHash: string;
  appPasswordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Animal {
  id: string;
  ownerId: string;
  name: string;
  tagNumber: string;
  species: AnimalSpecies;
  breed: string;
  gender: AnimalGender;
  ageMonths: number;
  weightKg: number;
  purchasePrice: number;
  healthCondition: HealthCondition;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedStock {
  id: string;
  ownerId: string;
  name: string;
  category: FeedCategory;
  currentStock: number;
  unit: FeedUnit;
  minStockAlert: number;
  unitCost: number;
  lastRestockedDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  ownerId: string;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  transactionDate: string;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  ownerId: string;
  productType: SaleProductType;
  itemName: string;
  referenceTag: string;
  quantity: number;
  unit: SaleUnit;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  buyerName: string;
  buyerPhone: string;
  saleDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type AnimalInput = Omit<Animal, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
export type FeedStockInput = Omit<FeedStock, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
export type TransactionInput = Omit<Transaction, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;
export type SaleRecordInput = Omit<SaleRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export interface FarmProfileUpdateInput {
  farmName: string;
  ownerName: string;
  location: string;
  phone: string;
  currency: string;
}

export interface DashboardSummary {
  totalAnimals: number;
  healthyAnimals: number;
  careNeededAnimals: number;
  livestockValuation: number;
  totalFeedItems: number;
  lowStockCount: number;
  feedInventoryValue: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalSalesAmount: number;
  totalSalesPaid: number;
  totalSalesDue: number;
  speciesCounts: Record<string, number>;
}
