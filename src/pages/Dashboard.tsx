import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { IndianRupee, FileText, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { format, subDays, isAfter } from 'date-fns';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const Dashboard: React.FC = () => {
  const { invoices } = useStore();
  const navigate = useNavigate();
  const sevenDaysAgo = useMemo(() => subDays(new Date(), 7), []);

  // Filter to last 7 days
  const recentInvoices = useMemo(
    () => invoices.filter(inv => isAfter(new Date(inv.date), sevenDaysAgo))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [invoices, sevenDaysAgo]
  );

  const { totalSales, totalCollected, totalPending, invoiceCount, statusCounts } = useMemo(() => {
    let sales = 0, collected = 0, pending = 0;
    let counts = { paid: 0, partial: 0, unpaid: 0 };
    recentInvoices.forEach(inv => {
      sales += inv.totalAmount;
      collected += inv.amountPaid;
      pending += inv.pendingAmount;
      counts[inv.status]++;
    });
    return { totalSales: sales, totalCollected: collected, totalPending: pending, invoiceCount: recentInvoices.length, statusCounts: counts };
  }, [recentInvoices]);

  const chartData = useMemo(() => [
    { name: 'Collected', value: totalCollected, color: '#B8860B' },
    { name: 'Pending', value: totalPending, color: '#3a3a3a' },
  ], [totalCollected, totalPending]);

  const emptyState = recentInvoices.length === 0;

  const kpiCards = [
    { label: 'Total Sales', value: formatCurrency(totalSales), icon: IndianRupee, borderColor: 'border-l-[#B8860B]', iconColor: 'text-[#B8860B]' },
    { label: 'Total Collected', value: formatCurrency(totalCollected), icon: CheckCircle, borderColor: 'border-l-green-500', iconColor: 'text-green-500' },
    { label: 'Total Pending', value: formatCurrency(totalPending), icon: AlertCircle, borderColor: 'border-l-red-500', iconColor: 'text-red-500' },
    { label: 'Total Invoices', value: String(invoiceCount), icon: FileText, borderColor: 'border-l-blue-500', iconColor: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif text-[#1A1209] dark:text-[#F5F5F0]">Dashboard Overview</h1>
        <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1 flex items-center gap-1.5">
          <Calendar size={14} className="text-[#B8860B]" />
          Showing data from{' '}
          <span className="font-medium text-[#B8860B]">{format(sevenDaysAgo, 'dd MMM yyyy')}</span>
          {' — '}
          <span className="font-medium text-[#B8860B]">{format(new Date(), 'dd MMM yyyy')}</span>
          <span className="text-[#9A9A8A] text-xs ml-1">(Last 7 days)</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map(({ label, value, icon: Icon, borderColor, iconColor }) => (
          <div key={label} className={`card p-6 border-l-4 ${borderColor} relative overflow-hidden group`}>
            <div className="absolute top-[-20%] right-[-10%] opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Icon size={120} />
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className={`p-3 bg-[#F5F0E8] dark:bg-[#1A1A1A] rounded-lg ${iconColor}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-[#6B5E4A] dark:text-[#9A9A8A] font-medium text-sm">{label}</h3>
            </div>
            <p className="text-3xl font-bold tracking-tight text-[#1A1209] dark:text-[#F5F5F0]">{value}</p>
            <p className="text-xs text-[#9A9A8A] mt-2 flex items-center gap-1">
              <Calendar size={11} /> Last 7 days
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Chart */}
        <div className="card p-6 lg:col-span-1 flex flex-col">
          <h2 className="text-xl font-serif text-[#1A1209] dark:text-[#F5F5F0] mb-6">Collection Status</h2>
          <div className="flex justify-between mb-8">
            {[
              { label: 'PAID', value: statusCounts.paid, color: 'text-green-500' },
              { label: 'PARTIAL', value: statusCounts.partial, color: 'text-yellow-500' },
              { label: 'UNPAID', value: statusCounts.unpaid, color: 'text-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-[#6B5E4A] dark:text-[#9A9A8A] uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2E2E2E', borderRadius: '8px', color: '#F5F5F0' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="card p-0 lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[#E8E0D0] dark:border-[#2E2E2E] flex justify-between items-center">
            <h2 className="text-xl font-serif text-[#1A1209] dark:text-[#F5F5F0]">Recent Invoices</h2>
            <Link to="/invoices" className="text-sm text-[#B8860B] hover:text-[#FFD700] transition-colors">View All</Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
                <tr>
                  <th className="px-6 py-3 font-medium">Invoice No.</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D0] dark:divide-[#2E2E2E]">
                {emptyState ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-[#9A9A8A]">
                        <Calendar size={40} className="mb-3 opacity-30" />
                        <p className="text-sm mb-2">No invoices in the last 7 days</p>
                        <button
                          onClick={() => navigate('/invoices/new')}
                          className="text-[#B8860B] text-sm hover:underline"
                        >
                          + Create your first invoice today
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 cursor-pointer"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-[#B8860B] hover:underline">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-[#1A1209] dark:text-[#F5F5F0]">{inv.customer.name}</td>
                      <td className="px-6 py-4 text-[#6B5E4A] dark:text-[#9A9A8A]">{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4 text-right font-medium text-[#1A1209] dark:text-[#F5F5F0]">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-6 py-4 flex justify-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
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
