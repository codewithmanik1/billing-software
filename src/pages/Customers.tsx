import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { Customer } from '../types';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
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
  address: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const Customers: React.FC = () => {
  const { customers, invoices, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  });

  const filteredCustomers = useMemo(() => {
    setCurrentPage(1); // reset on search
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate outstanding balance for each customer
  const customerBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    customers.forEach(c => balances[c.id] = 0);
    invoices.forEach(inv => {
      if (balances[inv.customer.id] !== undefined) {
        balances[inv.customer.id] += inv.pendingAmount;
      }
    });
    return balances;
  }, [customers, invoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    reset({ name: '', phone: '', email: '', address: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingId(customer.id);
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setIsFormOpen(true);
  };

  const onFormSubmit = (data: CustomerFormData) => {
    if (editingId) {
      updateCustomer(editingId, data);
      toast.success('Customer updated successfully');
    } else {
      const newCustomer: Customer = {
        id: `c-${Date.now()}`,
        ...data
      };
      addCustomer(newCustomer);
      toast.success('Customer added successfully');
    }
    setIsFormOpen(false);
  };

  const confirmDelete = () => {
    if (deletingId) {
      // Check if trying to delete a customer with invoices
      const hasInvoices = invoices.some(inv => inv.customer.id === deletingId);
      if (hasInvoices) {
        toast.error('Cannot delete customer with existing invoices.');
      } else {
        deleteCustomer(deletingId);
        toast.success('Customer deleted successfully');
      }
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif text-gray-900 dark:text-white">Customers</h1>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="card p-0 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Email / Address</th>
                <th className="px-6 py-3 font-medium text-right">Outstanding Balance</th>
                <th className="px-6 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D0] dark:divide-[#2E2E2E]">
              {filteredCustomers.length > 0 ? (
                paginatedCustomers.map(customer => {
                  const balance = customerBalances[customer.id] || 0;
                  return (
                    <tr key={customer.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{customer.name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{customer.phone}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {customer.email && <div className="text-sm">{customer.email}</div>}
                        {customer.address && <div className="text-xs opacity-70">{customer.address}</div>}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${balance > 0 ? 'text-red-400' : 'text-green-500'}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(customer)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gold transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="Edit Customer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { setDeletingId(customer.id); setIsDeleteOpen(true); }}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No customers found mapping search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#E8E0D0] dark:border-[#2E2E2E]">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            itemsPerPageOptions={[10, 25, 50]}
            entityName="customers"
          />
        </div>
      </div>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
            <input {...register('name')} className="input-field" placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Phone <span className="text-red-500">*</span></label>
            <input {...register('phone')} className="input-field" placeholder="9876543210" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="john@example.com" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Address</label>
            <textarea {...register('address')} className="input-field min-h-[80px]" placeholder="123 Main St" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Customer</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete this customer? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setIsDeleteOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-gray-900 dark:text-white px-4 py-2 rounded-md transition-colors font-medium">Delete Customer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
