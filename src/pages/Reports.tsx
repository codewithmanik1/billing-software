import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { IndianRupee, TrendingUp, TrendingDown, Calendar, ChevronRight } from 'lucide-react';
import {
  format, isAfter, isBefore, startOfDay, endOfDay,
  subDays, startOfMonth, endOfMonth, startOfYear
} from 'date-fns';
import { Link } from 'react-router-dom';
import type { Invoice } from '../types';
import { Pagination } from '../components/ui/Pagination';

type Preset = 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime';

const today = new Date();

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7days', label: 'Last 7 Days' },
  { id: '30days', label: 'Last 30 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'allTime', label: 'All Time' },
];

function getPresetDates(preset: Preset): { start: string; end: string } {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  const todayFmt = fmt(today);
  switch (preset) {
    case 'today': return { start: todayFmt, end: todayFmt };
    case '7days': return { start: fmt(subDays(today, 7)), end: todayFmt };
    case '30days': return { start: fmt(subDays(today, 30)), end: todayFmt };
    case 'thisMonth': return { start: fmt(startOfMonth(today)), end: todayFmt };
    case 'lastMonth': {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { start: fmt(startOfMonth(lastMonthDate)), end: fmt(endOfMonth(lastMonthDate)) };
    }
    case 'thisYear': return { start: fmt(startOfYear(today)), end: todayFmt };
    case 'allTime': return { start: '2000-01-01', end: todayFmt };
  }
}

