import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import ChatManagementModal from './ChatManagementModal';
import UserGuide from './UserGuide';
import InstallButton from './InstallButton';
import CharterArchive from './CharterArchive';
import { textMatches } from './utils/searchUtils';
// 🔥 FIX 16: Import API functions for multi-device sync
// 🔥 FIX 31: Added checkExpiredOptions for auto-expire
import { getBookingsByVessel, getAllBookings, checkExpiredOptions, getInvoicesByVessel } from './services/apiService';
// 📊 Charts for Statistics modal
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
// 🔥 Auto-refresh hook for polling API data
import { useAutoRefresh } from './hooks/useAutoRefresh';

// Import icons from FleetManagement or create here
const icons = {
  home: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>),
  logout: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>),
  bookingSheet: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>),
  shield: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>),
  plus: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>),
  x: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>),
  fileText: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>),
  chevronLeft: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>),
  returnArrow: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>),
  eye: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>)
};

const COMPANY_INFO = {
  name: "TAILWIND YACHTING",
  emails: {
    info: "info@tailwindyachting.com"
  }
};

// Header Component
function Header({ title, onBack, onHome = null }) {
  const user = authService.getCurrentUser();

  return (
    <div className="bg-[#1e40af] p-4 shadow-md flex items-center justify-between border-b border-[#d1d5db]">
      {/* LEFT: Home button - styled with house icon */}
      {onHome && (
        <button
          onClick={onHome}
          className="bg-[#1e40af] hover:bg-blue-700 border border-blue-400 rounded-lg px-3 py-2 transition-colors flex flex-col items-center min-w-[60px]"
          title="Αρχική"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span className="text-[10px] text-white mt-1 font-medium">Αρχική</span>
        </button>
      )}
      {!onHome && <div className="w-16"></div>}

      <div className="flex-grow text-center">
        <h1 className="text-xl font-bold text-white truncate px-2">{title}</h1>
        {user && (
          <div className="flex items-center justify-center gap-2 mt-1">
            {user.role === 'OWNER' ? icons.eye : icons.shield}
            <span className="text-xs text-blue-200 font-semibold">
              {user.role === 'OWNER' ? `${user.name} (View Only)` : user.name}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT: Return arrow - just navigate back, NO logout */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-white p-2 hover:bg-blue-700 rounded-lg transition-colors flex flex-col items-center"
          title="Πίσω (παραμένετε συνδεδεμένοι)"
        >
          {icons.returnArrow}
          <span className="text-[10px] mt-0.5">Return</span>
        </button>
      )}
      {!onBack && <div className="w-12"></div>}
    </div>
  );
}

// 📊 Statistics Modal Component - PROFESSIONAL REDESIGN (Seazone/Voly/Latitude365 Inspired)
interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boats: any[];
}

// Custom tooltip for charts - Light Blue Theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-blue-300 rounded-lg p-3 shadow-xl">
        <p className="text-blue-700 font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: €{entry.value?.toLocaleString('el-GR', { minimumFractionDigits: 0 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Animated stat card component - Light Blue Theme
const StatCard = ({ title, value, subtitle, icon, trend, color, delay = 0 }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  color: string;
  delay?: number;
}) => (
  <div
    className={`relative overflow-hidden rounded-xl p-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl cursor-default group bg-white/90 border border-blue-200 shadow-md`}
    style={{
      borderLeft: `4px solid ${color}`,
      animationDelay: `${delay}ms`
    }}
  >
    <div className="absolute top-0 right-0 w-20 h-20 opacity-15 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
      <span className="text-5xl">{icon}</span>
    </div>
    <div className="relative z-10">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
      <p className="text-gray-800 text-xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
        </div>
      )}
    </div>
  </div>
);

// Chart colors - professional palette for light theme
const CHART_COLORS = {
  income: '#0D9488',      // Teal-600
  expenses: '#DC2626',    // Red-600
  commission: '#D97706',  // Amber-600
  invoices: '#7C3AED',    // Violet-600
  profit: '#059669',      // Emerald-600
  neutral: '#6B7280'      // Gray-500
};

