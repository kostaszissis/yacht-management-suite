import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import * as XLSX from 'xlsx';

// Vessels list (same as other pages)
const VESSELS = [
  { id: 1, name: 'Maria 1' },
  { id: 2, name: 'Maria 2' },
  { id: 3, name: 'Valesia' },
  { id: 4, name: 'Bar Bar' },
  { id: 5, name: 'Kalispera' },
  { id: 6, name: 'Infinity' },
  { id: 7, name: 'Perla' },
  { id: 8, name: 'Bob' }
];

// Owners list (placeholder - will be fetched from API)
const OWNERS = [
  { id: 1, name: 'Owner A', vessels: [1, 2] },
  { id: 2, name: 'Owner B', vessels: [3, 4] },
  { id: 3, name: 'Owner C', vessels: [5, 6] },
  { id: 4, name: 'Owner D', vessels: [7, 8] }
];

// API endpoint for reports
const API_REPORTS = '/api/reports.php';

// Raw API booking data interface
interface RawBookingData {
  bookingNumber: string;
  vesselName: string;
  vesselId: number;
  ownerCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  amount: number;
  commissionPercent: number;
  commission: number;
  vatOnCommission: number;
  foreignBrokerPercent: number;
  foreignCommission: number;
  netIncome: number;
  payments: any[];
  totalPaid: number;
  balance: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  broker: string;
  status: string;
}

// Helper function to get vessel ID from name
function getVesselIdByName(name: string): number | null {
  const vessel = VESSELS.find(v => v.name === name);
  return vessel ? vessel.id : null;
}

// Helper function to get vessel name from ID
function getVesselNameById(id: number): string | null {
  const vessel = VESSELS.find(v => v.id === id);
  return vessel ? vessel.name : null;
}

// Helper to get vessels owned by an owner
function getOwnerVessels(ownerId: number): number[] {
  const owner = OWNERS.find(o => o.id === ownerId);
  return owner ? owner.vessels : [];
}

// Helper to get owner by vessel ID
function getOwnerByVesselId(vesselId: number): { id: number; name: string } | null {
  const owner = OWNERS.find(o => o.vessels.includes(vesselId));
  return owner ? { id: owner.id, name: owner.name } : null;
}

// Calculate days between two dates
function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get month string from date (YYYY-MM format)
function getMonthFromDate(date: string): string {
  return date.substring(0, 7);
}

// Format money with proper decimal places (e.g., 1234.56 -> "1,234.56€")
function formatMoney(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€';
}

// Format money without decimals for summary cards (e.g., 1234 -> "1,234€")
function formatMoneyShort(num: number): string {
  return Math.round(num).toLocaleString('en-US') + '€';
}

// Helper function to check if a date is within range
function isDateInRange(date: string, dateFrom: string | null, dateTo: string | null): boolean {
  if (!dateFrom && !dateTo) return true;
  const d = new Date(date);
  if (dateFrom && d < new Date(dateFrom)) return false;
  if (dateTo && d > new Date(dateTo)) return false;
  return true;
}

interface Filters {
  dateFrom?: string;
  dateTo?: string;
  vesselId?: number | null;
  ownerId?: number | null;
}

interface PaymentSummary {
  bookingCode: string;
  vesselName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
}

interface CharterSummary {
  vesselId: number;
  vesselName: string;
  month: string;
  totalCharters: number;
  totalDays: number;
  totalRevenue: number;
}

interface CommissionSummary {
  ownerId: number;
  ownerName: string;
  vesselName: string;
  totalRevenue: number;
  commission: number;
  vatOnCommission: number;
  netToOwner: number;
}

interface VesselSummary {
  vesselId: number;
  vesselName: string;
  totalBookings: number;
  totalDays: number;
  totalRevenue: number;
  averagePerDay: number;
}

interface OccupancySummary {
  vesselId: number;
  vesselName: string;
  totalDays: number;
  bookedDays: number;
  occupancyPercent: number;
}

interface BrokerSummary {
  brokerId: number;
  brokerName: string;
  brokerEmail: string;
  totalBookings: number;
  totalDays: number;
  totalRevenue: number;
  commission: number;
}

interface CustomerBooking {
  bookingCode: string;
  vesselName: string;
  startDate: string;
  endDate: string;
  amount: number;
}

interface RepeatCustomer {
  customerId: number;
  customerName: string;
  customerEmail: string;
  totalBookings: number;
  totalSpent: number;
  firstBooking: string;
  lastBooking: string;
  bookings: CustomerBooking[];
}

interface DirectCustomer {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingCode: string;
  vesselName: string;
  startDate: string;
  endDate: string;
  amount: number;
  source: string;
}

// ============================================
// REAL API FUNCTIONS - Fetch from /api/reports.php
// ============================================

// Fetch raw booking data from the API
async function fetchReportsData(filters: Filters): Promise<RawBookingData[]> {
  try {
    // Build query string with filters
    const params = new URLSearchParams();
    if (filters.vesselId) {
      const vesselName = getVesselNameById(filters.vesselId);
      if (vesselName) params.append('vessel', vesselName);
    }
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.ownerId) params.append('owner', String(filters.ownerId));

    const url = `${API_REPORTS}${params.toString() ? '?' + params.toString() : ''}`;
    console.log('Fetching reports from:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('API Response:', result);

    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }

    console.warn('API returned unexpected format, returning empty array');
    return [];
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return [];
  }
}

