
export type AccountType = 'BDO' | 'GCash' | 'Cash';
export type TransactionType = 'fund' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  mode: AccountType;
  category: string;
}

export interface DieselReport {
  id: string;
  date: string;
  amount: number;
  vehicle: string;
  areaCode: string;
  assignedStaff: string;
}

export interface FinancialSummary {
  bdo: number;
  gcash: number;
  cash: number;
  total: number;
  fundsReceived: number;
  expenses: number;
  dieselTotal: number;
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'tip' | 'warning' | 'positive';
}
