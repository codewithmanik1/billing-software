import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, ArrowLeft, Save, Loader2, User, Search, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Combobox } from '@headlessui/react';
import { format } from 'date-fns';
import mjLogo from '../../assets/mj_logo.png';

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  itemName: z.string().min(1, 'Item name required'),
  purity: z.enum(['24K', '22K', '18K', '14K']),
  weightGrams: z.number().min(0.01, 'Weight > 0'),
  ratePerGram: z.number().min(1, 'Rate > 0'),
  makingCharges: z.number().min(0, 'Cannot be negative'),
  amount: z.number()
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  invoiceDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discount: z.number().nonnegative(),
  gstPercent: z.number().nonnegative(),
  notes: z.string().optional()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Utility for currency formatting
const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

export const InvoiceForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  
  const [customerQuery, setCustomerQuery] = useState('');

  // Fetching data
  const { data: customersRes } = useQuery({
    queryKey: ['customers-mini', customerQuery],
    queryFn: async () => {
      const res = await api.get(`/customers?limit=20&search=${customerQuery}`);
      return res.data;
    },
    staleTime: 5000,
  });

  const { data: existingInvoiceRes, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ['invoice-detail', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
    enabled: isEditing,
  });

  const existingInvoice = existingInvoiceRes?.data;
  const customers = customersRes?.data?.customers || [];

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
      items: [{ itemName: '', purity: '22K', weightGrams: 0, ratePerGram: 0, makingCharges: 0, amount: 0 }],
      discount: 0,
      gstPercent: 3,
      notes: ''
    }
  });

  // Load existing data if editing
  useEffect(() => {
    if (existingInvoice) {
      reset({
        customerId: existingInvoice.customerId,
        invoiceDate: format(new Date(existingInvoice.invoiceDate), 'yyyy-MM-dd'),
        items: existingInvoice.items.map((item: any) => ({
          ...item,
          weightGrams: Number(item.weightGrams),
          ratePerGram: Number(item.ratePerGram),
          makingCharges: Number(item.makingCharges),
          amount: Number(item.amount)
        })),
        discount: Number(existingInvoice.discount),
        gstPercent: Number(existingInvoice.gstPercent),
        notes: existingInvoice.notes || ''
      });
    }
  }, [existingInvoice, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items') || [];
  const watchDiscount = watch('discount') || 0;
  const watchGstPercent = watch('gstPercent') || 3;
  const watchDate = watch('invoiceDate');

  // Real-time calculation
  useEffect(() => {
    watchItems.forEach((item, index) => {
      if (!item) return;
      const weight = parseFloat(String(item.weightGrams)) || 0;
      const rate = parseFloat(String(item.ratePerGram)) || 0;
      const making = parseFloat(String(item.makingCharges)) || 0;
      // Note: discount is global in this schema, so per-item disc is 0 unless added to schema
      const amount = (weight * rate) + making;
      
      if (item.amount !== amount) {
        setValue(`items.${index}.amount`, amount, { shouldValidate: true });
      }
    });
  }, [JSON.stringify(watchItems), setValue]);

  const subtotal = watchItems.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const amountAfterDiscount = Math.max(0, subtotal - Number(watchDiscount));
  const gstAmount = (amountAfterDiscount * Number(watchGstPercent)) / 100;
  const grandTotal = amountAfterDiscount + gstAmount;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.post('/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Invoice generated successfully');
      navigate('/invoices');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create invoice'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      toast.success('Invoice updated successfully');
      navigate(`/invoices/${id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update invoice'),
  });

  const onSubmit = (data: InvoiceFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedCustomerId = watch('customerId');
  const selectedCustomerObj = customers.find((c: any) => c.id === selectedCustomerId) || existingInvoice?.customer;
  const formattedDateForHeader = watchDate ? format(new Date(watchDate), 'dd MMM yyyy') : '';

  if (isEditing && isLoadingInvoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#B8860B] animate-spin mb-4" />
        <p className="text-[#6B5E4A] font-serif italic">Retrieving invoice draft...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
           <button type="button" onClick={() => navigate(-1)} className="p-2.5 bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 hover:bg-[#B8860B]/10 rounded-xl transition-all text-gray-400 hover:text-[#B8860B]">
             <ArrowLeft size={20} />
           </button>
           <div>
               <h1 className="text-2xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h1>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Invoice Letterhead Preview Section */}
        <div className="card p-6 bg-white dark:bg-dark-800 shadow-md rounded-xl flex justify-between items-center">
           <div className="flex items-center gap-4">
              <img
                src={mjLogo}
                alt="More Jwellers"
                className="w-12 h-12 rounded-lg object-contain bg-[#FBF0E4] p-1 shadow-sm"
              />
              <div>
                <h2 className="text-[#1A1209] dark:text-[#F5F5F0] text-lg font-bold uppercase">More Jewellers</h2>
                <p className="text-[#B8860B] text-[10px] font-bold uppercase tracking-wider">Main Road, Mehkar, Bidar, Karnataka</p>
              </div>
           </div>

           <div className="text-right">
              <div className="text-lg font-bold text-[#1A1209] dark:text-[#F5F5F0]">
                 {isEditing ? existingInvoice?.invoiceNumber : 'NEW-INVOICE'}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{formattedDateForHeader || 'SELECT DATE'}</p>
           </div>
        </div>

        {/* Header Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-8 rounded-2xl shadow-md space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 bg-[#B8860B]/10 rounded-lg text-[#B8860B]"><User size={18} /></div>
                <h2 className="text-lg font-bold text-[#1A1209] dark:text-[#F5F5F0]">Customer Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#6B5E4A] dark:text-gray-400 uppercase tracking-widest">Client Selection <span className="text-red-500">*</span></label>
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field }) => (
                      <Combobox value={field.value} onChange={field.onChange}>
                        <div className="relative">
                          <div className="relative">
                             <Combobox.Input
                               className="input-field pl-10"
                               displayValue={(id: string) => customers.find((c: any) => c.id === id)?.name || existingInvoice?.customer.name || ''}
                               onChange={(event) => setCustomerQuery(event.target.value)}
                               placeholder="Search registered clients..."
                             />
                             <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Search size={16} />
                             </div>
                          </div>
                          <Combobox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {customers.length === 0 && customerQuery !== '' ? (
                              <div className="relative cursor-default select-none py-4 px-4 text-center">
                                <p className="text-gray-400 italic text-sm">No client record found.</p>
                                <button type="button" onClick={() => navigate('/customers')} className="text-[#B8860B] text-xs font-bold uppercase mt-2 hover:underline">Register New Client</button>
                              </div>
                            ) : (
                              customers.map((customer: any) => (
                                <Combobox.Option
                                  key={customer.id}
                                  className={({ active }) => `relative cursor-pointer select-none py-3 pl-4 pr-4 transition-colors ${active ? 'bg-[#FFF8E7] dark:bg-dark-700 text-[#B8860B]' : 'text-gray-700 dark:text-gray-200'}`}
                                  value={customer.id}
                                >
                                  <div className="flex justify-between items-center">
                                     <div className="font-bold">{customer.name}</div>
                                     <div className="text-[10px] font-bold opacity-60 font-mono tracking-tighter">{customer.phone}</div>
                                  </div>
                                  <div className="text-[10px] opacity-50 mt-0.5 truncate">{customer.address || 'No address provided'}</div>
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    )}
                  />
                  {errors.customerId && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.customerId.message}</p>}
               </div>

               <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#6B5E4A] dark:text-gray-400 uppercase tracking-widest">Registry Date <span className="text-red-500">*</span></label>
                  <input type="date" {...register('invoiceDate')} className="input-field" />
                  {errors.invoiceDate && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.invoiceDate.message}</p>}
               </div>
            </div>

            {selectedCustomerObj && (
              <div className="bg-[#FFF8E7]/50 dark:bg-dark-900/50 p-4 rounded-xl border border-[#B8860B]/10 transition-all flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
                 <div className="w-10 h-10 bg-white dark:bg-dark-800 rounded-lg flex items-center justify-center text-[#B8860B] shadow-sm flex-shrink-0">
                    <User size={20} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <p className="font-bold text-[#1A1209] dark:text-[#F5F5F0] pb-1 border-b border-[#B8860B]/20 w-fit">{selectedCustomerObj.name}</p>
                       {selectedCustomerObj.gstin && <span className="text-[9px] font-bold bg-[#B8860B] text-white px-2 py-0.5 rounded uppercase">{selectedCustomerObj.gstin}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                       <p className="text-[11px] text-gray-500 font-medium">📱 {selectedCustomerObj.phone}</p>
                       {selectedCustomerObj.email && <p className="text-[11px] text-gray-500 font-medium truncate">✉️ {selectedCustomerObj.email}</p>}
                    </div>
                    {selectedCustomerObj.address && <p className="text-[10px] text-gray-400 mt-1 italic leading-relaxed">{selectedCustomerObj.address}</p>}
                 </div>
              </div>
            )}
          </div>

          <div className="card p-8 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
               <div className="p-1.5 bg-[#B8860B]/10 rounded-lg text-[#B8860B]"><Calculator size={18} /></div>
               <h2 className="text-lg font-serif text-[#1A1209] dark:text-[#F5F5F0]">Registry Meta</h2>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#6B5E4A] dark:text-gray-400 uppercase tracking-widest">Internal Narrative</label>
                <textarea {...register('notes')} className="input-field min-h-[148px] py-3 text-sm italic" placeholder="Add specific details or special instructions..." />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-0 rounded-2xl shadow-xl border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900">
            <h2 className="text-xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">Invoice Items</h2>
            <button 
              type="button" 
              onClick={() => append({ itemName: '', purity: '22K', weightGrams: 0, ratePerGram: 0, makingCharges: 0, amount: 0 })}
              className="px-4 py-2 bg-[#B8860B] hover:bg-[#8B6508] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-[#B8860B]/20 flex items-center gap-2"
            >
              <Plus size={14} /> Add Ornament
            </button>
          </div>
          
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#B8860B] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] w-[35%]">Ornament Item</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-center">Purity</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Net Wt (g)</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Rate / g</th>
                  <th className="px-4 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Making</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Amnt (₹)</th>
                  <th className="px-4 py-4 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                {fields.map((field, index) => (
                  <tr key={field.id} className="group hover:bg-[#FFF8E7]/30 dark:hover:bg-dark-900 transition-colors">
                    <td className="px-6 py-4">
                      <input 
                        {...register(`items.${index}.itemName`)} 
                        className={`w-full bg-transparent border-b-2 ${errors.items?.[index]?.itemName ? 'border-red-400' : 'border-gray-100 dark:border-dark-800'} py-2 text-[#1A1209] dark:text-white font-bold focus:outline-none focus:border-[#B8860B] transition-colors`}
                        placeholder="e.g. Traditional Jhumka..."
                      />
                    </td>
                    <td className="px-4 py-4">
                      <select 
                        {...register(`items.${index}.purity`)} 
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-dark-800 py-2 text-[#B8860B] font-bold text-center focus:outline-none focus:border-[#B8860B]"
                      >
                        <option value="24K">24K (Pure)</option>
                        <option value="22K">22K (Std)</option>
                        <option value="18K">18K</option>
                        <option value="14K">14K</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="number" step="0.001"
                        {...register(`items.${index}.weightGrams`, { valueAsNumber: true })} 
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-dark-800 py-2 text-[#1A1209] dark:text-white font-mono font-bold text-right focus:outline-none focus:border-[#B8860B]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="number" step="1"
                        {...register(`items.${index}.ratePerGram`, { valueAsNumber: true })} 
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-dark-800 py-2 text-[#1A1209] dark:text-white font-mono font-bold text-right focus:outline-none focus:border-[#B8860B]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input 
                        type="number" step="1"
                        {...register(`items.${index}.makingCharges`, { valueAsNumber: true })} 
                        className="w-full bg-transparent border-b-2 border-gray-100 dark:border-dark-800 py-2 text-[#1A1209] dark:text-white font-mono font-bold text-right focus:outline-none focus:border-[#B8860B]"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-[#1A1209] dark:text-white font-bold text-lg font-mono">
                          {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(watchItems[index]?.amount || 0)}
                       </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-2 text-gray-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10 disabled:opacity-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.items && <div className="p-4 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">{errors.items.message || 'Please verify that all line items have valid weights and rates'}</div>}
        </div>

        {/* Totals Section */}
        <div className="flex justify-end gap-6">
           <div className="w-full lg:w-4/12 card p-8 rounded-2xl shadow-2xl bg-white dark:bg-dark-800 border-t-4 border-[#B8860B] space-y-6">
              <div className="space-y-4">
                  <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aggregate Registry</span>
                    <span className="font-bold text-[#1A1209] dark:text-white font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center group">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Adjustment Discount</span>
                       <span className="text-[9px] text-[#B8860B] font-bold">Lumpsum Reduction</span>
                    </div>
                    <div className="relative">
                       <input 
                         type="number" 
                         {...register('discount', { valueAsNumber: true })} 
                         className="w-28 bg-[#FFF8E7]/50 dark:bg-dark-900 border border-[#B8860B]/20 rounded-lg px-3 py-1.5 text-[#1A1209] dark:text-white font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-[#B8860B]"
                       />
                       <span className="absolute right-0 top-0 -mt-2 -mr-1 text-[10px] bg-[#B8860B] text-white px-1.5 rounded-full">₹</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tax Provision</span>
                       <span className="text-[9px] text-[#B8860B] font-bold">Combined GST Calculation</span>
                    </div>
                    <select 
                      {...register('gstPercent', { valueAsNumber: true })} 
                      className="w-28 bg-[#FFF8E7]/50 dark:bg-dark-900 border border-[#B8860B]/20 rounded-lg px-3 py-1.5 text-[#1A1209] dark:text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-[#B8860B]"
                    >
                      <option value={0}>EXEMPT (0%)</option>
                      <option value={1.5}>MIN (1.5%)</option>
                      <option value={3}>STD (3%)</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-t border-gray-50 dark:border-dark-700 pt-4">
                    <span className="uppercase tracking-[0.2em]">Accrued GST</span>
                    <span className="font-mono">{formatCurrency(gstAmount)}</span>
                  </div>
              </div>

              <div className="pt-6 border-t-2 border-gray-100 dark:border-dark-700">
                  <p className="text-[10px] font-bold text-[#9A9A8A] uppercase tracking-[0.4em] mb-1 text-right">Net Final Valuation</p>
                  <div className="flex justify-end items-baseline gap-2">
                     <span className="text-4xl font-bold text-[#1A1209] dark:text-[#F5F5F0] font-mono tracking-tighter">
                        {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(grandTotal)}
                     </span>
                     <span className="text-sm font-bold text-[#B8860B]">INR</span>
                  </div>
              </div>
           </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-6 border-t border-gray-100 dark:border-dark-800 pt-8 mt-4">
          <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 text-gray-400 hover:text-gray-600 font-bold uppercase tracking-[0.2em] text-[10px] transition-all">
            Discard Registry
          </button>
          <button 
             type="submit" 
             disabled={createMutation.isPending || updateMutation.isPending}
             className="bg-[#1A1209] hover:bg-[#B8860B] text-white px-12 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-gold/20 flex items-center gap-3 transition-all"
          >
            {createMutation.isPending || updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditing ? 'Commit Amendments' : 'Generate Registry'}
          </button>
        </div>
      </form>
    </div>
  );
};

