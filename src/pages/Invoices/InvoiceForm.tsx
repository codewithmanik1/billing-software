import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Combobox } from '@headlessui/react';
import { format } from 'date-fns';

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
  date: z.string(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discount: z.number().min(0),
  gstPercent: z.number().min(0),
  notes: z.string().optional()
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

import mjLogo from '../../assets/mj_logo.png';

export const InvoiceForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, invoices, addInvoice, updateInvoice } = useStore();
  
  const isEditing = Boolean(id);
  const existingInvoice = isEditing ? invoices.find(i => i.id === id) : null;

  // Auto generate invoice number
  const nextInvoiceNumber = useMemo(() => {
    if (isEditing && existingInvoice) return existingInvoice.invoiceNumber;
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.invoiceNumber.includes(`INV-${year}`)).length;
    return `INV-${year}-${String(count + 1).padStart(3, '0')}`;
  }, [invoices, isEditing, existingInvoice]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: existingInvoice?.customer.id || '',
      date: existingInvoice ? format(new Date(existingInvoice.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      items: existingInvoice?.items || [{ itemName: '', purity: '22K', weightGrams: 0, ratePerGram: 0, makingCharges: 0, amount: 0 }],
      discount: existingInvoice?.discount || 0,
      gstPercent: existingInvoice?.gstPercent || 3,
      notes: existingInvoice?.notes || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const watchDiscount = watch('discount') || 0;
  const watchGstPercent = watch('gstPercent') || 3;
  const watchDate = watch('date');

  // Real-time calculation
  useEffect(() => {
    watchItems.forEach((item, index) => {
      const amount = (Number(item.weightGrams) * Number(item.ratePerGram)) + Number(item.makingCharges);
      if (item.amount !== amount) {
        setValue(`items.${index}.amount`, amount, { shouldValidate: true });
      }
    });
  }, [JSON.stringify(watchItems), setValue]);

  const subtotal = watchItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const amountAfterDiscount = Math.max(0, subtotal - watchDiscount);
  const gstAmount = (amountAfterDiscount * watchGstPercent) / 100;
  const grandTotal = amountAfterDiscount + gstAmount;

  const [customerQuery, setCustomerQuery] = useState('');
  const filteredCustomers = customerQuery === ''
    ? customers
    : customers.filter((c) => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery));

  const onSubmit = (data: InvoiceFormData) => {
    const selectedCustomer = customers.find(c => c.id === data.customerId);
    if (!selectedCustomer) {
      toast.error('Selected customer not found');
      return;
    }

    const payload = {
      date: new Date(data.date).toISOString(),
      customer: selectedCustomer,
      items: data.items.map(i => ({ ...i, id: i.id || `i-${Date.now()}-${Math.random()}` })),
      subtotal,
      discount: data.discount,
      gstPercent: data.gstPercent,
      gstAmount,
      totalAmount: grandTotal,
      notes: data.notes
    };

    if (isEditing && existingInvoice) {
      // recalculate amounts
      const amountPaid = existingInvoice.amountPaid;
      const pendingAmount = grandTotal - amountPaid;
      let status = existingInvoice.status;
      if (pendingAmount <= 0) status = 'paid';
      else if (amountPaid > 0) status = 'partial';
      else status = 'unpaid';

      updateInvoice(existingInvoice.id, {
        ...payload,
        amountPaid,
        pendingAmount,
        status
      });
      toast.success('Invoice updated successfully');
    } else {
      const invoiceId = `inv-${Date.now()}`;
      addInvoice({
        ...payload,
        id: invoiceId,
        invoiceNumber: nextInvoiceNumber,
        amountPaid: 0,
        pendingAmount: grandTotal,
        status: 'unpaid'
      });
      toast.success('Invoice created successfully');
    }
    navigate('/invoices');
  };

  const selectedCustomerId = watch('customerId');
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);
  const formattedDateForHeader = watchDate ? format(new Date(watchDate), 'dd MMM yyyy') : '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <button type="button" onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <span className="text-gray-500 dark:text-gray-400 font-medium">{isEditing ? 'Editing Invoice' : 'Drafting New Invoice'}</span>
      </div>

      {/* Invoice Letterhead Section */}
      <div className="card p-8 bg-white dark:bg-dark-800">
        <div className="flex items-start justify-between pb-6 border-b border-gray-100 dark:border-dark-700">
          {/* Left: Logo + Shop name */}
          <div className="flex items-center gap-4">
            <img
              src={mjLogo}
              alt="More Jwellers"
              className="w-16 h-16 rounded-xl object-contain flex-shrink-0"
              style={{ background: '#FBF0E4', padding: '3px', border: '1px solid rgba(184,134,11,0.3)' }}
            />
            <div>
              <h2
                className="text-[#B8860B] dark:text-[#FFD700] text-xl font-bold tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                More Jwellers
              </h2>
              <p className="text-gray-500 dark:text-[#9A9A8A] text-xs mt-0.5">Premium Gold & Silver Jewellery</p>
              <p className="text-gray-500 dark:text-[#9A9A8A] text-xs">📞 +91 XXXXX XXXXX</p>
              <p className="text-gray-500 dark:text-[#9A9A8A] text-xs">📍 Your Shop Address, City - PIN</p>
            </div>
          </div>

          {/* Right: Invoice title + number */}
          <div className="text-right">
            <h1
              className="text-[#B8860B] dark:text-[#FFD700] text-3xl font-bold tracking-widest uppercase"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              INVOICE
            </h1>
            <p className="text-gray-900 dark:text-[#F5F5F0] text-sm font-bold mt-1 tracking-widest">{nextInvoiceNumber}</p>
            <p className="text-gray-500 dark:text-[#9A9A8A] text-xs mt-1">Date: {formattedDateForHeader}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-dark-700 pb-2">Customer Details</h2>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Select Customer <span className="text-red-500">*</span></label>
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field }) => (
                      <Combobox value={field.value} onChange={field.onChange}>
                        <div className="relative">
                          <Combobox.Input
                            className="input-field"
                            displayValue={(id: string) => customers.find(c => c.id === id)?.name || ''}
                            onChange={(event) => setCustomerQuery(event.target.value)}
                            placeholder="Search customer..."
                          />
                          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredCustomers.length === 0 && customerQuery !== '' ? (
                              <div className="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400">
                                Nothing found.
                              </div>
                            ) : (
                              filteredCustomers.map((customer) => (
                                <Combobox.Option
                                  key={customer.id}
                                  className={({ active }) => `relative cursor-pointer select-none py-2 pl-4 pr-4 ${active ? 'bg-gold text-dark-900' : 'text-gray-700 dark:text-gray-200'}`}
                                  value={customer.id}
                                >
                                  <div className="font-medium">{customer.name}</div>
                                  <div className={`text-xs ${typeof selectedCustomerId === 'string' ? (selectedCustomerId === customer.id ? 'opacity-80' : 'text-gray-500 dark:text-gray-400') : 'text-gray-500 dark:text-gray-400'}`}>
                                    {customer.phone}
                                  </div>
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    )}
                  />
                  {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>}
               </div>

               {selectedCustomerObj && (
                 <div className="bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-200 dark:border-dark-700 text-sm">
                   <p><span className="text-gray-500 dark:text-gray-400">Phone:</span> {selectedCustomerObj.phone}</p>
                   {selectedCustomerObj.email && <p><span className="text-gray-500 dark:text-gray-400">Email:</span> {selectedCustomerObj.email}</p>}
                   {selectedCustomerObj.address && <p><span className="text-gray-500 dark:text-gray-400">Address:</span> {selectedCustomerObj.address}</p>}
                 </div>
               )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-dark-700 pb-2">Invoice Meta</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                <input type="date" {...register('date')} className="input-field" />
              </div>
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notes / Remarks</label>
                <textarea {...register('notes')} className="input-field min-h-[80px]" placeholder="Thank you for your business!" />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center bg-gray-50 dark:bg-dark-900/50">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Line Items</h2>
            <button 
              type="button" 
              onClick={() => append({ itemName: '', purity: '22K', weightGrams: 0, ratePerGram: 0, makingCharges: 0, amount: 0 })}
              className="px-3 py-1.5 bg-gray-100 dark:bg-dark-700 hover:bg-gray-100 dark:bg-dark-600 text-gold rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium w-1/4">Item Name</th>
                  <th className="px-4 py-3 font-medium w-32">Purity</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">Weight (g)</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">Rate/g (₹)</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">Making Chg (₹)</th>
                  <th className="px-4 py-3 font-medium w-32 text-right">Amount (₹)</th>
                  <th className="px-4 py-3 font-medium w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {fields.map((field, index) => (
                  <tr key={field.id} className="group">
                    <td className="px-4 py-3">
                      <input 
                        {...register(`items.${index}.itemName`)} 
                        className={`w-full bg-white dark:bg-dark-900 border ${errors.items?.[index]?.itemName ? 'border-red-500' : 'border-gray-200 dark:border-dark-700'} rounded-md px-2 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-gold`}
                        placeholder="Gold Necklace"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        {...register(`items.${index}.purity`)} 
                        className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md px-2 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-gold"
                      >
                        <option value="24K">24K</option>
                        <option value="22K">22K</option>
                        <option value="18K">18K</option>
                        <option value="14K">14K</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" step="0.01"
                        {...register(`items.${index}.weightGrams`, { valueAsNumber: true })} 
                        className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md px-2 py-1.5 text-gray-900 dark:text-white text-right focus:outline-none focus:border-gold"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" step="1"
                        {...register(`items.${index}.ratePerGram`, { valueAsNumber: true })} 
                        className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md px-2 py-1.5 text-gray-900 dark:text-white text-right focus:outline-none focus:border-gold"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input 
                        type="number" step="1"
                        {...register(`items.${index}.makingCharges`, { valueAsNumber: true })} 
                        className="w-full bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md px-2 py-1.5 text-gray-900 dark:text-white text-right focus:outline-none focus:border-gold"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(watchItems[index]?.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1.5 text-gray-500 hover:text-red-500 transition-colors rounded hover:bg-gray-100 dark:bg-dark-700 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.items && <div className="p-3 text-red-500 text-sm">{errors.items.message || 'Please check line items for errors'}</div>}
        </div>

        {/* Totals Section */}
        <div className="flex justify-end">
          <div className="w-full md:w-1/3 card p-6 space-y-4">
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium">Subtotal</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium">Discount (₹)</span>
              <input 
                type="number" 
                {...register('discount', { valueAsNumber: true })} 
                className="w-24 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md px-2 py-1 text-gray-900 dark:text-white text-right focus:outline-none focus:border-gold"
              />
            </div>
            
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium">GST (%)</span>
              <select 
                {...register('gstPercent', { valueAsNumber: true })} 
                className="w-24 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-md px-2 py-1 text-gray-900 dark:text-white text-right focus:outline-none focus:border-gold"
              >
                <option value={0}>0%</option>
                <option value={1.5}>1.5%</option>
                <option value={3}>3%</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 text-sm">
              <span>GST Amount</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(gstAmount)}</span>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-dark-700 flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white font-serif">Grand Total</span>
              <span className="text-2xl font-bold text-gold">₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 border-t border-gray-200 dark:border-dark-700 pt-6">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">
            Cancel
          </button>
          <button type="submit" className="btn-primary px-8 flex items-center gap-2">
            <Save size={20} />
            <span>{isEditing ? 'Update Invoice' : 'Save Invoice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
