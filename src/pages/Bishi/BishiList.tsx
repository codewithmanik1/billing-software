import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Coins, Plus, Loader2, ChevronRight, TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EditBishiModal } from './modals/EditBishiModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const BishiList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editingBishi, setEditingBishi] = useState<any>(null);
  const [deletingBishi, setDeletingBishi] = useState<any>(null);

  const deleteBishiMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/bishi/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bishi scheme deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['bishis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete Bishi scheme');
    }
  });

  const { data: bishiRes, isLoading } = useQuery({
    queryKey: ['bishis'],
    queryFn: async () => {
      const res = await api.get('/bishi');
      return res.data;
    },
  });

  const bishisArray = Array.isArray(bishiRes?.data) ? bishiRes.data : [];

  const summary = {
    activeCount: bishisArray.filter((b: any) => b.status === 'ACTIVE').length,
    totalCollected: bishisArray.reduce((sum: number, b: any) => sum + (b.totalCollectedAllTime || 0), 0),
    totalOutstanding: bishisArray.reduce((sum: number, b: any) => sum + (b.totalOutstandingAllTime || 0), 0),
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Bishi Schemes</h1>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1">
            🏦 Manage rotating savings and collection schemes
          </p>
        </div>
        <button
          onClick={() => navigate('/bishi/create')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1A1209] hover:bg-[#B8860B] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#B8860B]/20"
        >
          <Plus size={16} />
          Create Bishi
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 rounded-xl shadow-sm border-t-2 border-[#B8860B] text-center">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">Active Bishis</p>
          <div className="text-3xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">
            {summary.activeCount}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Schemes in progress</p>
        </div>

        <div className="card p-6 rounded-xl shadow-sm border-t-2 border-green-500 text-center">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">Total Collected</p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-green-600 dark:text-green-400">
            <TrendingUp size={20} />
            {formatCurrency(summary.totalCollected)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">All-time collections</p>
        </div>

        <div className="card p-6 rounded-xl shadow-sm border-t-2 border-red-500 text-center">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">Total Outstanding</p>
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-red-600 dark:text-red-400">
            <TrendingDown size={20} />
            {formatCurrency(summary.totalOutstanding)}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Total pending dues</p>
        </div>
      </div>

      {/* List */}
      <div className="card p-0 rounded-2xl shadow-xl overflow-hidden border-gray-100">
        <div className="p-6 border-b border-gray-100 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900">
          <h2 className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
            <Coins size={20} className="text-[#B8860B]" />
            All Bishi Schemes
          </h2>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="text-[#B8860B] animate-spin mb-4" />
              <p className="text-[#6B5E4A] font-medium tracking-widest uppercase text-xs">Loading schemes...</p>
            </div>
          ) : bishisArray.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A1209] text-white">
                <tr>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Scheme Name</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Start Date</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Duration</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Monthly Amount</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Members</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Progress</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                {bishisArray.map((bishi: any) => (
                  <tr key={bishi.id} className="bg-white dark:bg-dark-900 hover:bg-[#FFF8E7]/50 dark:hover:bg-dark-800 transition-colors group">
                    <td className="px-8 py-4">
                      <span className="text-[#1A1209] dark:text-[#F5F5F0] font-bold text-base">{bishi.name}</span>
                    </td>
                    <td className="px-6 py-4 text-[#6B5E4A] dark:text-gray-400 font-medium">
                      {format(new Date(bishi.startDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 text-[#6B5E4A] dark:text-gray-400">
                      {bishi.durationMonths} Months
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1A1209] dark:text-[#F5F5F0]">
                      {formatCurrency(Number(bishi.monthlyAmount))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-[#F5F5F0] dark:bg-dark-800 rounded-lg text-xs font-bold text-[#6B5E4A] dark:text-gray-300">
                        {bishi.memberCount} Members
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase text-gray-400">Month {bishi.currentMonthNumber} of {bishi.durationMonths}</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#B8860B]" 
                            style={{ width: `${(bishi.currentMonthNumber / bishi.durationMonths) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        bishi.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {bishi.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/bishi/${bishi.id}`}
                          className="inline-flex items-center gap-1 text-[#B8860B] font-bold text-xs hover:underline"
                        >
                          VIEW DETAILS
                          <ChevronRight size={14} />
                        </Link>
                        <button
                          onClick={() => setEditingBishi(bishi)}
                          className="p-1.5 text-gray-500 hover:text-[#B8860B] hover:bg-[#FFF8E7] rounded-lg transition-all"
                          title="Edit Scheme"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingBishi(bishi)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                          title="Delete Scheme"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 dark:bg-black/10">
              <div className="w-16 h-16 bg-[#B8860B]/10 rounded-full flex items-center justify-center text-[#B8860B] mb-4">
                <Coins size={32} />
              </div>
              <p className="text-lg font-serif text-[#1A1209] dark:text-[#F5F5F0]">No Bishi schemes yet</p>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Create your first Bishi to start collections.</p>
            </div>
          )}
        </div>
      </div>

      {editingBishi && (
        <EditBishiModal
          isOpen={editingBishi !== null}
          onClose={() => setEditingBishi(null)}
          bishi={editingBishi}
        />
      )}

      <ConfirmDialog
        isOpen={deletingBishi !== null}
        onClose={() => setDeletingBishi(null)}
        onConfirm={() => {
          if (deletingBishi) deleteBishiMutation.mutate(deletingBishi.id);
        }}
        title="Delete Bishi Scheme"
        message="Are you sure you want to delete this scheme? All member and payment records will be permanently removed. This action cannot be undone."
        confirmText="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
};
