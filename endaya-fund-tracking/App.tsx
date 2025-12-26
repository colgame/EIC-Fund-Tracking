
import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, ListTodo, Fuel, 
  TrendingUp, Wallet, Banknote, CreditCard, 
  Plus, Trash2, X, Download,
  Calendar, Search, ChevronDown,
  RefreshCw, CheckCircle2,
  Cloud, CloudOff, Wallet2, ReceiptText, Undo2,
  LayoutGrid, FileSpreadsheet
} from 'lucide-react';
import { 
  Transaction, DieselReport, FinancialSummary, 
  AccountType, TransactionType
} from './types';
import { 
  INITIAL_TRANSACTIONS, INITIAL_DIESEL_REPORTS, 
  CATEGORIES, COLORS 
} from './constants';

// --- Components ---

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
            {React.cloneElement(icon as React.ReactElement, { size: 28 })}
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
  const [isMounted, setIsMounted] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDriveConnected, setIsDriveConnected] = useState(() => localStorage.getItem('endaya_drive_connected') === 'true');
  const [isSyncingToDrive, setIsSyncingToDrive] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('endaya_transactions');
      return saved ? JSON.parse(saved) as Transaction[] : INITIAL_TRANSACTIONS;
    } catch (e) {
      return INITIAL_TRANSACTIONS;
    }
  });
  
  const [dieselReports, setDieselReports] = useState<DieselReport[]>(() => {
    try {
      const saved = localStorage.getItem('endaya_diesel');
      return saved ? JSON.parse(saved) as DieselReport[] : INITIAL_DIESEL_REPORTS;
    } catch (e) {
      return INITIAL_DIESEL_REPORTS;
    }
  });

  const [allCategories, setAllCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('endaya_categories');
      return saved ? JSON.parse(saved) as string[] : CATEGORIES;
    } catch (e) {
      return CATEGORIES;
    }
  });

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setChartsReady(true), 1500);

    const performSave = () => {
      try {
        setIsSaving(true);
        localStorage.setItem('endaya_transactions', JSON.stringify(transactions));
        localStorage.setItem('endaya_diesel', JSON.stringify(dieselReports));
        localStorage.setItem('endaya_categories', JSON.stringify(allCategories));
        
        const now = new Date();
        setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase());
        setTimeout(() => setIsSaving(false), 800);
      } catch (err) {
        setIsSaving(false);
      }
    };
    const debounceTimer = setTimeout(performSave, 1000);
    return () => {
      clearTimeout(timer);
      clearTimeout(debounceTimer);
    };
  }, [transactions, dieselReports, allCategories]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setChartsReady(false);
      const timer = setTimeout(() => setChartsReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleManualSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 500);
  };

  const connectGoogleDrive = () => {
    if (isDriveConnected) {
      if(confirm("Disconnect from Endaya Shared Drive?")) {
        setIsDriveConnected(false);
        localStorage.setItem('endaya_drive_connected', 'false');
      }
      return;
    }
    setIsSyncingToDrive(true);
    setSyncStep('Connecting Spreadsheet...');
    setTimeout(() => {
      setIsDriveConnected(true);
      localStorage.setItem('endaya_drive_connected', 'true');
      setIsSyncingToDrive(false);
      setSyncStep('');
    }, 2000);
  };

  const today = new Date();
  const year = today.getFullYear();
  const monthStr = (today.getMonth() + 1).toString().padStart(2, '0');
  const dayStr = today.getDate().toString().padStart(2, '0');
  const todayISO = `${year}-${monthStr}-${dayStr}`;

  const [selectedAccount, setSelectedAccount] = useState<AccountType>('BDO');
  const [selectedMonth, setSelectedMonth] = useState(monthStr); 
  const [selectedDate, setSelectedDate] = useState(todayISO); 

  const [dieselViewMode, setDieselViewMode] = useState<'Daily' | 'Monthly'>('Daily');
  const [dieselSelectedMonth, setDieselSelectedMonth] = useState(monthStr);
  const [dieselSelectedDate, setDieselSelectedDate] = useState(todayISO);

  const [pieMonth, setPieMonth] = useState<string>('All');

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showDieselModal, setShowDieselModal] = useState(false);

  const [transactionPreFill, setTransactionPreFill] = useState<{
    type?: TransactionType;
    category?: string;
    description?: string;
  } | null>(null);

  const summary = useMemo<FinancialSummary>(() => {
    const calculate = (mode: AccountType) => 
      transactions.filter(t => t.mode === mode).reduce((acc, t) => acc + t.amount, 0);
    const fundsReceived = transactions.filter(t => t.type === 'fund').reduce((acc, t) => acc + t.amount, 0);
    
    const expenses = transactions
      .filter(t => {
        const isDieselBudget = (t.category === 'Diesel') || 
                               (t.description.toUpperCase().includes("ALLOCATED TODAY'S BUDGET FOR DIESEL"));
        return t.type === 'expense' && !isDieselBudget;
      })
      .reduce((acc, t) => acc + Math.abs(t.amount), 0);
      
    const dieselTotal = dieselReports.reduce((acc, d) => acc + d.amount, 0);

    return {
      bdo: calculate('BDO'),
      gcash: calculate('GCash'),
      cash: calculate('Cash'),
      total: calculate('BDO') + calculate('GCash') + calculate('Cash'),
      fundsReceived,
      expenses,
      dieselTotal
    };
  }, [transactions, dieselReports]);

  const getDatesInMonth = (month: string): string[] => {
    const targetMonth = month === 'All' ? '01' : month;
    const monthIndex = parseInt(targetMonth) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(`${year}-${targetMonth}-${day.toString().padStart(2, '0')}`);
    }
    return dates;
  };

  const availableDates = useMemo<string[]>(() => {
    const dates = getDatesInMonth(selectedMonth);
    return [...dates].sort();
  }, [selectedMonth, year]);

  const dieselAvailableDates = useMemo<string[]>(() => {
    const dates = getDatesInMonth(dieselSelectedMonth);
    return [...dates].sort();
  }, [dieselSelectedMonth, year]);

  useEffect(() => {
    if (selectedMonth !== 'All' && !selectedDate.includes(`-${selectedMonth}-`)) {
      setSelectedDate(selectedMonth === monthStr ? todayISO : availableDates[0]);
    }
  }, [selectedMonth, availableDates, monthStr, todayISO]);

  useEffect(() => {
    if (!dieselSelectedDate.includes(`-${dieselSelectedMonth}-`)) {
      setDieselSelectedDate(dieselSelectedMonth === monthStr ? todayISO : dieselAvailableDates[0]);
    }
  }, [dieselSelectedMonth, dieselAvailableDates, monthStr, todayISO]);

  const dailyLedger = useMemo<{
    beginningBalance: number;
    additionalFunds: Transaction[];
    totalFunds: number;
    expensesByCategory: Record<string, Transaction[]>;
    totalExpenses: number;
    availableBalance: number;
  } | null>(() => {
    if (!selectedDate) return null;
    const currentAccountTransactions = transactions.filter(t => t.mode === selectedAccount);
    const beginningBalance = currentAccountTransactions
      .filter(t => t.date < selectedDate)
      .reduce((acc, t) => acc + t.amount, 0);
    const additionalFunds = currentAccountTransactions
      .filter(t => t.date === selectedDate && t.type === 'fund');
    const totalAdditionalFunds = additionalFunds.reduce((acc, t) => acc + t.amount, 0);
    const totalFunds = beginningBalance + totalAdditionalFunds;
    const dayExpenses = currentAccountTransactions.filter(t => t.date === selectedDate && t.type === 'expense');
    const expensesByCategory: Record<string, Transaction[]> = {};
    dayExpenses.forEach(t => {
      if (!expensesByCategory[t.category]) expensesByCategory[t.category] = [];
      expensesByCategory[t.category].push(t);
    });
    const totalExpenses = dayExpenses.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const availableBalance = totalFunds - totalExpenses;
    return { beginningBalance, additionalFunds, totalFunds, expensesByCategory, totalExpenses, availableBalance };
  }, [transactions, selectedDate, selectedAccount]);

  const dieselLedger = useMemo(() => {
    const periodPrefix = dieselViewMode === 'Daily' ? dieselSelectedDate : `${year}-${dieselSelectedMonth}`;
    const budgetAllocations = transactions.filter(t => 
      t.date.startsWith(periodPrefix) && 
      (
        (t.category === 'Diesel') || 
        (t.description.toUpperCase().includes("ALLOCATED TODAY'S BUDGET FOR DIESEL"))
      )
    );
    const totalDieselBudget = budgetAllocations.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const filteredLogs = dieselViewMode === 'Daily' 
      ? dieselReports.filter(d => d.date === dieselSelectedDate)
      : dieselReports.filter(d => d.date.startsWith(periodPrefix));
    const periodExpenses = filteredLogs.reduce((acc, d) => acc + d.amount, 0);
    const returnedToFund = totalDieselBudget - periodExpenses;
    return { filteredLogs, dieselBudget: totalDieselBudget, periodTotal: periodExpenses, returnedToFund };
  }, [dieselReports, transactions, dieselViewMode, dieselSelectedDate, dieselSelectedMonth, year]);

  const categoryPieData = useMemo(() => {
    const catMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .filter(t => pieMonth === 'All' || t.date.split('-')[1] === pieMonth)
      .forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [transactions, pieMonth]);

  const deleteTransaction = (id: string) => { if (confirm('Delete this transaction?')) setTransactions(prev => prev.filter(t => t.id !== id)); };
  const deleteDiesel = (id: string) => { if (confirm('Delete this diesel report?')) setDieselReports(prev => prev.filter(d => d.id !== id)); };

  const exportToCSV = () => {
    setShowExportMenu(false);
    const rows = activeTab === 'transactions' ? transactions : dieselReports;
    const csvContent = "data:text/csv;charset=utf-8," + JSON.stringify(rows);
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${activeTab}_full_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 font-inter">
      {/* Sync Overlay */}
      {isSyncingToDrive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex flex-col items-center justify-center">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in duration-300">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin" />
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{syncStep}</h4>
          </div>
        </div>
      )}

      {/* Sidebar Desktop Only */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col border-r border-slate-800">
        <div className="p-8 pb-4 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Banknote className="w-6 h-6" />
            </div>
            <h1 className="text-sm font-bold tracking-tight leading-tight uppercase">Endaya Industries Corporation</h1>
          </div>
        </div>
        
        {/* Navigation Menu - Fixed at top */}
        <nav className="flex-1 px-4 space-y-2 py-4">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold text-sm uppercase">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <ListTodo className="w-5 h-5" />
            <span className="font-bold text-sm uppercase">Transactions</span>
          </button>
          <button onClick={() => setActiveTab('diesel')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${activeTab === 'diesel' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-200'}`}>
            <Fuel className="w-5 h-5" />
            <span className="font-bold text-sm uppercase">Diesel Logs</span>
          </button>
        </nav>

        {/* Spreadsheet Connection in Sidebar - Moved to bottom to prevent layout shifts */}
        {activeTab !== 'dashboard' && (
          <div className="px-6 pb-8 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button 
              onClick={connectGoogleDrive} 
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl w-full border text-[10px] font-black uppercase tracking-widest transition-all ${isDriveConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
              {isDriveConnected ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
              {isDriveConnected ? 'Drive Connected' : 'Link Google Drive'}
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden pb-20 lg:pb-0">
        <header className="h-24 lg:h-20 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{activeTab}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {isSaving ? 'SYNCING...' : lastSaved ? `LAST SAVED: ${lastSaved}` : 'READY'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Connect to Spreadsheets Button - Removed from Dashboard Header as requested */}
            {activeTab !== 'dashboard' && (
              <button 
                onClick={connectGoogleDrive} 
                className={`p-3 border rounded-xl transition-all shadow-sm ${isDriveConnected ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-white'}`}
                title={isDriveConnected ? "Spreadsheets Connected" : "Connect to Spreadsheets"}
              >
                <FileSpreadsheet size={18} />
              </button>
            )}

            {/* Manual Save / Sync Button */}
            <button 
              onClick={handleManualSave} 
              className="p-3 border border-slate-200 rounded-xl text-emerald-500 hover:bg-emerald-50 transition-all shadow-sm"
              title="Manual Sync"
            >
              <CheckCircle2 size={18} />
            </button>

            {/* Export Button - Hidden on Dashboard as requested */}
            {activeTab !== 'dashboard' && (
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)} 
                  className="p-3 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                  title="Export"
                >
                  <Download size={18} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <button onClick={exportToCSV} className="w-full text-left px-4 py-3 text-[10px] font-black text-slate-700 hover:bg-slate-50 uppercase tracking-widest border-b border-slate-100">Export as CSV</button>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => { setTransactionPreFill(null); activeTab === 'diesel' ? setShowDieselModal(true) : setShowTransactionModal(true); }} 
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-xl text-[11px] font-black text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all uppercase tracking-[0.15em] ml-1"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Entry</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <StatCard 
                  title="BDO FUNDS" 
                  amount={summary.bdo} 
                  icon={<Banknote />} 
                  gradient="bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]" 
                  accentColor="text-[#1e3a8a]" 
                />
                <StatCard 
                  title="GCASH BALANCE" 
                  amount={summary.gcash} 
                  icon={<CreditCard />} 
                  gradient="bg-gradient-to-br from-[#0070f3] to-[#00b4ff]" 
                  accentColor="text-[#0070f3]" 
                />
                <StatCard 
                  title="CASH ON HAND" 
                  amount={summary.cash} 
                  icon={<Wallet />} 
                  gradient="bg-gradient-to-br from-[#f59e0b] to-[#ea580c]" 
                  accentColor="text-[#ea580c]" 
                />
                <StatCard 
                  title="TOTAL FUND" 
                  amount={summary.total} 
                  icon={<TrendingUp />} 
                  gradient="bg-gradient-to-br from-slate-800 to-slate-950" 
                  accentColor="text-slate-800" 
                />
              </div>
              
              <div className="flex justify-center pb-10">
                <div className="w-full max-w-5xl bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Expense Distribution</h3>
                    <div className="relative">
                      <select 
                        value={pieMonth} 
                        onChange={(e) => setPieMonth(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-8 text-[11px] font-black uppercase tracking-widest text-slate-500 focus:outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/10"
                      >
                        <option value="All">All Months</option>
                        {Array.from({length: 12}, (_, i) => {
                          const m = (i + 1).toString().padStart(2, '0');
                          return <option key={m} value={m}>{new Date(2000, i).toLocaleString('default', {month: 'long'})}</option>
                        })}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between gap-12 flex-1 min-h-0">
                    <div className="w-full md:w-1/2 relative min-h-[350px]">
                      {chartsReady && categoryPieData.length > 0 && (
                        <ResponsiveContainer key={`pie-${chartsReady ? 'ready' : 'pending'}`} width="100%" height={350} minWidth={0} minHeight={0}>
                          <PieChart>
                            <Pie 
                              data={categoryPieData} 
                              innerRadius={80} 
                              outerRadius={125} 
                              dataKey="value" 
                              paddingAngle={5}
                              animationDuration={1000}
                              isAnimationActive={true}
                            >
                              {categoryPieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => formatPHP(value)}
                              contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 25px 30px -5px rgb(0 0 0 / 0.1)', fontWeight: '800', fontSize: '12px', padding: '12px 16px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                      {[...categoryPieData].sort((a,b) => b.value - a.value).map((cat, i) => (
                        <div key={cat.name} className="flex items-center justify-between text-[13px] font-black group hover:bg-slate-50 p-4 rounded-2xl transition-all border border-transparent hover:border-slate-100 cursor-default">
                          <div className="flex items-center gap-4">
                            <div className="w-4 h-4 rounded-md shadow-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-slate-500 uppercase tracking-tight">{cat.name}</span>
                          </div>
                          <span className="text-slate-800 text-lg">{formatPHP(cat.value)}</span>
                        </div>
                      ))}
                      {categoryPieData.length === 0 && (
                        <div className="text-center py-20 opacity-30 flex flex-col items-center">
                          <Wallet2 className="w-16 h-16 mb-4 text-slate-300" />
                          <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">No transactions recorded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {['BDO', 'GCash', 'Cash'].map(acc => (
                    <button key={acc} onClick={() => setSelectedAccount(acc as AccountType)} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${selectedAccount === acc ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      {acc}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 group min-w-[200px]">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-sm font-black text-slate-700 focus:outline-none cursor-pointer w-full uppercase">
                    {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
                  </select>
                </div>
              </div>
              {dailyLedger && (
                <div className="bg-white rounded-[2rem] shadow-lg border border-slate-200 overflow-hidden font-sans text-[15px] max-w-5xl mx-auto">
                  <div className="bg-indigo-600 text-center py-8 text-white uppercase font-black">
                    <div className="text-xs tracking-[0.2em] mb-1 opacity-90 font-bold">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</div>
                    <div className="text-xl tracking-[0.1em]">{selectedAccount} TRANSACTIONS</div>
                  </div>
                  <div className="flex justify-end items-center px-8 py-5 border-b border-slate-100 bg-white">
                    <span className="font-black text-slate-500 text-[10px] uppercase mr-4 tracking-widest">Available Balance:</span>
                    <span className="text-indigo-600 text-2xl font-black">₱ {dailyLedger.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <table className="w-full border-collapse">
                    <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100"><th className="px-4 py-4 text-left w-3/5 tracking-[0.1em] pl-4">Description</th><th className="px-4 py-4 text-right tracking-[0.1em]">Amount</th><th className="px-4 py-4 text-right tracking-[0.1em] pr-4">Action</th></tr></thead>
                    <tbody>
                      <tr className="border-b border-slate-50"><td className="px-4 py-5 font-black text-slate-800 uppercase text-[15px] pl-4">Beginning Balance:</td><td className="px-4 py-5 text-right"></td><td className="px-4 py-5 text-right font-black text-slate-800 text-[16px] pr-4">₱ {dailyLedger.beginningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                      {dailyLedger.additionalFunds.map((fund: Transaction) => (
                        <tr key={fund.id} className="border-b border-slate-50 hover:bg-emerald-50/20 group transition-colors">
                          <td className="px-4 py-5 flex flex-col pl-4"><span className="text-emerald-700 font-bold uppercase tracking-tight text-[14px] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {fund.description}</span></td>
                          <td className="px-4 py-5 text-right text-emerald-600 font-bold uppercase text-[14px]">₱ {fund.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-5 text-right pr-4"><button onClick={() => deleteTransaction(fund.id)} className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 border-b border-slate-200"><td colSpan={3} className="px-4 py-2.5 font-black text-slate-500 uppercase text-[11px] tracking-wider pl-4">Expenses / Deductions:</td></tr>
                      {Object.entries(dailyLedger.expensesByCategory).map(([cat, transList]: [string, Transaction[]]) => (
                        <React.Fragment key={cat}>
                          <tr className="bg-slate-50/50"><td colSpan={3} className="px-4 py-3 font-black text-slate-400 uppercase text-[12px] underline underline-offset-4 tracking-[0.15em] pl-4">{cat}</td></tr>
                          {transList.map((t: Transaction) => (
                            <tr key={t.id} className="border-b border-slate-50 hover:bg-rose-50/30 group transition-colors">
                              <td className="pl-4 py-4 pr-4"><span className="text-slate-700 font-bold uppercase text-[14px]">{t.description}</span></td>
                              <td className="px-4 py-4 text-right text-rose-600 font-bold uppercase text-[14px]">₱ {Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-4 text-right pr-4"><button onClick={() => deleteTransaction(t.id)} className="text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button></td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-slate-50 border-t-2 border-slate-900"><td className="px-4 py-6 font-black text-slate-900 uppercase text-[17px] pl-4">Total Daily Expenses</td><td className="px-4 py-6"></td><td className="px-4 py-6 text-right font-black text-slate-900 text-[18px] pr-4">₱ {dailyLedger.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'diesel' && (
            <div className="space-y-6 animate-in zoom-in duration-500 pb-20">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {['Daily', 'Monthly'].map(mode => (
                    <button key={mode} onClick={() => setDieselViewMode(mode as 'Daily' | 'Monthly')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${dieselViewMode === mode ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{mode}</button>
                  ))}
                </div>
                {dieselViewMode === 'Daily' && (
                  <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 group min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <select value={dieselSelectedDate} onChange={(e) => setDieselSelectedDate(e.target.value)} className="bg-transparent text-sm font-black text-slate-700 focus:outline-none cursor-pointer w-full uppercase">
                      {dieselAvailableDates.map(date => <option key={date} value={date}>{date}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden font-sans text-[15px] max-w-5xl mx-auto border border-slate-100">
                <div className="bg-orange-600 text-center py-12 text-white uppercase font-black relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12 translate-x-1/4 translate-y-1/4"><Fuel size={180} /></div>
                  <div className="text-[10px] tracking-[0.3em] mb-2 opacity-90 font-bold relative z-10">{dieselViewMode === 'Daily' ? new Date(dieselSelectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() : `${new Date(year, parseInt(dieselSelectedMonth)-1).toLocaleString('default', {month: 'long'}).toUpperCase()} ${year}`}</div>
                  <div className="text-3xl tracking-[0.1em] relative z-10">DIESEL CONSUMPTION LOGS</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-slate-100">
                  <div className="p-10 border-r border-slate-100 flex flex-col items-center text-center">
                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><Wallet2 size={12}/> TOTAL DIESEL BUDGET</span>
                    <span className="text-slate-800 text-3xl font-black mb-4">{formatPHP(dieselLedger.dieselBudget)}</span>
                  </div>
                  <div className="p-10 flex flex-col items-center text-center bg-orange-50/20">
                    <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2"><Undo2 size={12}/> RETURNED TO EIC FUND</span>
                    <span className={`text-3xl font-black ${dieselLedger.returnedToFund < 0 ? 'text-rose-600' : 'text-orange-600'}`}>{formatPHP(dieselLedger.returnedToFund)}</span>
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-orange-100 text-[9px] font-black text-orange-400 uppercase tracking-widest"><ReceiptText size={12} />Daily isolated tracking</div>
                  </div>
                </div>

                <div className="p-0 overflow-x-auto">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                        <th className="px-4 py-5 text-left tracking-widest pl-4">LOG DATE / VEHICLE</th>
                        <th className="px-4 py-5 text-left tracking-widest">AREA CODE</th>
                        <th className="px-4 py-5 text-left tracking-widest">STAFF</th>
                        <th className="px-4 py-5 text-right tracking-widest">COST (PHP)</th>
                        <th className="px-4 py-5 text-center tracking-widest pr-4">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dieselLedger.filteredLogs.length > 0 ? dieselLedger.filteredLogs.map((d: DieselReport) => (
                        <tr key={d.id} className="hover:bg-orange-50/10 group transition-colors">
                          <td className="px-4 py-6 flex flex-col pl-4"><span className="font-black text-slate-800 uppercase text-[14px]">{d.vehicle}</span><span className="text-[10px] font-bold text-slate-400 uppercase">{d.date}</span></td>
                          <td className="px-4 py-6 uppercase text-[12px] font-bold">{d.areaCode}</td>
                          <td className="px-4 py-6 uppercase text-[12px] font-bold">{d.assignedStaff}</td>
                          <td className="px-4 py-6 text-right text-orange-600 font-black text-[15px]">₱ {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-6 text-center pr-4"><button onClick={() => deleteDiesel(d.id)} className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} className="py-24 text-center opacity-10 uppercase font-black tracking-widest text-slate-400">No logs found for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                  <div className="bg-slate-50 px-4 py-10 flex justify-between items-center border-t border-slate-100 shadow-inner">
                    <span className="font-black text-slate-800 uppercase text-[15px] tracking-tight pl-4">TOTAL EXPENSE FOR THIS {dieselViewMode.toUpperCase()}</span>
                    <span className="text-slate-800 font-black text-2xl pr-4">₱ {dieselLedger.periodTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200 h-20 flex items-center justify-around px-6 z-[60] shadow-[0_-10px_25px_-10px_rgba(0,0,0,0.1)]">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex flex-col items-center justify-center gap-1.5 transition-all w-16 h-16 rounded-2xl ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-2' : 'text-slate-400'}`}
          >
            <LayoutGrid size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('transactions')} 
            className={`flex flex-col items-center justify-center gap-1.5 transition-all w-16 h-16 rounded-2xl ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-2' : 'text-slate-400'}`}
          >
            <ListTodo size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('diesel')} 
            className={`flex flex-col items-center justify-center gap-1.5 transition-all w-16 h-16 rounded-2xl ${activeTab === 'diesel' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 -translate-y-2' : 'text-slate-400'}`}
          >
            <Fuel size={24} />
          </button>
        </nav>
      </main>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">New Transaction</h3>
              <button onClick={() => { setShowTransactionModal(false); setTransactionPreFill(null); }} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const amountVal = Math.abs(parseFloat(formData.get('amount') as string));
              const typeVal = formData.get('type') as TransactionType;
              const newT: Transaction = {
                id: Date.now().toString(),
                date: formData.get('date') as string,
                description: (formData.get('description') as string).toUpperCase(),
                amount: amountVal * (typeVal === 'expense' ? -1 : 1),
                type: typeVal,
                mode: formData.get('mode') as AccountType,
                category: formData.get('category') as string
              };
              setTransactions(prev => [...prev, newT]);
              setShowTransactionModal(false); setTransactionPreFill(null);
            }} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label><input name="date" type="date" required defaultValue={selectedDate} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:ring-2 focus:ring-indigo-500/10 focus:outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label><select name="type" defaultValue={transactionPreFill?.type || "expense"} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"><option value="expense">EXPENSE OUT</option><option value="fund">FUND RECEIVED IN</option></select></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label><input name="description" required defaultValue={transactionPreFill?.description || ""} placeholder="Description..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:ring-2 focus:ring-indigo-500/10 focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account</label><select name="mode" defaultValue={selectedAccount} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"><option value="BDO">BDO</option><option value="GCASH">GCASH</option><option value="CASH">CASH</option></select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><select name="category" defaultValue={transactionPreFill?.category || "Fund Transfer"} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:ring-2 focus:ring-indigo-500/10 focus:outline-none">{allCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (PHP)</label><input name="amount" type="number" step="0.01" required placeholder="0.00" autoFocus={!!transactionPreFill} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 text-3xl font-black uppercase text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none shadow-inner" /></div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all hover:scale-[1.01]">Save Entry</button>
            </form>
          </div>
        </div>
      )}

      {/* Diesel Log Modal */}
      {showDieselModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between"><h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Log Diesel Vehicle Cost</h3><button onClick={() => setShowDieselModal(false)} className="p-3 rounded-full hover:bg-slate-100 transition-colors"><X size={20}/></button></div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newD: DieselReport = {
                id: Date.now().toString(),
                date: formData.get('date') as string,
                vehicle: (formData.get('vehicle') as string).toUpperCase(),
                areaCode: (formData.get('areaCode') as string).toUpperCase(),
                assignedStaff: (formData.get('assignedStaff') as string).toUpperCase(),
                amount: parseFloat(formData.get('amount') as string)
              };
              setDieselReports(prev => [...prev, newD]);
              setShowDieselModal(false);
            }} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label><input name="date" type="date" required defaultValue={selectedDate} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Area Code</label><input name="areaCode" placeholder="MKT..." required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:outline-none" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Staff</label><input name="assignedStaff" placeholder="Staff Name..." required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle Plate/Unit</label><input name="vehicle" placeholder="TRUCK 01..." required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:outline-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost (PHP)</label><input name="amount" type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black uppercase focus:outline-none" /></div>
              </div>
              <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 hover:bg-orange-700 transition-all hover:scale-[1.01]">Save Cost Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