// Transform raw API data into PaymentSummary format
async function getPaymentSummary(filters: Filters): Promise<PaymentSummary[]> {
  console.log('=== getPaymentSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Debug: Log first few raw records to see actual values
  if (rawData.length > 0) {
    console.log('Sample raw data (first 3 records):');
    rawData.slice(0, 3).forEach((b, i) => {
      console.log(`  [${i}] amount: ${b.amount} (type: ${typeof b.amount}), totalPaid: ${b.totalPaid}, balance: ${b.balance}`);
    });
  }

  // Transform to PaymentSummary format
  const data: PaymentSummary[] = rawData.map(booking => {
    // Ensure proper number conversion - handle string or number input
    const amount = parseFloat(String(booking.amount)) || 0;
    const totalPaid = parseFloat(String(booking.totalPaid)) || 0;
    const balance = parseFloat(String(booking.balance)) || 0;

    return {
      bookingCode: booking.bookingNumber || 'N/A',
      vesselName: booking.vesselName || 'Unknown',
      startDate: booking.startDate || '',
      endDate: booking.endDate || '',
      totalAmount: amount,
      paidAmount: totalPaid,
      unpaidAmount: balance,
      status: (booking.paymentStatus as 'paid' | 'partial' | 'unpaid') || 'unpaid'
    };
  });

  // Debug: Log transformed totals
  const debugTotal = data.reduce((sum, p) => sum + p.totalAmount, 0);
  const debugPaid = data.reduce((sum, p) => sum + p.paidAmount, 0);
  const debugBalance = data.reduce((sum, p) => sum + p.unpaidAmount, 0);
  console.log('DEBUG totals - Total:', debugTotal, 'Paid:', debugPaid, 'Balance:', debugBalance);

  console.log('Transformed payment data:', data.length, 'records');
  return data;
}

// Transform raw API data into CharterSummary format (grouped by vessel and month)
async function getCharterSummary(filters: Filters): Promise<CharterSummary[]> {
  console.log('=== getCharterSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Group bookings by vessel and month
  const grouped: Record<string, CharterSummary> = {};

  rawData.forEach(booking => {
    const vesselId = booking.vesselId || getVesselIdByName(booking.vesselName) || 0;
    const month = getMonthFromDate(booking.startDate || '');
    const key = `${vesselId}-${month}`;

    if (!grouped[key]) {
      grouped[key] = {
        vesselId,
        vesselName: booking.vesselName || 'Unknown',
        month,
        totalCharters: 0,
        totalDays: 0,
        totalRevenue: 0
      };
    }

    grouped[key].totalCharters += 1;
    grouped[key].totalDays += getDaysBetween(booking.startDate || '', booking.endDate || '');
    grouped[key].totalRevenue += Number(booking.amount) || 0;
  });

  const data = Object.values(grouped).sort((a, b) => {
    if (a.vesselName !== b.vesselName) return a.vesselName.localeCompare(b.vesselName);
    return a.month.localeCompare(b.month);
  });

  console.log('Transformed charter data:', data.length, 'records');
  return data;
}

// Transform raw API data into CommissionSummary format (grouped by vessel)
async function getCommissionSummary(filters: Filters): Promise<CommissionSummary[]> {
  console.log('=== getCommissionSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Group by vessel and aggregate commissions
  const grouped: Record<string, CommissionSummary> = {};

  rawData.forEach(booking => {
    const vesselId = booking.vesselId || getVesselIdByName(booking.vesselName) || 0;
    const owner = getOwnerByVesselId(vesselId);
    const key = booking.vesselName || 'Unknown';

    if (!grouped[key]) {
      grouped[key] = {
        ownerId: owner?.id || 0,
        ownerName: owner?.name || booking.ownerCode || 'Unknown Owner',
        vesselName: booking.vesselName || 'Unknown',
        totalRevenue: 0,
        commission: 0,
        vatOnCommission: 0,
        netToOwner: 0
      };
    }

    grouped[key].totalRevenue += Number(booking.amount) || 0;
    grouped[key].commission += Number(booking.commission) || 0;
    grouped[key].vatOnCommission += Number(booking.vatOnCommission) || 0;
    grouped[key].netToOwner += Number(booking.netIncome) || 0;
  });

  const data = Object.values(grouped);
  console.log('Transformed commission data:', data.length, 'records');
  return data;
}

// Transform raw API data into VesselSummary format
async function getVesselSummary(filters: Filters): Promise<VesselSummary[]> {
  console.log('=== getVesselSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Group by vessel
  const grouped: Record<string, VesselSummary> = {};

  rawData.forEach(booking => {
    const vesselId = booking.vesselId || getVesselIdByName(booking.vesselName) || 0;
    const key = booking.vesselName || 'Unknown';

    if (!grouped[key]) {
      grouped[key] = {
        vesselId,
        vesselName: booking.vesselName || 'Unknown',
        totalBookings: 0,
        totalDays: 0,
        totalRevenue: 0,
        averagePerDay: 0
      };
    }

    grouped[key].totalBookings += 1;
    grouped[key].totalDays += getDaysBetween(booking.startDate || '', booking.endDate || '');
    grouped[key].totalRevenue += Number(booking.amount) || 0;
  });

  // Calculate average per day
  const data = Object.values(grouped).map(v => ({
    ...v,
    averagePerDay: v.totalDays > 0 ? Math.round(v.totalRevenue / v.totalDays) : 0
  }));

  console.log('Transformed vessel data:', data.length, 'records');
  return data;
}

// Transform raw API data into OccupancySummary format
async function getOccupancySummary(filters: Filters): Promise<OccupancySummary[]> {
  console.log('=== getOccupancySummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Charter season: April 1st to October 31st = 214 days
  const SEASON_DAYS = 214;

  // Calculate booked days per vessel
  const grouped: Record<string, { vesselId: number; vesselName: string; bookedDays: number }> = {};

  rawData.forEach(booking => {
    const vesselId = booking.vesselId || getVesselIdByName(booking.vesselName) || 0;
    const key = booking.vesselName || 'Unknown';

    if (!grouped[key]) {
      grouped[key] = {
        vesselId,
        vesselName: booking.vesselName || 'Unknown',
        bookedDays: 0
      };
    }

    grouped[key].bookedDays += getDaysBetween(booking.startDate || '', booking.endDate || '');
  });

  // Convert to OccupancySummary format
  const data: OccupancySummary[] = Object.values(grouped).map(v => ({
    vesselId: v.vesselId,
    vesselName: v.vesselName,
    totalDays: SEASON_DAYS,
    bookedDays: Math.min(v.bookedDays, SEASON_DAYS),
    occupancyPercent: Math.round((Math.min(v.bookedDays, SEASON_DAYS) / SEASON_DAYS) * 100)
  }));

  console.log('Transformed occupancy data:', data.length, 'records');
  return data;
}

// Transform raw API data into BrokerSummary format
async function getBrokerSummary(filters: Filters): Promise<BrokerSummary[]> {
  console.log('=== getBrokerSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Group by broker
  const grouped: Record<string, BrokerSummary> = {};
  let brokerIdCounter = 1;

  rawData.forEach(booking => {
    const brokerName = booking.broker || 'Direct (Απευθείας)';

    if (!grouped[brokerName]) {
      grouped[brokerName] = {
        brokerId: brokerIdCounter++,
        brokerName,
        brokerEmail: '', // API doesn't provide broker email
        totalBookings: 0,
        totalDays: 0,
        totalRevenue: 0,
        commission: 0
      };
    }

    grouped[brokerName].totalBookings += 1;
    grouped[brokerName].totalDays += getDaysBetween(booking.startDate || '', booking.endDate || '');
    grouped[brokerName].totalRevenue += Number(booking.amount) || 0;
    grouped[brokerName].commission += Number(booking.foreignCommission) || 0;
  });

  const data = Object.values(grouped);
  console.log('Transformed broker data:', data.length, 'records');
  return data;
}

// Transform raw API data into RepeatCustomer format
async function getRepeatCustomers(filters: Filters): Promise<RepeatCustomer[]> {
  console.log('=== getRepeatCustomers called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Group by customer email (as unique identifier)
  const grouped: Record<string, {
    customerId: number;
    customerName: string;
    customerEmail: string;
    bookings: CustomerBooking[];
  }> = {};
  let customerIdCounter = 1;

  rawData.forEach(booking => {
    const email = booking.customerEmail || 'unknown@email.com';

    if (!grouped[email]) {
      grouped[email] = {
        customerId: customerIdCounter++,
        customerName: booking.customerName || 'Unknown Customer',
        customerEmail: email,
        bookings: []
      };
    }

    grouped[email].bookings.push({
      bookingCode: booking.bookingNumber || 'N/A',
      vesselName: booking.vesselName || 'Unknown',
      startDate: booking.startDate || '',
      endDate: booking.endDate || '',
      amount: Number(booking.amount) || 0
    });
  });

  // Filter to only customers with 2+ bookings (repeat customers)
  const repeatCustomers = Object.values(grouped)
    .filter(c => c.bookings.length >= 2)
    .map(c => {
      const sortedBookings = c.bookings.sort((a, b) => a.startDate.localeCompare(b.startDate));
      return {
        customerId: c.customerId,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        totalBookings: c.bookings.length,
        totalSpent: c.bookings.reduce((sum, b) => sum + b.amount, 0),
        firstBooking: sortedBookings[0]?.startDate || '',
        lastBooking: sortedBookings[sortedBookings.length - 1]?.startDate || '',
        bookings: sortedBookings
      };
    });

  console.log('Transformed repeat customers:', repeatCustomers.length, 'records');
  return repeatCustomers;
}

// Transform raw API data into DirectCustomer format
async function getDirectCustomers(filters: Filters): Promise<DirectCustomer[]> {
  console.log('=== getDirectCustomers called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));

  const rawData = await fetchReportsData(filters);
  console.log('Raw data received:', rawData.length, 'records');

  // Filter for direct bookings (no broker or broker is 'Direct')
  const directBookings = rawData.filter(booking => {
    const broker = booking.broker || '';
    return !broker || broker.toLowerCase().includes('direct') || broker.toLowerCase().includes('απευθείας');
  });

  let customerIdCounter = 101;
  const data: DirectCustomer[] = directBookings.map(booking => ({
    customerId: customerIdCounter++,
    customerName: booking.customerName || 'Unknown Customer',
    customerEmail: booking.customerEmail || '',
    customerPhone: booking.customerPhone || '',
    bookingCode: booking.bookingNumber || 'N/A',
    vesselName: booking.vesselName || 'Unknown',
    startDate: booking.startDate || '',
    endDate: booking.endDate || '',
    amount: Number(booking.amount) || 0,
    source: 'Direct'
  }));

  console.log('Transformed direct customers:', data.length, 'records');
  return data;
}

type TabType = 'payments' | 'charters' | 'commissions' | 'vessels' | 'occupancy' | 'brokers' | 'repeat' | 'direct';

const ConsolidatedReports: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'el' | 'en'>('el');
  const [activeTab, setActiveTab] = useState<TabType>('payments');
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedVessel, setSelectedVessel] = useState<number | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<number | null>(null);

  // Data
  const [paymentData, setPaymentData] = useState<PaymentSummary[]>([]);
  const [charterData, setCharterData] = useState<CharterSummary[]>([]);
  const [commissionData, setCommissionData] = useState<CommissionSummary[]>([]);
  const [vesselData, setVesselData] = useState<VesselSummary[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancySummary[]>([]);
  const [brokerData, setBrokerData] = useState<BrokerSummary[]>([]);
  const [repeatCustomerData, setRepeatCustomerData] = useState<RepeatCustomer[]>([]);
  const [directCustomerData, setDirectCustomerData] = useState<DirectCustomer[]>([]);

  // Expanded rows for repeat customers
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());

  // Check permissions
  const canViewFinancials = authService.canViewFinancials() || authService.isAdmin();

  // Set default date range (current year)
  useEffect(() => {
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    const yearEnd = `${now.getFullYear()}-12-31`;
    setDateFrom(yearStart);
    setDateTo(yearEnd);
  }, []);

  // Load data function wrapped in useCallback
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const filters = {
      dateFrom,
      dateTo,
      vesselId: selectedVessel,
      ownerId: selectedOwner
    };

    // DEBUG: Log filter state when loading data
    console.log('=== LOADING DATA ===');
    console.log('Active tab:', activeTab);
    console.log('Filters:', JSON.stringify(filters, null, 2));
    console.log('selectedVessel state:', selectedVessel);

    try {
      switch (activeTab) {
        case 'payments':
          const payments = await getPaymentSummary(filters);
          console.log('Setting paymentData with', payments.length, 'records:', payments.map(p => p.vesselName));
          setPaymentData(payments);
          break;
        case 'charters':
          const charters = await getCharterSummary(filters);
          console.log('Setting charterData with', charters.length, 'records:', charters.map(c => c.vesselName));
          setCharterData(charters);
          break;
        case 'commissions':
          const commissions = await getCommissionSummary(filters);
          console.log('Setting commissionData with', commissions.length, 'records');
          setCommissionData(commissions);
          break;
        case 'vessels':
          const vessels = await getVesselSummary(filters);
          console.log('Setting vesselData with', vessels.length, 'records:', vessels.map(v => v.vesselName));
          setVesselData(vessels);
          break;
        case 'occupancy':
          const occupancy = await getOccupancySummary(filters);
          console.log('Setting occupancyData with', occupancy.length, 'records:', occupancy.map(o => o.vesselName));
          setOccupancyData(occupancy);
          break;
        case 'brokers':
          const brokers = await getBrokerSummary(filters);
          console.log('Setting brokerData with', brokers.length, 'records');
          setBrokerData(brokers);
          break;
        case 'repeat':
          const repeat = await getRepeatCustomers(filters);
          console.log('Setting repeatCustomerData with', repeat.length, 'records');
          setRepeatCustomerData(repeat);
          break;
        case 'direct':
          const direct = await getDirectCustomers(filters);
          console.log('Setting directCustomerData with', direct.length, 'records:', direct.map(d => d.vesselName));
          setDirectCustomerData(direct);
          break;
      }
      console.log('=== DATA LOAD COMPLETE ===');
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  }, [activeTab, dateFrom, dateTo, selectedVessel, selectedOwner]);

  // Load data when filters change
  useEffect(() => {
    if (!canViewFinancials) return;
    loadData();
  }, [canViewFinancials, loadData]);

  // Calculate totals for payments
  const paymentTotals = useMemo(() => {
    console.log('=== Calculating paymentTotals ===');
    console.log('paymentData count:', paymentData.length);

    // Debug: Log all amounts
    if (paymentData.length > 0) {
      console.log('All amounts:', paymentData.map(p => p.totalAmount));
    }

    const total = paymentData.reduce((acc, p) => acc + p.totalAmount, 0);
    const paid = paymentData.reduce((acc, p) => acc + p.paidAmount, 0);
    const unpaid = paymentData.reduce((acc, p) => acc + p.unpaidAmount, 0);
    const paidCount = paymentData.filter(p => p.status === 'paid').length;
    const partialCount = paymentData.filter(p => p.status === 'partial').length;
    const unpaidCount = paymentData.filter(p => p.status === 'unpaid').length;

    console.log('Calculated totals - Total:', total, 'Paid:', paid, 'Unpaid:', unpaid);

    return { total, paid, unpaid, paidCount, partialCount, unpaidCount };
  }, [paymentData]);

  // Calculate totals for charters
  const charterTotals = useMemo(() => {
    const totalCharters = charterData.reduce((acc, c) => acc + c.totalCharters, 0);
    const totalDays = charterData.reduce((acc, c) => acc + c.totalDays, 0);
    const totalRevenue = charterData.reduce((acc, c) => acc + c.totalRevenue, 0);
    return { totalCharters, totalDays, totalRevenue };
  }, [charterData]);

  // Calculate totals for commissions
  const commissionTotals = useMemo(() => {
    const totalRevenue = commissionData.reduce((acc, c) => acc + c.totalRevenue, 0);
    const totalCommission = commissionData.reduce((acc, c) => acc + c.commission, 0);
    const totalVat = commissionData.reduce((acc, c) => acc + c.vatOnCommission, 0);
    const totalNet = commissionData.reduce((acc, c) => acc + c.netToOwner, 0);
    return { totalRevenue, totalCommission, totalVat, totalNet };
  }, [commissionData]);

  // Calculate totals for vessels
  const vesselTotals = useMemo(() => {
    const totalBookings = vesselData.reduce((acc, v) => acc + v.totalBookings, 0);
    const totalDays = vesselData.reduce((acc, v) => acc + v.totalDays, 0);
    const totalRevenue = vesselData.reduce((acc, v) => acc + v.totalRevenue, 0);
    return { totalBookings, totalDays, totalRevenue };
  }, [vesselData]);

  // Calculate average occupancy
  const avgOccupancy = useMemo(() => {
    if (occupancyData.length === 0) return 0;
    return Math.round(occupancyData.reduce((acc, o) => acc + o.occupancyPercent, 0) / occupancyData.length);
  }, [occupancyData]);

  // Calculate totals for brokers
  const brokerTotals = useMemo(() => {
    const totalBookings = brokerData.reduce((acc, b) => acc + b.totalBookings, 0);
    const totalDays = brokerData.reduce((acc, b) => acc + b.totalDays, 0);
    const totalRevenue = brokerData.reduce((acc, b) => acc + b.totalRevenue, 0);
    const totalCommission = brokerData.reduce((acc, b) => acc + b.commission, 0);
    return { totalBookings, totalDays, totalRevenue, totalCommission };
  }, [brokerData]);

  // Calculate totals for repeat customers
  const repeatTotals = useMemo(() => {
    const totalCustomers = repeatCustomerData.length;
    const totalBookings = repeatCustomerData.reduce((acc, c) => acc + c.totalBookings, 0);
    const totalSpent = repeatCustomerData.reduce((acc, c) => acc + c.totalSpent, 0);
    return { totalCustomers, totalBookings, totalSpent };
  }, [repeatCustomerData]);

  // Calculate totals for direct customers
  const directTotals = useMemo(() => {
    const totalCustomers = directCustomerData.length;
    const totalRevenue = directCustomerData.reduce((acc, c) => acc + c.amount, 0);
    const bySource = directCustomerData.reduce((acc, c) => {
      acc[c.source] = (acc[c.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { totalCustomers, totalRevenue, bySource };
  }, [directCustomerData]);

  // Toggle expanded customer
  const toggleCustomerExpand = (customerId: number) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    let data: any[] = [];
    let sheetName = '';

    switch (activeTab) {
      case 'payments':
        sheetName = 'Payment Summary';
        data = paymentData.map(p => ({
          'Booking Code': p.bookingCode,
          'Vessel': p.vesselName,
          'Start Date': p.startDate,
          'End Date': p.endDate,
          'Total': p.totalAmount.toFixed(2),
          'Paid': p.paidAmount.toFixed(2),
          'Unpaid': p.unpaidAmount.toFixed(2),
          'Status': p.status.toUpperCase()
        }));
        break;
      case 'charters':
        sheetName = 'Charter Summary';
        data = charterData.map(c => ({
          'Vessel': c.vesselName,
          'Month': c.month,
          'Charters': c.totalCharters,
          'Days': c.totalDays,
          'Revenue': c.totalRevenue.toFixed(2)
        }));
        break;
      case 'commissions':
        sheetName = 'Commission Summary';
        data = commissionData.map(c => ({
          'Owner': c.ownerName,
          'Vessel': c.vesselName,
          'Revenue': c.totalRevenue.toFixed(2),
          'Commission': c.commission.toFixed(2),
          'VAT': c.vatOnCommission.toFixed(2),
          'Net to Owner': c.netToOwner.toFixed(2)
        }));
        break;
      case 'vessels':
        sheetName = 'Vessel Summary';
        data = vesselData.map(v => ({
          'Vessel': v.vesselName,
          'Bookings': v.totalBookings,
          'Days': v.totalDays,
          'Revenue': v.totalRevenue.toFixed(2),
          'Avg/Day': v.averagePerDay.toFixed(2)
        }));
        break;
      case 'occupancy':
        sheetName = 'Occupancy Summary';
        data = occupancyData.map(o => ({
          'Vessel': o.vesselName,
          'Season (Apr-Oct)': '214 days',
          'Booked Days': o.bookedDays,
          'Occupancy %': o.occupancyPercent + '%'
        }));
        break;
      case 'brokers':
        sheetName = 'Broker Summary';
        data = brokerData.map(b => ({
          'Broker': b.brokerName,
          'Email': b.brokerEmail,
          'Bookings': b.totalBookings,
          'Days': b.totalDays,
          'Revenue': b.totalRevenue.toFixed(2),
          'Commission': b.commission.toFixed(2)
        }));
        break;
      case 'repeat':
        sheetName = 'Repeat Customers';
        data = repeatCustomerData.map(c => ({
          'Customer': c.customerName,
          'Email': c.customerEmail,
          'Total Bookings': c.totalBookings,
          'Total Spent': c.totalSpent.toFixed(2),
          'First Booking': c.firstBooking,
          'Last Booking': c.lastBooking
        }));
        break;
      case 'direct':
        sheetName = 'Direct Customers';
        data = directCustomerData.map(c => ({
          'Customer': c.customerName,
          'Email': c.customerEmail,
          'Phone': c.customerPhone,
          'Booking': c.bookingCode,
          'Vessel': c.vesselName,
          'Dates': `${c.startDate} - ${c.endDate}`,
          'Amount': c.amount.toFixed(2),
          'Source': c.source
        }));
        break;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Tab definitions
  const tabs: { key: TabType; labelEl: string; labelEn: string; icon: string }[] = [
    { key: 'payments', labelEl: 'Πληρωμές', labelEn: 'Payments', icon: '💳' },
    { key: 'charters', labelEl: 'Ναύλα', labelEn: 'Charters', icon: '⛵' },
    { key: 'commissions', labelEl: 'Προμήθειες', labelEn: 'Commissions', icon: '💰' },
    { key: 'vessels', labelEl: 'Σκάφη', labelEn: 'Vessels', icon: '🚢' },
    { key: 'occupancy', labelEl: 'Κατάληψη', labelEn: 'Occupancy', icon: '📊' },
    { key: 'brokers', labelEl: 'Brokers', labelEn: 'Brokers', icon: '🤝' },
    { key: 'repeat', labelEl: 'Επαναλ. Πελάτες', labelEn: 'Repeat Customers', icon: '🔄' },
    { key: 'direct', labelEl: 'Direct Πελάτες', labelEn: 'Direct Customers', icon: '📞' }
  ];

  if (!canViewFinancials) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="text-center text-[#374151]">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2 text-[#1e40af]">Access Denied</h2>
          <p className="text-[#6b7280]">You don't have permission to view financial reports.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <div className="bg-[#1e40af] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#1e3a8a] rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                📋 {lang === 'el' ? 'ΣΥΓΚΕΝΤΡΩΤΙΚΑ' : 'CONSOLIDATED REPORTS'}
              </h1>
              <p className="text-sm text-blue-200">
                {lang === 'el' ? 'Οικονομικές Αναφορές' : 'Financial Reports'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'el' ? 'en' : 'el')}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white transition-colors"
          >
            {lang === 'el' ? 'EN' : 'EL'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-[#d1d5db] shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Date From */}
          <div>
            <label className="block text-xs text-[#374151] font-medium mb-1">
              {lang === 'el' ? 'Από' : 'From'}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[#374151] text-sm focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs text-[#374151] font-medium mb-1">
              {lang === 'el' ? 'Έως' : 'To'}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[#374151] text-sm focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] focus:outline-none"
            />
          </div>

          {/* Vessel */}
          <div>
            <label className="block text-xs text-[#374151] font-medium mb-1">
              {lang === 'el' ? 'Σκάφος' : 'Vessel'}
            </label>
            <select
              value={selectedVessel || ''}
              onChange={(e) => setSelectedVessel(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[#374151] text-sm focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">{lang === 'el' ? 'Όλα' : 'All'}</option>
              {VESSELS.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-xs text-[#374151] font-medium mb-1">
              {lang === 'el' ? 'Ιδιοκτήτης' : 'Owner'}
            </label>
            <select
              value={selectedOwner || ''}
              onChange={(e) => setSelectedOwner(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[#374151] text-sm focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] focus:outline-none"
            >
              <option value="">{lang === 'el' ? 'Όλοι' : 'All'}</option>
              {OWNERS.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2 bg-white border-b border-[#d1d5db] overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-[#1e40af] text-white shadow-lg'
                  : 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb] border border-[#d1d5db]'
              }`}
            >
              {tab.icon} {lang === 'el' ? tab.labelEl : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-[1200px] mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e40af] mx-auto mb-4"></div>
              <p className="text-[#6b7280]">{lang === 'el' ? 'Φόρτωση...' : 'Loading...'}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Payment Summary Tab */}
            {activeTab === 'payments' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <div className="text-green-100 text-xs mb-1">{lang === 'el' ? 'Πληρωμένα' : 'Paid'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(paymentTotals.paid)}</div>
                    <div className="text-green-200 text-xs mt-1">{paymentTotals.paidCount} {lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="text-orange-100 text-xs mb-1">{lang === 'el' ? 'Μερικώς' : 'Partial'}</div>
                    <div className="text-2xl font-bold text-white">{paymentTotals.partialCount}</div>
                    <div className="text-orange-200 text-xs mt-1">{lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-xl shadow-lg">
                    <div className="text-red-100 text-xs mb-1">{lang === 'el' ? 'Ανεξόφλητα' : 'Unpaid'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(paymentTotals.unpaid)}</div>
                    <div className="text-red-200 text-xs mt-1">{paymentTotals.unpaidCount} {lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                  </div>
                </div>

                {/* Total Bar */}
                <div className="bg-white p-4 rounded-lg mb-4 border border-[#d1d5db] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#374151] text-sm font-medium">{lang === 'el' ? 'Σύνολο' : 'Total'}</span>
                    <span className="text-xl font-bold text-[#1e40af]">{formatMoneyShort(paymentTotals.total)}</span>
                  </div>
                  <div className="h-3 bg-[#e5e7eb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${(paymentTotals.paid / paymentTotals.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-[#6b7280]">
                    <span>{Math.round((paymentTotals.paid / paymentTotals.total) * 100)}% {lang === 'el' ? 'εισπράχθηκε' : 'collected'}</span>
                    <span>{Math.round((paymentTotals.unpaid / paymentTotals.total) * 100)}% {lang === 'el' ? 'εκκρεμεί' : 'pending'}</span>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f9fafb]">
                        <tr className="text-[#374151] text-left border-b border-[#d1d5db]">
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Κωδικός' : 'Code'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Σκάφος' : 'Vessel'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Ημερομηνίες' : 'Dates'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Σύνολο' : 'Total'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Πληρωμένα' : 'Paid'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Υπόλοιπο' : 'Balance'}</th>
                          <th className="p-3 text-center font-semibold">{lang === 'el' ? 'Κατάσταση' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentData.map((payment, idx) => (
                          <tr key={idx} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                            <td className="p-3 font-mono text-[#1e40af]">{payment.bookingCode}</td>
                            <td className="p-3 text-[#374151] font-medium">{payment.vesselName}</td>
                            <td className="p-3 text-[#6b7280]">
                              {new Date(payment.startDate).toLocaleDateString('el-GR')} - {new Date(payment.endDate).toLocaleDateString('el-GR')}
                            </td>
                            <td className="p-3 text-right text-[#374151] font-medium">{formatMoneyShort(payment.totalAmount)}</td>
                            <td className="p-3 text-right text-green-600">{formatMoneyShort(payment.paidAmount)}</td>
                            <td className="p-3 text-right text-red-600">{formatMoneyShort(payment.unpaidAmount)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                                payment.status === 'partial' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {payment.status === 'paid' ? (lang === 'el' ? 'Εξοφλημένο' : 'Paid') :
                                 payment.status === 'partial' ? (lang === 'el' ? 'Μερικώς' : 'Partial') :
                                 (lang === 'el' ? 'Ανεξόφλητο' : 'Unpaid')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Charter Summary Tab */}
            {activeTab === 'charters' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Συνολικά Ναύλα' : 'Total Charters'}</div>
                    <div className="text-2xl font-bold text-white">{charterTotals.totalCharters}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg">
                    <div className="text-purple-100 text-xs mb-1">{lang === 'el' ? 'Συνολικές Ημέρες' : 'Total Days'}</div>
                    <div className="text-2xl font-bold text-white">{charterTotals.totalDays}</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Συνολικά Έσοδα' : 'Total Revenue'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(charterTotals.totalRevenue)}</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f9fafb]">
                        <tr className="text-[#374151] text-left border-b border-[#d1d5db]">
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Σκάφος' : 'Vessel'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Μήνας' : 'Month'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Ναύλα' : 'Charters'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Ημέρες' : 'Days'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Έσοδα' : 'Revenue'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charterData.map((charter, idx) => (
                          <tr key={idx} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                            <td className="p-3 text-[#374151] font-medium">{charter.vesselName}</td>
                            <td className="p-3 text-[#6b7280]">{charter.month}</td>
                            <td className="p-3 text-right text-[#1e40af] font-medium">{charter.totalCharters}</td>
                            <td className="p-3 text-right text-[#6b7280]">{charter.totalDays}</td>
                            <td className="p-3 text-right text-green-600 font-medium">{formatMoneyShort(charter.totalRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Commission Summary Tab */}
            {activeTab === 'commissions' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <div className="text-green-100 text-xs mb-1">{lang === 'el' ? 'Συν. Έσοδα' : 'Total Revenue'}</div>
                    <div className="text-xl font-bold text-white">{formatMoneyShort(commissionTotals.totalRevenue)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="text-orange-100 text-xs mb-1">{lang === 'el' ? 'Προμήθεια' : 'Commission'}</div>
                    <div className="text-xl font-bold text-white">{formatMoneyShort(commissionTotals.totalCommission)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-xl shadow-lg">
                    <div className="text-red-100 text-xs mb-1">{lang === 'el' ? 'ΦΠΑ Προμήθειας' : 'VAT'}</div>
                    <div className="text-xl font-bold text-white">{formatMoneyShort(commissionTotals.totalVat)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Καθαρά σε Ιδιοκτ.' : 'Net to Owner'}</div>
                    <div className="text-xl font-bold text-white">{formatMoneyShort(commissionTotals.totalNet)}</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f9fafb]">
                        <tr className="text-[#374151] text-left border-b border-[#d1d5db]">
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Ιδιοκτήτης' : 'Owner'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Σκάφος' : 'Vessel'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Έσοδα' : 'Revenue'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Προμήθεια' : 'Commission'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'ΦΠΑ' : 'VAT'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Καθαρά' : 'Net'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionData.map((comm, idx) => (
                          <tr key={idx} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                            <td className="p-3 text-[#374151] font-medium">{comm.ownerName}</td>
                            <td className="p-3 text-[#6b7280]">{comm.vesselName}</td>
                            <td className="p-3 text-right text-green-600">{formatMoneyShort(comm.totalRevenue)}</td>
                            <td className="p-3 text-right text-orange-600">{formatMoneyShort(comm.commission)}</td>
                            <td className="p-3 text-right text-red-600">{formatMoneyShort(comm.vatOnCommission)}</td>
                            <td className="p-3 text-right text-[#1e40af] font-bold">{formatMoneyShort(comm.netToOwner)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Vessel Summary Tab */}
            {activeTab === 'vessels' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Συν. Κρατήσεις' : 'Total Bookings'}</div>
                    <div className="text-2xl font-bold text-white">{vesselTotals.totalBookings}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg">
                    <div className="text-purple-100 text-xs mb-1">{lang === 'el' ? 'Συν. Ημέρες' : 'Total Days'}</div>
                    <div className="text-2xl font-bold text-white">{vesselTotals.totalDays}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <div className="text-green-100 text-xs mb-1">{lang === 'el' ? 'Συν. Έσοδα' : 'Total Revenue'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(vesselTotals.totalRevenue)}</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f9fafb]">
                        <tr className="text-[#374151] text-left border-b border-[#d1d5db]">
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Σκάφος' : 'Vessel'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Κρατήσεις' : 'Bookings'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Ημέρες' : 'Days'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Έσοδα' : 'Revenue'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Μέσος/Ημέρα' : 'Avg/Day'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vesselData.map((vessel, idx) => (
                          <tr key={idx} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                            <td className="p-3 text-[#374151] font-medium">{vessel.vesselName}</td>
                            <td className="p-3 text-right text-[#1e40af] font-medium">{vessel.totalBookings}</td>
                            <td className="p-3 text-right text-[#6b7280]">{vessel.totalDays}</td>
                            <td className="p-3 text-right text-green-600 font-medium">{formatMoneyShort(vessel.totalRevenue)}</td>
                            <td className="p-3 text-right text-[#6b7280]">{formatMoneyShort(vessel.averagePerDay)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Occupancy Tab */}
            {activeTab === 'occupancy' && (
              <div>
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-6 rounded-xl shadow-lg mb-4">
                  <div className="text-center">
                    <div className="text-blue-100 text-sm mb-1">{lang === 'el' ? 'Μέση Κατάληψη Στόλου' : 'Average Fleet Occupancy'}</div>
                    <div className="text-5xl font-bold text-white">{avgOccupancy}%</div>
                    <div className="text-blue-200 text-xs mt-2">
                      {lang === 'el' ? 'Περίοδος: 1 Απριλίου - 31 Οκτωβρίου (214 ημέρες)' : 'Season: April 1 - October 31 (214 days)'}
                    </div>
                  </div>
                </div>

                {/* Vessel Occupancy Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {occupancyData.map((occ, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-[#d1d5db] shadow-sm">
                      <div className="text-[#374151] font-medium mb-2">{occ.vesselName}</div>
                      <div className="relative h-4 bg-[#e5e7eb] rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full transition-all duration-500 ${
                            occ.occupancyPercent >= 70 ? 'bg-green-500' :
                            occ.occupancyPercent >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${occ.occupancyPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#6b7280]">{occ.bookedDays}/214 {lang === 'el' ? 'ημέρες' : 'days'}</span>
                        <span className={`font-bold ${
                          occ.occupancyPercent >= 70 ? 'text-green-600' :
                          occ.occupancyPercent >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{occ.occupancyPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Broker Summary Tab */}
            {activeTab === 'brokers' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Brokers' : 'Brokers'}</div>
                    <div className="text-2xl font-bold text-white">{brokerData.length}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg">
                    <div className="text-purple-100 text-xs mb-1">{lang === 'el' ? 'Κρατήσεις' : 'Bookings'}</div>
                    <div className="text-2xl font-bold text-white">{brokerTotals.totalBookings}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <div className="text-green-100 text-xs mb-1">{lang === 'el' ? 'Έσοδα' : 'Revenue'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(brokerTotals.totalRevenue)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="text-orange-100 text-xs mb-1">{lang === 'el' ? 'Προμήθειες' : 'Commissions'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(brokerTotals.totalCommission)}</div>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f9fafb]">
                        <tr className="text-[#374151] text-left border-b border-[#d1d5db]">
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Broker' : 'Broker'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Email' : 'Email'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Κρατήσεις' : 'Bookings'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Ημέρες' : 'Days'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Έσοδα' : 'Revenue'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Προμήθεια' : 'Commission'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brokerData.map((broker, idx) => (
                          <tr key={idx} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                            <td className="p-3 text-[#374151] font-medium">{broker.brokerName}</td>
                            <td className="p-3 text-[#6b7280] text-xs">{broker.brokerEmail}</td>
                            <td className="p-3 text-right text-[#1e40af] font-bold">{broker.totalBookings}</td>
                            <td className="p-3 text-right text-[#6b7280]">{broker.totalDays}</td>
                            <td className="p-3 text-right text-green-600 font-medium">{formatMoneyShort(broker.totalRevenue)}</td>
                            <td className="p-3 text-right text-orange-600">{formatMoneyShort(broker.commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#f9fafb]">
                        <tr className="text-[#374151] font-bold border-t border-[#d1d5db]">
                          <td className="p-3" colSpan={2}>{lang === 'el' ? 'ΣΥΝΟΛΟ' : 'TOTAL'}</td>
                          <td className="p-3 text-right text-[#1e40af]">{brokerTotals.totalBookings}</td>
                          <td className="p-3 text-right">{brokerTotals.totalDays}</td>
                          <td className="p-3 text-right text-green-600">{formatMoneyShort(brokerTotals.totalRevenue)}</td>
                          <td className="p-3 text-right text-orange-600">{formatMoneyShort(brokerTotals.totalCommission)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Repeat Customers Tab */}
            {activeTab === 'repeat' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Επαναλ. Πελάτες' : 'Repeat Customers'}</div>
                    <div className="text-2xl font-bold text-white">{repeatTotals.totalCustomers}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg">
                    <div className="text-purple-100 text-xs mb-1">{lang === 'el' ? 'Συν. Κρατήσεις' : 'Total Bookings'}</div>
                    <div className="text-2xl font-bold text-white">{repeatTotals.totalBookings}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <div className="text-green-100 text-xs mb-1">{lang === 'el' ? 'Συν. Έσοδα' : 'Total Spent'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(repeatTotals.totalSpent)}</div>
                  </div>
                </div>

                {/* Customer Cards with expandable booking history */}
                <div className="space-y-3">
                  {repeatCustomerData.map((customer, idx) => {
                    const isExpanded = expandedCustomers.has(customer.customerId);
                    return (
                      <div key={idx} className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                        {/* Customer Header */}
                        <button
                          onClick={() => toggleCustomerExpand(customer.customerId)}
                          className="w-full p-4 flex items-center justify-between hover:bg-[#f9fafb] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#1e40af] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {customer.customerName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="text-left">
                              <div className="text-[#374151] font-medium">{customer.customerName}</div>
                              <div className="text-[#6b7280] text-xs">{customer.customerEmail}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-[#1e40af] font-bold">{customer.totalBookings} {lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                              <div className="text-green-600 text-sm">{formatMoneyShort(customer.totalSpent)}</div>
                            </div>
                            <span className={`text-[#6b7280] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                          </div>
                        </button>

                        {/* Expanded Booking History */}
                        {isExpanded && (
                          <div className="border-t border-[#d1d5db] p-4 bg-[#f9fafb]">
                            <div className="text-xs text-[#6b7280] mb-2">
                              {lang === 'el' ? 'Ιστορικό Κρατήσεων' : 'Booking History'} ({customer.firstBooking} - {customer.lastBooking})
                            </div>
                            <div className="space-y-2">
                              {customer.bookings.map((booking, bIdx) => (
                                <div key={bIdx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#e5e7eb]">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[#1e40af] font-mono text-xs">{booking.bookingCode}</span>
                                    <span className="text-[#374151]">{booking.vesselName}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-[#6b7280] text-xs">
                                      {new Date(booking.startDate).toLocaleDateString('el-GR')} - {new Date(booking.endDate).toLocaleDateString('el-GR')}
                                    </span>
                                    <span className="text-green-600 font-medium">{formatMoneyShort(booking.amount)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct Customers Tab */}
            {activeTab === 'direct' && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Direct Πελάτες' : 'Direct Customers'}</div>
                    <div className="text-2xl font-bold text-white">{directTotals.totalCustomers}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                    <div className="text-green-100 text-xs mb-1">{lang === 'el' ? 'Συν. Έσοδα' : 'Total Revenue'}</div>
                    <div className="text-2xl font-bold text-white">{formatMoneyShort(directTotals.totalRevenue)}</div>
                  </div>
                  {Object.entries(directTotals.bySource).slice(0, 2).map(([source, count]) => (
                    <div key={source} className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg">
                      <div className="text-purple-100 text-xs mb-1">{source}</div>
                      <div className="text-2xl font-bold text-white">{count}</div>
                    </div>
                  ))}
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg border border-[#d1d5db] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f9fafb]">
                        <tr className="text-[#374151] text-left border-b border-[#d1d5db]">
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Πελάτης' : 'Customer'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Επικοινωνία' : 'Contact'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Κράτηση' : 'Booking'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Σκάφος' : 'Vessel'}</th>
                          <th className="p-3 font-semibold">{lang === 'el' ? 'Ημερομηνίες' : 'Dates'}</th>
                          <th className="p-3 text-right font-semibold">{lang === 'el' ? 'Ποσό' : 'Amount'}</th>
                          <th className="p-3 text-center font-semibold">{lang === 'el' ? 'Πηγή' : 'Source'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directCustomerData.map((customer, idx) => (
                          <tr key={idx} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] transition-colors">
                            <td className="p-3 text-[#374151] font-medium">{customer.customerName}</td>
                            <td className="p-3">
                              <div className="text-[#6b7280] text-xs">{customer.customerEmail}</div>
                              <div className="text-[#9ca3af] text-xs">{customer.customerPhone}</div>
                            </td>
                            <td className="p-3 font-mono text-[#1e40af] text-xs">{customer.bookingCode}</td>
                            <td className="p-3 text-[#6b7280]">{customer.vesselName}</td>
                            <td className="p-3 text-[#6b7280] text-xs">
                              {new Date(customer.startDate).toLocaleDateString('el-GR')} - {new Date(customer.endDate).toLocaleDateString('el-GR')}
                            </td>
                            <td className="p-3 text-right text-green-600 font-medium">{formatMoneyShort(customer.amount)}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                customer.source === 'Website' ? 'bg-blue-100 text-blue-700' :
                                customer.source === 'Phone' ? 'bg-green-100 text-green-700' :
                                customer.source === 'Referral' ? 'bg-purple-100 text-purple-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {customer.source}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#f9fafb]">
                        <tr className="text-[#374151] font-bold border-t border-[#d1d5db]">
                          <td className="p-3" colSpan={5}>{lang === 'el' ? 'ΣΥΝΟΛΟ' : 'TOTAL'} ({directTotals.totalCustomers} {lang === 'el' ? 'πελάτες' : 'customers'})</td>
                          <td className="p-3 text-right text-green-600">{formatMoneyShort(directTotals.totalRevenue)}</td>
                          <td className="p-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#d1d5db] shadow-lg">
        <div className="flex gap-3 justify-center max-w-[800px] mx-auto">
          <button
            onClick={exportToExcel}
            className="px-6 py-3 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>📊</span> Excel
          </button>
          <button
            onClick={() => alert('PDF export coming soon!')}
            className="px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>📄</span> PDF
          </button>
          <button
            onClick={() => alert('Word export coming soon!')}
            className="px-6 py-3 bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>📝</span> Word
          </button>
        </div>
      </div>

      {/* Bottom padding for fixed footer */}
      <div className="h-20"></div>
    </div>
  );
};

export default ConsolidatedReports;
