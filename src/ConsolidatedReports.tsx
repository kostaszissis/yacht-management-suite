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

// API placeholder functions
const API_BASE = 'https://yachtmanagementsuite.com/api';

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

// Helper function to check if owner owns a vessel
function ownerOwnsVessel(ownerId: number, vesselId: number): boolean {
  const owner = OWNERS.find(o => o.id === ownerId);
  return owner ? owner.vessels.includes(vesselId) : false;
}

// Helper function to check if a date is within range
function isDateInRange(date: string, dateFrom: string | null, dateTo: string | null): boolean {
  if (!dateFrom && !dateTo) return true;
  const d = new Date(date);
  if (dateFrom && d < new Date(dateFrom)) return false;
  if (dateTo && d > new Date(dateTo)) return false;
  return true;
}

// Helper to get vessels owned by an owner
function getOwnerVessels(ownerId: number): number[] {
  const owner = OWNERS.find(o => o.id === ownerId);
  return owner ? owner.vessels : [];
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

// Placeholder API functions
async function getPaymentSummary(filters: Filters): Promise<PaymentSummary[]> {
  console.log('=== getPaymentSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call

  // Get current year for placeholder data
  const currentYear = new Date().getFullYear();

  // Placeholder data - using current year for dates
  let data: PaymentSummary[] = [
    { bookingCode: 'BK-2024-001', vesselName: 'Maria 1', startDate: `${currentYear}-06-15`, endDate: `${currentYear}-06-22`, totalAmount: 5000, paidAmount: 5000, unpaidAmount: 0, status: 'paid' },
    { bookingCode: 'BK-2024-002', vesselName: 'Valesia', startDate: `${currentYear}-07-01`, endDate: `${currentYear}-07-08`, totalAmount: 7500, paidAmount: 3000, unpaidAmount: 4500, status: 'partial' },
    { bookingCode: 'BK-2024-003', vesselName: 'Bar Bar', startDate: `${currentYear}-07-10`, endDate: `${currentYear}-07-17`, totalAmount: 6000, paidAmount: 0, unpaidAmount: 6000, status: 'unpaid' },
    { bookingCode: 'BK-2024-004', vesselName: 'Maria 2', startDate: `${currentYear}-07-20`, endDate: `${currentYear}-07-27`, totalAmount: 5500, paidAmount: 5500, unpaidAmount: 0, status: 'paid' },
    { bookingCode: 'BK-2024-005', vesselName: 'Infinity', startDate: `${currentYear}-08-01`, endDate: `${currentYear}-08-08`, totalAmount: 8000, paidAmount: 4000, unpaidAmount: 4000, status: 'partial' },
    { bookingCode: 'BK-2024-006', vesselName: 'Kalispera', startDate: `${currentYear}-06-20`, endDate: `${currentYear}-06-27`, totalAmount: 7000, paidAmount: 7000, unpaidAmount: 0, status: 'paid' },
    { bookingCode: 'BK-2024-007', vesselName: 'Perla', startDate: `${currentYear}-07-25`, endDate: `${currentYear}-08-01`, totalAmount: 8500, paidAmount: 4250, unpaidAmount: 4250, status: 'partial' },
    { bookingCode: 'BK-2024-008', vesselName: 'Bob', startDate: `${currentYear}-08-10`, endDate: `${currentYear}-08-17`, totalAmount: 6500, paidAmount: 0, unpaidAmount: 6500, status: 'unpaid' },
  ];

  console.log('Initial data count:', data.length);

  // Apply vessel filter
  if (filters.vesselId) {
    const vesselName = getVesselNameById(filters.vesselId);
    console.log('Vessel filter active - vesselId:', filters.vesselId, '-> vesselName:', vesselName);
    if (vesselName) {
      const beforeCount = data.length;
      data = data.filter(p => p.vesselName === vesselName);
      console.log('After vessel filter:', beforeCount, '->', data.length, 'records');
    }
  } else {
    console.log('No vessel filter applied (vesselId is null/undefined)');
  }

  // Apply owner filter (filter by vessels owned)
  if (filters.ownerId) {
    const ownerVessels = getOwnerVessels(filters.ownerId);
    data = data.filter(p => {
      const vesselId = getVesselIdByName(p.vesselName);
      return vesselId && ownerVessels.includes(vesselId);
    });
  }

  // Apply date range filter
  if (filters.dateFrom || filters.dateTo) {
    data = data.filter(p => isDateInRange(p.startDate, filters.dateFrom || null, filters.dateTo || null));
  }

  return data;
}

async function getCharterSummary(filters: Filters): Promise<CharterSummary[]> {
  console.log('=== getCharterSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call
  const currentYear = new Date().getFullYear();

  let data: CharterSummary[] = [
    { vesselId: 1, vesselName: 'Maria 1', month: `${currentYear}-06`, totalCharters: 3, totalDays: 21, totalRevenue: 15000 },
    { vesselId: 1, vesselName: 'Maria 1', month: `${currentYear}-07`, totalCharters: 4, totalDays: 28, totalRevenue: 20000 },
    { vesselId: 2, vesselName: 'Maria 2', month: `${currentYear}-06`, totalCharters: 2, totalDays: 14, totalRevenue: 11000 },
    { vesselId: 2, vesselName: 'Maria 2', month: `${currentYear}-07`, totalCharters: 3, totalDays: 21, totalRevenue: 16500 },
    { vesselId: 3, vesselName: 'Valesia', month: `${currentYear}-06`, totalCharters: 2, totalDays: 14, totalRevenue: 18000 },
    { vesselId: 3, vesselName: 'Valesia', month: `${currentYear}-07`, totalCharters: 3, totalDays: 21, totalRevenue: 22500 },
    { vesselId: 4, vesselName: 'Bar Bar', month: `${currentYear}-06`, totalCharters: 2, totalDays: 14, totalRevenue: 12000 },
    { vesselId: 4, vesselName: 'Bar Bar', month: `${currentYear}-07`, totalCharters: 4, totalDays: 28, totalRevenue: 24000 },
    { vesselId: 5, vesselName: 'Kalispera', month: `${currentYear}-07`, totalCharters: 3, totalDays: 21, totalRevenue: 14000 },
    { vesselId: 6, vesselName: 'Infinity', month: `${currentYear}-07`, totalCharters: 4, totalDays: 28, totalRevenue: 32000 },
    { vesselId: 7, vesselName: 'Perla', month: `${currentYear}-08`, totalCharters: 3, totalDays: 21, totalRevenue: 25500 },
    { vesselId: 8, vesselName: 'Bob', month: `${currentYear}-08`, totalCharters: 2, totalDays: 14, totalRevenue: 13000 },
  ];

  console.log('Initial charter data count:', data.length);

  // Apply vessel filter
  if (filters.vesselId) {
    console.log('Vessel filter active - vesselId:', filters.vesselId);
    const beforeCount = data.length;
    data = data.filter(c => c.vesselId === filters.vesselId);
    console.log('After vessel filter:', beforeCount, '->', data.length, 'records');
  }

  // Apply owner filter
  if (filters.ownerId) {
    const ownerVessels = getOwnerVessels(filters.ownerId);
    console.log('Owner filter active - ownerId:', filters.ownerId, '-> vessels:', ownerVessels);
    data = data.filter(c => ownerVessels.includes(c.vesselId));
  }

  // Apply date range filter (filter by month)
  if (filters.dateFrom || filters.dateTo) {
    const beforeCount = data.length;
    data = data.filter(c => {
      const monthStart = c.month + '-01';
      return isDateInRange(monthStart, filters.dateFrom || null, filters.dateTo || null);
    });
    console.log('After date filter:', beforeCount, '->', data.length, 'records');
  }

  console.log('Final charter data count:', data.length);
  return data;
}

async function getCommissionSummary(filters: Filters): Promise<CommissionSummary[]> {
  console.log('=== getCommissionSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call
  let data: CommissionSummary[] = [
    { ownerId: 1, ownerName: 'Owner A', vesselName: 'Maria 1', totalRevenue: 35000, commission: 7000, vatOnCommission: 1680, netToOwner: 26320 },
    { ownerId: 1, ownerName: 'Owner A', vesselName: 'Maria 2', totalRevenue: 25000, commission: 5000, vatOnCommission: 1200, netToOwner: 18800 },
    { ownerId: 2, ownerName: 'Owner B', vesselName: 'Valesia', totalRevenue: 45000, commission: 9000, vatOnCommission: 2160, netToOwner: 33840 },
    { ownerId: 2, ownerName: 'Owner B', vesselName: 'Bar Bar', totalRevenue: 36000, commission: 7200, vatOnCommission: 1728, netToOwner: 27072 },
    { ownerId: 3, ownerName: 'Owner C', vesselName: 'Kalispera', totalRevenue: 28000, commission: 5600, vatOnCommission: 1344, netToOwner: 21056 },
    { ownerId: 3, ownerName: 'Owner C', vesselName: 'Infinity', totalRevenue: 64000, commission: 12800, vatOnCommission: 3072, netToOwner: 48128 },
    { ownerId: 4, ownerName: 'Owner D', vesselName: 'Perla', totalRevenue: 51000, commission: 10200, vatOnCommission: 2448, netToOwner: 38352 },
    { ownerId: 4, ownerName: 'Owner D', vesselName: 'Bob', totalRevenue: 26000, commission: 5200, vatOnCommission: 1248, netToOwner: 19552 },
  ];

  console.log('Initial commission data count:', data.length);

  // Apply vessel filter
  if (filters.vesselId) {
    const vesselName = getVesselNameById(filters.vesselId);
    console.log('Vessel filter active - vesselId:', filters.vesselId, '-> vesselName:', vesselName);
    if (vesselName) {
      const beforeCount = data.length;
      data = data.filter(c => c.vesselName === vesselName);
      console.log('After vessel filter:', beforeCount, '->', data.length, 'records');
    }
  }

  // Apply owner filter
  if (filters.ownerId) {
    console.log('Owner filter active - ownerId:', filters.ownerId);
    data = data.filter(c => c.ownerId === filters.ownerId);
  }

  console.log('Final commission data count:', data.length);
  return data;
}

async function getVesselSummary(filters: Filters): Promise<VesselSummary[]> {
  console.log('=== getVesselSummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call

  // Generate consistent data (not random) for each vessel
  const vesselStats: Record<number, { bookings: number; days: number; revenue: number }> = {
    1: { bookings: 12, days: 84, revenue: 42000 },   // Maria 1
    2: { bookings: 10, days: 70, revenue: 35000 },   // Maria 2
    3: { bookings: 14, days: 98, revenue: 73500 },   // Valesia
    4: { bookings: 11, days: 77, revenue: 46200 },   // Bar Bar
    5: { bookings: 8, days: 56, revenue: 28000 },    // Kalispera
    6: { bookings: 15, days: 105, revenue: 84000 },  // Infinity
    7: { bookings: 13, days: 91, revenue: 68250 },   // Perla
    8: { bookings: 7, days: 49, revenue: 24500 },    // Bob
  };

  let vessels = VESSELS;
  console.log('Initial vessels count:', vessels.length);

  // Apply vessel filter
  if (filters.vesselId) {
    console.log('Vessel filter active - vesselId:', filters.vesselId);
    const beforeCount = vessels.length;
    vessels = vessels.filter(v => v.id === filters.vesselId);
    console.log('After vessel filter:', beforeCount, '->', vessels.length, 'vessels');
  }

  // Apply owner filter
  if (filters.ownerId) {
    const ownerVessels = getOwnerVessels(filters.ownerId);
    console.log('Owner filter active - ownerId:', filters.ownerId, '-> vessels:', ownerVessels);
    vessels = vessels.filter(v => ownerVessels.includes(v.id));
  }

  const result = vessels.map(v => {
    const stats = vesselStats[v.id] || { bookings: 0, days: 0, revenue: 0 };
    return {
      vesselId: v.id,
      vesselName: v.name,
      totalBookings: stats.bookings,
      totalDays: stats.days,
      totalRevenue: stats.revenue,
      averagePerDay: stats.days > 0 ? Math.round(stats.revenue / stats.days) : 0
    };
  });
  console.log('Final vessel summary count:', result.length);
  return result;
}

async function getOccupancySummary(filters: Filters): Promise<OccupancySummary[]> {
  console.log('=== getOccupancySummary called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call
  // Charter season: April 1st to October 31st = 214 days
  const SEASON_DAYS = 214;

  // Consistent booked days per vessel
  const vesselBookedDays: Record<number, number> = {
    1: 168,  // Maria 1 - 78%
    2: 140,  // Maria 2 - 65%
    3: 182,  // Valesia - 85%
    4: 154,  // Bar Bar - 72%
    5: 112,  // Kalispera - 52%
    6: 196,  // Infinity - 92%
    7: 175,  // Perla - 82%
    8: 98,   // Bob - 46%
  };

  let vessels = VESSELS;
  console.log('Initial vessels count:', vessels.length);

  // Apply vessel filter
  if (filters.vesselId) {
    console.log('Vessel filter active - vesselId:', filters.vesselId);
    const beforeCount = vessels.length;
    vessels = vessels.filter(v => v.id === filters.vesselId);
    console.log('After vessel filter:', beforeCount, '->', vessels.length, 'vessels');
  }

  // Apply owner filter
  if (filters.ownerId) {
    const ownerVessels = getOwnerVessels(filters.ownerId);
    console.log('Owner filter active - ownerId:', filters.ownerId, '-> vessels:', ownerVessels);
    vessels = vessels.filter(v => ownerVessels.includes(v.id));
  }

  const result = vessels.map(v => {
    const bookedDays = vesselBookedDays[v.id] || 0;
    return {
      vesselId: v.id,
      vesselName: v.name,
      totalDays: SEASON_DAYS,
      bookedDays: Math.min(bookedDays, SEASON_DAYS),
      occupancyPercent: Math.round((Math.min(bookedDays, SEASON_DAYS) / SEASON_DAYS) * 100)
    };
  });
  console.log('Final occupancy summary count:', result.length);
  return result;
}

async function getBrokerSummary(filters: Filters): Promise<BrokerSummary[]> {
  console.log('Fetching broker summary with filters:', filters);
  // TODO: Replace with actual API call
  // Note: Broker data is aggregated - vessel/owner filters would require more complex data structure
  // For now, broker summary shows all brokers (vessel filter doesn't apply directly to brokers)
  return [
    { brokerId: 1, brokerName: 'Sunsail Greece', brokerEmail: 'bookings@sunsail.gr', totalBookings: 12, totalDays: 84, totalRevenue: 65000, commission: 13000 },
    { brokerId: 2, brokerName: 'Moorings Charter', brokerEmail: 'info@moorings.com', totalBookings: 8, totalDays: 56, totalRevenue: 48000, commission: 9600 },
    { brokerId: 3, brokerName: 'Dream Yacht', brokerEmail: 'sales@dreamyacht.com', totalBookings: 15, totalDays: 105, totalRevenue: 82000, commission: 16400 },
    { brokerId: 4, brokerName: 'Navigare Yachting', brokerEmail: 'charter@navigare.com', totalBookings: 6, totalDays: 42, totalRevenue: 35000, commission: 7000 },
    { brokerId: 5, brokerName: 'Click&Boat', brokerEmail: 'pro@clickandboat.com', totalBookings: 10, totalDays: 70, totalRevenue: 55000, commission: 11000 },
  ];
}

async function getRepeatCustomers(filters: Filters): Promise<RepeatCustomer[]> {
  console.log('=== getRepeatCustomers called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  let data: RepeatCustomer[] = [
    {
      customerId: 1,
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      totalBookings: 4,
      totalSpent: 28000,
      firstBooking: `${lastYear}-06-15`,
      lastBooking: `${currentYear}-07-20`,
      bookings: [
        { bookingCode: `BK-${lastYear}-045`, vesselName: 'Maria 1', startDate: `${lastYear}-06-15`, endDate: `${lastYear}-06-22`, amount: 5000 },
        { bookingCode: `BK-${lastYear}-089`, vesselName: 'Maria 1', startDate: `${lastYear}-08-05`, endDate: `${lastYear}-08-12`, amount: 6000 },
        { bookingCode: `BK-${currentYear}-012`, vesselName: 'Valesia', startDate: `${currentYear}-05-10`, endDate: `${currentYear}-05-17`, amount: 7500 },
        { bookingCode: `BK-${currentYear}-034`, vesselName: 'Infinity', startDate: `${currentYear}-07-20`, endDate: `${currentYear}-07-27`, amount: 9500 },
      ]
    },
    {
      customerId: 2,
      customerName: 'Maria Papadopoulou',
      customerEmail: 'maria.p@gmail.com',
      totalBookings: 3,
      totalSpent: 19500,
      firstBooking: `${lastYear}-06-01`,
      lastBooking: `${currentYear}-08-10`,
      bookings: [
        { bookingCode: `BK-${lastYear}-055`, vesselName: 'Bar Bar', startDate: `${lastYear}-06-01`, endDate: `${lastYear}-06-08`, amount: 6000 },
        { bookingCode: `BK-${currentYear}-015`, vesselName: 'Maria 2', startDate: `${currentYear}-05-15`, endDate: `${currentYear}-05-22`, amount: 5500 },
        { bookingCode: `BK-${currentYear}-078`, vesselName: 'Perla', startDate: `${currentYear}-08-10`, endDate: `${currentYear}-08-17`, amount: 8000 },
      ]
    },
    {
      customerId: 3,
      customerName: 'Hans Mueller',
      customerEmail: 'hans.mueller@web.de',
      totalBookings: 2,
      totalSpent: 15000,
      firstBooking: `${lastYear}-07-15`,
      lastBooking: `${currentYear}-07-01`,
      bookings: [
        { bookingCode: `BK-${lastYear}-078`, vesselName: 'Kalispera', startDate: `${lastYear}-07-15`, endDate: `${lastYear}-07-22`, amount: 7000 },
        { bookingCode: `BK-${currentYear}-045`, vesselName: 'Infinity', startDate: `${currentYear}-07-01`, endDate: `${currentYear}-07-08`, amount: 8000 },
      ]
    },
  ];

  console.log('Initial repeat customers count:', data.length);

  // Apply vessel filter - filter customers who have bookings on the selected vessel
  if (filters.vesselId) {
    const vesselName = getVesselNameById(filters.vesselId);
    console.log('Vessel filter active - vesselId:', filters.vesselId, '-> vesselName:', vesselName);
    if (vesselName) {
      const beforeCount = data.length;
      data = data.filter(c => c.bookings.some(b => b.vesselName === vesselName));
      console.log('After vessel filter (customers):', beforeCount, '->', data.length, 'customers');
      // Also filter each customer's bookings to only show the selected vessel
      data = data.map(c => ({
        ...c,
        bookings: c.bookings.filter(b => b.vesselName === vesselName),
        totalBookings: c.bookings.filter(b => b.vesselName === vesselName).length,
        totalSpent: c.bookings.filter(b => b.vesselName === vesselName).reduce((sum, b) => sum + b.amount, 0)
      }));
    }
  }

  // Apply owner filter - filter by vessels owned
  if (filters.ownerId) {
    const ownerVessels = getOwnerVessels(filters.ownerId);
    const ownerVesselNames = ownerVessels.map(id => getVesselNameById(id)).filter(Boolean);
    data = data.filter(c => c.bookings.some(b => ownerVesselNames.includes(b.vesselName)));
    // Also filter bookings
    data = data.map(c => ({
      ...c,
      bookings: c.bookings.filter(b => ownerVesselNames.includes(b.vesselName)),
      totalBookings: c.bookings.filter(b => ownerVesselNames.includes(b.vesselName)).length,
      totalSpent: c.bookings.filter(b => ownerVesselNames.includes(b.vesselName)).reduce((sum, b) => sum + b.amount, 0)
    }));
  }

  // Apply date range filter
  if (filters.dateFrom || filters.dateTo) {
    data = data.map(c => ({
      ...c,
      bookings: c.bookings.filter(b => isDateInRange(b.startDate, filters.dateFrom || null, filters.dateTo || null))
    }));
    // Recalculate totals
    data = data.map(c => ({
      ...c,
      totalBookings: c.bookings.length,
      totalSpent: c.bookings.reduce((sum, b) => sum + b.amount, 0)
    }));
    // Remove customers with no bookings in range
    data = data.filter(c => c.bookings.length > 0);
  }

  return data;
}

async function getDirectCustomers(filters: Filters): Promise<DirectCustomer[]> {
  console.log('=== getDirectCustomers called ===');
  console.log('Filters received:', JSON.stringify(filters, null, 2));
  // TODO: Replace with actual API call
  const currentYear = new Date().getFullYear();

  let data: DirectCustomer[] = [
    { customerId: 101, customerName: 'George Nikolaou', customerEmail: 'g.nikolaou@gmail.com', customerPhone: '+30 694 123 4567', bookingCode: `BK-${currentYear}-022`, vesselName: 'Maria 1', startDate: `${currentYear}-06-01`, endDate: `${currentYear}-06-08`, amount: 5500, source: 'Website' },
    { customerId: 102, customerName: 'Sophie Martin', customerEmail: 'sophie.m@yahoo.fr', customerPhone: '+33 6 12 34 56 78', bookingCode: `BK-${currentYear}-038`, vesselName: 'Valesia', startDate: `${currentYear}-06-20`, endDate: `${currentYear}-06-27`, amount: 7500, source: 'Phone' },
    { customerId: 103, customerName: 'Dimitris Alexiou', customerEmail: 'dalexiou@outlook.com', customerPhone: '+30 697 456 7890', bookingCode: `BK-${currentYear}-051`, vesselName: 'Bar Bar', startDate: `${currentYear}-07-05`, endDate: `${currentYear}-07-12`, amount: 6200, source: 'Referral' },
    { customerId: 104, customerName: 'Emma Wilson', customerEmail: 'emma.w@gmail.com', customerPhone: '+44 7911 123456', bookingCode: `BK-${currentYear}-067`, vesselName: 'Maria 2', startDate: `${currentYear}-07-15`, endDate: `${currentYear}-07-22`, amount: 5800, source: 'Website' },
    { customerId: 105, customerName: 'Kostas Papadopoulos', customerEmail: 'kpapadopoulos@hotmail.com', customerPhone: '+30 698 789 0123', bookingCode: `BK-${currentYear}-082`, vesselName: 'Infinity', startDate: `${currentYear}-08-01`, endDate: `${currentYear}-08-08`, amount: 8500, source: 'Repeat' },
    { customerId: 106, customerName: 'Anna Bergström', customerEmail: 'anna.b@gmail.se', customerPhone: '+46 70 123 45 67', bookingCode: `BK-${currentYear}-095`, vesselName: 'Perla', startDate: `${currentYear}-08-15`, endDate: `${currentYear}-08-22`, amount: 7800, source: 'Website' },
    { customerId: 107, customerName: 'Marco Rossi', customerEmail: 'marco.r@gmail.it', customerPhone: '+39 339 123 4567', bookingCode: `BK-${currentYear}-101`, vesselName: 'Kalispera', startDate: `${currentYear}-07-08`, endDate: `${currentYear}-07-15`, amount: 5000, source: 'Website' },
    { customerId: 108, customerName: 'Sarah Johnson', customerEmail: 'sarah.j@yahoo.com', customerPhone: '+1 555 123 4567', bookingCode: `BK-${currentYear}-115`, vesselName: 'Bob', startDate: `${currentYear}-08-05`, endDate: `${currentYear}-08-12`, amount: 4800, source: 'Phone' },
  ];

  console.log('Initial direct customers count:', data.length);

  // Apply vessel filter
  if (filters.vesselId) {
    const vesselName = getVesselNameById(filters.vesselId);
    console.log('Vessel filter active - vesselId:', filters.vesselId, '-> vesselName:', vesselName);
    if (vesselName) {
      const beforeCount = data.length;
      data = data.filter(c => c.vesselName === vesselName);
      console.log('After vessel filter:', beforeCount, '->', data.length, 'records');
    }
  }

  // Apply owner filter
  if (filters.ownerId) {
    const ownerVessels = getOwnerVessels(filters.ownerId);
    data = data.filter(c => {
      const vesselId = getVesselIdByName(c.vesselName);
      return vesselId && ownerVessels.includes(vesselId);
    });
  }

  // Apply date range filter
  if (filters.dateFrom || filters.dateTo) {
    data = data.filter(c => isDateInRange(c.startDate, filters.dateFrom || null, filters.dateTo || null));
  }

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
    const total = paymentData.reduce((acc, p) => acc + p.totalAmount, 0);
    const paid = paymentData.reduce((acc, p) => acc + p.paidAmount, 0);
    const unpaid = paymentData.reduce((acc, p) => acc + p.unpaidAmount, 0);
    const paidCount = paymentData.filter(p => p.status === 'paid').length;
    const partialCount = paymentData.filter(p => p.status === 'partial').length;
    const unpaidCount = paymentData.filter(p => p.status === 'unpaid').length;
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
                    <div className="text-2xl font-bold text-white">{paymentTotals.paid.toLocaleString()}€</div>
                    <div className="text-green-200 text-xs mt-1">{paymentTotals.paidCount} {lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="text-orange-100 text-xs mb-1">{lang === 'el' ? 'Μερικώς' : 'Partial'}</div>
                    <div className="text-2xl font-bold text-white">{paymentTotals.partialCount}</div>
                    <div className="text-orange-200 text-xs mt-1">{lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-xl shadow-lg">
                    <div className="text-red-100 text-xs mb-1">{lang === 'el' ? 'Ανεξόφλητα' : 'Unpaid'}</div>
                    <div className="text-2xl font-bold text-white">{paymentTotals.unpaid.toLocaleString()}€</div>
                    <div className="text-red-200 text-xs mt-1">{paymentTotals.unpaidCount} {lang === 'el' ? 'κρατήσεις' : 'bookings'}</div>
                  </div>
                </div>

                {/* Total Bar */}
                <div className="bg-white p-4 rounded-lg mb-4 border border-[#d1d5db] shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#374151] text-sm font-medium">{lang === 'el' ? 'Σύνολο' : 'Total'}</span>
                    <span className="text-xl font-bold text-[#1e40af]">{paymentTotals.total.toLocaleString()}€</span>
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
                            <td className="p-3 text-right text-[#374151] font-medium">{payment.totalAmount.toLocaleString()}€</td>
                            <td className="p-3 text-right text-green-600">{payment.paidAmount.toLocaleString()}€</td>
                            <td className="p-3 text-right text-red-600">{payment.unpaidAmount.toLocaleString()}€</td>
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
                    <div className="text-2xl font-bold text-white">{charterTotals.totalRevenue.toLocaleString()}€</div>
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
                            <td className="p-3 text-right text-green-600 font-medium">{charter.totalRevenue.toLocaleString()}€</td>
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
                    <div className="text-xl font-bold text-white">{commissionTotals.totalRevenue.toLocaleString()}€</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="text-orange-100 text-xs mb-1">{lang === 'el' ? 'Προμήθεια' : 'Commission'}</div>
                    <div className="text-xl font-bold text-white">{commissionTotals.totalCommission.toLocaleString()}€</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-xl shadow-lg">
                    <div className="text-red-100 text-xs mb-1">{lang === 'el' ? 'ΦΠΑ Προμήθειας' : 'VAT'}</div>
                    <div className="text-xl font-bold text-white">{commissionTotals.totalVat.toLocaleString()}€</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#1e40af] to-blue-700 p-4 rounded-xl shadow-lg">
                    <div className="text-blue-100 text-xs mb-1">{lang === 'el' ? 'Καθαρά σε Ιδιοκτ.' : 'Net to Owner'}</div>
                    <div className="text-xl font-bold text-white">{commissionTotals.totalNet.toLocaleString()}€</div>
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
                            <td className="p-3 text-right text-green-600">{comm.totalRevenue.toLocaleString()}€</td>
                            <td className="p-3 text-right text-orange-600">{comm.commission.toLocaleString()}€</td>
                            <td className="p-3 text-right text-red-600">{comm.vatOnCommission.toLocaleString()}€</td>
                            <td className="p-3 text-right text-[#1e40af] font-bold">{comm.netToOwner.toLocaleString()}€</td>
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
                    <div className="text-2xl font-bold text-white">{vesselTotals.totalRevenue.toLocaleString()}€</div>
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
                            <td className="p-3 text-right text-green-600 font-medium">{vessel.totalRevenue.toLocaleString()}€</td>
                            <td className="p-3 text-right text-[#6b7280]">{vessel.averagePerDay.toLocaleString()}€</td>
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
                    <div className="text-2xl font-bold text-white">{brokerTotals.totalRevenue.toLocaleString()}€</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4 rounded-xl shadow-lg">
                    <div className="text-orange-100 text-xs mb-1">{lang === 'el' ? 'Προμήθειες' : 'Commissions'}</div>
                    <div className="text-2xl font-bold text-white">{brokerTotals.totalCommission.toLocaleString()}€</div>
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
                            <td className="p-3 text-right text-green-600 font-medium">{broker.totalRevenue.toLocaleString()}€</td>
                            <td className="p-3 text-right text-orange-600">{broker.commission.toLocaleString()}€</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#f9fafb]">
                        <tr className="text-[#374151] font-bold border-t border-[#d1d5db]">
                          <td className="p-3" colSpan={2}>{lang === 'el' ? 'ΣΥΝΟΛΟ' : 'TOTAL'}</td>
                          <td className="p-3 text-right text-[#1e40af]">{brokerTotals.totalBookings}</td>
                          <td className="p-3 text-right">{brokerTotals.totalDays}</td>
                          <td className="p-3 text-right text-green-600">{brokerTotals.totalRevenue.toLocaleString()}€</td>
                          <td className="p-3 text-right text-orange-600">{brokerTotals.totalCommission.toLocaleString()}€</td>
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
                    <div className="text-2xl font-bold text-white">{repeatTotals.totalSpent.toLocaleString()}€</div>
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
                              <div className="text-green-600 text-sm">{customer.totalSpent.toLocaleString()}€</div>
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
                                    <span className="text-green-600 font-medium">{booking.amount.toLocaleString()}€</span>
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
                    <div className="text-2xl font-bold text-white">{directTotals.totalRevenue.toLocaleString()}€</div>
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
                            <td className="p-3 text-right text-green-600 font-medium">{customer.amount.toLocaleString()}€</td>
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
                          <td className="p-3 text-right text-green-600">{directTotals.totalRevenue.toLocaleString()}€</td>
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
