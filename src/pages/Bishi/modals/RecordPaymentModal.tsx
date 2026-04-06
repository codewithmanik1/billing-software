import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { IndianRupee, Loader2, X, Wallet, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    bishiId: number;
    bishiMemberId: number;
    monthNumber: number;
    monthLabel: string;
    memberName: string;
    amountDue: number;
    dueCarriedForward: number;
    totalPayable: number;
    currentAmountPaid: number;
    currentPaymentDate?: string | null;
    currentPaymentMode?: string | null;
    currentNotes?: string | null;
  };
}

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, data }) => {
  const [amountPaid, setAmountPaid] = useState<number>(data.currentAmountPaid || data.totalPayable);
  const [paymentDate, setPaymentDate] = useState<string>(data.currentPaymentDate ? format(new Date(data.currentPaymentDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [paymentMode, setPaymentMode] = useState<string>(data.currentPaymentMode || 'CASH');
  const [notes, setNotes] = useState<string>(data.currentNotes || '');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const isEdit = data.currentAmountPaid > 0;

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/bishi/${data.bishiId}/payments`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Payment updated successfully!' : 'Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['bishi-payments', data.bishiId, data.monthNumber] });
      queryClient.invalidateQueries({ queryKey: ['bishi', data.bishiId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  });

  const handleSave = () => {
    mutation.mutate({
      bishiMemberId: data.bishiMemberId,
      monthNumber: data.monthNumber,
      amountPaid: Number(amountPaid),
      paymentMode,
      paymentDate,
      notes,
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      setIsConfirmOpen(true);
    } else {
      handleSave();
    }
  };

  if (!isOpen) return null;

  const outstanding = Math.max(0, data.totalPayable - amountPaid);
  let status = 'DUE';
  if (amountPaid >= data.totalPayable) status = 'PAID';
  else if (amountPaid > 0) status = 'PARTIAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-dark-800">
        <div className="p-6 border-b border-gray-50 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900">
          <h3 className="text-lg font-bold text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
            <Wallet size={20} className="text-[#B8860B]" />
            Record Payment
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-[#B8860B]/5 border-b border-[#B8860B]/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B]">Member Name</p>
              <h4 className="text-base font-bold text-[#1A1209] dark:text-[#F5F5F0]">{data.memberName}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B]">{data.monthLabel}</p>
              <h4 className="text-sm font-bold text-[#6B5E4A] dark:text-gray-400">Month {data.monthNumber}</h4>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#B8860B]/10">
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-widest text-gray-500">Monthly Amount</p>
              <p className="text-sm font-bold text-[#1A1209] dark:text-[#F5F5F0]">{formatCurrency(data.amountDue)}</p>
            </div>
            <div>
              <p className="text-[8px] font-extrabold uppercase tracking-widest text-gray-500">Previous Dues</p>
              <p className="text-sm font-bold text-red-500">{formatCurrency(data.dueCarriedForward)}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white dark:bg-dark-800 rounded-xl border border-[#B8860B]/20 flex justify-between items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Total Payable</p>
            <p className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">{formatCurrency(data.totalPayable)}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Amount Paid (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <IndianRupee size={16} />
              </div>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="input-field pl-10 py-2.5 font-bold font-mono focus:bg-white bg-gray-50 border-gray-100 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="input-field py-2.5 bg-gray-50 border-gray-100 focus:bg-white rounded-xl text-sm font-bold"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Payment Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input-field pl-10 py-2.5 focus:bg-white bg-gray-50 border-gray-100 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Notes (Optional)</label>
            <div className="relative">
              <div className="absolute left-4 top-3 pointer-events-none text-gray-400">
                <FileText size={16} />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Paid via UPI..."
                className="input-field pl-10 py-2.5 min-h-[80px] focus:bg-white bg-gray-50 border-gray-100 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 text-[10px] space-y-1 font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
            <div className="flex justify-between">
              <span>Status will be:</span>
              <span className={`${
                status === 'PAID' ? 'text-green-600' : status === 'PARTIAL' ? 'text-amber-600' : 'text-red-600'
              }`}>{status}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Balance:</span>
              <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(outstanding)}</span>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-2 px-8 py-2.5 bg-[#1A1209] hover:bg-[#B8860B] disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Update Payment' : 'Save Payment'}
            </button>
          </div>
        </form>

        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleSave}
          title="Update Payment"
          message="Are you sure you want to update this payment record? This will affect the member's outstanding balance."
          confirmText="Yes, Update"
          isDestructive={false}
        />
      </div>
    </div>
  );
};
