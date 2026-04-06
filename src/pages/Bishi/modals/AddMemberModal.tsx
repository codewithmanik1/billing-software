import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { Search, Loader2, X, UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddMemberModalProps {
  bishiId: number;
  isOpen: boolean;
  onClose: () => void;
  existingMemberIds: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ bishiId, isOpen, onClose, existingMemberIds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: customersRes, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers-autocomplete', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/customers/autocomplete?q=${searchTerm}`);
      return res.data;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async (customerIds: string[]) => {
      const res = await api.post(`/bishi/${bishiId}/members`, { customerIds });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Members added successfully!');
      queryClient.invalidateQueries({ queryKey: ['bishi', bishiId] });
      onClose();
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add members');
    }
  });

  const customers = React.useMemo(() => {
    const rawList = customersRes?.data || [];
    const filtered = rawList.filter((c: any) => !existingMemberIds.includes(c.id));
    
    if (!searchTerm.trim()) return filtered.slice(0, 10);

    const query = searchTerm.toLowerCase().trim();
    return filtered.sort((a: any, b: any) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(query);
      const bStarts = bName.startsWith(query);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aName.localeCompare(bName);
    }).slice(0, 10);
  }, [customersRes, existingMemberIds, searchTerm]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-dark-800">
        <div className="p-6 border-b border-gray-50 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900">
          <h3 className="text-lg font-bold text-[#1A1209] dark:text-[#F5F5F0] flex items-center gap-2">
            <UserPlus size={20} className="text-[#B8860B]" />
            Add Bishi Members
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2 text-sm bg-gray-50 border-gray-100 focus:bg-white rounded-xl"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {isLoadingCustomers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#B8860B]" size={24} />
              </div>
            ) : customers.length > 0 ? (
              customers.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    selectedIds.includes(c.id)
                      ? 'border-[#B8860B] bg-[#FFF8E7]/50'
                      : 'border-gray-50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#1A1209] dark:text-[#F5F5F0]">{c.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{c.phone}</span>
                  </div>
                  {selectedIds.includes(c.id) && <CheckCircle2 size={20} className="text-[#B8860B]" />}
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-gray-400 text-sm italic font-medium">No new customers found.</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-50 dark:border-dark-800 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
            {selectedIds.length} Selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={selectedIds.length === 0 || mutation.isPending}
              onClick={() => mutation.mutate(selectedIds)}
              className="px-6 py-2 bg-[#1A1209] hover:bg-[#B8860B] disabled:bg-gray-300 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2"
            >
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
