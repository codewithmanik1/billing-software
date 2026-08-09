import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Award, CheckCircle2, Clock, CreditCard, Wallet, Calendar, User, Phone, X, ShieldAlert, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface BishiMemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
}

export const BishiMemberDetailsModal: React.FC<BishiMemberDetailsModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
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

  const getPaymentModeBadge = (mode: string | null) => {
    if (!mode) return <span className="text-xs text-gray-400">-</span>;
    const modeColors: Record<string, string> = {
      CASH: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
      UPI: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800',
      CARD: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
      BANK_TRANSFER: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800',
      CHEQUE: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${modeColors[mode] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        <CreditCard size={12} />
        {mode.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-300 dark:border-green-800">
            <CheckCircle2 size={12} /> PAID
          </span>
        );
      case 'EXEMPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
            EXEMPT (WINNER)
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            <Clock size={12} /> PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-300 dark:border-red-800">
            <Clock size={12} /> PENDING
          </span>
        );
    }
  };

  const isWinner = member.status === 'WON' || !!member.wonMonthNumber;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-4xl">
      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-br from-[#1A1209] to-[#2D2115] text-[#F5F5F0] rounded-2xl p-6 shadow-xl relative overflow-hidden border border-[#B8860B]/30">
          <div className="absolute right-0 top-0 -translate-y-12 translate-x-12 opacity-10 pointer-events-none">
            <Sparkles size={200} className="text-[#B8860B]" />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-[#B8860B] text-black font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  Member #{member.memberNumber}
                </span>
                {isWinner ? (
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Award size={14} /> Winner ({member.wonMonthLabel || `Month ${member.wonMonthNumber}`})
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold text-xs px-3 py-1 rounded-full border border-emerald-500/30">
                    Active Member
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                <User className="text-[#B8860B]" size={24} />
                {member.customer?.name}
              </h2>
              <div className="flex items-center gap-4 text-xs text-[#9A9A8A]">
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-[#B8860B]" /> {member.customer?.phone}
                </span>
                <span>•</span>
                <span>Scheme: <strong className="text-white">{member.bishi?.name}</strong></span>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 text-right">
              <div className="text-[10px] text-[#9A9A8A] uppercase tracking-wider font-bold">Monthly Installment</div>
              <div className="text-xl font-bold text-[#B8860B]">{formatCurrency(member.bishi?.monthlyAmount || 0)}</div>
              <div className="text-[11px] text-gray-400">{member.bishi?.durationMonths} Months Duration</div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-900 border border-gray-100 dark:border-dark-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Scheme Value</div>
            <div className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0] mt-1">
              {formatCurrency(member.financials?.totalSchemeAmount || 0)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Total payable for full scheme</div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Total Paid (All Months)</div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatCurrency(member.financials?.totalPaid || 0)}
            </div>
            <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">Collected payment</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Remaining Balance</div>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
              {formatCurrency(member.financials?.remainingAmount || 0)}
            </div>
            <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">Pending payments remaining</div>
          </div>
        </div>

        {/* Month-Wise Payment Breakdown Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[#1A1209] dark:text-[#F5F5F0]">
              Month-Wise Payment Records
            </h3>
            <span className="text-xs text-gray-400">Total {member.payments?.length || 0} Months</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-dark-800 shadow-sm max-h-[350px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase">Month</th>
                  <th className="px-4 py-3 font-bold uppercase">Inst.</th>
                  <th className="px-4 py-3 font-bold uppercase">Prev. Due</th>
                  <th className="px-4 py-3 font-bold uppercase">Total Payable</th>
                  <th className="px-4 py-3 font-bold uppercase">Paid</th>
                  <th className="px-4 py-3 font-bold uppercase">Payment Date</th>
                  <th className="px-4 py-3 font-bold uppercase">Mode</th>
                  <th className="px-4 py-3 font-bold uppercase">Outstanding</th>
                  <th className="px-4 py-3 font-bold uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-800 bg-white dark:bg-[#141414]">
                {member.payments && member.payments.length > 0 ? (
                  member.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#FFF8E7]/50 dark:hover:bg-[#1F1A0E]/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#1A1209] dark:text-[#F5F5F0]">
                        {p.monthLabel || `Month ${p.monthNumber}`}
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 dark:text-gray-300 font-mono">
                        {formatCurrency(p.amountDue)}
                      </td>
                      <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 font-mono">
                        {formatCurrency(p.dueCarriedForward)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-gray-100 font-mono">
                        {formatCurrency(p.totalPayable)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(p.amountPaid)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getPaymentModeBadge(p.paymentMode)}
                      </td>
                      <td className={`px-4 py-3.5 font-bold font-mono ${p.totalOutstanding > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {formatCurrency(p.totalOutstanding)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {getStatusBadge(p.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400 italic">
                      No payment records found for this member.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-dark-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
