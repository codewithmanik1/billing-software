import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Search, Edit2, Trash2, Loader2, UserPlus, Phone, Mail } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Pagination } from '../components/ui/Pagination';

const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Record<string, unknown> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  });

  // Fetching data
  const { data: customersRes, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, currentPage, itemsPerPage],
    queryFn: async () => {
      const res = await api.get(`/customers?search=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`);
      return res.data;
    },
  });

  const customers = customersRes?.data?.customers || [];
  const pagination = customersRes?.data?.pagination || { total: 0 };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer added successfully');
      setIsFormOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to add customer'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: CustomerFormData }) => api.put(`/customers/${data.id}`, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
      setIsFormOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to update customer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
      setIsDeleteOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Cannot delete customer'),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    reset({ name: '', phone: '', email: '', address: '', gstin: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Record<string, unknown>) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name as string,
      phone: customer.phone as string,
      email: (customer.email as string) || '',
      address: (customer.address as string) || '',
      gstin: (customer.gstin as string) || '',
    });
    setIsFormOpen(true);
  };

  const onFormSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id as string, body: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-dark-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-800">
        <div>
          <h1 className="text-3xl font-serif text-[#1A1209] dark:text-[#F5F5F0]">Customer Directory</h1>
          <p className="text-sm text-[#6B5E4A] dark:text-[#9A9A8A] mt-1">Manage client profiles and track balances</p>
        </div>
        <button 
           onClick={handleOpenAdd} 
           className="btn-primary flex items-center gap-2.5 px-6 py-3 rounded-xl shadow-lg shadow-gold/10"
        >
          <UserPlus size={20} />
          <span className="font-semibold">Add New Customer</span>
        </button>
      </div>

      <div className="card p-0 flex flex-col shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-800 bg-gray-50/30 dark:bg-black/10">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-11 py-2.5 bg-white dark:bg-dark-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Client Identity</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Contact Info</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Purchase Info</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Outstanding Balance</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {isLoading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                         <Loader2 className="w-8 h-8 text-[#B8860B] animate-spin" />
                         <p className="text-[#9A9A8A]">Retrieving customer data...</p>
                      </div>
                   </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((customer: Record<string, unknown> & { id: string; name: string; phone: string; email?: string; gstin?: string; totalInvoices: number; totalPaid: number; outstandingBalance: number }) => (
                  <tr key={customer.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 group">
                    <td className="px-6 py-5">
                       <div className="font-bold text-[#1A1209] dark:text-[#F5F5F0] text-base group-hover:text-[#B8860B] transition-colors">{customer.name}</div>
                       {customer.gstin && <div className="text-[10px] text-gray-400 mt-0.5 tracking-widest uppercase">GST: {customer.gstin}</div>}
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-[#6B5E4A] dark:text-[#9A9A8A]">
                          <Phone size={14} className="opacity-50" />
                          <span>{customer.phone}</span>
                       </div>
                       {customer.email && (
                          <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                             <Mail size={13} className="opacity-40" />
                             <span className="truncate max-w-[150px]">{customer.email}</span>
                          </div>
                       )}
                    </td>
                    <td className="px-6 py-5">
                       <div className="text-xs text-[#6B5E4A] dark:text-[#9A9A8A] font-medium">
                          Total Invoices: <span className="text-[#B8860B]">{customer.totalInvoices}</span>
                       </div>
                       <div className="text-[10px] text-gray-400 mt-1">
                          Paid: {formatCurrency(customer.totalPaid)}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-lg">
                        <span className={customer.outstandingBalance > 0 ? 'text-red-500' : 'text-green-500'}>
                           {formatCurrency(customer.outstandingBalance)}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleOpenEdit(customer)}
                          className="p-2.5 text-gray-400 hover:text-[#B8860B] transition-colors rounded-xl hover:bg-[#B8860B]/10"
                          title="Edit Profile"
                          aria-label="Edit customer"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => { setDeletingId(customer.id); setIsDeleteOpen(true); }}
                          className="p-2.5 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                          title="Remove Customer"
                          aria-label="Delete customer"
                        >
                          <Trash2 size={18} />
                        </button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[#9A9A8A]">
                    <div className="flex flex-col items-center gap-2">
                       <Search size={40} className="opacity-20 translate-y-2 -rotate-12 mb-2" />
                       <p className="text-base font-serif italic">No clients found matching your search</p>
                       <p className="text-xs opacity-60">Try searching for a name or phone number</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {pagination.total > 0 && (
          <div className="p-5 border-t border-gray-100 dark:border-dark-800 bg-gray-50/20">
            <Pagination
              currentPage={currentPage}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
              itemsPerPageOptions={[10, 25, 50]}
              entityName="customers"
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider text-[10px]">Client Name <span className="text-red-500">*</span></label>
              <input {...register('name')} className="input-field py-3 text-base" placeholder="Enter full name" />
              {errors.name && <p className="text-red-500 text-[10px] uppercase font-bold mt-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider text-[10px]">Phone Number <span className="text-red-500">*</span></label>
              <input {...register('phone')} className="input-field py-3 text-base" placeholder="10-digit mobile" />
              {errors.phone && <p className="text-red-500 text-[10px] uppercase font-bold mt-1">{errors.phone.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider text-[10px]">Email Address</label>
              <input {...register('email')} type="email" className="input-field py-3" placeholder="client@example.com" />
              {errors.email && <p className="text-red-500 text-[10px] uppercase font-bold mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider text-[10px]">GSTIN (Optional)</label>
              <input {...register('gstin')} className="input-field py-3 uppercase" placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider text-[10px]">Postal Address</label>
            <textarea {...register('address')} className="input-field min-h-[100px] py-3 text-sm" placeholder="Full residential or business address" />
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-dark-800">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-2.5 text-[#6B5E4A] dark:text-[#9A9A8A] font-bold text-sm uppercase tracking-widest hover:text-[#B8860B] transition-colors">Discard</button>
            <button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingCustomer ? 'Update Client' : 'Save Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Security Confirmation">
        <div className="space-y-6 pt-2">
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
             <div className="p-2 bg-red-500 rounded-lg text-white">
                <Trash2 size={24} />
             </div>
             <div>
                <p className="font-bold text-red-600 dark:text-red-400">Permanently Delete Client?</p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">This will remove all profile data. Note: Customers with active invoices cannot be deleted.</p>
             </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteOpen(false)} className="px-5 py-2 text-gray-500 hover:text-gray-700 font-bold uppercase tracking-wider text-xs">Cancel</button>
            <button 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmed, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

