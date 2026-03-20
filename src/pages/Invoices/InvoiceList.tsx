import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Search, Edit2, Trash2, Eye, IndianRupee, Loader2, Calendar, User, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { Pagination } from '../../components/ui/Pagination';

export const InvoiceList: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Fetching data
  const { data: invoicesRes, isLoading } = useQuery({
    queryKey: ['invoices', searchTerm, statusFilter, currentPage, itemsPerPage],
    queryFn: async () => {
      let url = `/invoices?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter.toUpperCase()}`;
      }
      const res = await api.get(url);
      return res.data;
    },
  });

  const invoices = invoicesRes?.data?.invoices || [];
  const pagination = invoicesRes?.data?.pagination || { total: 0 };

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
      setIsDeleteOpen(false);
      setDeletingId(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to delete invoice'),
  });

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Invoices' },
    { id: 'paid', label: 'Paid' },
    { id: 'partial', label: 'Partial' },
    { id: 'unpaid', label: 'Unpaid' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1209] dark:text-[#F5F5F0]">Billing Registry</h1>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1">History of all transactions and generation of quotes</p>
        </div>
        <button 
           onClick={() => navigate('/invoices/new')} 
           className="btn-primary flex items-center gap-2.5 px-6 py-3 rounded-xl shadow-lg shadow-gold/10"
        >
          <Plus size={20} />
          <span className="font-semibold">Create New Invoice</span>
        </button>
      </div>

      <div className="card p-0 flex flex-col shadow-md overflow-hidden">
        {/* Filters and Search */}
        <div className="p-5 border-b border-gray-100 dark:border-dark-800 bg-gray-50/30 dark:bg-black/10 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar scroll-smooth">
            <div className="flex items-center gap-2 mr-2 text-[#6B5E4A] dark:text-gray-400">
               <Filter size={16} />
               <span className="text-xs font-bold uppercase tracking-widest">Filter:</span>
            </div>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id as any); setCurrentPage(1); }}
                className={clsx(
                  "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === tab.id 
                    ? "bg-[#B8860B] text-white shadow-md shadow-[#B8860B]/20" 
                    : "text-[#6B5E4A] dark:text-gray-400 hover:bg-[#B8860B]/10 hover:text-[#B8860B]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-80 shrink-0">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Invoice # or Customer name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-field pl-11 py-2.5 bg-white dark:bg-dark-900"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full text-left text-sm max-md:block">
            <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A] max-md:hidden">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Invoice Details</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Customer & Contact</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Financials</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-center">Payment Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800 max-md:block">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 text-[#B8860B] animate-spin" />
                         <p className="text-[#9A9A8A]">Fetching records...</p>
                      </div>
                   </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv: Record<string, unknown> & { id: string; invoiceNumber: string; invoiceDate: string; customer: { name: string; phone: string }; grandTotal: number; totalPaid: number; balanceDue: number; status: string }) => (
                  <tr key={inv.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 group max-md:block max-md:p-4 max-md:border-b border-gray-100 dark:border-dark-800 relative">
                    <td className="px-6 py-5 max-md:p-0 max-md:block max-md:border-b border-gray-50 dark:border-dark-800 max-md:pb-3 max-md:mb-3">
                       <div className="flex max-md:justify-between max-md:items-start md:block">
                         <span className="md:hidden font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-1">Invoice</span>
                         <div className="text-right md:text-left">
                           <div className="font-bold text-[#1A1209] dark:text-[#F5F5F0] text-base group-hover:text-[#B8860B] transition-colors">{inv.invoiceNumber}</div>
                           <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1 font-medium italic justify-end md:justify-start">
                              <Calendar size={12} />
                              {format(new Date(inv.invoiceDate), 'dd MMM yyyy')}
                           </div>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 font-medium max-md:p-0 max-md:block max-md:border-b border-gray-50 dark:border-dark-800 max-md:pb-3 max-md:mb-3">
                       <div className="flex max-md:justify-between max-md:items-start md:block">
                         <span className="md:hidden font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-1">Customer</span>
                         <div className="text-right md:text-left">
                           <div className="flex items-center gap-2 text-[#1A1209] dark:text-[#F5F5F0] justify-end md:justify-start">
                              <User size={14} className="text-[#B8860B]" />
                              <span>{inv.customer.name}</span>
                           </div>
                           <div className="text-[10px] text-gray-400 mt-1 pl-0 md:pl-5">{inv.customer.phone}</div>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right max-md:p-0 max-md:block max-md:border-b border-gray-50 dark:border-dark-800 max-md:pb-3 max-md:mb-3">
                       <div className="flex max-md:justify-between max-md:items-center md:block">
                         <span className="md:hidden font-bold text-[10px] text-gray-500 uppercase tracking-widest">Financials</span>
                         <div className="text-right">
                           <div className="font-bold text-[#1A1209] dark:text-[#F5F5F0] text-lg">{formatCurrency(Number(inv.grandTotal))}</div>
                           {Number(inv.totalPaid) > 0 && (
                              <div className="text-[10px] text-green-600 dark:text-green-500 font-bold mt-0.5">
                                 Paid: {formatCurrency(Number(inv.totalPaid))}
                              </div>
                           )}
                           {Number(inv.balanceDue) > 0 && (
                              <div className="text-[10px] text-red-500 font-bold mt-0.5">
                                 Due: {formatCurrency(Number(inv.balanceDue))}
                              </div>
                           )}
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center max-md:p-0 max-md:block max-md:border-b border-gray-50 dark:border-dark-800 max-md:pb-3 max-md:mb-3">
                       <div className="flex max-md:justify-between max-md:items-center md:block">
                         <span className="md:hidden font-bold text-[10px] text-gray-500 uppercase tracking-widest">Status</span>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest inline-block ${
                           inv.status === 'PAID' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                           inv.status === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                           'bg-red-500/10 text-red-600 dark:text-red-400'
                         }`}>
                           {inv.status}
                         </span>
                       </div>
                    </td>
                     <td className="px-6 py-5 max-md:p-0 max-md:block">
                      <div className="flex justify-center md:justify-end gap-3 sm:gap-2 max-md:pt-4 max-md:pb-2 max-md:border-t border-gray-50 dark:border-dark-800">
                        <button 
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors rounded-xl hover:bg-blue-500/10"
                          title="View Insights"
                          aria-label="View invoice details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}?tab=payments`)}
                          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-green-500 transition-colors rounded-xl hover:bg-green-500/10"
                          title="Register Payment"
                          aria-label="Register payment"
                        >
                          <IndianRupee size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-[#B8860B] transition-colors rounded-xl hover:bg-[#B8860B]/10"
                          title="Amend Record"
                          aria-label="Edit invoice"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingId(inv.id); setIsDeleteOpen(true); }}
                          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                          title="Void Invoice"
                          aria-label="Delete invoice"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-[#9A9A8A]">
                    <div className="flex flex-col items-center gap-2">
                       <Filter size={48} className="opacity-10 mb-2" />
                       <p className="text-lg font-serif italic text-gray-400">Registry is empty for this criteria</p>
                       <p className="text-xs opacity-60">Adjust filters or create a new invoice to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="p-5 border-t border-gray-100 dark:border-dark-800 bg-gray-50/20">
            <Pagination
              currentPage={currentPage}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
              itemsPerPageOptions={[10, 25, 50]}
              entityName="invoices"
            />
          </div>
        )}
      </div>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Security Confirmation">
        <div className="space-y-6 pt-2">
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
             <div className="p-2 bg-red-500 rounded-lg text-white">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="font-bold text-red-600 dark:text-red-400">Permanently Void Invoice?</p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">This will erase the financial record and all associated payments. This action is IRREVERSIBLE.</p>
             </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteOpen(false)} className="px-5 py-2 text-gray-500 hover:text-gray-700 font-bold uppercase tracking-wider text-xs">Retain Record</button>
            <button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmed, Void Registry
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

