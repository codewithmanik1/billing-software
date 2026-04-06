import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { Coins, Loader2, Calendar, IndianRupee, Trophy, Clock, X } from 'lucide-react';
import { format } from 'date-fns';

const bishiSchema = z.object({
  name: z.string().min(1, 'Bishi name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  durationMonths: z.number().int().min(1, 'Duration must be at least 1 month'),
  monthlyAmount: z.number().positive('Monthly amount must be positive'),
  winnersPerMonth: z.number().int().min(1, 'Winners per month must be at least 1'),
});

type BishiFormValues = z.infer<typeof bishiSchema>;

interface EditBishiModalProps {
  isOpen: boolean;
  onClose: () => void;
  bishi: any;
}

export const EditBishiModal: React.FC<EditBishiModalProps> = ({ isOpen, onClose, bishi }) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BishiFormValues>({
    resolver: zodResolver(bishiSchema),
  });

  useEffect(() => {
    if (bishi) {
      reset({
        name: bishi.name,
        startDate: format(new Date(bishi.startDate), 'yyyy-MM-dd'),
        durationMonths: bishi.durationMonths,
        monthlyAmount: Number(bishi.monthlyAmount),
        winnersPerMonth: bishi.winnersPerMonth,
      });
    }
  }, [bishi, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: BishiFormValues) => {
      const res = await api.put(`/bishi/${bishi.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bishi scheme updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['bishi', String(bishi.id)] });
      queryClient.invalidateQueries({ queryKey: ['bishis'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update Bishi scheme');
    }
  });

  const onSubmit = (data: BishiFormValues) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-dark-800">
        <div className="p-6 border-b border-gray-50 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900">
          <h3 className="text-lg font-bold text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
            <Coins size={20} className="text-[#B8860B]" />
            Edit Bishi Scheme
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Bishi Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Coins size={18} />
                </div>
                <input
                  {...register('name')}
                  className="input-field pl-11 py-2.5 bg-gray-50 border-gray-100 focus:bg-white rounded-xl text-sm font-medium"
                />
              </div>
              {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Start Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="input-field pl-11 py-2.5 bg-gray-50 border-gray-100 focus:bg-white rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Duration (Months)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Clock size={18} />
                  </div>
                  <input
                    type="number"
                    {...register('durationMonths', { valueAsNumber: true })}
                    className="input-field pl-11 py-2.5 bg-gray-50 border-gray-100 focus:bg-white rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Monthly Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <IndianRupee size={18} />
                  </div>
                  <input
                    type="number"
                    {...register('monthlyAmount', { valueAsNumber: true })}
                    className="input-field pl-11 py-2.5 bg-gray-50 border-gray-100 focus:bg-white rounded-xl text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* Winners */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">Winners / Month</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Trophy size={18} />
                  </div>
                  <input
                    type="number"
                    {...register('winnersPerMonth', { valueAsNumber: true })}
                    className="input-field pl-11 py-2.5 bg-gray-50 border-gray-100 focus:bg-white rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-2 px-10 py-3 bg-[#1A1209] hover:bg-[#B8860B] disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Update Scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
