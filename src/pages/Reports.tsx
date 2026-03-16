import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import {
  format, subDays, startOfMonth, endOfMonth, startOfYear
} from 'date-fns';
import { Link } from 'react-router-dom';
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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const Reports: React.FC = () => {
  const [activePreset, setActivePreset] = useState<Preset>('30days');
  const [startDate, setStartDate] = useState(format(subDays(today, 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));
  const [appliedStart, setAppliedStart] = useState(startDate);
  const [appliedEnd, setAppliedEnd] = useState(endDate);

  // Pagination for outstanding invoices
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetching Report Summary (KPIs)
  const { data: summaryRes, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['reports-summary', appliedStart, appliedEnd],
    queryFn: async () => {
      const res = await api.get(`/reports/summary?fromDate=${appliedStart}&toDate=${appliedEnd}`);
      return res.data;
    },
  });

  // Fetching Outstanding Invoices for the period
  const { data: outstandingRes, isLoading: isLoadingOutstanding } = useQuery({
    queryKey: ['reports-outstanding', appliedStart, appliedEnd, currentPage, itemsPerPage],
    queryFn: async () => {
      const res = await api.get(`/invoices?status=unpaid&fromDate=${appliedStart}&toDate=${appliedEnd}&page=${currentPage}&limit=${itemsPerPage}`);
      return res.data;
    },
  });

  const summary = summaryRes?.data || { totalSalesGenerated: 0, totalAmountCollected: 0, totalAmountPending: 0, invoiceCount: 0 };
  const outstandingInvoices = outstandingRes?.data?.invoices || [];
  const totalOutstanding = outstandingRes?.data?.pagination?.total || 0;

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

  const dayCount = Math.round(
    (new Date(appliedEnd).getTime() - new Date(appliedStart).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const isLoading = isLoadingSummary || isLoadingOutstanding;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Reports</h1>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1">
            📊 Metric Period: <span className="font-bold text-[#B8860B]">
              {format(new Date(appliedStart), 'dd MMM yyyy')} – {format(new Date(appliedEnd), 'dd MMM yyyy')}
            </span>
            <span className="ml-2 text-xs font-mono">({dayCount} Days)</span>
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-[#B8860B] text-xs font-bold uppercase tracking-widest bg-[#FFF8E7] px-4 py-2 rounded-full border border-[#B8860B]/20">
            <Loader2 size={14} className="animate-spin" />
            Recalculating...
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card p-6 rounded-2xl shadow-md space-y-4 border-l-4 border-[#B8860B]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-xl px-4 py-2 shadow-sm">
              <Calendar size={16} className="text-[#B8860B]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setActivePreset('allTime'); }}
                className="bg-transparent text-sm font-bold text-[#1A1209] dark:text-[#F5F5F0] focus:outline-none"
              />
              <span className="text-[#9A9A8A] font-bold mx-1">TO</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setActivePreset('allTime'); }}
                className="bg-transparent text-sm font-bold text-[#1A1209] dark:text-[#F5F5F0] focus:outline-none"
              />
            </div>
            <button
              onClick={applyFilter}
              className="px-6 py-2.5 bg-[#1A1209] hover:bg-[#B8860B] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#B8860B]/20"
            >
              Update View
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border transition-all ${
                  activePreset === p.id
                    ? 'bg-[#B8860B] border-[#B8860B] text-white shadow-md'
                    : 'bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 text-[#6B5E4A] dark:text-gray-400 hover:border-[#B8860B] hover:text-[#B8860B]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="card p-6 rounded-2xl bg-[#1A1209] text-white">
           <p className="text-xs text-gray-400 font-medium leading-relaxed">Financial summaries are generated based on the recorded invoice transactions in the database.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 rounded-xl shadow-sm border-t-2 border-[#B8860B] text-center">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">Total Sales</p>
          <div className="text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">
            {formatCurrency(summary.totalSalesGenerated)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">{summary.invoiceCount} Invoices</p>
        </div>

        <div className="card p-8 rounded-2xl shadow-lg border-t-4 border-green-500 text-center hover:translate-y-[-4px] transition-all">
          <p className="text-[#9A9A8A] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Total Liquidity Collected</p>
          <div className="flex items-center justify-center gap-2 text-4xl font-mono font-bold text-green-600 dark:text-green-400 text-shadow-glow">
            <TrendingUp size={24} className="text-green-500" />
            {formatCurrency(summary.totalAmountCollected).replace('₹', '')}
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase text-green-500/80">
            {summary.totalSalesGenerated > 0 ? Math.round((summary.totalAmountCollected / summary.totalSalesGenerated) * 100) : 0}% COLLECTION RATIO
          </p>
        </div>

        <div className="card p-8 rounded-2xl shadow-lg border-t-4 border-red-500 text-center hover:translate-y-[-4px] transition-all">
          <p className="text-[#9A9A8A] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Outstanding Credit Balance</p>
          <div className="flex items-center justify-center gap-2 text-4xl font-mono font-bold text-red-600 dark:text-red-400">
            <TrendingDown size={24} className="text-red-500" />
            {formatCurrency(summary.totalAmountPending).replace('₹', '')}
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase text-red-500/80">
            ACTION REQUIRED ON {totalOutstanding} ENTRIES
          </p>
        </div>
      </div>

      {/* Outstanding Invoices Table */}
      <div className="card p-0 rounded-2xl shadow-2xl overflow-hidden border-gray-100">
        <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900">
          <h2 className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
            Outstanding Payments
          </h2>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          {totalOutstanding > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1209] text-white">
                <tr>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Reference</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Date</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Recipient Client</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Registry Total</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Debit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                {outstandingInvoices.map((inv: Record<string, unknown> & { id: string; invoiceNumber: string; invoiceDate: string; customer: { name: string; phone: string }; totalAmount: number; pendingAmount: number }) => (
                  <tr key={inv.id} className="bg-white dark:bg-dark-900 hover:bg-[#FFF8E7]/50 dark:hover:bg-dark-800 transition-colors group">
                    <td className="px-8 py-4">
                      <Link to={`/invoices/${inv.id}`} className="text-[#B8860B] font-mono font-bold hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[#6B5E4A] dark:text-gray-400 font-medium">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-[#1A1209] dark:text-[#F5F5F0] font-bold">{inv.customer.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{inv.customer.phone}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[#1A1209] dark:text-[#F5F5F0] font-mono font-medium">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-8 py-4 text-right">
                       <span className="text-red-600 dark:text-red-400 font-mono font-bold text-lg">
                          {formatCurrency(inv.pendingAmount)}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 dark:bg-black/10">
               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                  <TrendingUp size={32} />
               </div>
               <p className="text-lg font-serif text-[#1A1209] dark:text-[#F5F5F0]">Perfect Credit Standing</p>
               <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">No outstanding balances detected in this period.</p>
            </div>
          )}
        </div>

        {totalOutstanding > itemsPerPage && (
          <div className="p-6 border-t border-gray-100 dark:border-dark-800 bg-gray-50/30 dark:bg-black/10">
            <Pagination
              currentPage={currentPage}
              totalItems={totalOutstanding}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
              entityName="debit entries"
            />
          </div>
        )}
      </div>
    </div>
  );
};

