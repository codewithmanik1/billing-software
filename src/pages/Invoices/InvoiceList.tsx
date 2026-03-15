import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Search, Edit2, Trash2, Eye, IndianRupee } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { Pagination } from '../../components/ui/Pagination';

export const InvoiceList: React.FC = () => {
  const { invoices, deleteInvoice } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'desc' 
            ? new Date(b.date).getTime() - new Date(a.date).getTime()
            : new Date(a.date).getTime() - new Date(b.date).getTime();
        } else {
          return sortOrder === 'desc' 
            ? b.totalAmount - a.totalAmount
            : a.totalAmount - b.totalAmount;
        }
      });
  }, [invoices, searchTerm, statusFilter, sortBy, sortOrder]);

  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = () => {
    if (deletingId) {
      deleteInvoice(deletingId);
      toast.success('Invoice deleted successfully');
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif text-gray-900 dark:text-white">Invoices</h1>
        <Link to="/invoices/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          <span>Create Invoice</span>
        </Link>
      </div>

      <div className="card p-0 flex flex-col">
        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-700 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id as any); setCurrentPage(1); }}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  statusFilter === tab.id 
                    ? "bg-[#FFF8E7] dark:bg-dark-700 text-[#8B6508] dark:text-gold border border-[#B8860B]/30 dark:border-dark-600" 
                    : "text-[#6B5E4A] dark:text-gray-400 hover:text-[#1A1209] dark:hover:text-gray-200 hover:bg-[#F5F0E8] dark:hover:bg-dark-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64 shrink-0">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
              <tr>
                <th className="px-6 py-3 font-medium">Invoice No.</th>
                <th 
                  className="px-6 py-3 font-medium cursor-pointer hover:text-gray-900 dark:text-white transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th 
                  className="px-6 py-3 font-medium text-right cursor-pointer hover:text-gray-900 dark:text-white transition-colors"
                  onClick={() => toggleSort('amount')}
                >
                  Total Amt {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 font-medium text-right">Pending</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D0] dark:divide-[#2E2E2E]">
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 cursor-pointer">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{inv.customer.name}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(inv.totalAmount)}</td>
                    <td className={`px-6 py-4 text-right font-medium ${inv.pendingAmount > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {formatCurrency(inv.pendingAmount)}
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-500/10 text-green-500' :
                        inv.status === 'partial' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-400 transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/invoices/${inv.id}?tab=payments`)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-green-400 transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="Payments"
                        >
                          <IndianRupee size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gold transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="Edit Invoice"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { setDeletingId(inv.id); setIsDeleteOpen(true); }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="Delete Invoice"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#E8E0D0] dark:border-[#2E2E2E]">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
            entityName="invoices"
          />
        </div>
      </div>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Invoice">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete this invoice? This action cannot be undone and will also delete associated payment records.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsDeleteOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-gray-900 dark:text-white px-4 py-2 rounded-md transition-colors font-medium">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