function StatisticsModal({ isOpen, onClose, boats }: StatisticsModalProps) {
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedBoat, setSelectedBoat] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [chartersData, setChartersData] = useState<any[]>([]);
  const [invoicesData, setInvoicesData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'boats'>('overview');
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lang, setLang] = useState<'el' | 'en'>('el');

  // Get available years dynamically from data (last 5 years as fallback)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Load charters and invoices data when modal opens or filters change
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        let allCharters: any[] = [];
        let allInvoices: any[] = [];

        if (selectedBoat === 'all') {
          // Load charters and invoices from all boats in parallel
          const results = await Promise.all(boats.map(async (boat) => {
            const [boatCharters, boatInvoices] = await Promise.all([
              getBookingsByVessel(boat.id).catch(() => []),
              getInvoicesByVessel(boat.id).catch(() => {
                // Fallback to localStorage for invoices
                const key = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
                const stored = localStorage.getItem(key);
                return stored ? JSON.parse(stored) : [];
              })
            ]);
            return {
              charters: boatCharters.map((c: any) => ({ ...c, boatName: boat.name, boatId: boat.id })),
              invoices: boatInvoices.map((i: any) => ({ ...i, boatName: boat.name, boatId: boat.id }))
            };
          }));

          results.forEach(r => {
            allCharters = [...allCharters, ...r.charters];
            allInvoices = [...allInvoices, ...r.invoices];
          });
        } else {
          // Load charters and invoices from selected boat
          const boat = boats.find(b => b.id === selectedBoat || String(b.id) === selectedBoat);
          const boatId = boat?.id || selectedBoat;

          const [boatCharters, boatInvoices] = await Promise.all([
            getBookingsByVessel(boatId).catch(() => []),
            getInvoicesByVessel(boatId).catch(() => {
              const key = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
              const stored = localStorage.getItem(key);
              return stored ? JSON.parse(stored) : [];
            })
          ]);

          allCharters = boatCharters.map((c: any) => ({ ...c, boatName: boat?.name || selectedBoat, boatId }));
          allInvoices = boatInvoices.map((i: any) => ({ ...i, boatName: boat?.name || selectedBoat, boatId }));
        }

        // Filter charters by year
        const filteredCharters = allCharters.filter((c: any) => {
          const charterDate = c.startDate || c.dateFrom || c.date;
          if (!charterDate) return false;
          const year = new Date(charterDate).getFullYear();
          return year === selectedYear;
        });

        // Filter invoices by year
        const filteredInvoices = allInvoices.filter((i: any) => {
          const invoiceDate = i.date || i.invoiceDate || i.createdAt;
          if (!invoiceDate) return false;
          const year = new Date(invoiceDate).getFullYear();
          return year === selectedYear;
        });

        setChartersData(filteredCharters);
        setInvoicesData(filteredInvoices);
        console.log(`📊 Stats: Loaded ${filteredCharters.length} charters and ${filteredInvoices.length} invoices for ${selectedYear}`);
      } catch (error) {
        console.error('Error loading statistics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, selectedYear, selectedBoat, boats]);

  // Calculate statistics including invoices
  const statistics = React.useMemo(() => {
    // Charter income
    const totalIncome = chartersData.reduce((sum, c) => sum + (c.amount || c.totalAmount || c.charterAmount || 0), 0);

    // Charter expenses (commission + VAT)
    const totalCommission = chartersData.reduce((sum, c) => sum + (c.commission || 0), 0);
    const totalVat = chartersData.reduce((sum, c) => sum + (c.vat_on_commission || c.vatOnCommission || 0), 0);
    const charterExpenses = totalCommission + totalVat;

    // Invoice expenses (boat expenses/timologia)
    const invoiceExpenses = invoicesData.reduce((sum, i) => sum + (i.amount || 0), 0);

    // Total expenses = charter expenses + invoice expenses
    const totalExpenses = charterExpenses + invoiceExpenses;
    const netProfit = totalIncome - totalExpenses;
    const charterCount = chartersData.length;
    const invoiceCount = invoicesData.length;
    const avgValue = charterCount > 0 ? totalIncome / charterCount : 0;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Find best performing boat (by net profit)
    const boatPerformance: { [key: string]: { income: number; expenses: number; name: string } } = {};

    // Add charter income
    chartersData.forEach(c => {
      const boatId = c.boatId || c.vesselId || 'unknown';
      const boatName = c.boatName || c.vesselName || boatId;
      if (!boatPerformance[boatId]) {
        boatPerformance[boatId] = { income: 0, expenses: 0, name: boatName };
      }
      boatPerformance[boatId].income += (c.amount || c.totalAmount || c.charterAmount || 0);
      boatPerformance[boatId].expenses += (c.commission || 0) + (c.vat_on_commission || c.vatOnCommission || 0);
    });

    // Add invoice expenses
    invoicesData.forEach(i => {
      const boatId = i.boatId || i.vesselId || 'unknown';
      const boatName = i.boatName || i.vesselName || boatId;
      if (!boatPerformance[boatId]) {
        boatPerformance[boatId] = { income: 0, expenses: 0, name: boatName };
      }
      boatPerformance[boatId].expenses += (i.amount || 0);
    });

    // Sort by net profit (income - expenses)
    const bestBoat = Object.entries(boatPerformance)
      .map(([id, data]) => ({ id, ...data, net: data.income - data.expenses }))
      .sort((a, b) => b.net - a.net)[0];

    return {
      totalIncome,
      totalExpenses,
      charterExpenses,
      invoiceExpenses,
      netProfit,
      charterCount,
      invoiceCount,
      avgValue,
      profitMargin,
      bestBoat: bestBoat ? { name: bestBoat.name, income: bestBoat.income, net: bestBoat.net } : null
    };
  }, [chartersData, invoicesData]);

  // Translation helper
  const t = React.useCallback((el: string, en: string) => lang === 'el' ? el : en, [lang]);

  // Prepare pie chart data with breakdown
  const pieChartData = React.useMemo(() => {
    if (statistics.totalIncome === 0 && statistics.totalExpenses === 0) {
      return [{ name: t('Δεν υπάρχουν δεδομένα', 'No data available'), value: 1, fill: CHART_COLORS.neutral }];
    }
    return [
      { name: t('Καθαρό Κέρδος', 'Net Profit'), value: Math.max(0, statistics.netProfit), fill: CHART_COLORS.profit },
      { name: t('Προμήθειες', 'Commissions'), value: statistics.charterExpenses, fill: CHART_COLORS.commission },
      { name: t('Τιμολόγια', 'Invoices'), value: statistics.invoiceExpenses, fill: CHART_COLORS.invoices }
    ].filter(d => d.value > 0);
  }, [statistics, t]);

  // Income vs Expenses donut chart
  const incomeExpenseData = React.useMemo(() => {
    if (statistics.totalIncome === 0 && statistics.totalExpenses === 0) {
      return [{ name: t('Δεν υπάρχουν δεδομένα', 'No data available'), value: 1, fill: CHART_COLORS.neutral }];
    }
    return [
      { name: t('Έσοδα', 'Income'), value: statistics.totalIncome, fill: CHART_COLORS.income },
      { name: t('Έξοδα', 'Expenses'), value: statistics.totalExpenses, fill: CHART_COLORS.expenses }
    ];
  }, [statistics, t]);

  // Monthly/Quarterly/Yearly data aggregation
  const periodData = React.useMemo(() => {
    const monthNames = lang === 'el'
      ? ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

    let data: { name: string; income: number; expenses: number; profit: number; charterExpenses: number; invoiceExpenses: number; charters: number }[] = [];

    if (selectedPeriod === 'monthly') {
      data = monthNames.map((name) => ({
        name,
        income: 0,
        expenses: 0,
        profit: 0,
        charterExpenses: 0,
        invoiceExpenses: 0,
        charters: 0
      }));

      chartersData.forEach(c => {
        const charterDate = c.startDate || c.dateFrom || c.date;
        if (!charterDate) return;
        const month = new Date(charterDate).getMonth();
        const charterExp = (c.commission || 0) + (c.vat_on_commission || c.vatOnCommission || 0);
        const income = c.amount || c.totalAmount || c.charterAmount || 0;
        data[month].income += income;
        data[month].charterExpenses += charterExp;
        data[month].expenses += charterExp;
        data[month].charters += 1;
      });

      invoicesData.forEach(i => {
        const invoiceDate = i.date || i.invoiceDate || i.createdAt;
        if (!invoiceDate) return;
        const month = new Date(invoiceDate).getMonth();
        const amount = i.amount || 0;
        data[month].invoiceExpenses += amount;
        data[month].expenses += amount;
      });

      // Calculate profit for each month
      data.forEach(d => {
        d.profit = d.income - d.expenses;
      });
    } else if (selectedPeriod === 'quarterly') {
      data = quarterNames.map((name) => ({
        name,
        income: 0,
        expenses: 0,
        profit: 0,
        charterExpenses: 0,
        invoiceExpenses: 0,
        charters: 0
      }));

      chartersData.forEach(c => {
        const charterDate = c.startDate || c.dateFrom || c.date;
        if (!charterDate) return;
        const quarter = Math.floor(new Date(charterDate).getMonth() / 3);
        const charterExp = (c.commission || 0) + (c.vat_on_commission || c.vatOnCommission || 0);
        const income = c.amount || c.totalAmount || c.charterAmount || 0;
        data[quarter].income += income;
        data[quarter].charterExpenses += charterExp;
        data[quarter].expenses += charterExp;
        data[quarter].charters += 1;
      });

      invoicesData.forEach(i => {
        const invoiceDate = i.date || i.invoiceDate || i.createdAt;
        if (!invoiceDate) return;
        const quarter = Math.floor(new Date(invoiceDate).getMonth() / 3);
        const amount = i.amount || 0;
        data[quarter].invoiceExpenses += amount;
        data[quarter].expenses += amount;
      });

      // Calculate profit for each quarter
      data.forEach(d => {
        d.profit = d.income - d.expenses;
      });
    } else {
      // Yearly - single aggregation
      data = [{
        name: String(selectedYear),
        income: statistics.totalIncome,
        expenses: statistics.totalExpenses,
        profit: statistics.netProfit,
        charterExpenses: statistics.charterExpenses,
        invoiceExpenses: statistics.invoiceExpenses,
        charters: statistics.charterCount
      }];
    }

    return data;
  }, [chartersData, invoicesData, selectedPeriod, selectedYear, statistics, lang]);

  // Per-boat data for bar chart (including invoices)
  const boatData = React.useMemo(() => {
    const boatMap: { [key: string]: { name: string; income: number; expenses: number; profit: number; charterExpenses: number; invoiceExpenses: number; charters: number; invoices: number } } = {};

    chartersData.forEach(c => {
      const boatId = c.boatId || c.vesselId || 'unknown';
      const boatName = c.boatName || c.vesselName || boatId;
      if (!boatMap[boatId]) {
        boatMap[boatId] = { name: boatName, income: 0, expenses: 0, profit: 0, charterExpenses: 0, invoiceExpenses: 0, charters: 0, invoices: 0 };
      }
      const charterExp = (c.commission || 0) + (c.vat_on_commission || c.vatOnCommission || 0);
      boatMap[boatId].income += (c.amount || c.totalAmount || c.charterAmount || 0);
      boatMap[boatId].charterExpenses += charterExp;
      boatMap[boatId].expenses += charterExp;
      boatMap[boatId].charters += 1;
    });

    invoicesData.forEach(i => {
      const boatId = i.boatId || i.vesselId || 'unknown';
      const boatName = i.boatName || i.vesselName || boatId;
      if (!boatMap[boatId]) {
        boatMap[boatId] = { name: boatName, income: 0, expenses: 0, profit: 0, charterExpenses: 0, invoiceExpenses: 0, charters: 0, invoices: 0 };
      }
      const amount = i.amount || 0;
      boatMap[boatId].invoiceExpenses += amount;
      boatMap[boatId].expenses += amount;
      boatMap[boatId].invoices += 1;
    });

    // Calculate profit for each boat
    Object.values(boatMap).forEach(b => {
      b.profit = b.income - b.expenses;
    });

    return Object.values(boatMap).sort((a, b) => b.profit - a.profit);
  }, [chartersData, invoicesData]);

  // Format currency helper
  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('el-GR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Export to PDF - Fixed implementation
  const exportToPDF = async () => {
    console.log('PDF Export clicked');
    alert('PDF Export started - check console for progress');
    setIsExporting('pdf');
    try {
      console.log('Importing jsPDF...');
      const { default: jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      const doc = new jsPDF();

      // Header
      doc.setFillColor(20, 30, 48);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('TAILWIND YACHTING', 105, 18, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Financial Statistics Report', 105, 28, { align: 'center' });

      // Filters info
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      const boatName = selectedBoat === 'all' ? 'All Boats' : boats.find(b => b.id === selectedBoat || String(b.id) === selectedBoat)?.name || selectedBoat;
      doc.text(`Year: ${selectedYear} | Boat: ${boatName} | Period: ${selectedPeriod}`, 105, 50, { align: 'center' });

      // Summary section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Financial Summary', 20, 65);

      doc.setFontSize(11);
      const summaryY = 75;
      const col1 = 20;
      const col2 = 110;

      doc.setTextColor(20, 184, 166);
      doc.text(`Total Income: ${formatCurrency(statistics.totalIncome)}`, col1, summaryY);
      doc.setTextColor(244, 63, 94);
      doc.text(`Total Expenses: ${formatCurrency(statistics.totalExpenses)}`, col2, summaryY);

      doc.setTextColor(0, 0, 0);
      doc.text(`  - Commissions: ${formatCurrency(statistics.charterExpenses)}`, col1, summaryY + 8);
      doc.text(`  - Invoices: ${formatCurrency(statistics.invoiceExpenses)}`, col1, summaryY + 16);

      doc.setTextColor(16, 185, 129);
      doc.text(`Net Profit: ${formatCurrency(statistics.netProfit)}`, col2, summaryY + 8);
      doc.setTextColor(0, 0, 0);
      doc.text(`Profit Margin: ${statistics.profitMargin.toFixed(1)}%`, col2, summaryY + 16);

      doc.text(`Charters: ${statistics.charterCount}`, col1, summaryY + 28);
      doc.text(`Average Value: ${formatCurrency(statistics.avgValue)}`, col2, summaryY + 28);

      if (statistics.bestBoat) {
        doc.text(`Best Boat: ${statistics.bestBoat.name} (${formatCurrency(statistics.bestBoat.net)})`, col1, summaryY + 36);
      }

      // Period breakdown
      let y = summaryY + 55;
      doc.setFontSize(14);
      doc.text(`${selectedPeriod === 'monthly' ? 'Monthly' : selectedPeriod === 'quarterly' ? 'Quarterly' : 'Yearly'} Breakdown`, 20, y);

      doc.setFontSize(10);
      y += 10;

      periodData.forEach((m) => {
        if (m.income > 0 || m.expenses > 0) {
          doc.setTextColor(0, 0, 0);
          doc.text(`${m.name}:`, 20, y);
          doc.setTextColor(20, 184, 166);
          doc.text(`Income ${formatCurrency(m.income)}`, 45, y);
          doc.setTextColor(244, 63, 94);
          doc.text(`Expenses ${formatCurrency(m.expenses)}`, 95, y);
          doc.setTextColor(m.profit >= 0 ? 16 : 244, m.profit >= 0 ? 185 : 63, m.profit >= 0 ? 129 : 94);
          doc.text(`Profit ${formatCurrency(m.profit)}`, 150, y);
          y += 7;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        }
      });

      // Per boat breakdown
      if (boatData.length > 0 && selectedBoat === 'all') {
        y += 10;
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Per Boat Performance', 20, y);
        y += 10;
        doc.setFontSize(10);

        boatData.forEach(b => {
          doc.setTextColor(0, 0, 0);
          doc.text(`${b.name}:`, 20, y);
          doc.setTextColor(20, 184, 166);
          doc.text(`${formatCurrency(b.income)}`, 70, y);
          doc.setTextColor(244, 63, 94);
          doc.text(`${formatCurrency(b.expenses)}`, 110, y);
          doc.setTextColor(b.profit >= 0 ? 16 : 244, b.profit >= 0 ? 185 : 63, b.profit >= 0 ? 129 : 94);
          doc.text(`${formatCurrency(b.profit)}`, 150, y);
          y += 7;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString('el-GR')}`, 105, 290, { align: 'center' });

      const filename = `Statistics_${selectedYear}_${selectedBoat === 'all' ? 'AllBoats' : selectedBoat}.pdf`;
      console.log('Saving PDF as:', filename);
      doc.save(filename);
      console.log('PDF saved successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Error exporting to PDF: ' + (error as Error).message);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to Word - Fixed implementation
  const exportToWord = async () => {
    console.log('Word Export clicked');
    setIsExporting('word');
    try {
      console.log('Importing docx...');
      const docx = await import('docx');
      console.log('docx imported successfully');
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;

      const boatName = selectedBoat === 'all' ? 'All Boats' : boats.find(b => b.id === selectedBoat || String(b.id) === selectedBoat)?.name || selectedBoat;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'TAILWIND YACHTING', bold: true, size: 48, color: '14B8A6' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Financial Statistics Report', size: 28, color: '666666' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Year: ${selectedYear}  |  Boat: ${boatName}  |  Period: ${selectedPeriod}`, size: 20, color: '888888' })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 }
            }),
            new Paragraph({
              text: 'Financial Summary',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Income', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(statistics.totalIncome), color: '14B8A6' })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Expenses', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(statistics.totalExpenses), color: 'F43F5E' })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Net Profit', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(statistics.netProfit), color: statistics.netProfit >= 0 ? '10B981' : 'F43F5E' })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Profit Margin', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${statistics.profitMargin.toFixed(1)}%` })] })] }),
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Charters', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ text: String(statistics.charterCount) })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Average Value', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ text: formatCurrency(statistics.avgValue) })] }),
                  ]
                }),
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 400 } }),
            new Paragraph({
              text: `${selectedPeriod === 'monthly' ? 'Monthly' : selectedPeriod === 'quarterly' ? 'Quarterly' : 'Yearly'} Breakdown`,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            ...periodData.filter(m => m.income > 0 || m.expenses > 0).map(m =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${m.name}: `, bold: true }),
                  new TextRun({ text: `Income ${formatCurrency(m.income)}`, color: '14B8A6' }),
                  new TextRun({ text: '  |  ' }),
                  new TextRun({ text: `Expenses ${formatCurrency(m.expenses)}`, color: 'F43F5E' }),
                  new TextRun({ text: '  |  ' }),
                  new TextRun({ text: `Profit ${formatCurrency(m.profit)}`, color: m.profit >= 0 ? '10B981' : 'F43F5E' })
                ],
                spacing: { after: 100 }
              })
            ),
            ...(selectedBoat === 'all' && boatData.length > 0 ? [
              new Paragraph({ text: '', spacing: { after: 400 } }),
              new Paragraph({
                text: 'Per Boat Performance',
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
              }),
              ...boatData.map(b =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${b.name}: `, bold: true }),
                    new TextRun({ text: `Income ${formatCurrency(b.income)}`, color: '14B8A6' }),
                    new TextRun({ text: '  |  ' }),
                    new TextRun({ text: `Expenses ${formatCurrency(b.expenses)}`, color: 'F43F5E' }),
                    new TextRun({ text: '  |  ' }),
                    new TextRun({ text: `Profit ${formatCurrency(b.profit)}`, color: b.profit >= 0 ? '10B981' : 'F43F5E' }),
                    new TextRun({ text: `  |  Charters: ${b.charters}` })
                  ],
                  spacing: { after: 100 }
                })
              )
            ] : []),
            new Paragraph({ text: '', spacing: { after: 400 } }),
            new Paragraph({
              children: [new TextRun({ text: `Generated: ${new Date().toLocaleString('el-GR')}`, size: 18, color: 'AAAAAA' })],
              alignment: AlignmentType.CENTER
            })
          ]
        }]
      });

      console.log('Creating Word blob...');
      const blob = await Packer.toBlob(doc);
      console.log('Word blob created, size:', blob.size);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Statistics_${selectedYear}_${selectedBoat === 'all' ? 'AllBoats' : selectedBoat}.docx`;
      console.log('Downloading Word file:', link.download);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Word file downloaded successfully!');
    } catch (error) {
      console.error('Word Export Error:', error);
      alert('Error exporting to Word: ' + (error as Error).message);
    } finally {
      setIsExporting(null);
    }
  };

  // Export to Excel - New implementation
  const exportToExcel = async () => {
    console.log('Excel Export clicked');
    setIsExporting('excel');
    try {
      console.log('Importing xlsx...');
      const XLSX = await import('xlsx');
      console.log('xlsx imported successfully');

      // Summary sheet data
      const summaryData = [
        ['TAILWIND YACHTING - Financial Statistics'],
        [''],
        ['Report Parameters'],
        ['Year', selectedYear],
        ['Boat', selectedBoat === 'all' ? 'All Boats' : boats.find(b => b.id === selectedBoat || String(b.id) === selectedBoat)?.name || selectedBoat],
        ['Period', selectedPeriod],
        ['Generated', new Date().toLocaleString('el-GR')],
        [''],
        ['Financial Summary'],
        ['Total Income', statistics.totalIncome],
        ['Total Expenses', statistics.totalExpenses],
        ['  - Commissions', statistics.charterExpenses],
        ['  - Invoices', statistics.invoiceExpenses],
        ['Net Profit', statistics.netProfit],
        ['Profit Margin', `${statistics.profitMargin.toFixed(1)}%`],
        [''],
        ['Performance Metrics'],
        ['Number of Charters', statistics.charterCount],
        ['Number of Invoices', statistics.invoiceCount],
        ['Average Charter Value', statistics.avgValue],
        ['Best Performing Boat', statistics.bestBoat?.name || 'N/A'],
        ['Best Boat Profit', statistics.bestBoat?.net || 0]
      ];

      // Period breakdown data
      const periodSheetData = [
        ['Period', 'Income', 'Expenses', 'Profit', 'Charters', 'Commission', 'Invoices'],
        ...periodData.map(p => [p.name, p.income, p.expenses, p.profit, p.charters, p.charterExpenses, p.invoiceExpenses])
      ];

      // Per boat data
      const boatSheetData = [
        ['Boat', 'Income', 'Expenses', 'Profit', 'Charters', 'Commission', 'Invoices', 'Invoice Count'],
        ...boatData.map(b => [b.name, b.income, b.expenses, b.profit, b.charters, b.charterExpenses, b.invoiceExpenses, b.invoices])
      ];

      const wb = XLSX.utils.book_new();

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      const ws2 = XLSX.utils.aoa_to_sheet(periodSheetData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Period Breakdown');

      if (selectedBoat === 'all' && boatData.length > 0) {
        const ws3 = XLSX.utils.aoa_to_sheet(boatSheetData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Per Boat');
      }

      const filename = `Statistics_${selectedYear}_${selectedBoat === 'all' ? 'AllBoats' : selectedBoat}.xlsx`;
      console.log('Writing Excel file:', filename);
      XLSX.writeFile(wb, filename);
      console.log('Excel file saved successfully!');
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert('Error exporting to Excel: ' + (error as Error).message);
    } finally {
      setIsExporting(null);
    }
  };

  if (!isOpen) return null;

  const hasData = chartersData.length > 0 || invoicesData.length > 0;
  console.log('StatisticsModal render - hasData:', hasData, 'charters:', chartersData.length, 'invoices:', invoicesData.length);

  return (
    <div className="fixed inset-0 z-50 min-h-screen text-gray-800 overflow-auto" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
      {/* Header - Light Blue Gradient */}
      <div className="p-4 rounded-b-xl shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <div className="max-w-7xl mx-auto">
          {/* Top Row - Back Button and Language Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            >
              ← {lang === 'el' ? 'Πίσω' : 'Back'}
            </button>
            <button
              onClick={() => setLang(lang === 'el' ? 'en' : 'el')}
              className="px-4 py-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-105"
            >
              {lang === 'el' ? '🇬🇧 EN' : '🇬🇷 EL'}
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-blue-800 text-center drop-shadow-md">
            📊 {lang === 'el' ? 'ΟΙΚΟΝΟΜΙΚΑ ΣΤΑΤΙΣΤΙΚΑ' : 'FINANCIAL STATISTICS'}
          </h1>
          <p className="text-blue-700 text-center mt-1">
            TAILWIND YACHTING
          </p>

          {/* Export Buttons Row */}
          <div className="flex items-center justify-center gap-2 mt-4" style={{ position: 'relative', zIndex: 100 }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('PDF button clicked!');
                alert('PDF clicked!');
                exportToPDF();
              }}
              disabled={isExporting === 'pdf'}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-bold transition-all disabled:opacity-50 border-2 border-red-400 shadow-lg cursor-pointer"
            >
              {isExporting === 'pdf' ? <span className="animate-spin">⏳</span> : '📄'} PDF
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Word button clicked!');
                alert('Word clicked!');
                exportToWord();
              }}
              disabled={isExporting === 'word'}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-600 rounded-lg text-sm font-bold transition-all disabled:opacity-50 border-2 border-blue-400 shadow-lg cursor-pointer"
            >
              {isExporting === 'word' ? <span className="animate-spin">⏳</span> : '📝'} Word
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Excel button clicked!');
                alert('Excel clicked!');
                exportToExcel();
              }}
              disabled={isExporting === 'excel'}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-green-50 text-green-600 rounded-lg text-sm font-bold transition-all disabled:opacity-50 border-2 border-green-400 shadow-lg cursor-pointer"
            >
              {isExporting === 'excel' ? <span className="animate-spin">⏳</span> : '📊'} Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Filters and Tabs Card */}
        <div className="rounded-xl p-4 mb-4 border border-blue-300 shadow-md" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          {/* Filters - Compact Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 text-xs font-medium">{t('Έτος', 'Year')}</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white/90 text-gray-800 rounded-lg px-3 py-1.5 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-colors shadow-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-blue-700 text-xs font-medium">{t('Σκάφος', 'Vessel')}</span>
              <select
                value={selectedBoat}
                onChange={(e) => setSelectedBoat(e.target.value)}
                className="bg-white/90 text-gray-800 rounded-lg px-3 py-1.5 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm max-w-[150px] transition-colors shadow-sm"
              >
                <option value="all">{t('Όλα τα σκάφη', 'All vessels')}</option>
                {boats.map(boat => (
                  <option key={boat.id} value={boat.id}>{boat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-blue-700 text-xs font-medium">{t('Περίοδος', 'Period')}</span>
              <div className="flex bg-white/80 rounded-lg p-0.5 border border-blue-300 shadow-sm">
                {(['monthly', 'quarterly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {period === 'monthly' ? t('Μήνας', 'Month') : period === 'quarterly' ? t('Τρίμηνο', 'Quarter') : t('Έτος', 'Year')}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Export */}
            <div className="sm:hidden flex gap-1 ml-auto">
              <button onClick={exportToPDF} disabled={!hasData} className="p-2 bg-white/80 text-red-600 rounded-lg disabled:opacity-50 border border-red-300 shadow-sm">📄</button>
              <button onClick={exportToWord} disabled={!hasData} className="p-2 bg-white/80 text-blue-600 rounded-lg disabled:opacity-50 border border-blue-300 shadow-sm">📝</button>
              <button onClick={exportToExcel} disabled={!hasData} className="p-2 bg-white/80 text-green-600 rounded-lg disabled:opacity-50 border border-green-300 shadow-sm">📊</button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 bg-white/60 p-1 rounded-xl w-fit border border-blue-200 shadow-sm">
            {[
              { key: 'overview', label: t('Επισκόπηση', 'Overview'), icon: '📋' },
              { key: 'charts', label: t('Γραφήματα', 'Charts'), icon: '📈' },
              { key: 'boats', label: t('Σκάφη', 'Vessels'), icon: '⛵' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-blue-700 font-medium">{t('Φόρτωση δεδομένων...', 'Loading data...')}</p>
              </div>
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center mb-4 border border-blue-200 shadow-md">
                <span className="text-4xl">📭</span>
              </div>
              <p className="text-gray-700 text-lg mb-2 font-medium">{t('Δεν βρέθηκαν δεδομένα', 'No data found')}</p>
              <p className="text-gray-500 text-sm">{t('Δοκιμάστε να αλλάξετε τα φίλτρα', 'Try changing the filters')}</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                      title={t('Συνολικά Έσοδα', 'Total Income')}
                      value={formatCurrency(statistics.totalIncome)}
                      icon="💰"
                      color={CHART_COLORS.income}
                      delay={0}
                    />
                    <StatCard
                      title={t('Συνολικά Έξοδα', 'Total Expenses')}
                      value={formatCurrency(statistics.totalExpenses)}
                      subtitle={`${t('Προμ', 'Comm')}: ${formatCurrency(statistics.charterExpenses)} | ${t('Τιμ', 'Inv')}: ${formatCurrency(statistics.invoiceExpenses)}`}
                      icon="📉"
                      color={CHART_COLORS.expenses}
                      delay={50}
                    />
                    <StatCard
                      title={t('Καθαρό Κέρδος', 'Net Profit')}
                      value={formatCurrency(statistics.netProfit)}
                      subtitle={`${t('Περιθώριο', 'Margin')}: ${statistics.profitMargin.toFixed(1)}%`}
                      icon={statistics.netProfit >= 0 ? "📈" : "📉"}
                      color={statistics.netProfit >= 0 ? CHART_COLORS.profit : CHART_COLORS.expenses}
                      delay={100}
                    />
                    <StatCard
                      title={t('Ναυλώσεις', 'Charters')}
                      value={String(statistics.charterCount)}
                      subtitle={`${t('Μ.Ο.', 'Avg')}: ${formatCurrency(statistics.avgValue)}`}
                      icon="⛵"
                      color="#3B82F6"
                      delay={150}
                    />
                  </div>

                  {/* Quick Overview Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Income vs Expenses Donut */}
                    <div className="bg-white/90 rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
                      <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                        <span className="text-lg">🎯</span> {t('Έσοδα vs Έξοδα', 'Income vs Expenses')}
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={incomeExpenseData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {incomeExpenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => <span className="text-gray-700 text-sm font-medium">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div className="bg-white/90 rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
                      <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                        <span className="text-lg">🥧</span> {t('Κατανομή Κερδοφορίας', 'Profit Distribution')}
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              wrapperStyle={{ paddingTop: '20px' }}
                              formatter={(value) => <span className="text-gray-700 text-sm font-medium">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Best Performer Card */}
                  {statistics.bestBoat && (
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-4 sm:p-6 border border-amber-300 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-200 rounded-xl flex items-center justify-center border border-amber-300">
                          <span className="text-3xl">🏆</span>
                        </div>
                        <div>
                          <p className="text-amber-700 text-sm font-medium">{t('Κορυφαίο Σκάφος', 'Top Vessel')} {selectedYear}</p>
                          <p className="text-gray-800 text-xl font-bold">{statistics.bestBoat.name}</p>
                          <p className="text-gray-600 text-sm">
                            {t('Έσοδα', 'Income')}: {formatCurrency(statistics.bestBoat.income)} • {t('Κέρδος', 'Profit')}: {formatCurrency(statistics.bestBoat.net)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Charts Tab */}
              {activeTab === 'charts' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Period Comparison */}
                  <div className="bg-white/90 rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
                    <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      {selectedPeriod === 'monthly' ? t('Μηνιαία', 'Monthly') : selectedPeriod === 'quarterly' ? t('Τριμηνιαία', 'Quarterly') : t('Ετήσια', 'Yearly')} {t('Σύγκριση', 'Comparison')}
                    </h3>
                    <div className="h-72 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={periodData} barCategoryGap="15%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#6B7280"
                            tick={{ fontSize: 11, fill: '#374151' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis
                            stroke="#6B7280"
                            tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
                            tick={{ fontSize: 11, fill: '#374151' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-gray-700 text-sm font-medium">{value}</span>}
                          />
                          <Bar dataKey="income" name={t('Έσοδα', 'Income')} fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" name={t('Έξοδα', 'Expenses')} fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Profit Trend Line Chart */}
                  <div className="bg-white/90 rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
                    <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                      <span className="text-lg">📈</span> {t('Τάση Κερδοφορίας', 'Profit Trend')}
                    </h3>
                    <div className="h-72 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={periodData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#6B7280"
                            tick={{ fontSize: 11, fill: '#374151' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <YAxis
                            stroke="#6B7280"
                            tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
                            tick={{ fontSize: 11, fill: '#374151' }}
                            axisLine={{ stroke: '#D1D5DB' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => <span className="text-gray-700 text-sm font-medium">{value}</span>}
                          />
                          <Line
                            type="monotone"
                            dataKey="income"
                            name={t('Έσοδα', 'Income')}
                            stroke={CHART_COLORS.income}
                            strokeWidth={2}
                            dot={{ fill: CHART_COLORS.income, strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="expenses"
                            name={t('Έξοδα', 'Expenses')}
                            stroke={CHART_COLORS.expenses}
                            strokeWidth={2}
                            dot={{ fill: CHART_COLORS.expenses, strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            name={t('Κέρδος', 'Profit')}
                            stroke={CHART_COLORS.profit}
                            strokeWidth={3}
                            dot={{ fill: CHART_COLORS.profit, strokeWidth: 0, r: 5 }}
                            activeDot={{ r: 7, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Boats Tab */}
              {activeTab === 'boats' && (
                <div className="space-y-6 animate-fadeIn">
                  {boatData.length > 0 ? (
                    <>
                      {/* Boat Comparison Chart */}
                      <div className="bg-white/90 rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
                        <h3 className="text-gray-800 font-semibold mb-4 flex items-center gap-2">
                          <span className="text-lg">⛵</span> {t('Σύγκριση ανά Σκάφος', 'Comparison by Vessel')}
                        </h3>
                        <div className="h-72 sm:h-96">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={boatData} layout="vertical" barCategoryGap="20%">
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                              <XAxis
                                type="number"
                                stroke="#6B7280"
                                tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
                                tick={{ fontSize: 11, fill: '#374151' }}
                                axisLine={{ stroke: '#D1D5DB' }}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#6B7280"
                                width={100}
                                tick={{ fontSize: 11, fill: '#374151' }}
                                axisLine={{ stroke: '#D1D5DB' }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                formatter={(value) => <span className="text-gray-700 text-sm font-medium">{value}</span>}
                              />
                              <Bar dataKey="income" name={t('Έσοδα', 'Income')} fill={CHART_COLORS.income} radius={[0, 4, 4, 0]} />
                              <Bar dataKey="expenses" name={t('Έξοδα', 'Expenses')} fill={CHART_COLORS.expenses} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Boat Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boatData.map((boat, index) => (
                          <div
                            key={boat.name}
                            className="bg-white/90 rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg shadow-md"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">⛵</span>
                                <h4 className="text-gray-800 font-semibold">{boat.name}</h4>
                              </div>
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-amber-200 text-amber-700 text-xs rounded-full font-medium border border-amber-300">🏆 #1</span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{t('Έσοδα', 'Income')}</span>
                                <span className="text-teal-600 font-medium">{formatCurrency(boat.income)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{t('Έξοδα', 'Expenses')}</span>
                                <span className="text-red-600 font-medium">{formatCurrency(boat.expenses)}</span>
                              </div>
                              <div className="h-px bg-blue-200 my-2"></div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{t('Κέρδος', 'Profit')}</span>
                                <span className={`font-bold ${boat.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {formatCurrency(boat.profit)}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>{boat.charters} {t('ναυλώσεις', 'charters')}</span>
                                <span>{boat.invoices} {t('τιμολόγια', 'invoices')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <p className="text-gray-600 font-medium">{t('Επιλέξτε "Όλα τα σκάφη" για σύγκριση', 'Select "All vessels" for comparison')}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Light Blue */}
        <div className="px-4 sm:px-6 py-3 border-t border-blue-300 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
          <div className="text-blue-800 text-xs sm:text-sm flex items-center gap-2 font-medium">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span>{chartersData.length} {t('ναυλώσεις', 'charters')}</span>
            <span className="text-blue-600">•</span>
            <span>{invoicesData.length} {t('τιμολόγια', 'invoices')}</span>
            <span className="text-blue-600">•</span>
            <span>{selectedYear}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white/90 hover:bg-white text-blue-700 hover:text-blue-900 rounded-lg text-sm font-bold transition-all shadow-sm hover:scale-105"
          >
            {t('Κλείσιμο', 'Close')}
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// AdminDashboard Component - FULLSCREEN με ανοιχτά χρώματα
export default function AdminDashboard({
  boats,
  onSelectBoat,
  onHome,
  navigate,
  loadBoats,
  showAddBoat,
  setShowAddBoat,
  showEmployeeManagement,
  setShowEmployeeManagement,
  showDataManagement,
  setShowDataManagement,
  showActivityLog,
  setShowActivityLog,
  showFinancials,
  setShowFinancials
}) {
  const [financialsData, setFinancialsData] = useState({
    boats: [],
    totals: { income: 0, expenses: 0, net: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatManagement, setShowChatManagement] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  // 🔥 Auto-refresh: Track last update time
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // 📝 Track Page 1 bookings per boat for highlighting
  const [page1BookingsByBoat, setPage1BookingsByBoat] = useState<{[boatId: string]: {count: number, firstBooking: any}}>({});
  // 🔧 Expandable tasks menu state
  const [tasksMenuExpanded, setTasksMenuExpanded] = useState(false);
  // 💰 Expandable financials menu state
  const [financialsMenuExpanded, setFinancialsMenuExpanded] = useState(false);
  // 📊 Statistics modal state
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  // 📁 Charter Archive modal state
  const [showCharterArchive, setShowCharterArchive] = useState(false);

  // Task categories for navigation (all same light blue color)
  const taskCategories = [
    { key: 'engine', icon: '⚙️', name: 'ΜΗΧΑΝΗ' },
    { key: 'generator', icon: '⚡', name: 'ΓΕΝΝΗΤΡΙΑ' },
    { key: 'shaft', icon: '🔧', name: 'ΑΞΟΝΑΣ' },
    { key: 'valves', icon: '🚿', name: 'ΒΑΝΕΣ ΘΑΛΑΣΣΗΣ' },
    { key: 'electrical', icon: '💡', name: 'ΗΛΕΚΤΡΟΛΟΓΙΚΑ' },
    { key: 'desalination', icon: '💧', name: 'ΑΦΑΛΑΤΩΣΗ' },
    { key: 'documents', icon: '📄', name: 'ΕΓΓΡΑΦΑ' }
  ];
  const user = authService.getCurrentUser();
  const reactNavigate = useNavigate();

  // Filter boats based on search (case-insensitive)
  const filteredBoats = boats.filter(boat => {
    if (!searchTerm.trim()) return true;
    const boatText = `${boat.id} ${boat.name} ${boat.type} ${boat.model || ''}`;
    return textMatches(boatText, searchTerm);
  });

  // 🔥 FIX 16 + Auto-refresh: Load financials from API (memoized)
  const loadFinancialsData = useCallback(async () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const boatsData: any[] = [];

    // Load all boats in parallel for better performance
    await Promise.all(boats.map(async (boat: any) => {
      // Load charters from API only (no localStorage fallback)
      let charters: any[] = [];
      try {
        charters = await getBookingsByVessel(boat.id);
      } catch (e) {
        console.error(`❌ Error loading charters for ${boat.name}:`, e);
        charters = []; // No localStorage fallback
      }

      // Load invoices (localStorage only for now - separate from bookings)
      const invoicesKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      const invoices = invoicesStored ? JSON.parse(invoicesStored) : [];

      const boatIncome = charters.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const charterExpenses = charters.reduce((sum: number, c: any) => sum + (c.commission || 0) + (c.vat_on_commission || 0), 0);
      const invoiceExpenses = invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const boatExpenses = charterExpenses + invoiceExpenses;
      const boatNet = boatIncome - boatExpenses;

      totalIncome += boatIncome;
      totalExpenses += boatExpenses;

      boatsData.push({
        id: boat.id,
        name: boat.name,
        income: boatIncome,
        expenses: boatExpenses,
        net: boatNet,
        chartersCount: charters.length,
        invoicesCount: invoices.length
      });
    }));

    // 🔥 FIX 31: Check for expired options (6 days old)
    try {
      const expiredCharters = await checkExpiredOptions();
      if (expiredCharters.length > 0) {
        console.log(`✅ Auto-expired ${expiredCharters.length} options:`, expiredCharters);
      }
    } catch (e) {
      console.log('⚠️ Could not check expired options:', e);
    }

    setFinancialsData({
      boats: boatsData,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses
      }
    });
    setLastUpdated(new Date());
    console.log('✅ AdminDashboard: Financials loaded from API');
  }, [boats]);

  // 🔥 Auto-refresh: Poll data every 5 minutes
  const { isRefreshing } = useAutoRefresh(loadFinancialsData, 5);

  // Load financials data on mount and when boats change
  useEffect(() => {
    loadFinancialsData();
  }, [loadFinancialsData]);

  // 📝 Fetch Page 1 bookings from API (no localStorage)
  useEffect(() => {
    const fetchPage1Bookings = async () => {
      const bookingsByBoat: {[boatId: string]: {count: number, firstBooking: any}} = {};

      console.log('🔍 AdminDashboard: Fetching Page 1 bookings from API...');
      console.log('📦 Available boats:', boats.map(b => ({ id: b.id, name: b.name })));

      try {
        // Fetch all bookings from API
        const allBookings = await getAllBookings();
        console.log(`📂 Fetched ${allBookings.length} total bookings from API`);

        boats.forEach((boat: any) => {
          // Filter bookings for this boat
          const boatBookings = allBookings.filter((b: any) =>
            b.vesselName?.toLowerCase() === boat.name?.toLowerCase() ||
            b.boatName?.toLowerCase() === boat.name?.toLowerCase() ||
            b.vessel?.toLowerCase() === boat.name?.toLowerCase()
          );

          console.log(`📂 ${boat.name}: Found ${boatBookings.length} total bookings`);

          if (boatBookings.length > 0) {
            // Find Page 1 bookings that need financial details
            // Check: source='page1' OR status='Draft' (more lenient)
            // AND: amount is missing or 0
            const page1Bookings = boatBookings.filter((c: any) => {
              const isFromPage1 = c.source === 'page1';
              const isDraft = c.status === 'Draft';
              const needsAmount = !c.amount || c.amount === 0;

              // Include if: (from Page 1 OR Draft) AND needs amount
              return (isFromPage1 || isDraft) && needsAmount;
            });

            console.log(`📝 ${boat.name}: Found ${page1Bookings.length} Page 1 bookings needing attention`);

            if (page1Bookings.length > 0) {
              bookingsByBoat[boat.id] = {
                count: page1Bookings.length,
                firstBooking: page1Bookings[0]
              };
            }
          }
        });

        console.log('✅ Page 1 bookings summary:', bookingsByBoat);
        setPage1BookingsByBoat(bookingsByBoat);
      } catch (error) {
        console.error('❌ Error fetching Page 1 bookings:', error);
        setPage1BookingsByBoat({});
      }
    };

    fetchPage1Bookings();

    // Re-fetch when global bookings refresh
    const handleRefresh = () => {
      console.log('🔄 Global refresh triggered, re-fetching Page 1 bookings');
      fetchPage1Bookings();
    };

    window.addEventListener('globalBookingsRefreshed', handleRefresh);
    return () => window.removeEventListener('globalBookingsRefreshed', handleRefresh);
  }, [boats]);

  // 🔥 FIX: Return button = navigate only, NO logout
  // Use React Router navigate (not window.location.href) to preserve session
  const handleBackNavigation = () => {
    reactNavigate('/');
  };

  if (!authService.isLoggedIn()) {
    return (
      <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 fixed inset-0 z-50">
        <Header title="Access Denied" onBack={null} onHome={onHome} />
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-slate-600 mb-6">You don't have permission to access Admin Dashboard.</p>
            <p className="text-sm text-slate-500">Contact: {COMPANY_INFO.emails.info}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 fixed inset-0 z-50 overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full">
        <Header
          title="Πίνακας Διαχειριστή"
          onBack={handleBackNavigation}
          onHome={onHome}
        />

        {/* User Info Bar */}
        <div className="p-3 bg-white/90 backdrop-blur-xl border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                👤
              </div>
              <div>
                <div className="text-base font-bold text-slate-800">{user?.name || user?.code}</div>
                <div className="text-xs text-blue-600">{user?.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <InstallButton className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-semibold transition-colors" />
              <button
                onClick={() => setShowUserGuide(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                📖 Οδηγίες
              </button>
              <div className="text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold">Online</span>
              </div>
              {/* Auto-refresh indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{lastUpdated.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                {isRefreshing && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full animate-pulse text-xs">
                    Ανανέωση...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - 3 columns */}
        <div className="flex-grow flex overflow-hidden">
          {/* Left Buttons */}
          <div className="w-36 sm:w-44 bg-white/80 backdrop-blur-xl border-r border-blue-200 flex flex-col items-center py-4 gap-4 px-3 overflow-y-auto">
            <button
              onClick={() => {
                authService.logActivity('view_fleet_booking_plan');
                navigate('fleetBookingPlan');
              }}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
              title="Booking Plan"
            >
              {icons.bookingSheet}
              <span className="text-sm font-bold">Plan</span>
            </button>

            {authService.canManageCodes() && (
              <button
                onClick={() => setShowEmployeeManagement(true)}
                className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Διαχείριση Υπαλλήλων"
              >
                {icons.shield}
                <span className="text-sm font-bold">Users</span>
              </button>
            )}

            {authService.canManageFleet() && (
              <button
                onClick={() => window.location.href = '/add-boat'}
                className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Προσθήκη Σκάφους"
              >
                {icons.plus}
                <span className="text-sm font-bold">+Boat</span>
              </button>
            )}

            {/* 🔧 Expandable Tasks Menu */}
            {authService.canManageTasks() && (
              <div className="w-full">
                {/* Main Toggle Button */}
                <button
                  onClick={() => setTasksMenuExpanded(!tasksMenuExpanded)}
                  className="w-full h-14 bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-500 hover:to-cyan-500 rounded-xl flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  title="Εργασίες Σκαφών"
                >
                  <span className="text-xl">🔧</span>
                  <span className="text-sm font-bold">ΕΡΓΑΣΙΕΣ</span>
                  <span className={`text-sm transition-transform duration-300 ${tasksMenuExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Expandable Menu Items with Scroll */}
                <div className={`transition-all duration-300 ease-in-out ${tasksMenuExpanded ? 'max-h-[600px] opacity-100 mt-2 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="space-y-2 pl-2 border-l-2 border-sky-300 pr-1 pb-2">
                    {/* Winter Check-in */}
                    <button
                      onClick={() => reactNavigate('/winterization')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">❄️</span>
                      <span className="text-xs font-semibold">Winter Check-in</span>
                    </button>
                    {/* Χειμερινές Εργασίες */}
                    <button
                      onClick={() => reactNavigate('/winter-inventory')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">📦</span>
                      <span className="text-xs font-semibold">Χειμερινές Εργασίες</span>
                    </button>
                    {/* TakeOver */}
                    <button
                      onClick={() => reactNavigate('/winter-takeover')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">📋</span>
                      <span className="text-xs font-semibold">Take Over</span>
                    </button>
                    {/* Safety */}
                    <button
                      onClick={() => reactNavigate('/winter-safety')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">🩹</span>
                      <span className="text-xs font-semibold">Safety Equipment</span>
                    </button>
                    {/* Divider */}
                    <div className="border-t border-sky-200 my-2"></div>

                    {/* Task Categories - Navigate to Pages (all same light blue) */}
                    {taskCategories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => reactNavigate(`/tasks/${category.key}`)}
                        className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                        style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-xs font-semibold">{category.name}</span>
                        <span className="ml-auto text-xs text-slate-500">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 📁 Charter Archive Button — hidden for TECHNICAL role */}
            {!authService.isTechnical() && (
              <button
                onClick={() => setShowCharterArchive(true)}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                title="Αρχείο Ναύλων"
              >
                <span className="text-xl">📁</span>
                <span className="text-sm font-bold">ΑΡΧΕΙΟ ΝΑΥΛΩΝ</span>
              </button>
            )}
          </div>

          {/* Center - Boats List (more compact) */}
          <div className="flex-grow overflow-y-auto p-3 flex flex-col max-w-4xl mx-auto">
            {/* Search Box */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Αναζήτηση (όνομα, τύπος, μοντέλο...)"
                  className="w-full px-4 py-2 bg-white/90 backdrop-blur-xl text-slate-800 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm placeholder-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-3 text-blue-700 text-center">
              Σκάφη ({filteredBoats.length}{searchTerm ? ` / ${boats.length}` : ''})
            </h2>

            {/* Responsive Grid for Boats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 flex-grow overflow-y-auto">
              {filteredBoats.length > 0 ? filteredBoats.map(boat => {
                const hasPage1Bookings = page1BookingsByBoat[boat.id];
                const page1Count = hasPage1Bookings?.count || 0;

                // 🔍 DEBUG: Log card rendering for Perla
                if (boat.name === 'Perla' || boat.name === 'PERLA') {
                  console.log('🎨 RENDERING PERLA CARD:', {
                    boatId: boat.id,
                    boatName: boat.name,
                    page1BookingsByBoat,
                    hasPage1Bookings,
                    page1Count,
                    shouldHighlight: !!hasPage1Bookings
                  });
                }

                return (
                  <button
                    key={boat.id}
                    onClick={() => onSelectBoat(boat)}
                    className={`text-left backdrop-blur-xl p-4 rounded-2xl transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 h-fit transform-gpu ${
                      hasPage1Bookings
                        ? 'bg-blue-50 border-2 border-blue-500 hover:bg-blue-100'
                        : 'bg-white/90 border border-blue-200 hover:bg-white hover:border-blue-400'
                    }`}
                    style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    {/* Page 1 Badge */}
                    {hasPage1Bookings && (
                      <div className="mb-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1">
                        📝 {page1Count === 1 ? 'Νέο ναύλο από Check-in' : `${page1Count} νέα ναύλα από Check-in`}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-blue-600">{boat.name || boat.id}</h3>
                        <p className="text-xs text-slate-600 font-semibold">{boat.id}</p>
                        <p className="text-xs text-slate-500">{boat.type} {boat.model && `• ${boat.model}`}</p>
                      </div>
                      <div className="text-blue-500 text-xl">→</div>
                    </div>
                  </button>
                );
              }) : (
                <div className="col-span-full bg-white/90 backdrop-blur-xl p-4 rounded-2xl text-center border border-blue-200">
                  <p className="text-slate-600 text-sm">
                    {searchTerm ? `Δεν βρέθηκαν σκάφη για "${searchTerm}"` : 'Δεν βρέθηκαν σκάφη.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Buttons */}
          <div className="w-36 sm:w-44 bg-white/80 backdrop-blur-xl border-l border-blue-200 flex flex-col items-center py-4 gap-4 px-3">
            <button
              onClick={() => setShowChatManagement(true)}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
              title="Chat Management"
            >
              <span className="text-xl">💬</span>
              <span className="text-sm font-bold">Chats</span>
            </button>

            {authService.canClearData() && (
              <button
                onClick={() => setShowDataManagement(true)}
                className="w-full h-14 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Διαγραφή Δεδομένων"
              >
                {icons.x}
                <span className="text-sm font-bold">Delete</span>
              </button>
            )}

            {authService.canManageCodes() && (
              <button
                onClick={() => setShowActivityLog(true)}
                className="w-full h-14 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Activity Log"
              >
                {icons.fileText}
                <span className="text-sm font-bold">Log</span>
              </button>
            )}

            {authService.isAdmin() && (
              <div className="w-full">
                <button
                  onClick={() => setFinancialsMenuExpanded(!financialsMenuExpanded)}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                  title="Οικονομικά Στοιχεία"
                >
                  <span className="text-xl">💰</span>
                  <span className="text-sm font-bold">Οικονομικά</span>
                  <span className={`transition-transform ${financialsMenuExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {financialsMenuExpanded && (
                  <div className="mt-2 space-y-2">
                    <button
                      onClick={() => setShowStatisticsModal(true)}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition-colors"
                    >
                      📊 ΣΤΑΤΙΣΤΙΚΑ
                    </button>
                    <button
                      onClick={() => reactNavigate('/reports')}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition-colors"
                    >
                      📋 ΣΥΓΚΕΝΤΡΩΤΙΚΑ
                    </button>
                    <button
                      onClick={() => alert('ΤΙΜΟΛΟΓΙΑ - Coming soon!')}
                      className="w-full h-10 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition-colors"
                    >
                      📄 ΤΙΜΟΛΟΓΙΑ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Chat Management Modal */}
      {showChatManagement && (
        <ChatManagementModal onClose={() => setShowChatManagement(false)} />
      )}

      {/* User Guide Modal */}
      <UserGuide isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={showStatisticsModal}
        onClose={() => setShowStatisticsModal(false)}
        boats={boats}
      />

      {/* Charter Archive Modal — hidden for TECHNICAL role */}
      {showCharterArchive && !authService.isTechnical() && (
        <CharterArchive onClose={() => setShowCharterArchive(false)} />
      )}
    </div>
  );
}