export const Reports: React.FC = () => {
  const { invoices } = useStore();

  const [activePreset, setActivePreset] = useState<Preset>('30days');
  const [startDate, setStartDate] = useState(format(subDays(today, 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [appliedStart, setAppliedStart] = useState(startDate);
  const [appliedEnd, setAppliedEnd] = useState(endDate);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const applyFilter = () => {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setCurrentPage(1);
  };

  const handlePreset = (preset: Preset) => {
    const { start, end } = getPresetDates(preset);
    setActivePreset(preset);
    setStartDate(start);
    setEndDate(end);
    setAppliedStart(start);
    setAppliedEnd(end);
    setCurrentPage(1);
  };

  const reportData = useMemo(() => {
    const start = startOfDay(new Date(appliedStart));
    const end = endOfDay(new Date(appliedEnd));

    const filteredInvoices = invoices.filter(inv => {
      const d = new Date(inv.date);
      return (isAfter(d, start) || d.getTime() === start.getTime()) &&
             (isBefore(d, end) || d.getTime() === end.getTime());
    });

    let totalSales = 0, totalCollected = 0, totalPending = 0;
    const unpaidInvoices: Invoice[] = [];

    filteredInvoices.forEach(inv => {
      totalSales += inv.totalAmount;
      totalCollected += inv.amountPaid;
      totalPending += inv.pendingAmount;
      if (inv.pendingAmount > 0) unpaidInvoices.push(inv);
    });

    return {
      totalSales, totalCollected, totalPending,
      invoiceCount: filteredInvoices.length,
      unpaidInvoices: unpaidInvoices.sort((a, b) => b.pendingAmount - a.pendingAmount),
    };
  }, [invoices, appliedStart, appliedEnd]);

  const paginatedUnpaid = reportData.unpaidInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const dayCount = Math.round(
    (new Date(appliedEnd).getTime() - new Date(appliedStart).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-[#1A1209] dark:text-[#F5F5F0]">Financial Reports</h1>
        <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1">
          📊 Showing: <span className="font-medium text-[#B8860B]">
            {format(new Date(appliedStart), 'dd MMM yyyy')} – {format(new Date(appliedEnd), 'dd MMM yyyy')}
          </span>
          <span className="ml-2 text-xs">({dayCount} days, {reportData.invoiceCount} invoices)</span>
        </p>
      </div>

      {/* Date Range Filter Bar */}
      <div className="card p-4 space-y-4">
        {/* Inputs row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FAFAF7] dark:bg-[#0A0A0A] border border-[#E8E0D0] dark:border-[#2E2E2E] rounded-lg px-3 py-2">
            <Calendar size={16} className="text-[#B8860B]" />
            <span className="text-xs text-[#6B5E4A] dark:text-[#9A9A8A] font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setActivePreset('allTime'); }}
              className="bg-transparent text-sm text-[#1A1209] dark:text-[#F5F5F0] focus:outline-none"
            />
          </div>
          <span className="text-[#9A9A8A]">→</span>
          <div className="flex items-center gap-2 bg-[#FAFAF7] dark:bg-[#0A0A0A] border border-[#E8E0D0] dark:border-[#2E2E2E] rounded-lg px-3 py-2">
            <Calendar size={16} className="text-[#B8860B]" />
            <span className="text-xs text-[#6B5E4A] dark:text-[#9A9A8A] font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setActivePreset('allTime'); }}
              className="bg-transparent text-sm text-[#1A1209] dark:text-[#F5F5F0] focus:outline-none"
            />
          </div>
          <button
            onClick={applyFilter}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#B8860B] hover:bg-[#FFD700] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Apply <ChevronRight size={14} />
          </button>
        </div>

        {/* Quick Select Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 ${
                activePreset === p.id
                  ? 'bg-[#B8860B] border-[#B8860B] text-white shadow-[0_0_8px_rgba(184,134,11,0.3)]'
                  : 'bg-transparent border-[#B8860B]/40 text-[#8B6508] dark:text-[#B8860B] hover:border-[#B8860B] hover:bg-[#B8860B]/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-t-4 border-t-[#B8860B] text-center">
          <p className="text-[#6B5E4A] dark:text-[#9A9A8A] font-medium mb-2 uppercase tracking-wider text-xs">Total Sales Generated</p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0] mb-1">
            <IndianRupee size={28} className="text-[#B8860B]" />
            {formatCurrency(reportData.totalSales).replace('₹', '')}
          </div>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A]">{reportData.invoiceCount} invoices in period</p>
        </div>

        <div className="card p-6 border-t-4 border-t-green-500 text-center">
          <p className="text-[#6B5E4A] dark:text-[#9A9A8A] font-medium mb-2 uppercase tracking-wider text-xs">Total Amount Collected</p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0] mb-1">
            <TrendingUp size={28} className="text-green-500" />
            {formatCurrency(reportData.totalCollected)}
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            {reportData.totalSales > 0 ? Math.round((reportData.totalCollected / reportData.totalSales) * 100) : 0}% recovery rate
          </p>
        </div>

        <div className="card p-6 border-t-4 border-t-red-500 text-center">
          <p className="text-[#6B5E4A] dark:text-[#9A9A8A] font-medium mb-2 uppercase tracking-wider text-xs">Total Amount Pending</p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0] mb-1">
            <TrendingDown size={28} className="text-red-500" />
            {formatCurrency(reportData.totalPending)}
          </div>
          <p className="text-sm text-red-500/80">{reportData.unpaidInvoices.length} invoices pending</p>
        </div>
      </div>

      {/* Outstanding Invoices Table */}
      {reportData.unpaidInvoices.length > 0 ? (
        <div className="card p-0">
          <div className="p-4 border-b border-[#E8E0D0] dark:border-[#2E2E2E] bg-[#F5F0E8] dark:bg-[#0A0A0A]/50">
            <h2 className="text-lg font-serif text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Outstanding Invoices in Period
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
                <tr>
                  <th className="px-6 py-3 font-medium">Invoice No.</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium text-right">Invoice Total</th>
                  <th className="px-6 py-3 font-medium text-right">Pending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D0] dark:divide-[#2E2E2E]">
                {paginatedUnpaid.map((inv) => (
                  <tr key={inv.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 cursor-pointer">
                    <td className="px-6 py-4 font-medium">
                      <Link to={`/invoices/${inv.id}`} className="text-[#B8860B] hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[#6B5E4A] dark:text-[#9A9A8A]">{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-[#1A1209] dark:text-[#F5F5F0]">{inv.customer.name}</td>
                    <td className="px-6 py-4 text-right text-[#1A1209] dark:text-[#F5F5F0]">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-6 py-4 text-right font-medium text-red-500">{formatCurrency(inv.pendingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E8E0D0] dark:border-[#2E2E2E]">
            <Pagination
              currentPage={currentPage}
              totalItems={reportData.unpaidInvoices.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
              entityName="outstanding invoices"
            />
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <TrendingUp size={40} className="mx-auto mb-3 text-[#9A9A8A] opacity-30" />
          <p className="text-[#6B5E4A] dark:text-[#9A9A8A]">No outstanding invoices in this period.</p>
        </div>
      )}
    </div>
  );
};
