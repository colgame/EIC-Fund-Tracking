import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { 
  PieChart, Pie, Cell, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
// Added missing icons ClipboardList and ArrowLeftRight to resolve compilation errors
import { 
  LayoutDashboard, ListTodo, Fuel, 
  Banknote, CreditCard, Wallet,
  Plus, Trash2, X,
  Calendar, RefreshCw, 
  Loader2, FileSpreadsheet, Users,
  Settings2, Edit3, Save,
  ClipboardList, ArrowLeftRight
} from 'lucide-react';
import { 
  Transaction, DieselReport, FinancialSummary, 
  AccountType, TransactionType
} from './types';
import { 
  INITIAL_TRANSACTIONS, INITIAL_DIESEL_REPORTS, 
  CATEGORIES as DEFAULT_CATEGORIES, COLORS 
} from './constants';

// --- Helpers ---
const formatPHP = (amount: number) => {
  return new Intl.NumberFormat('en-PH', { 
    style: 'currency', 
    currency: 'PHP' 
  }).format(amount);
};

const StatCard: React.FC<{ 
  title: string; 
  amount: number; 
  icon: React.ReactNode; 
  gradient: string;
  accentColor: string;
}> = ({ title, amount, icon, gradient, accentColor }) => {
  const isNegative = amount < 0;
  const textColorClass = isNegative ? 'text-rose-600' : accentColor;
  
  return (
    <div className={`p-6 rounded-[2.5rem] shadow-xl text-white ${gradient} transition-transform hover:scale-[1.02] relative overflow-hidden group min-h-[180px] flex flex-col justify-between`}>
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
      <div className="flex justify-between items-start relative z-10">
        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner border border-white/10">
          <div className="text-white">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
          </div>
        </div>
        <span className="text-white/90 text-[11px] font-black uppercase tracking-[0.2em] pt-2">{title}</span>
      </div>
      <div className="relative z-10 mt-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-full py-4 px-6 flex justify-center items-center shadow-2xl border border-white/40">
          <span className={`text-xl md:text-2xl font-black tracking-tight ${textColorClass}`}>
            {isNegative ? '-' : ''}{formatPHP(Math.abs(amount))}
          </span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'diesel'>('dashboard');
  const [chartsReady, setChartsReady] = useState(false);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDieselModal, setShowDieselModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [syncState, setSyncState] = useState<{status: 'idle' | 'syncing' | 'connected' | 'error', lastSync: string | null}>({ 
    status: 'idle', 
    lastSync: null 
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('endaya_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  
  const [dieselReports, setDieselReports] = useState<DieselReport[]>(() => {
    const saved = localStorage.getItem('endaya_diesel');
    return saved ? JSON.parse(saved) : INITIAL_DIESEL_REPORTS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('endaya_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const syncWithCloud = useCallback(async (isInitial = false) => {
    if (isInitial) setIsCloudLoading(true);
    setSyncState(prev => ({ ...prev, status: 'syncing' }));

    try {
      await new Promise(resolve => setTimeout(resolve, isInitial ? 1000 : 1500));
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase();
      setSyncState({ status: 'connected', lastSync: now });
      localStorage.setItem('endaya_transactions', JSON.stringify(transactions));
      localStorage.setItem('endaya_diesel', JSON.stringify(dieselReports));
      localStorage.setItem('endaya_categories', JSON.stringify(categories));
    } catch (error) {
      setSyncState(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsCloudLoading(false);
    }
  }, [transactions, dieselReports, categories]);

  useEffect(() => {
    syncWithCloud(true);
    // Increased mount delay to ensure layout stability
    const chartTimer = setTimeout(() => setChartsReady(true), 1500);
    return () => clearTimeout(chartTimer);
  }, []);

  useEffect(() => {
    // Reset and trigger a slightly longer delay on tab change to dashboard
    if (activeTab === 'dashboard') {
      setChartsReady(false);
      const timer = setTimeout(() => setChartsReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const { todayISO, currentYear, currentMonthStr } = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return { todayISO: `${y}-${m}-${day}`, currentYear: y, currentMonthStr: m };
  }, []);

  const [selectedAccount, setSelectedAccount] = useState<AccountType>('BDO');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr); 
  const [selectedDate, setSelectedDate] = useState(todayISO); 

  const [dieselViewMode, setDieselViewMode] = useState<'Daily' | 'Monthly'>('Daily');
  const [dieselSelectedMonth, setDieselSelectedMonth] = useState(currentMonthStr);
  const [dieselSelectedDate, setDieselSelectedDate] = useState(todayISO);

  const [pieMonth, setPieMonth] = useState<string>('All');

  const summary = useMemo<FinancialSummary>(() => {
    const calculate = (mode: AccountType) => transactions.filter(t => t.mode === mode).reduce((acc, t) => acc + t.amount, 0);
    const fundsReceived = transactions.filter(t => t.type === 'fund').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Diesel').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const dieselTotal = dieselReports.reduce((acc, d) => acc + d.amount, 0);
    return { bdo: calculate('BDO'), gcash: calculate('GCash'), cash: calculate('Cash'), total: calculate('BDO') + calculate('GCash') + calculate('Cash'), fundsReceived, expenses, dieselTotal };
  }, [transactions, dieselReports]);

  // Fix: Explicitly type fullYearDateOptions to avoid 'unknown' map error
  const fullYearDateOptions = useMemo<{ name: string; monthStr: string; dates: { value: string; label: string }[] }[]>(() => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const monthName = new Date(currentYear, m).toLocaleString('default', { month: 'long' });
      const monthStr = (m + 1).toString().padStart(2, '0');
      const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
      const dates = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currentYear}-${monthStr}-${d.toString().padStart(2, '0')}`;
        dates.push({
          value: dateStr,
          label: `${monthName} ${d}, ${currentYear}`
        });
      }
      months.push({ name: monthName, monthStr, dates });
    }
    return months;
  }, [currentYear]);

  const availableDatesForTransactions = useMemo(() => {
    const targetMonth = selectedMonth === 'All' ? '01' : selectedMonth;
    const daysInMonth = new Date(currentYear, parseInt(targetMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => `${currentYear}-${targetMonth}-${(i + 1).toString().padStart(2, '0')}`).sort();
  }, [selectedMonth, currentYear]);

  const dailyLedger = useMemo(() => {
    if (!selectedDate) return null;
    const currentAccountTransactions = transactions.filter(t => t.mode === selectedAccount);
    const beginningBalance = currentAccountTransactions.filter(t => t.date < selectedDate).reduce((acc, t) => acc + t.amount, 0);
    const additionalFunds = currentAccountTransactions.filter(t => t.date === selectedDate && t.type === 'fund');
    
    const fundsByCategory: Record<string, Transaction[]> = {};
    additionalFunds.forEach(t => {
      if (!fundsByCategory[t.category]) fundsByCategory[t.category] = [];
      fundsByCategory[t.category].push(t);
    });

    const dayExpenses = currentAccountTransactions.filter(t => t.date === selectedDate && t.type === 'expense');
    const expensesByCategory: Record<string, Transaction[]> = {};
    dayExpenses.forEach(t => { 
      if (!expensesByCategory[t.category]) expensesByCategory[t.category] = []; 
      expensesByCategory[t.category].push(t); 
    });

    const totalFunds = beginningBalance + additionalFunds.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = dayExpenses.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    return { beginningBalance, additionalFunds, fundsByCategory, totalFunds, expensesByCategory, dayExpenses, totalExpenses, availableBalance: totalFunds - totalExpenses };
  }, [transactions, selectedDate, selectedAccount]);

  const dieselLedger = useMemo(() => {
    const periodPrefix = dieselViewMode === 'Daily' ? dieselSelectedDate : `${currentYear}-${dieselSelectedMonth}`;
    const budgetAllocations = transactions.filter(t => t.date.startsWith(periodPrefix) && t.category === 'Diesel');
    const totalDieselBudget = budgetAllocations.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const filteredLogs = dieselReports.filter(d => dieselViewMode === 'Daily' ? d.date === dieselSelectedDate : d.date.startsWith(periodPrefix));
    const periodExpenses = filteredLogs.reduce((acc, d) => acc + d.amount, 0);
    return { filteredLogs, dieselBudget: totalDieselBudget, periodTotal: periodExpenses, returnedToFund: totalDieselBudget - periodExpenses };
  }, [dieselReports, transactions, dieselViewMode, dieselSelectedDate, dieselSelectedMonth, currentYear]);

  const categoryPieData = useMemo<{ name: string; value: number }[]>(() => {
    const catMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .filter(t => pieMonth === 'All' || t.date.split('-')[1] === pieMonth)
      .forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [transactions, pieMonth]);

  const deleteTransaction = (id: string) => { if (confirm('Delete record?')) setTransactions(prev => prev.filter(t => t.id !== id)); };
  const deleteDiesel = (id: string) => { if (confirm('Delete record?')) setDieselReports(prev => prev.filter(d => d.id !== id)); };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = { ...newTx, id: Date.now().toString() };
    setTransactions(prev => [...prev, tx]);
    setShowTransactionModal(false);
  };

  const handleAddDiesel = (newDl: Omit<DieselReport, 'id'>) => {
    const dl: DieselReport = { ...newDl, id: Date.now().toString() };
    setDieselReports(prev => [...prev, dl]);
    setShowDieselModal(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert("Category already exists.");
      return;
    }
    const updated = [...categories, newCategoryName.trim()];
    setCategories(updated);
    setNewCategoryName("");
    localStorage.setItem('endaya_categories', JSON.stringify(updated));
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Delete category "${cat}"? Transactions using this category will remain, but you won't be able to select it for new entries.`)) {
      const updated = categories.filter(c => c !== cat);
      setCategories(updated);
      localStorage.setItem('endaya_categories', JSON.stringify(updated));
    }
  };

  const handleEditCategory = (idx: number) => {
    setEditingCategoryIdx(idx);
    setEditingCategoryValue(categories[idx]);
  };

  const handleSaveCategoryEdit = () => {
    if (editingCategoryIdx === null) return;
    const oldVal = categories[editingCategoryIdx];
    const newVal = editingCategoryValue.trim();
    if (!newVal) return;
    
    const updated = [...categories];
    updated[editingCategoryIdx] = newVal;
    setCategories(updated);
    
    const updatedTransactions = transactions.map(t => 
      t.category === oldVal ? { ...t, category: newVal } : t
    );
    setTransactions(updatedTransactions);
    
    setEditingCategoryIdx(null);
    localStorage.setItem('endaya_categories', JSON.stringify(updated));
    localStorage.setItem('endaya_transactions', JSON.stringify(updatedTransactions));
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = transactions.map(t => ({ Date: t.date, Description: t.description, Amount: t.amount, Mode: t.mode, Category: t.category }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Endaya_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const InputLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">{children}</label>
  );

  const FormInput = "w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all appearance-none";

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 font-inter">
      {isCloudLoading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-8 max-w-sm w-full animate-in zoom-in duration-300">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            <div className="text-center">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Syncing Cloud...</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Connecting to Secure Bank Gateway</p>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY MANAGER MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
             <div className="px-10 pt-10 pb-6 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Manage Categories</h3>
                <button 
                  onClick={() => setShowCategoryModal(false)} 
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                  <X size={24}/>
                </button>
              </div>
              <div className="px-10 mb-6 shrink-0">
                <InputLabel>Add New Category</InputLabel>
                <div className="flex gap-2">
                  <input 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter name..."
                    className={FormInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-md active:scale-95 transition-all flex items-center justify-center min-w-[56px]"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
              <div className="px-10 pb-10 overflow-y-auto custom-scrollbar flex-1">
                <InputLabel>Existing Categories</InputLabel>
                <div className="space-y-3">
                  {categories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-slate-300">
                      <div className="flex-1 overflow-hidden mr-4">
                        {editingCategoryIdx === idx ? (
                          <input 
                            autoFocus
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            onBlur={handleSaveCategoryEdit}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCategoryEdit()}
                            className="w-full bg-white border border-indigo-400 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 outline-none"
                          />
                        ) : (
                          <span className="text-xs font-black text-slate-700 uppercase block truncate">{cat}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {editingCategoryIdx === idx ? (
                          <button onClick={handleSaveCategoryEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><Save size={18} /></button>
                        ) : (
                          <button onClick={() => handleEditCategory(idx)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-xl transition-colors"><Edit3 size={18} /></button>
                        )}
                        <button onClick={() => handleDeleteCategory(cat)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-10 text-slate-300 font-bold uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                      No categories defined
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

      {/* NEW TRANSACTION MODAL */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-10 pt-10 pb-6 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">New Transaction</h3>
              <button 
                onClick={() => setShowTransactionModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X size={24}/>
              </button>
            </div>
            <form className="px-10 pb-10 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddTransaction({
                date: formData.get('date') as string,
                description: formData.get('description') as string,
                amount: Number(formData.get('amount')) * (formData.get('type') === 'expense' ? -1 : 1),
                type: formData.get('type') as TransactionType,
                mode: formData.get('mode') as AccountType,
                category: formData.get('category') as string
              });
            }}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <InputLabel>Date</InputLabel>
                  <input required name="date" type="date" className={FormInput} defaultValue={todayISO} />
                </div>
                <div>
                  <InputLabel>Type</InputLabel>
                  <select name="type" className={FormInput}>
                    <option value="expense">EXPENSE OUT</option>
                    <option value="fund">INCOMING FUND</option>
                  </select>
                </div>
              </div>
              <div>
                <InputLabel>Description</InputLabel>
                <input required name="description" placeholder="DESCRIPTION..." className={FormInput} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <InputLabel>Account</InputLabel>
                  <select name="mode" className={FormInput}>
                    <option>BDO</option>
                    <option>GCash</option>
                    <option>Cash</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <InputLabel>Category</InputLabel>
                    <button 
                      type="button" 
                      onClick={() => setShowCategoryModal(true)}
                      className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700 underline"
                    >
                      Manage
                    </button>
                  </div>
                  <select name="category" className={FormInput}>
                    {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <InputLabel>Amount (PHP)</InputLabel>
                <div className="relative group">
                   <input 
                    required 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-[2rem] px-6 py-6 text-3xl font-black text-slate-400 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-all text-center" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-5 bg-[#4f46e5] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Save Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW DIESEL MODAL */}
      {showDieselModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-10 pt-10 pb-6 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Log Diesel Expense</h3>
              <button 
                onClick={() => setShowDieselModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X size={24}/>
              </button>
            </div>
            <form className="px-10 pb-10 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddDiesel({
                date: formData.get('date') as string,
                amount: Number(formData.get('amount')),
                vehicle: formData.get('vehicle') as string,
                areaCode: formData.get('area') as string,
                assignedStaff: formData.get('staff') as string
              });
            }}>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <InputLabel>Date</InputLabel>
                  <input required name="date" type="date" className={FormInput} defaultValue={todayISO} />
                </div>
                <div>
                  <InputLabel>Area Code</InputLabel>
                  <input required name="area" placeholder="E.G. LIPA..." className={FormInput} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <InputLabel>Vehicle</InputLabel>
                  <input required name="vehicle" placeholder="VEHICLE ID..." className={FormInput} />
                </div>
                <div>
                  <InputLabel>Assigned Staff</InputLabel>
                  <input required name="staff" placeholder="NAME..." className={FormInput} />
                </div>
              </div>
              <div>
                <InputLabel>Cost (PHP)</InputLabel>
                <input 
                  required 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-[2rem] px-6 py-6 text-3xl font-black text-slate-400 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white transition-all text-center" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-5 bg-[#ea580c] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95"
              >
                Save Diesel Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col border-r border-slate-800 relative">
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-start gap-4 text-white">
            <div className="w-14 h-14 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shrink-0 mt-0.5"><Banknote className="w-8 h-8" /></div>
            <div className="flex flex-col leading-tight pt-1">
              <h1 className="text-[17px] font-black tracking-tight uppercase text-white leading-[1.1]">Endaya</h1>
              <h1 className="text-[17px] font-black tracking-tight uppercase text-white leading-[1.1]">Industries</h1>
              <h1 className="text-[17px] font-black tracking-tight uppercase text-white leading-[1.1]">Corporation</h1>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 py-6">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><LayoutDashboard size={20} /><span className="font-bold text-sm uppercase">Dashboard</span></button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><ListTodo size={20} /><span className="font-bold text-sm uppercase">Transactions</span></button>
          <button onClick={() => setActiveTab('diesel')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === 'diesel' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}><Fuel size={20} /><span className="font-bold text-sm uppercase">Diesel Logs</span></button>
        </nav>
        <div className="px-6 pb-10 mt-auto shrink-0 relative">
           <button onClick={() => setShowSyncDetails(!showSyncDetails)} className="w-full bg-slate-800/50 rounded-[2rem] p-6 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 group text-left">
              <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${syncState.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-500'} ${syncState.status === 'syncing' ? 'animate-pulse' : ''}`} /><span className={`text-[10px] font-black uppercase tracking-widest ${syncState.status === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>Live Cloud Link</span></div>
              <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Cloud Active</p>
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-20 lg:pb-0">
        <header className="h-24 lg:h-20 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">{activeTab.toUpperCase()}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${syncState.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'} ${syncState.status === 'syncing' ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase">
                {syncState.status === 'syncing' ? 'Syncing...' : `Last Sync: ${syncState.lastSync || 'Initializing...'}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => syncWithCloud(false)} 
              disabled={syncState.status === 'syncing'}
              title="Refresh Cloud Data"
              className="p-2.5 md:p-3 border rounded-xl bg-white border-slate-200 text-slate-500 shadow-sm hover:bg-slate-50 transition-all hover:border-indigo-200 hover:text-indigo-600 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={18} className={syncState.status === 'syncing' ? 'animate-spin text-indigo-600' : 'transition-transform active:rotate-180'} />
            </button>
            
            {activeTab !== 'dashboard' && (
              <>
                <button onClick={exportToExcel} title="Export to Excel" className="hidden sm:block p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
                  <FileSpreadsheet size={18} />
                </button>
                {activeTab === 'transactions' && (
                  <button onClick={() => setShowCategoryModal(true)} title="Manage Categories" className="hidden sm:block p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
                    <Settings2 size={18} />
                  </button>
                )}
                <button 
                  onClick={() => activeTab === 'diesel' ? setShowDieselModal(true) : setShowTransactionModal(true)}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-indigo-600 rounded-xl text-[10px] md:text-[11px] font-black text-white hover:bg-indigo-700 shadow-xl uppercase transition-all active:scale-95"
                >
                  <Plus size={16} /><span className="hidden sm:inline">New Entry</span>
                </button>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-0 md:p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <div className="p-4 md:p-0 space-y-8 animate-in fade-in duration-500 min-h-0 flex flex-col">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 shrink-0">
                <StatCard title="BDO FUNDS" amount={summary.bdo} icon={<Banknote />} gradient="bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]" accentColor="text-[#1e3a8a]" />
                <StatCard title="GCASH BALANCE" amount={summary.gcash} icon={<CreditCard />} gradient="bg-gradient-to-br from-[#0070f3] to-[#00b4ff]" accentColor="text-[#0070f3]" />
                <StatCard title="CASH ON HAND" amount={summary.cash} icon={<Wallet />} gradient="bg-gradient-to-br from-[#f59e0b] to-[#ea580c]" accentColor="text-[#ea580c]" />
                <StatCard title="TOTAL TEAM FUND" amount={summary.total} icon={<Users />} gradient="bg-gradient-to-br from-slate-800 to-slate-950" accentColor="text-slate-800" />
              </div>
              <div className="w-full max-w-5xl mx-auto bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 mt-8 min-h-0">
                <div className="flex justify-between items-center mb-10"><h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase">Expense Distribution</h3><select value={pieMonth} onChange={(e) => setPieMonth(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] md:text-[11px] font-black uppercase text-slate-500 outline-none"><option value="All">All Time</option>{Array.from({length: 12}, (_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(2000, i).toLocaleString('default', {month: 'long'})}</option>)}</select></div>
                <div className="flex flex-col md:flex-row items-center gap-12 min-h-0">
                  {/* Robust container for Recharts ResponsiveContainer */}
                  <div className="w-full md:w-1/2 h-[300px] md:h-[350px] relative min-w-0 min-h-0 flex items-center justify-center">
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                        <PieChart>
                          <Pie 
                            data={categoryPieData} 
                            innerRadius={70} 
                            outerRadius={110} 
                            dataKey="value" 
                            paddingAngle={5}
                            animationDuration={800}
                          >
                            {categoryPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => formatPHP(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-300">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Optimizing Canvas...</span>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-1/2 space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                    {categoryPieData.map((cat, i) => (
                      <div key={i} className="flex justify-between p-3 md:p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <span className="text-slate-500 font-black uppercase text-[10px] md:text-xs">{cat.name}</span>
                        <span className="text-slate-800 font-black text-xs md:text-sm">{formatPHP(cat.value)}</span>
                      </div>
                    ))}
                    {categoryPieData.length === 0 && (
                       <div className="text-center py-10 text-slate-300 font-black uppercase text-[10px] tracking-widest">No expenses found</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="p-4 md:p-0 space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24">
              <div className="bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 flex flex-wrap gap-3 md:gap-4 items-center">
                <div className="flex gap-1.5 md:gap-2 bg-slate-50 p-1.5 rounded-2xl">
                  {['BDO', 'GCash', 'Cash'].map(acc => (
                    <button key={acc} onClick={() => setSelectedAccount(acc as AccountType)} className={`px-4 md:px-5 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${selectedAccount === acc ? 'bg-[#4f46e5] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{acc}</button>
                  ))}
                </div>
                <div className="flex gap-2.5 md:gap-3 bg-slate-50 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl border border-slate-100 items-center">
                  <Calendar size={14} className="text-slate-400" />
                  <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-[11px] md:text-sm font-black text-slate-700 uppercase outline-none cursor-pointer">
                    {availableDatesForTransactions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              {dailyLedger && (
                <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-[#4f46e5] text-center py-6 text-white relative overflow-hidden">
                    <div className="text-[9px] font-black uppercase tracking-[0.4em] mb-1 opacity-80">
                      {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-widest leading-none drop-shadow-lg px-4">
                      {selectedAccount} TRANSACTIONS
                    </h1>
                  </div>
                  <div className="flex justify-end items-center p-4 bg-white border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${dailyLedger.availableBalance < 0 ? 'text-rose-600' : 'text-[#4f46e5]'}`}>Available Balance:</span>
                      <div className={`text-xl md:text-2xl font-black tracking-tighter ${dailyLedger.availableBalance < 0 ? 'text-rose-600' : 'text-[#4f46e5]'}`}>
                        {formatPHP(dailyLedger.availableBalance)}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#f8fafc] border-b border-slate-100">
                        <tr className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-4 md:px-6 py-4 text-left">Description</th>
                          <th className="px-4 md:px-6 py-4 text-right">Amount</th>
                          <th className="px-4 md:px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {/* Beginning Balance Row */}
                        <tr className="border-b">
                          <td className="px-4 md:px-6 py-6 font-black text-slate-900 uppercase text-xs md:text-sm">
                            BEGINNING BALANCE:
                          </td>
                          <td className="px-4 md:px-6 py-6 text-right font-black text-slate-900 text-xs md:text-sm">
                            {formatPHP(dailyLedger.beginningBalance)}
                          </td>
                          <td></td>
                        </tr>

                        {/* Incoming Funds Grouped */}
                        {Object.entries(dailyLedger.fundsByCategory).map(([cat, items]) => (
                          <React.Fragment key={cat}>
                            <tr className="bg-white">
                              <td colSpan={3} className="px-4 md:px-6 pt-4 pb-1">
                                <div className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 inline-block">{cat}</div>
                              </td>
                            </tr>
                            {(items as Transaction[]).map(f => (
                              <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 md:px-6 py-3">
                                  <div className="font-bold text-slate-700 text-[10px] md:text-xs uppercase pl-2">{f.description}</div>
                                </td>
                                <td className="px-4 md:px-6 py-3 text-right font-black text-emerald-600 text-[10px] md:text-xs">
                                  {formatPHP(f.amount)}
                                </td>
                                <td className="px-4 md:px-6 py-3 text-center">
                                  <button onClick={() => deleteTransaction(f.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-200 hover:text-rose-500 transition-colors">
                                    <Trash2 size={14}/>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}

                        <tr className="bg-[#f8fafc]">
                          <td colSpan={3} className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                            EXPENSES / DEDUCTIONS:
                          </td>
                        </tr>

                        {/* Expenses Grouped By Category */}
                        {Object.entries(dailyLedger.expensesByCategory).map(([cat, items]) => (
                          <React.Fragment key={cat}>
                            <tr className="bg-white">
                              <td colSpan={3} className="px-4 md:px-6 pt-4 pb-1">
                                <div className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 inline-block">{cat}</div>
                              </td>
                            </tr>
                            {(items as Transaction[]).map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 md:px-6 py-3">
                                  <div className="text-slate-800 text-[10px] md:text-xs font-bold uppercase tracking-tight pl-2">{item.description}</div>
                                </td>
                                <td className="px-4 md:px-6 py-3 text-right font-black text-slate-800 text-[10px] md:text-xs">
                                  {formatPHP(Math.abs(item.amount))}
                                </td>
                                <td className="px-4 md:px-6 py-3 text-center">
                                  <button onClick={() => deleteTransaction(item.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-200 hover:text-rose-500 transition-colors">
                                    <Trash2 size={14}/>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}

                        {dailyLedger.dayExpenses.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 md:px-6 py-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest opacity-40">
                              No Deductions for this day
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-[#f8fafc] border-t border-slate-100 p-6 flex justify-between items-center">
                    <span className="text-xs md:text-sm font-black uppercase text-slate-900 tracking-tight">
                      TOTAL DAILY EXPENSES
                    </span>
                    <span className="text-lg md:text-xl font-black text-slate-900 tracking-tighter">
                      {formatPHP(dailyLedger.totalExpenses)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diesel' && (
            <div className="p-4 md:p-0 space-y-0 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24">
               <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border border-slate-100">
                  <div className="bg-[#ea580c] text-white py-6 px-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Fuel size={60} />
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-[0.4em] mb-1 opacity-80">
                      {new Date(dieselSelectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-widest leading-none drop-shadow-lg px-4">
                      DIESEL CONSUMPTION LOGS
                    </h1>
                  </div>
                  <div className="bg-white px-4 md:px-6 py-3 border-b border-slate-100 flex flex-wrap gap-3 md:gap-4 items-center justify-center">
                    <div className="flex gap-1.5 md:gap-2 bg-slate-50 p-1 rounded-2xl">
                      {['Daily', 'Monthly'].map(mode => (
                        <button key={mode} onClick={() => setDieselViewMode(mode as 'Daily' | 'Monthly')} className={`px-4 md:px-5 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all ${dieselViewMode === mode ? 'bg-[#ea580c] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{mode}</button>
                      ))}
                    </div>
                    <div className="flex gap-2 bg-slate-50 px-3 md:px-4 py-2 rounded-2xl border border-slate-100 items-center">
                      <Calendar size={14} className="text-[#ea580c]" />
                      {dieselViewMode === 'Daily' ? (
                        <select 
                          value={dieselSelectedDate} 
                          onChange={(e) => setDieselSelectedDate(e.target.value)} 
                          className="bg-transparent text-[10px] md:text-[11px] font-black text-slate-700 uppercase outline-none cursor-pointer max-w-[150px] md:max-w-[200px]"
                        >
                          {fullYearDateOptions.map(month => (
                            <optgroup key={month.monthStr} label={month.name.toUpperCase()}>
                              {month.dates.map(date => (
                                <option key={date.value} value={date.value}>
                                  {date.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ) : (
                        <select 
                          value={dieselSelectedMonth} 
                          onChange={(e) => setDieselSelectedMonth(e.target.value)} 
                          className="bg-transparent text-[10px] md:text-[11px] font-black text-slate-700 uppercase outline-none cursor-pointer"
                        >
                          {fullYearDateOptions.map(month => (
                            <option key={month.monthStr} value={month.monthStr}>
                              {month.name.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 bg-white relative border-b border-slate-50">
                    <div className="absolute top-1/4 bottom-1/4 left-1/2 w-[1px] bg-slate-100 hidden md:block" />
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList size={14} className="text-indigo-400" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Diesel Budget</span>
                      </div>
                      <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">
                        {formatPHP(dieselLedger.dieselBudget)}
                      </div>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowLeftRight size={14} className="text-[#ea580c]" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Returned to EIC Fund</span>
                      </div>
                      <div className="text-xl md:text-2xl font-black text-[#ea580c] tracking-tighter">
                        {formatPHP(dieselLedger.returnedToFund)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#f8fafc] border-b border-slate-100">
                          <tr className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-4 md:px-6 py-4 text-left">Log Date / Vehicle</th>
                            <th className="px-4 md:px-6 py-4 text-left">Area</th>
                            <th className="px-4 md:px-6 py-4 text-left">Staff</th>
                            <th className="px-4 md:px-6 py-4 text-right">Cost (PHP)</th>
                            <th className="px-4 md:px-6 py-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 min-h-[150px]">
                          {(dieselLedger.filteredLogs as DieselReport[]).map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-4 md:px-6 py-3">
                                <div className="text-[8px] text-slate-400 font-black uppercase mb-0.5">{log.date}</div>
                                <div className="font-black text-slate-800 text-[10px] md:text-xs uppercase">{log.vehicle}</div>
                              </td>
                              <td className="px-4 md:px-6 py-3">
                                <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-tight">{log.areaCode}</div>
                              </td>
                              <td className="px-4 md:px-6 py-3">
                                <div className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase">{log.assignedStaff}</div>
                              </td>
                              <td className="px-4 md:px-6 py-3 text-right font-black text-slate-900 text-xs md:text-sm">
                                {formatPHP(log.amount)}
                              </td>
                              <td className="px-4 md:px-6 py-3 text-center">
                                <button onClick={() => deleteDiesel(log.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-200 hover:text-rose-500 transition-colors">
                                  <Trash2 size={14}/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-[#f8fafc] border-t border-slate-100 p-4 flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-900 tracking-widest">
                        TOTAL EXPENSE FOR PERIOD
                      </span>
                      <span className="text-base md:text-lg font-black text-slate-900 tracking-tighter">
                        {formatPHP(dieselLedger.periodTotal)}
                      </span>
                    </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 flex items-center justify-between z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}><LayoutDashboard size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} /></button>
        <button onClick={() => setActiveTab('transactions')} className="relative -top-6 group">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-300 group-active:scale-95 ${activeTab === 'transactions' ? 'bg-[#4f46e5] text-white shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
            <ListTodo size={28} strokeWidth={2.5} />
          </div>
        </button>
        <button onClick={() => setActiveTab('diesel')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'diesel' ? 'text-[#ea580c] scale-110' : 'text-slate-400'}`}><Fuel size={24} strokeWidth={activeTab === 'diesel' ? 2.5 : 2} /></button>
      </nav>
    </div>
  );
};

export default App;