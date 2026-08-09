import React from 'react';
import { ArrowLeft, Award, CheckCircle2, Clock, CreditCard, Calendar, Phone, Mail, Sparkles, TrendingUp, Wallet, User, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface BishiMemberDashboardProps {
  member: any;
  onBack: () => void;
}

export const BishiMemberDashboard: React.FC<BishiMemberDashboardProps> = ({ member, onBack }) => {
  if (!member) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
    } catch {
      return dateStr;
    }
  };

  const bishi = member.bishi || {};
  const customer = member.customer || {};
  const financials = member.financials || {};
  const payments = member.payments || [];
  const isWinner = member.status === 'WON' || !!member.wonMonthNumber;

  const totalSchemeAmount = financials.totalSchemeAmount || (Number(bishi.monthlyAmount || 0) * (bishi.durationMonths || 1));
  const totalPaid = financials.totalPaid || 0;
  const remainingAmount = financials.remainingAmount || Math.max(0, totalSchemeAmount - totalPaid);
  const paidPercent = totalSchemeAmount > 0 ? Math.min(100, Math.round((totalPaid / totalSchemeAmount) * 100)) : 0;

  const paidMonthsCount = payments.filter((p: any) => p.status === 'PAID').length;
  const pendingMonthsCount = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'DUE' || p.status === 'PARTIAL').length;

  const getPaymentModeBadge = (mode: string | null) => {
    if (!mode) return <span className="text-xs text-gray-400 font-mono">-</span>;
    const modeColors: Record<string, string> = {
      CASH: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
      UPI: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800',
      CARD: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
      BANK_TRANSFER: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800',
      CHEQUE: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${modeColors[mode] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        <CreditCard size={12} />
        {mode.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 size={13} /> PAID
          </span>
        );
      case 'EXEMPT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
            EXEMPT (WINNER)
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock size={13} /> PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-300 dark:border-red-700">
            <Clock size={13} /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-dark-900 hover:bg-gray-50 dark:hover:bg-dark-800 text-[#1A1209] dark:text-[#F5F5F0] rounded-xl border border-gray-200 dark:border-dark-700 font-bold text-xs uppercase tracking-wider transition-all shadow-xs group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-[#B8860B]" />
          Back to Bishi Members List
        </button>

        <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
          <span>Scheme ID: <strong className="text-gray-700 dark:text-gray-200">#{bishi.id}</strong></span>
          <span>•</span>
          <span>Joined: {formatDate(member.joinedAt || bishi.startDate)}</span>
        </div>
      </div>

      {/* Hero Customer Profile Banner */}
      <div className="bg-gradient-to-r from-[#1F160C] via-[#2A1D10] to-[#120B04] text-[#F5F5F0] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-[#B8860B]/30">
        {/* Background decorative glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#B8860B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            {/* Initial Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#B8860B] to-[#8B6508] text-black font-extrabold font-serif text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-gold/20 border-2 border-white/20 shrink-0">
              {customer.name ? customer.name.charAt(0).toUpperCase() : 'M'}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#B8860B] text-black font-extrabold text-xs px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                  Member #{member.memberNumber}
                </span>

                <span className="bg-white/10 backdrop-blur-md text-amber-200 font-bold text-xs px-3 py-1 rounded-lg border border-white/10">
                  {bishi.name}
                </span>

                {isWinner ? (
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs px-3.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md animate-pulse">
                    <Award size={14} />
                    WINNER ({member.wonMonthLabel || `Month ${member.wonMonthNumber}`})
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold text-xs px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck size={13} /> Active Member
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                {customer.name}
              </h1>

              <div className="flex items-center gap-4 text-xs text-[#C5B496] flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Phone size={13} className="text-[#B8860B]" />
                  <strong className="text-white font-mono">{customer.phone}</strong>
                </span>
                {customer.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-[#B8860B]" />
                      <span>{customer.email}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Installment Info Badge */}
          <div className="bg-black/40 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 space-y-1 text-right self-stretch lg:self-auto flex lg:block justify-between items-center">
            <div>
              <div className="text-[10px] text-[#A69477] uppercase tracking-wider font-extrabold">Monthly Installment</div>
              <div className="text-2xl font-extrabold text-[#B8860B] font-mono">{formatCurrency(bishi.monthlyAmount || 0)}</div>
            </div>
            <div className="text-xs text-gray-300 font-medium pt-1 border-t border-white/10 lg:border-t-0 lg:pt-0">
              {bishi.durationMonths} Months Duration
            </div>
          </div>
        </div>
      </div>

      {/* Winner Congratulations Card (If Winner) */}
      {isWinner && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-500 text-black rounded-xl shadow-md shrink-0">
            <Award size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <span>🎉 Congratulations! Winner of {member.wonMonthLabel || `Month ${member.wonMonthNumber}`}</span>
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This member won the Bishi pot for <strong>{member.wonMonthLabel || `Month ${member.wonMonthNumber}`}</strong>. As per rules, winner does not need to pay monthly installments from subsequent months!
            </p>
          </div>
        </div>
      )}

      {/* Financial Metrics Cards (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Scheme Value */}
        <div className="card p-5 space-y-3 bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 shadow-sm relative overflow-hidden group hover:border-[#B8860B]/40 transition-all">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Scheme Value</span>
            <div className="p-2 rounded-xl bg-amber-50 text-[#B8860B] dark:bg-amber-950/40">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1A1209] dark:text-[#F5F5F0] font-mono">
              {formatCurrency(totalSchemeAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              Full {bishi.durationMonths} months commitment
            </div>
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div className="card p-5 space-y-3 bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Collected Paid</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalPaid)}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                <span>{paidMonthsCount} of {bishi.durationMonths} Months Paid</span>
                <span>{paidPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${paidPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Balance */}
        <div className="card p-5 space-y-3 bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Remaining Dues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(remainingAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              {pendingMonthsCount} Months remaining to pay
            </div>
          </div>
        </div>

        {/* Card 4: Status Indicator */}
        <div className="card p-5 space-y-3 bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Scheme Progress</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1A1209] dark:text-[#F5F5F0]">
              M-{paidMonthsCount} / {bishi.durationMonths}
            </div>
            <div className="text-xs text-gray-400 mt-1 font-medium">
              Overall Installments
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="card p-6 bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-serif font-bold text-lg text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
            <Calendar size={18} className="text-[#B8860B]" />
            Installment Progress Timeline
          </h3>
          <span className="text-xs text-gray-400 font-mono">{payments.length} Installments Total</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {payments.map((p: any) => {
            const isPaid = p.status === 'PAID';
            const isExempt = p.status === 'EXEMPT';
            const isPending = p.status === 'PENDING' || p.status === 'DUE' || p.status === 'PARTIAL';

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                    : isExempt
                    ? 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40 opacity-75'
                    : 'border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-[#1A1209] dark:text-[#F5F5F0]">
                    Month {p.monthNumber}
                  </span>
                  {isPaid && <CheckCircle2 size={15} className="text-emerald-600" />}
                  {isExempt && <span className="text-[10px] font-bold text-gray-400">EXEMPT</span>}
                  {isPending && <Clock size={15} className="text-amber-600" />}
                </div>

                <div className="text-xs font-mono font-bold">
                  {formatCurrency(p.amountDue)}
                </div>

                <div className="text-[10px] font-bold truncate">
                  {isPaid ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Paid ({p.paymentMode || 'Cash'})
                    </span>
                  ) : isExempt ? (
                    <span className="text-gray-500">Winner Exempt</span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400">
                      Due: {formatCurrency(p.totalOutstanding)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Month-Wise Payment Records Table */}
      <div className="card p-0 bg-white dark:bg-dark-900 border-gray-100 dark:border-dark-800 shadow-md overflow-hidden space-y-0">
        <div className="p-6 border-b border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-[#1A1209] dark:text-[#F5F5F0]">
              Month-Wise Payment Ledger & Records
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete installment breakdown, carried forward dues, dates, and payment modes
            </p>
          </div>

          <div className="text-xs text-gray-400 font-medium">
            Showing <strong className="text-[#B8860B]">{payments.length}</strong> months records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Month</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Monthly Inst.</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Prev. Due</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Total Payable</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Paid Amount</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Payment Date</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Payment Mode</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Outstanding</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800 bg-white dark:bg-[#141414]">
              {payments.length > 0 ? (
                payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#FFF8E7]/60 dark:hover:bg-[#1F1A0E]/60 transition-colors group">
                    <td className="px-6 py-4 font-bold text-[#1A1209] dark:text-[#F5F5F0]">
                      {p.monthLabel || `Month ${p.monthNumber}`}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono">
                      {formatCurrency(p.amountDue)}
                    </td>
                    <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-mono font-medium">
                      {formatCurrency(p.dueCarriedForward)}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#1A1209] dark:text-[#F5F5F0] font-mono">
                      {formatCurrency(p.totalPayable)}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(p.amountPaid)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentModeBadge(p.paymentMode)}
                    </td>
                    <td className={`px-6 py-4 font-extrabold font-mono ${p.totalOutstanding > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {formatCurrency(p.totalOutstanding)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 italic">
                    No payment records found for this member.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
