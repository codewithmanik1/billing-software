import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Building2, Save, Loader2 } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const Profile: React.FC = () => {
  const { profile, isLoading: isProfileLoading, refetchProfile } = useProfile();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile.id) {
      reset({
        name: profile.name,
        tagline: profile.tagline,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        gstin: profile.gstin || '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => api.put('/profile', data),
    onSuccess: () => {
      refetchProfile();
      toast.success('Company profile updated successfully');
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message || 'Failed to update profile'),
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#B8860B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-[#B8860B]/10 rounded-xl">
          <Building2 size={28} className="text-[#B8860B]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Company Profile</h1>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A]">Manage your business details shown on invoices</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-800 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Business Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Company Name <span className="text-red-500">*</span></label>
              <input {...register('name')} className="input-field py-3 text-base font-bold" placeholder="Your Company Name" />
              {errors.name && <p className="text-red-500 text-[10px] font-bold">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Tagline</label>
              <input {...register('tagline')} className="input-field py-3" placeholder="Premium Gold & Silver Jewellery" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
              <input {...register('phone')} className="input-field py-3" placeholder="6281 218 824" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
              <input {...register('email')} type="email" className="input-field py-3" placeholder="company@example.com" />
              {errors.email && <p className="text-red-500 text-[10px] font-bold">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Business Address</label>
            <textarea {...register('address')} className="input-field py-3 min-h-[80px]" placeholder="Full business address" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">GSTIN (Optional)</label>
              <input {...register('gstin')} className="input-field py-3 uppercase" placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-[#B8860B] hover:bg-[#8B6508] text-white px-10 py-3 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-[#B8860B]/20 transition-all"
          >
            {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};
