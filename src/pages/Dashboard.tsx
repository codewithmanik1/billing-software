import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { IndianRupee, FileText, CheckCircle, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);
  const fromDateStr = format(sevenDaysAgo, 'yyyy-MM-dd');

  const { data: summaryRes, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['dashboard-summary', fromDateStr],
    queryFn: async () => {
      const res = await api.get(`/reports/summary?fromDate=${fromDateStr}`);
      return res.data;
    },
  });

  const { data: invoicesRes, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['recent-invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices?limit=5');
      return res.data;
    },
  });

  const summary = summaryRes?.data || {
    totalSalesGenerated: 0,
    totalAmountCollected: 0,
    totalAmountPending: 0,
    invoiceCount: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
  };

  const recentInvoices = invoicesRes?.data?.invoices || [];

  const chartData = [
    { name: 'Collected', value: Number(summary.totalAmountCollected), color: '#B8860B' },
    { name: 'Pending', value: Number(summary.totalAmountPending), color: '#3a3a3a' },
  ];

  const kpiCards = [
    { label: 'Total Sales', value: formatCurrency(Number(summary.totalSalesGenerated)), icon: IndianRupee, borderColor: 'border-l-[#B8860B]', iconColor: 'text-[#B8860B]' },
    { label: 'Total Collected', value: formatCurrency(Number(summary.totalAmountCollected)), icon: CheckCircle, borderColor: 'border-l-green-500', iconColor: 'text-green-500' },
    { label: 'Total Pending', value: formatCurrency(Number(summary.totalAmountPending)), icon: AlertCircle, borderColor: 'border-l-red-500', iconColor: 'text-red-500' },
    { label: 'Total Invoices', value: String(summary.invoiceCount), icon: FileText, borderColor: 'border-l-blue-500', iconColor: 'text-blue-500' },
  ];

  if (isSummaryLoading || isInvoicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#B8860B]/20 border-t-[#B8860B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Dashboard</h1>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1 flex items-center gap-1.5">
            <Calendar size={14} className="text-[#B8860B]" />
            Real-time analytics from PostgreSQL database
          </p>
        </div>
        <div className="hidden sm:block">
           <button 
             onClick={() => navigate('/invoices/new')}
             className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg shadow-gold/10"
           >
             <FileText size={18} />
             Create New Invoice
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map(({ label, value, icon: Icon, borderColor, iconColor }) => (
          <div key={label} className={`card p-6 border-l-4 ${borderColor}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-2 bg-gray-100 dark:bg-dark-800 rounded-lg ${iconColor}`}>
                <Icon size={20} />
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 font-medium text-sm">{label}</h3>
            </div>
            <p className="text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Sales Distribution</h2>
          </div>
          <div className="flex justify-between mb-8">
            {[
              { label: 'PAID', value: summary.paidCount, color: 'text-green-500' },
              { label: 'PARTIAL', value: summary.partialCount, color: 'text-yellow-500' },
              { label: 'UNPAID', value: summary.unpaidCount, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-[#6B5E4A] dark:text-[#9A9A8A] uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                   cursor={{ fill: 'rgba(184, 134, 11, 0.05)' }}
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2E2E2E', borderRadius: '12px', color: '#F5F5F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-0 lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Recent Invoices</h2>
            <Link to="/invoices" className="text-sm text-[#B8860B] hover:text-[#FFD700] transition-colors flex items-center gap-1 font-medium">
              View All Invoices <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Invoice No.</th>
                  <th className="px-6 py-3.5 font-semibold">Customer</th>
                  <th className="px-6 py-3.5 font-semibold">Date</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Grand Total</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D0] dark:divide-[#2E2E2E]">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-[#9A9A8A]">
                        <div className="p-4 bg-gray-100 dark:bg-dark-800 rounded-full mb-4">
                           <FileText size={32} className="opacity-20" />
                        </div>
                        <p className="text-base font-medium text-[#6B5E4A] dark:text-[#F5F5F0] mb-1">No Recent Invoices</p>
                        <p className="text-sm mb-4">Create your first invoice to see it here.</p>
                        <button
                          onClick={() => navigate('/invoices/new')}
                          className="btn-primary px-4 py-2 text-sm rounded-lg"
                        >
                          + Create first invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv: any) => (
                    <tr
                      key={inv.id}
                      className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 cursor-pointer group"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="px-6 py-4.5 font-bold text-[#B8860B] group-hover:text-[#FFD700] transition-colors">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4.5 text-[#1A1209] dark:text-[#F5F5F0]">
                        <div className="font-medium">{inv.customer.name}</div>
                        <div className="text-xs text-[#9A9A8A]">{inv.customer.phone}</div>
                      </td>
                      <td className="px-6 py-4.5 text-[#6B5E4A] dark:text-[#9A9A8A]">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4.5 text-right font-bold text-[#1A1209] dark:text-[#F5F5F0]">{formatCurrency(Number(inv.grandTotal))}</td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                          inv.status === 'paid' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          inv.status === 'partial' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                          'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

