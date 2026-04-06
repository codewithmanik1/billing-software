import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { toast } from 'sonner';
import { Coins, ArrowLeft, Loader2, Calendar, IndianRupee, Trophy, Clock } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const bishiSchema = z.object({
  name: z.string().min(1, 'Bishi name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  durationMonths: z.number().int().min(1, 'Duration must be at least 1 month'),
  monthlyAmount: z.number().positive('Monthly amount must be positive'),
  winnersPerMonth: z.number().int().min(1, 'Winners per month must be at least 1'),
});

type BishiFormValues = z.infer<typeof bishiSchema>;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const BishiCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<BishiFormValues>({
    resolver: zodResolver(bishiSchema),
    defaultValues: {
      startDate: format(new Date(), 'yyyy-MM-dd'),
      durationMonths: 12,
      winnersPerMonth: 1,
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: BishiFormValues) => {
      const res = await api.post('/bishi', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bishi scheme created successfully!');
      queryClient.invalidateQueries({ queryKey: ['bishis'] });
      navigate('/bishi');
    },
    onError: (error: any) => {
      console.error('Bishi creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create Bishi scheme');
    }
  });

  const onSubmit = (data: BishiFormValues) => {
    mutation.mutate(data);
  };

  const watched = watch();
  const endDate = watched.startDate && watched.durationMonths 
    ? format(addMonths(new Date(watched.startDate), watched.durationMonths), 'dd MMM yyyy')
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bishi')}
          className="p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 text-[#6B5E4A] hover:text-[#B8860B] hover:border-[#B8860B] transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Create New Bishi</h1>
          <p className="text-sm text-[#9A9A8A]">Define the rules and schedule for the new scheme</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Card */}
        <div className="lg:col-span-2 card p-8 rounded-2xl shadow-xl border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Coins size={120} className="text-[#B8860B]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">
                  Bishi Scheme Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#B8860B] transition-colors">
                    <Coins size={18} />
                  </div>
                  <input
                    {...register('name')}
                    placeholder="e.g. Gold Shubh Bishi 2026"
                    className="input-field pl-11 py-3 bg-gray-50 border-gray-100 focus:bg-white transition-all rounded-xl"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.name.message}</p>}
              </div>

              {/* Start Date & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">
                    Start Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Calendar size={18} />
                    </div>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="input-field pl-11 py-3 bg-gray-50 border-gray-100 focus:bg-white rounded-xl"
                    />
                  </div>
                  {errors.startDate && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.startDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">
                    Duration (Months)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Clock size={18} />
                    </div>
                    <input
                      type="number"
                      {...register('durationMonths', { valueAsNumber: true })}
                      placeholder="12"
                      className="input-field pl-11 py-3 bg-gray-50 border-gray-100 focus:bg-white rounded-xl"
                    />
                  </div>
                  {errors.durationMonths && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.durationMonths.message}</p>}
                </div>
              </div>

              {/* Amount & Winners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">
                    Monthly Amount (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <IndianRupee size={18} />
                    </div>
                    <input
                      type="number"
                      {...register('monthlyAmount', { valueAsNumber: true })}
                      placeholder="5000"
                      className="input-field pl-11 py-3 bg-gray-50 border-gray-100 focus:bg-white rounded-xl font-bold font-mono"
                    />
                  </div>
                  {errors.monthlyAmount && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.monthlyAmount.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">
                    Winners Per Month
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <Trophy size={18} />
                    </div>
                    <input
                      type="number"
                      {...register('winnersPerMonth', { valueAsNumber: true })}
                      placeholder="1"
                      className="input-field pl-11 py-3 bg-gray-50 border-gray-100 focus:bg-white rounded-xl"
                    />
                  </div>
                  {errors.winnersPerMonth && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.winnersPerMonth.message}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 dark:border-dark-800 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/bishi')}
                className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#6B5E4A] hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-10 py-3 bg-[#1A1209] hover:bg-[#B8860B] disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl hover:shadow-[#B8860B]/20 flex items-center gap-2"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Bishi Scheme'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 rounded-2xl bg-[#1A1209] text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Coins size={140} />
            </div>
            
            <h3 className="text-lg font-bold mb-6 text-[#FFD700]">Scheme Summary</h3>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Starts On</p>
                  <p className="text-sm font-medium">{watched.startDate ? format(new Date(watched.startDate), 'dd MMM yyyy') : '...'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Duration & End Date</p>
                  <p className="text-sm font-medium">{watched.durationMonths || 12} Months</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ends around {endDate || '...'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <IndianRupee size={18} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Subscription</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(watched.monthlyAmount || 0)}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Per Member / Per Month</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Trophy size={18} className="text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Winner Yield</p>
                  <p className="text-sm font-medium">{watched.winnersPerMonth || 1} lucky winner(s) monthly</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20">
            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2">Important Instructions</h4>
            <ul className="text-xs text-amber-900/70 dark:text-amber-500 space-y-2 list-disc pl-4">
              <li>Members can be added later, but only before the first payment is recorded.</li>
              <li>Monthly amount is fixed for all members.</li>
              <li>Winners are manually announced every month after collection.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
