import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Save, Trash2, Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Combobox } from '@headlessui/react';
import { format } from 'date-fns';
import mjLogo from '../../assets/mj_logo.png';
import { useProfile } from '../../context/ProfileContext';
import { useEnterKeyNavigation } from '../../lib/useEnterKeyNavigation';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { RecordCollectionModal } from '../../components/RecordCollectionModal';
import type { PaymentFormData } from '../../components/RecordCollectionModal';

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Item name required'),
  metalType: z.enum(['24K', '22K', '18K', '14K']),
  weightGrams: z.number().min(0.01, 'Weight > 0'),
  ratePerGram: z.number().min(1, 'Rate > 0'),
  makingCharges: z.number().min(0, 'Cannot be negative'),
  discount: z.number().nonnegative(),
  lineTotal: z.number()
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
  const { profile } = useProfile();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<InvoiceFormData | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEnterKeyNavigation(formRef, () => {
    handleSubmit((data) => {
      setPendingData(data);
      setIsConfirmOpen(true);
    })();
  });

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

  const { register, handleSubmit, control, watch, setValue, reset } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      invoiceDate: format(new Date(), 'yyyy-MM-dd'),
      items: [{ description: '', metalType: '22K', weightGrams: 0, ratePerGram: 0, makingCharges: 0, discount: 0, lineTotal: 0 }],
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
        items: existingInvoice.items.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          description: (item.description as string) || '',
          metalType: (item.metalType as string) || '22K',
          weightGrams: Number(item.weightGrams) || 0,
          ratePerGram: Number(item.ratePerGram) || 0,
          makingCharges: Number(item.makingCharges) || 0,
          discount: Number(item.discount || 0),
          lineTotal: Number(item.lineTotal || item.amount || 0)
        })),
        discount: Number(existingInvoice.additionalDiscount || existingInvoice.discount || 0),
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
  const watchGstPercent = watch('gstPercent') ?? 3;
  const watchDate = watch('invoiceDate');

  // Real-time calculation
  useEffect(() => {
    watchItems.forEach((item, index) => {
      if (!item) return;
      const weight = parseFloat(String(item.weightGrams)) || 0;
      const rate = parseFloat(String(item.ratePerGram)) || 0;
      const making = parseFloat(String(item.makingCharges)) || 0;
      const disc = parseFloat(String(item.discount)) || 0;
      const lineTotal = (weight * rate) + making - disc;
      
      if (item.lineTotal !== lineTotal) {
        setValue(`items.${index}.lineTotal`, lineTotal, { shouldValidate: true });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchItems.map(i => `${i?.weightGrams}-${i?.ratePerGram}-${i?.makingCharges}-${i?.discount}`).join(','), setValue]);

  const subtotal = watchItems.reduce((sum, item) => sum + (Number(item?.lineTotal) || 0), 0);
  const amountAfterDiscount = Math.max(0, subtotal - Number(watchDiscount));
  const gstAmount = (amountAfterDiscount * Number(watchGstPercent)) / 100;
  const grandTotal = amountAfterDiscount + gstAmount;

  // Auto-update payment amount when grandTotal changes
  useEffect(() => {
    if (paymentData) {
      setPaymentData(prev => prev ? { ...prev, amount: grandTotal } : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.post('/invoices', data),
    retry: false,
    onSuccess: async (res) => {
      const newInvoiceId = res.data?.data?.id;

      // If payment data was filled, call the record collection API after invoice is created
      if (paymentData && newInvoiceId) {
        try {
          await api.post('/payments', { ...paymentData, invoiceId: newInvoiceId });
          toast.success('Invoice generated & payment recorded successfully');
        } catch {
          toast.error('Invoice saved but payment recording failed. You can record payment from the invoice detail page.');
        }
      } else {
        toast.success('Invoice generated successfully');
      }

      setPaymentData(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      navigate('/invoices');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to create invoice'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      toast.success('Invoice updated successfully');
      navigate(`/invoices/${id}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to update invoice'),
  });

  const onSubmit = (data: InvoiceFormData) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (pendingData) {
      // Validate payment amount doesn't exceed invoice total
      if (paymentData && paymentData.amount > grandTotal) {
        toast.error(`Payment amount (₹${formatCurrency(paymentData.amount)}) exceeds invoice total (₹${formatCurrency(grandTotal)}). Please correct the payment details.`);
        return;
      }
      if (isEditing) {
        updateMutation.mutate(pendingData);
      } else {
        createMutation.mutate(pendingData);
      }
    }
  };

  const selectedCustomerId = watch('customerId');
  const selectedCustomerObj = customers.find((c: Record<string, unknown>) => c.id === selectedCustomerId) || existingInvoice?.customer;
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

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Letterhead Preview Section */}
        <div className="card p-4 md:p-8 bg-white dark:bg-[#1A1A1A] shadow-xl rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-100 dark:border-dark-800 gap-6">
           <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left w-full md:w-auto">
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-[#B8860B]/10 blur-xl group-hover:blur-2xl transition-all duration-500" />
                <img
                  src={mjLogo}
                  alt="More Jewellers"
                  onError={(e) => {
                    e.currentTarget.src = '/mj_logo.png';
                  }}
                  className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain bg-white p-2 shadow-inner border border-gray-100"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-[#B8860B] text-2xl font-bold uppercase tracking-tight">{profile.name}</h2>
                <div className="text-[10px] space-y-0.5">
                   <p className="text-gray-500 uppercase font-bold tracking-widest">{profile.tagline}</p>
                   <p className="text-gray-400 font-medium">Mob: {profile.phone} &nbsp;|&nbsp; {profile.email}</p>
                   <p className="text-gray-400 font-medium">{profile.address}</p>
                </div>
              </div>
           </div>

           <div className="w-full text-center md:text-right mt-4 md:mt-0">
              <h1 className="text-2xl md:text-3xl font-black text-[#B8860B] leading-none mb-2">INVOICE</h1>
              <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white font-mono tracking-tighter">
                 {isEditing ? existingInvoice?.invoiceNumber : 'INV-2024-001'}
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Date: {formattedDateForHeader || '15 Mar 2026'}</p>
           </div>
        </div>

        {/* Header Information */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          <div className="lg:col-span-3 card p-4 md:p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100 dark:border-dark-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customer Details</h2>
            
            <div className="space-y-6">
               <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Select Customer <span className="text-red-500">*</span></label>
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field }) => (
                      <Combobox value={field.value} onChange={field.onChange}>
                        <div className="relative">
                          <Combobox.Input
                            data-field-order="1"
                            className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#B8860B]/20 outline-none transition-all"
                            displayValue={(id: string) => customers.find((c: Record<string, unknown>) => c.id === id)?.name as string || existingInvoice?.customer.name || ''}
                            onChange={(event) => setCustomerQuery(event.target.value)}
                            placeholder="Rajesh Sharma"
                          />
                          <Combobox.Options className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 py-1 text-base shadow-2xl">
                            {/* ... same customers map ... */}
                            {customers.map((customer: Record<string, string>) => (
                                <Combobox.Option key={customer.id} className={({ active }) => `relative cursor-pointer select-none py-3 pl-4 pr-4 ${active ? 'bg-[#B8860B]/10 text-[#B8860B]' : 'text-gray-700 animate-in fade-in transition-all'}`} value={customer.id}>
                                  <div className="font-bold">{customer.name}</div>
                                </Combobox.Option>
                            ))}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    )}
                  />
               </div>

               {selectedCustomerObj ? (
                 <div className="bg-gray-50 dark:bg-dark-900 p-6 rounded-2xl space-y-2 border border-blue-50/50">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Phone: <span className="font-bold text-gray-900 dark:text-white ml-2">{selectedCustomerObj.phone}</span></p>
                    {selectedCustomerObj.address && <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Address: <span className="font-bold text-gray-900 dark:text-white ml-2">{selectedCustomerObj.address}</span></p>}
                 </div>
               ) : (
                 <div className="h-28 bg-gray-50 dark:bg-dark-900 rounded-2xl flex items-center justify-center border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium italic">Select a customer to view more details</p>
                 </div>
               )}
            </div>
          </div>

          <div className="lg:col-span-2 card p-4 md:p-8 rounded-2xl shadow-xl space-y-6 border border-gray-100 dark:border-dark-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invoice Meta</h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Date <span className="text-red-500">*</span></label>
                  <input data-field-order="2" type="date" {...register('invoiceDate')} className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#B8860B]/20 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Notes / Remarks</label>
                <textarea data-field-order="3" {...register('notes')} className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#B8860B]/20 outline-none h-24 italic" placeholder="Thank you for your business!" />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-0 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-800 overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-dark-800 flex justify-between items-center bg-white dark:bg-dark-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Line Items</h2>
            <button 
              type="button" 
              onClick={() => append({ description: '', metalType: '22K', weightGrams: 0, ratePerGram: 0, makingCharges: 0, discount: 0, lineTotal: 0 })}
              className="px-4 py-2 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto shadow-[inset_-15px_0_15px_-15px_rgba(184,134,11,0.15)] md:shadow-none min-h-[300px]">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800">
                <tr>
                  <th className="py-4 pl-6 pr-2 font-bold text-gray-500 uppercase tracking-widest text-[10px] whitespace-normal max-w-[120px]" style={{ width: '35%' }}>Item Name</th>
                  <th className="py-4 px-1 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center whitespace-normal" style={{ width: '8%' }}>Purity</th>
                  <th className="py-4 px-1 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center whitespace-normal" style={{ width: '12%' }}>Weight (g)</th>
                  <th className="py-4 px-1 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center whitespace-normal" style={{ width: '12%' }}>Rate/g (₹)</th>
                  <th className="py-4 px-1 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-center whitespace-normal" style={{ width: '12%' }}>Making (₹)</th>
                  <th className="py-4 pl-1 pr-4 font-bold text-gray-500 uppercase tracking-widest text-[10px] text-right whitespace-normal" style={{ width: '13%' }}>Amount (₹)</th>
                  <th className="py-4 px-1 text-center" style={{ width: '8%' }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                {fields.map((field, index) => (
                  <tr key={field.id} className="bg-white dark:bg-dark-900 transition-colors">
                    <td className="pl-6 pr-2 py-4">
                      <input
                        data-field-order={10 + index * 10 + 1}
                        {...register(`items.${index}.description`)}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                        placeholder="18K Gold Earrings"
                      />
                    </td>
                    <td className="px-1 py-4">
                      <select
                        data-field-order={10 + index * 10 + 2}
                        {...register(`items.${index}.metalType`)}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-0 py-2 text-gray-900 dark:text-white font-bold text-center appearance-none focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                      >
                        <option value="24K">24K</option>
                        <option value="22K">22K</option>
                        <option value="18K">18K</option>
                        <option value="14K">14K</option>
                      </select>
                    </td>
                    <td className="px-1 py-4">
                      <input
                        data-field-order={10 + index * 10 + 3}
                        type="number" step="0.001"
                        {...register(`items.${index}.weightGrams`, { valueAsNumber: true })}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-mono text-center focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                      />
                    </td>
                    <td className="px-1 py-4">
                      <input
                        data-field-order={10 + index * 10 + 4}
                        type="number" step="1"
                        {...register(`items.${index}.ratePerGram`, { valueAsNumber: true })}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-mono text-center focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                      />
                    </td>
                    <td className="px-1 py-4">
                      <input
                        data-field-order={10 + index * 10 + 5}
                        type="number" step="1"
                        {...register(`items.${index}.makingCharges`, { valueAsNumber: true })}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-mono text-center focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                      />
                    </td>
                    <td className="pl-1 pr-4 py-4 text-right">
                       <span className="text-gray-900 dark:text-white font-black text-sm font-mono tracking-tighter">
                          {formatCurrency(watchItems[index]?.lineTotal || 0)}
                       </span>
                    </td>
                    <td className="px-1 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="py-3 px-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 disabled:opacity-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end">
           <div className="w-full lg:w-4/12 card p-5 md:p-8 rounded-2xl shadow-xl bg-gray-50/50 dark:bg-dark-900 border border-gray-100 dark:border-dark-800 space-y-4">
              <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500 uppercase tracking-widest">Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">₹{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Discount (₹)</span>
                    <input 
                      data-field-order="1000000"
                      type="number" 
                      {...register('discount', { valueAsNumber: true })} 
                      className="w-20 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1 text-[#1A1209] dark:text-white font-mono font-bold text-right focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">GST (%)</span>
                    <input 
                      data-field-order="1000001"
                      type="number" 
                      {...register('gstPercent', { valueAsNumber: true })} 
                      className="w-20 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1 text-[#1A1209] dark:text-white font-mono font-bold text-right focus:ring-1 focus:ring-[#B8860B]/40 outline-none"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500 font-bold border-t border-gray-200 dark:border-dark-800 pt-3">
                    <span className="uppercase tracking-widest text-[10px]">GST Amount</span>
                    <span className="font-mono">₹{formatCurrency(gstAmount)}</span>
                  </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-200 dark:border-dark-800">
                  <div className="flex justify-between items-baseline group">
                     <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Grand Total</span>
                     <span className="text-2xl font-black text-[#B8860B] font-mono tracking-tighter">
                        ₹{formatCurrency(grandTotal)}
                     </span>
                  </div>
              </div>
           </div>
        </div>

        {/* Record Collection Section (only for new invoices) */}
        {!isEditing && (
          <div className="flex justify-end">
            <div className="w-full lg:w-4/12 card p-5 md:p-8 rounded-2xl shadow-xl bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Payment Collection</h2>
                {paymentData && (
                  <button
                    type="button"
                    onClick={() => setPaymentData(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove payment"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {paymentData ? (
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span className="font-bold text-green-600 font-mono">₹{formatCurrency(paymentData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Mode:</span>
                    <span className="font-bold">{paymentData.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span className="font-bold">{format(new Date(paymentData.paymentDate), 'dd MMM yyyy')}</span>
                  </div>
                  {paymentData.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">Ref:</span>
                      <span className="font-bold font-mono">{paymentData.referenceNumber}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full mt-2 px-4 py-2 bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold transition-all"
                  >
                    Edit Payment Details
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full px-4 py-3 bg-[#B8860B]/10 hover:bg-[#B8860B]/20 text-[#B8860B] rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-[#B8860B]/20"
                >
                  <IndianRupee size={14} /> Record Collection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col-reverse md:flex-row justify-end gap-3 mt-8">
          <button type="button" onClick={() => navigate(-1)} className="w-full md:w-auto px-10 py-3 md:py-3.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs md:text-sm uppercase tracking-widest transition-all min-h-[52px]">
            Cancel
          </button>
          <button
             type="submit"
             disabled={createMutation.isPending || updateMutation.isPending}
             className="w-full md:w-auto justify-center bg-[#B8860B] hover:bg-[#8B6508] text-white px-10 py-3 md:py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-[#B8860B]/20 transition-all min-h-[52px]"
          >
            {createMutation.isPending || updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </form>

      {/* Record Collection Modal (only for new invoices) */}
      {!isEditing && (
        <RecordCollectionModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          balanceDue={grandTotal}
          onSubmit={(data) => {
            setPaymentData(data);
            setIsPaymentModalOpen(false);
            toast.success('Payment details saved. Will be recorded when invoice is saved.');
          }}
          formatCurrency={(val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={isEditing ? 'Update Invoice' : 'Save Invoice'}
        message={isEditing ? 'Are you sure you want to update this invoice? This will override existing records.' : 'Are you sure you want to save and generate this invoice?'}
        confirmText={isEditing ? 'Update' : 'Save'}
        cancelText="Cancel"
      />
    </div>
  );
};

