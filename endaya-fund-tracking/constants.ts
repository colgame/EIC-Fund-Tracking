
import { Transaction, DieselReport } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2025-12-01', description: 'ADDITIONAL ERC FUND RECEIVED FROM SIR EMERSON', amount: 227000.00, type: 'fund', mode: 'BDO', category: 'Fund Transfer' },
  { id: 'df-1', date: '2025-12-01', description: 'DIESEL BUDGET ALLOCATION', amount: 50000.00, type: 'fund', mode: 'BDO', category: 'Diesel' },
  { id: '2', date: '2025-12-05', description: 'FUND TRANSFER TO GCASH (PO BANK FEE INCLUDED)', amount: -7136.87, type: 'expense', mode: 'BDO', category: 'Fund Transfer' },
  { id: '3', date: '2025-12-08', description: 'UCO PREPAYMENT', amount: -15010.00, type: 'expense', mode: 'BDO', category: 'Utilities' },
  { id: '4', date: '2025-12-10', description: 'FUND TRANSFER TO GCASH', amount: -50210.00, type: 'expense', mode: 'BDO', category: 'Fund Transfer' },
  { id: '5', date: '2025-12-12', description: 'FUND TRANSFER TO GCASH', amount: -22010.00, type: 'expense', mode: 'BDO', category: 'Fund Transfer' },
  { id: '6', date: '2025-12-15', description: 'LAWSON GROUP (NOV 17-22)', amount: -40670.00, type: 'expense', mode: 'BDO', category: 'Cooking Oil' },
  { id: '7', date: '2025-12-18', description: 'SM SURPLUS', amount: -4057.00, type: 'expense', mode: 'BDO', category: 'EMB Payment' },
  { id: '8', date: '2025-12-02', description: 'FUND TRANSFERRED FROM BDO', amount: 7136.87, type: 'fund', mode: 'GCash', category: 'Fund Transfer' },
  { id: '9', date: '2025-12-03', description: 'MARYJUANE SOLPUNO | 1 CANS', amount: -1500.00, type: 'expense', mode: 'GCash', category: 'Evap/Construction' },
  { id: '10', date: '2025-12-06', description: 'LAWSON ESQUERRA | 1 CANS', amount: -1050.00, type: 'expense', mode: 'GCash', category: 'Evap/Construction' },
  { id: '11', date: '2025-12-09', description: 'MARYJUANE OPUS MALL | 5 CANS', amount: -2500.00, type: 'expense', mode: 'GCash', category: 'Evap/Construction' },
  { id: '12', date: '2025-12-11', description: 'PILLA RDS OPUS MALL | 2 CANS', amount: -1000.00, type: 'expense', mode: 'GCash', category: 'Evap/Construction' },
  { id: '13', date: '2025-12-14', description: 'MARYJUANE LOON LIPA | 7 CANS DIESEL', amount: -2800.00, type: 'expense', mode: 'GCash', category: 'Diesel' },
  { id: '14', date: '2025-12-16', description: 'MERALCO', amount: -8842.86, type: 'expense', mode: 'GCash', category: 'Utilities' },
  { id: '15', date: '2025-12-19', description: 'GLOBE', amount: -850.00, type: 'expense', mode: 'GCash', category: 'Utilities' },
  { id: '16', date: '2025-12-04', description: 'CASH WITHDRAWAL FROM BDO', amount: 29000.00, type: 'fund', mode: 'Cash', category: 'Withdrawal' },
  { id: '17', date: '2025-12-07', description: 'ALLOCATES BUDGET FOR DEC 02', amount: -9750.00, type: 'expense', mode: 'Cash', category: 'Budget Allocation' },
  { id: '18', date: '2025-12-13', description: 'LILIANDRA | MDA TROPICAL NUT', amount: -160.00, type: 'expense', mode: 'Cash', category: 'Other Expenses' },
  { id: '19', date: '2025-12-17', description: 'WASTE DISPOSAL (5 WASTE DISPOSAL)', amount: -20200.00, type: 'expense', mode: 'Cash', category: 'Construction' },
];

export const INITIAL_DIESEL_REPORTS: DieselReport[] = [
  { id: 'd1', date: '2025-12-01', amount: 15000.00, vehicle: 'Truck 1', areaCode: 'LIPA', assignedStaff: 'JUAN DELA CRUZ' },
  { id: 'd2', date: '2025-12-08', amount: 20000.00, vehicle: 'Truck 2', areaCode: 'MKT', assignedStaff: 'PEDRO PENDUKO' },
  { id: 'd3', date: '2025-12-14', amount: 7000.00, vehicle: 'Truck 1', areaCode: 'LIPA', assignedStaff: 'JUAN DELA CRUZ' },
];

export const CATEGORIES = [
  'Fund Transfer',
  'Utilities',
  'Cooking Oil',
  'EMB Payment',
  'Evap/Construction',
  'Diesel',
  'Budget Allocation',
  'Other Expenses',
  'Construction',
  'Withdrawal'
];

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
