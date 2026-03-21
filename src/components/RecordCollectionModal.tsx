import React, { useRef, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEnterKeyNavigation } from '../lib/useEnterKeyNavigation';

const paymentSchema = z.object({
  paymentDate: z.string(),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

interface RecordCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceDue: number;
  onSubmit: (data: PaymentFormData) => void;
  isPending?: boolean;
  formatCurrency: (amount: number) => string;
}

export const RecordCollectionModal: React.FC<RecordCollectionModalProps> = ({
  isOpen,
  onClose,
  balanceDue,
  onSubmit,
  isPending = false,
  formatCurrency,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      amount: balanceDue || 0,
      paymentMode: 'CASH',
    }
  });

  useEnterKeyNavigation(formRef, () => {
    handleSubmit(onSubmit)();
  });

  // Reset form when modal opens with latest balanceDue
  useEffect(() => {
    if (isOpen) {
      reset({
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        amount: balanceDue || 0,
        paymentMode: 'CASH',
      });
    }
  }, [isOpen, balanceDue, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Collection">
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Payment Date <span className="text-red-500">*</span></label>
            <input data-field-order="1" type="date" {...register('paymentDate')} className="input-field py-3" />
            {errors.paymentDate && <p className="text-red-500 text-[10px] font-bold">{errors.paymentDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider justify-between">
              <span>Credit Amount <span className="text-red-500">*</span></span>
              <span className="text-[#B8860B]">Balance: {formatCurrency(balanceDue)}</span>
            </label>
            <input data-field-order="2" type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="input-field text-right py-3 font-mono font-bold text-lg" placeholder="0.00" />
            {errors.amount && <p className="text-red-500 text-[10px] font-bold">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Payment Instrument <span className="text-red-500">*</span></label>
            <select data-field-order="3" {...register('paymentMode')} className="input-field py-3 font-medium">
              <option value="CASH">Cash Payment</option>
              <option value="UPI">UPI Transfer</option>
              <option value="CARD">Debit/Credit Card</option>
              <option value="BANK_TRANSFER">NEFT/IMPS Transfer</option>
              <option value="CHEQUE">Cheque / demand Draft</option>
            </select>
            {errors.paymentMode && <p className="text-red-500 text-[10px] font-bold">{errors.paymentMode.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Reference / TID</label>
            <input data-field-order="4" type="text" {...register('referenceNumber')} className="input-field py-3 font-mono text-xs uppercase" placeholder="TXN-123456789" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Payment Remarks</label>
          <textarea data-field-order="5" {...register('notes')} className="input-field min-h-[80px] py-3 text-sm italic" placeholder="Add optional payment details..." />
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-100 dark:border-dark-800">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-[#6B5E4A] font-bold text-xs uppercase tracking-widest">Discard</button>
          <button
            type="submit"
            className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-gold/20"
            disabled={isPending}
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
            Confirm Collection
          </button>
        </div>
      </form>
    </Modal>
  );
};
