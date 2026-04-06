import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Trophy, Loader2, X, AlertCircle, CheckCircle2, User, Search } from 'lucide-react';
import { toast } from 'sonner';

interface AnnounceWinnerModalProps {
  bishiId: number;
  isOpen: boolean;
  onClose: () => void;
  data: {
    monthNumber: number;
    monthLabel: string;
    eligibleMembers: any[];
    winnersPerMonth: number;
  };
}

export const AnnounceWinnerModal: React.FC<AnnounceWinnerModalProps> = ({ bishiId, isOpen, onClose, data }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Pre-fill selected winners for the current month if any exist
  React.useEffect(() => {
    if (isOpen && data.eligibleMembers) {
      const currentWinners = data.eligibleMembers
        .filter(m => m.wonMonthNumber === data.monthNumber)
        .map(m => m.id);
      setSelectedIds(currentWinners);
    }
  }, [isOpen, data.monthNumber, data.eligibleMembers]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/bishi/${bishiId}/winners`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Winners announced successfully!');
      queryClient.invalidateQueries({ queryKey: ['bishi', bishiId] });
      queryClient.invalidateQueries({ queryKey: ['bishi-payments', bishiId, data.monthNumber] });
      onClose();
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to announce winners');
    }
  });

  const toggleSelect = (id: number) => {
    const member = data.eligibleMembers.find(m => m.id === id);
    
    // Prevent selecting someone who already won in another month
    if (member?.wonMonthNumber && member.wonMonthNumber !== data.monthNumber) {
      toast.error(`${member.customer.name} has already won in Month ${member.wonMonthNumber}.`);
      return;
    }

    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length < data.winnersPerMonth) {
        setSelectedIds(prev => [...prev, id]);
      } else {
        toast.warning(`This Bishi allows only ${data.winnersPerMonth} winner(s) per month.`);
      }
    }
  };

  const filteredMembers = (data.eligibleMembers || []).filter((m: any) => 
    m.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.customer.phone?.includes(searchTerm) ||
    m.memberNumber?.toString().includes(searchTerm)
  );

  const onSubmit = () => {
    if (selectedIds.length === 0) return;
    mutation.mutate({
      monthNumber: data.monthNumber,
      monthLabel: data.monthLabel,
      memberIds: selectedIds,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-dark-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-50 dark:border-dark-800 flex justify-between items-center bg-[#B8860B]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B8860B]/10 flex items-center justify-center text-[#B8860B]">
              <Trophy size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1A1209] dark:text-[#F5F5F0]">Announce Winner</h3>
              <p className="text-xs text-[#6B5E4A] font-bold uppercase tracking-widest">{data.monthLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-lg text-gray-400 shadow-sm border border-transparent hover:border-gray-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 flex gap-3 text-amber-800 dark:text-amber-400">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-xs font-medium leading-relaxed italic">
              <b>Important:</b> Winners' current month dues will be waived, and they will be exempt from future payments. Please ensure all collections for this month are recorded before announcing winners.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#B8860B] transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone or member #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-dark-800/50 border border-gray-100 dark:border-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 focus:border-[#B8860B] transition-all placeholder:text-gray-400 font-medium"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Selection List */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#6B5E4A] dark:text-gray-400">
              Select {data.winnersPerMonth} Member(s)
            </label>
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => toggleSelect(m.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center group ${
                      selectedIds.includes(m.id)
                        ? 'border-[#B8860B] bg-[#FFF8E7]/50'
                        : 'border-gray-50 hover:border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedIds.includes(m.id) ? 'bg-[#B8860B] text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <User size={16} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1A1209] dark:text-[#F5F5F0]">{m.customer.name}</span>
                          {m.wonMonthNumber && m.wonMonthNumber !== data.monthNumber && (
                            <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap">
                              Won M-{m.wonMonthNumber}
                            </span>
                          )}
                          {m.wonMonthNumber === data.monthNumber && (
                            <span className="text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest whitespace-nowrap animate-pulse">
                              Active Winner
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono tracking-tighter">Member #{m.memberNumber} | {m.customer.phone}</span>
                      </div>
                    </div>
                    {selectedIds.includes(m.id) ? (
                      <CheckCircle2 size={22} className="text-[#B8860B]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-100 group-hover:border-gray-200 transition-colors" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-50 italic text-sm">No eligible members available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-50 dark:border-dark-800 flex justify-between items-center bg-gray-50/30 dark:bg-black/10">
          <div className="text-xs font-bold uppercase tracking-widest text-[#B8860B] shadow-sm px-3 py-1 bg-white rounded-full border border-[#B8860B]/20">
            {selectedIds.length} / {data.winnersPerMonth} Selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={selectedIds.length !== data.winnersPerMonth || mutation.isPending}
              onClick={onSubmit}
              className="px-10 py-2.5 bg-[#1A1209] hover:bg-[#B8860B] disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl flex items-center gap-2 shadow-lg hover:shadow-[#B8860B]/20 transition-all"
            >
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Winner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
