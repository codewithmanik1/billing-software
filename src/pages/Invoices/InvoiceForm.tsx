import React, { useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Save, Trash2, Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Combobox, Transition } from '@headlessui/react';
import { format } from 'date-fns';
import mjLogo from '../../assets/mj_logo.png';
import { useProfile } from '../../context/ProfileContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// ─── Zod Schemas ───────────────────────────────────────────────────────────────
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Item name required'),
  metalType: z.enum(['24K', '22K', '18K', '14K', 'Silver']),
  weightGrams: z.number().min(0.001, 'Weight > 0'),
  ratePerGram: z.number().min(0, 'Rate >= 0'),
  makingCharges: z.number().min(0, 'Cannot be negative'),
  discount: z.number().nonnegative(),
  lineTotal: z.number(),
});

const paymentSchema = z.object({
  paymentDate: z.string(),
  amount: z.number().min(0.01, 'Amount > 0'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'OLD_GOLD']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  invoiceDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  payments: z.array(paymentSchema),
  discount: z.number().nonnegative(),
  gstPercent: z.number().nonnegative(),
  notes: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ─── Utility ───────────────────────────────────────────────────────────────────
const fmt = (val: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

const PURITY_OPTIONS = ['24K', '22K', '18K', '14K', 'Silver'] as const;
const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OLD_GOLD', label: 'Old Gold' },
] as const;

// ─── Focus helpers ─────────────────────────────────────────────────────────────
const focusField = (order: number | string, delay = 0) => {
  setTimeout(() => {
    const el = document.querySelector(`[data-fo="${order}"]`) as HTMLElement | null;
    el?.focus();
  }, delay);
};

const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

// ─── Component ─────────────────────────────────────────────────────────────────
export const InvoiceForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [customerQuery, setCustomerQuery] = useState('');
  const { profile } = useProfile();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<InvoiceFormData | null>(null);

  // ── RHF setup ──────────────────────────────────────────────────────────────
  const { register, handleSubmit, control, watch, setValue, reset } =
    useForm<InvoiceFormData>({
      resolver: zodResolver(invoiceSchema),
      defaultValues: {
        customerId: '',
        invoiceDate: format(new Date(), 'yyyy-MM-dd'),
        items: [
          {
            description: '',
            metalType: '22K',
            weightGrams: 0,
            ratePerGram: 0,
            makingCharges: 0,
            discount: 0,
            lineTotal: 0,
          },
        ],
        payments: [],
        discount: 0,
        gstPercent: 0,
        notes: '',
      },
    });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: 'items' });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({ control, name: 'payments' });

  // ── Queries ────────────────────────────────────────────────────────────────
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
  const customers: any[] = customersRes?.data?.customers || [];

  // ── Load existing invoice ─────────────────────────────────────────────────
  useEffect(() => {
    if (existingInvoice) {
      reset({
        customerId: existingInvoice.customerId,
        invoiceDate: format(new Date(existingInvoice.invoiceDate), 'yyyy-MM-dd'),
        items: existingInvoice.items.map((item: any) => ({
          id: item.id,
          description: item.description || '',
          metalType: item.metalType || '22K',
          weightGrams: Number(item.weightGrams) || 0,
          ratePerGram: Number(item.ratePerGram) || 0,
          makingCharges: Number(item.makingCharges) || 0,
          discount: Number(item.discount || 0),
          lineTotal: Number(item.lineTotal || item.amount || 0),
        })),
        discount: Number(
          existingInvoice.additionalDiscount || existingInvoice.discount || 0
        ),
        gstPercent: Number(existingInvoice.gstPercent),
        notes: existingInvoice.notes || '',
      });
    }
  }, [existingInvoice, reset]);

  // ── Live calculations ─────────────────────────────────────────────────────
  const watchItems = watch('items') || [];
  const watchPayments = watch('payments') || [];
  const watchDiscount = Number(watch('discount')) || 0;
  const watchGstPercent = Number(watch('gstPercent')) ?? 3;
  const watchDate = watch('invoiceDate');

  useEffect(() => {
    watchItems.forEach((item, index) => {
      if (!item) return;
      const w = parseFloat(String(item.weightGrams)) || 0;
      const r = parseFloat(String(item.ratePerGram)) || 0;
      const m = parseFloat(String(item.makingCharges)) || 0;
      const d = parseFloat(String(item.discount)) || 0;
      const lt = w * r + m - d;
      if (item.lineTotal !== lt)
        setValue(`items.${index}.lineTotal`, lt, { shouldValidate: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchItems
      .map((i) => `${i?.weightGrams}-${i?.ratePerGram}-${i?.makingCharges}-${i?.discount}`)
      .join(','),
    setValue,
  ]);

  const subtotal = watchItems.reduce((s, i) => s + (Number(i?.lineTotal) || 0), 0);
  const afterDiscount = Math.max(0, subtotal - watchDiscount);
  const gstAmount = (afterDiscount * watchGstPercent) / 100;
  const grandTotal = afterDiscount + gstAmount;
  const totalCollected = watchPayments.reduce((s, p) => s + (Number(p?.amount) || 0), 0);
  const balanceRemaining = Math.max(0, grandTotal - totalCollected);

  // ── Auto-focus customer on mount ──────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => focusField('cust'), 300);
    return () => clearTimeout(t);
  }, []);

  // ── Customer selection ─────────────────────────────────────────────────────
  const selectedCustomerId = watch('customerId');
  const selectedCustomerObj =
    customers.find((c) => c.id === selectedCustomerId) ||
    existingInvoice?.customer;

  const formattedDateForHeader = watchDate
    ? format(new Date(watchDate + 'T00:00:00'), 'dd MMM yyyy')
    : '';

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/invoices', data),
    retry: false,
    onSuccess: async (res) => {
      const newId = res.data?.data?.id;
      if (pendingData?.payments?.length && newId) {
        let sc = 0,
          fc = 0;
        for (const p of pendingData.payments) {
          try {
            await api.post('/payments', { ...p, invoiceId: newId });
            sc++;
          } catch {
            fc++;
          }
        }
        if (fc === 0)
          toast.success(`Invoice generated & ${sc} payment(s) recorded`);
        else toast.warning(`Invoice saved but ${fc} payment(s) failed.`);
      } else {
        toast.success('Invoice generated successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      navigate('/invoices');
    },
    onError: (err: any) => {
      const apiMsg = err.response?.data?.message || err.message || 'Failed to create invoice';
      const issues = err.response?.data?.errors;
      const detail = issues ? ' — ' + issues.map((e: any) => `${e.field}: ${e.message}`).join(', ') : '';
      console.error('[InvoiceForm] Create failed:', err.response?.data);
      toast.error(apiMsg + detail, { duration: 8000 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      toast.success('Invoice updated successfully');
      navigate(`/invoices/${id}`);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update invoice'),
  });

  const onSubmit = (data: InvoiceFormData) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (!pendingData) return;
    if (totalCollected > grandTotal + 0.01) {
      toast.error('Total collected exceeds grand total. Please adjust.');
      return;
    }
    const { payments, discount, items, ...rest } = pendingData;

    // Sanitize items — API expects no lineTotal / id / extra fields
    const sanitizedItems = items.map(({ description, metalType, weightGrams, ratePerGram, makingCharges, discount: itemDiscount }) => ({
      description,
      metalType,
      weightGrams: Number(weightGrams) || 0,
      ratePerGram: Number(ratePerGram) || 0,
      makingCharges: Number(makingCharges) || 0,
      discount: Number(itemDiscount) || 0,
    }));

    const invoicePayload = {
      ...rest,
      items: sanitizedItems,
      additionalDiscount: Number(discount) || 0,
    };

    console.log('[InvoiceForm] Submitting payload:', JSON.stringify(invoicePayload, null, 2));

    if (isEditing) updateMutation.mutate(invoicePayload as any);
    else createMutation.mutate(invoicePayload as any);
  };

  // ── Keyboard helper for Enter-key on a field ───────────────────────────────
  const onEnter =
    (nextOrder: number | string) =>
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          focusField(nextOrder);
        }
      };

  // ── Keyboard: Making field of last row → add new row ──────────────────────
  const onMakingKeyDown = (index: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === itemFields.length - 1) {
        appendItem({
          description: '',
          metalType: '22K',
          weightGrams: 0,
          ratePerGram: 0,
          makingCharges: 0,
          discount: 0,
          lineTotal: 0,
        });
        focusField(`item-${index + 1}-desc`, 60);
      } else {
        focusField(`item-${index + 1}-desc`);
      }
    }
  };

  // ── Keyboard: payment ref → if balance still remaining go to next payment amount ──
  const onPaymentRefKeyDown = (index: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (balanceRemaining > 0.01) {
        appendPayment({
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          amount: balanceRemaining,
          paymentMode: 'CASH',
        });
        focusField(`pay-${index + 1}-amount`, 60);
      } else {
        focusField('remarks');
      }
    }
  };

  if (isEditing && isLoadingInvoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#B8860B] animate-spin mb-4" />
        <p className="text-[#6B5E4A] font-serif italic">Retrieving invoice draft…</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 hover:bg-[#B8860B]/10 rounded-xl transition-all text-gray-400 hover:text-[#B8860B]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-serif text-[#1A1209] dark:text-[#F5F5F0]">
          {isEditing ? 'Edit Invoice' : 'New Invoice'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        {/* ── SECTION 1: Letterhead ─────────────────────────────────────────── */}
        <div className="card p-4 md:p-8 bg-white dark:bg-[#1A1A1A] shadow-xl rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-100 dark:border-dark-800 gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left w-full md:w-auto">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-[#B8860B]/10 blur-xl group-hover:blur-2xl transition-all duration-500" />
              <img
                src={mjLogo}
                alt="More Jewellers"
                onError={(e) => { e.currentTarget.src = '/mj_logo.png'; }}
                className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain bg-white p-2 shadow-inner border border-gray-100"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-[#B8860B] text-2xl font-serif font-bold uppercase tracking-tight">
                {profile.name}
              </h2>
              <div className="text-[10px] space-y-0.5">
                <p className="text-gray-500 uppercase font-bold tracking-widest">{profile.tagline}</p>
                <p className="text-gray-400 font-medium">
                  Mob: {profile.phone}&nbsp;|&nbsp;{profile.email}
                </p>
                <p className="text-gray-400 font-medium">{profile.address}</p>
              </div>
            </div>
          </div>
          <div className="w-full text-center md:text-right mt-4 md:mt-0">
            <h1 className="text-2xl md:text-3xl font-black font-serif text-[#B8860B] leading-none mb-2">
              INVOICE
            </h1>
            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white font-mono tracking-tighter">
              {isEditing
                ? existingInvoice?.invoiceNumber
                : `INV-DRAFT-${new Date().getFullYear()}`}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Date: {formattedDateForHeader}
            </p>
          </div>
        </div>

        {/* ── SECTION 2: Customer + Date — single row ───────────────────────── */}
        <div className="card p-4 md:p-6 bg-white dark:bg-[#1A1A1A] shadow-xl rounded-2xl border border-gray-100 dark:border-dark-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
            {/* Customer combobox — takes 2/3 */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Customer <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="customerId"
                render={({ field }) => (
                  <Combobox
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      // Jump to date after selection
                      focusField('date', 60);
                    }}
                  >
                    <div className="relative">
                      <Combobox.Input
                        data-fo="cust"
                        className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#B8860B]/30 outline-none transition-all"
                        displayValue={(cid: string) =>
                          customers.find((c) => c.id === cid)?.name ||
                          existingInvoice?.customer?.name ||
                          ''
                        }
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        placeholder="Type customer name…"
                        onKeyDown={(e) => {
                          // Arrow navigation is handled by HeadlessUI Combobox natively
                          // We only intercept Tab to jump to date
                          if (e.key === 'Tab' && !e.shiftKey) {
                            // allow default Tab — date input is next in DOM
                          }
                        }}
                      />
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Combobox.Options className="absolute z-40 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 py-1 shadow-2xl">
                          {customers.length === 0 && (
                            <p className="px-4 py-3 text-xs text-gray-400 italic">
                              No customers found
                            </p>
                          )}
                          {customers.map((c: any) => (
                            <Combobox.Option
                              key={c.id}
                              value={c.id}
                              className={({ active }) =>
                                `cursor-pointer select-none py-3 px-4 flex justify-between items-center ${active
                                  ? 'bg-[#B8860B]/10 text-[#B8860B]'
                                  : 'text-gray-700 dark:text-gray-200'
                                }`
                              }
                            >
                              <span className="font-bold">{c.name}</span>
                              <span className="text-xs text-gray-400 font-mono">{c.phone}</span>
                            </Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </Transition>
                    </div>

                    {/* Inline customer detail pills */}
                    {selectedCustomerObj && (
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                        <span>
                          📞{' '}
                          <span className="font-semibold text-gray-600 dark:text-gray-300">
                            {selectedCustomerObj.phone}
                          </span>
                        </span>
                        {selectedCustomerObj.address && (
                          <span>
                            📍{' '}
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                              {selectedCustomerObj.address}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </Combobox>
                )}
              />
            </div>

            {/* Date — takes 1/3 */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                data-fo="date"
                type="date"
                {...register('invoiceDate')}
                onKeyDown={onEnter('item-0-desc')}
                className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Line Items ─────────────────────────────────────────── */}
        <div className="card p-0 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-800 overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-dark-800 flex justify-between items-center bg-white dark:bg-dark-900">
            <h2 className="text-lg font-bold font-serif text-gray-900 dark:text-white">
              Line Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800">
                <tr>
                  <th className="py-4 pl-6 pr-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest" style={{ width: '30%' }}>
                    Item Name
                  </th>
                  <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center" style={{ width: '9%' }}>
                    Purity
                  </th>
                  <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center" style={{ width: '12%' }}>
                    Weight (g)
                  </th>
                  <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center" style={{ width: '13%' }}>
                    Rate/g (₹)
                  </th>
                  <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center" style={{ width: '13%' }}>
                    Making (₹)
                  </th>
                  <th className="py-4 pl-2 pr-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right" style={{ width: '15%' }}>
                    Amount (₹)
                  </th>
                  <th style={{ width: '8%' }} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-800">
                {itemFields.map((field, index) => (
                  <tr
                    key={field.id}
                    className="bg-white dark:bg-dark-900 hover:bg-[#FFF8EC] dark:hover:bg-dark-800 transition-colors"
                  >
                    {/* Item Name */}
                    <td className="pl-6 pr-2 py-3">
                      <input
                        data-fo={`item-${index}-desc`}
                        {...register(`items.${index}.description`)}
                        onKeyDown={onEnter(`item-${index}-purity`)}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                        placeholder="e.g. 22K Gold Chain"
                      />
                    </td>

                    {/* Purity */}
                    <td className="px-1 py-3">
                      <select
                        data-fo={`item-${index}-purity`}
                        {...register(`items.${index}.metalType`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            focusField(`item-${index}-weight`);
                          }
                        }}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-bold text-center appearance-none focus:ring-2 focus:ring-[#B8860B]/30 outline-none cursor-pointer"
                      >
                        {PURITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>

                    {/* Weight */}
                    <td className="px-1 py-3">
                      <input
                        data-fo={`item-${index}-weight`}
                        type="number"
                        step="0.001"
                        {...register(`items.${index}.weightGrams`, { valueAsNumber: true })}
                        onFocus={selectOnFocus}
                        onKeyDown={onEnter(`item-${index}-rate`)}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-mono text-center focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                      />
                    </td>

                    {/* Rate */}
                    <td className="px-1 py-3">
                      <input
                        data-fo={`item-${index}-rate`}
                        type="number"
                        step="1"
                        {...register(`items.${index}.ratePerGram`, { valueAsNumber: true })}
                        onFocus={selectOnFocus}
                        onKeyDown={onEnter(`item-${index}-making`)}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-mono text-center focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                      />
                    </td>

                    {/* Making */}
                    <td className="px-1 py-3">
                      <input
                        data-fo={`item-${index}-making`}
                        type="number"
                        step="1"
                        {...register(`items.${index}.makingCharges`, { valueAsNumber: true })}
                        onFocus={selectOnFocus}
                        onKeyDown={onMakingKeyDown(index)}
                        className="w-full bg-gray-50 dark:bg-dark-800 rounded-lg px-1 py-2 text-gray-900 dark:text-white font-mono text-center focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                      />
                    </td>

                    {/* Amount — read-only */}
                    <td className="pl-2 pr-4 py-3 text-right">
                      <span className="font-black text-sm font-mono tracking-tighter text-gray-900 dark:text-white">
                        {fmt(watchItems[index]?.lineTotal || 0)}
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="px-1 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={itemFields.length === 1}
                        className="py-3 px-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 disabled:opacity-0 focus:ring-2 focus:ring-[#B8860B]/20 outline-none"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Item row */}
          <div className="border-t border-gray-50 dark:border-dark-800 bg-white dark:bg-dark-900 px-4 py-3">
            <button
              type="button"
              onClick={() =>
                appendItem({
                  description: '',
                  metalType: '22K',
                  weightGrams: 0,
                  ratePerGram: 0,
                  makingCharges: 0,
                  discount: 0,
                  lineTotal: 0,
                })
              }
              className="w-full py-2 text-xs font-bold uppercase tracking-widest text-[#B8860B] hover:bg-[#B8860B]/5 rounded-lg flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-[#B8860B]/20 outline-none"
            >
              <Plus size={14} /> Add Another Item
            </button>
          </div>
        </div>

        {/* ── SECTION 5: Payment Collection — full width, directly below Line Items ── */}
        {!isEditing && (
          <div className="card p-0 rounded-2xl shadow-xl border border-[#B8860B]/10 bg-white dark:bg-dark-900 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-[#B8860B]/5 border-b border-[#B8860B]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IndianRupee size={15} className="text-[#B8860B]" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">
                  Payment Collection
                </h2>
                <span className="text-[10px] text-gray-400 italic ml-1">(optional)</span>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Bal. Remaining</p>
                <p className={`text-sm font-black font-mono ${balanceRemaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {balanceRemaining > 0 ? `₹${fmt(balanceRemaining)}` : '✅ Fully Paid'}
                </p>
              </div>
            </div>

            {paymentFields.length > 0 ? (
              <>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-3 px-6 py-2 bg-gray-50 dark:bg-dark-900 border-b border-gray-100 dark:border-dark-800">
                  {['Amount (₹)', 'Method', 'Date', 'Ref / TID', ''].map((h) => (
                    <span key={h} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</span>
                  ))}
                </div>

                {/* Payment rows */}
                {paymentFields.map((pf, idx) => (
                  <div
                    key={pf.id}
                    className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-3 items-center px-6 py-3 border-b border-gray-50 dark:border-dark-800 last:border-0 hover:bg-[#FFF8EC] dark:hover:bg-dark-800/30 transition-colors"
                  >
                    <input
                      data-fo={`pay-${idx}-amount`}
                      type="number"
                      step="0.01"
                      {...register(`payments.${idx}.amount`, { valueAsNumber: true })}
                      onFocus={selectOnFocus}
                      onKeyDown={onEnter(`pay-${idx}-mode`)}
                      className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-sm font-black text-green-600 font-mono focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                    />
                    <select
                      data-fo={`pay-${idx}-mode`}
                      {...register(`payments.${idx}.paymentMode`)}
                      onKeyDown={onEnter(`pay-${idx}-date`)}
                      className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-[#B8860B]/30 outline-none cursor-pointer"
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <input
                      data-fo={`pay-${idx}-date`}
                      type="date"
                      {...register(`payments.${idx}.paymentDate`)}
                      onKeyDown={onEnter(`pay-${idx}-ref`)}
                      className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-2 text-xs font-semibold focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                    />
                    <input
                      data-fo={`pay-${idx}-ref`}
                      type="text"
                      {...register(`payments.${idx}.referenceNumber`)}
                      onKeyDown={onPaymentRefKeyDown(idx)}
                      className="w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-2 text-[11px] font-mono uppercase focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                      placeholder="TXN / UPI Ref"
                    />
                    <button
                      type="button"
                      onClick={() => removePayment(idx)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 focus:ring-2 focus:ring-red-200 outline-none"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Add Payment button row */}
                <div className="border-t border-gray-50 dark:border-dark-800 bg-white dark:bg-dark-900 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => appendPayment({ paymentDate: format(new Date(), 'yyyy-MM-dd'), amount: Math.max(0, balanceRemaining), paymentMode: 'CASH' })}
                    className="w-full py-2 text-xs font-bold uppercase tracking-widest text-[#B8860B] hover:bg-[#B8860B]/5 rounded-lg flex items-center justify-center gap-2 transition-all focus:ring-2 focus:ring-[#B8860B]/20 outline-none"
                  >
                    <Plus size={14} /> Add Payment
                  </button>
                </div>

                {/* Summary footer */}
                <div className="px-6 pb-4 pt-1 flex flex-wrap gap-6 text-[11px] font-bold">
                  <span className="text-gray-400 uppercase tracking-widest">
                    Collected: <span className="text-green-600 font-mono ml-1">₹{fmt(totalCollected)}</span>
                  </span>
                  <span className="text-gray-400 uppercase tracking-widest">
                    Pending: <span className={`font-mono ml-1 ${balanceRemaining > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{fmt(balanceRemaining)}</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center">
                <button
                  type="button"
                  data-fo="collect-btn"
                  onClick={() => appendPayment({ paymentDate: format(new Date(), 'yyyy-MM-dd'), amount: grandTotal > 0 ? grandTotal : 0, paymentMode: 'CASH' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      appendPayment({ paymentDate: format(new Date(), 'yyyy-MM-dd'), amount: grandTotal > 0 ? grandTotal : 0, paymentMode: 'CASH' });
                      focusField('pay-0-amount', 60);
                    }
                  }}
                  className="px-7 py-3 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl text-[11px] font-bold text-[#B8860B] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-800 shadow-sm transition-all focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                >
                  <IndianRupee size={15} /> Collect Payment
                </button>
                <p className="text-[10px] text-gray-400 italic mt-2">Leave empty to save invoice with full balance due</p>
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 4 + 6 + 7: Totals (right), Remarks + Actions (full-width) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Empty left spacer on large screens */}
          <div className="hidden lg:block lg:col-span-2" />

          {/* Right column */}
          <div className="lg:col-span-3 space-y-5">
            {/* Totals */}
            <div className="card p-6 md:p-8 rounded-2xl shadow-xl bg-gray-50/50 dark:bg-dark-900 border border-gray-100 dark:border-dark-800">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">
                Invoice Totals
              </h2>
              <div className="space-y-0 divide-y divide-gray-100 dark:divide-dark-800">
                {/* SUBTOTAL */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                  <span className="text-base font-black font-mono text-gray-900 dark:text-white">₹{fmt(subtotal)}</span>
                </div>

                {/* DISCOUNT */}
                <div className="flex items-center justify-between py-3">
                  <label htmlFor="field-discount" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Discount (₹)</label>
                  <input
                    id="field-discount"
                    data-fo="discount"
                    type="number"
                    {...register('discount', { valueAsNumber: true })}
                    onFocus={selectOnFocus}
                    onKeyDown={onEnter('gst')}
                    className="w-32 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-right focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                  />
                </div>

                {/* GST */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="field-gst" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">GST (%)</label>
                    <input
                      id="field-gst"
                      data-fo="gst"
                      type="number"
                      {...register('gstPercent', { valueAsNumber: true })}
                      onFocus={selectOnFocus}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (paymentFields.length > 0) focusField('pay-0-amount');
                          else focusField('collect-btn');
                        }
                      }}
                      className="w-16 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-center focus:ring-2 focus:ring-[#B8860B]/30 outline-none"
                    />
                  </div>
                  <span className="text-base font-black font-mono text-gray-700 dark:text-gray-300">₹{fmt(gstAmount)}</span>
                </div>

                {/* GRAND TOTAL */}
                <div className="flex items-center justify-between pt-4 pb-1">
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Grand Total</span>
                  <span className="text-3xl font-black text-[#B8860B] font-mono tracking-tighter">₹{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* SECTION 6: Remarks */}
            <div className="card p-5 rounded-2xl shadow-xl bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Remarks / Notes
              </label>
              <textarea
                data-fo="remarks"
                {...register('notes')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    focusField('save-btn');
                  }
                }}
                className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-[#B8860B]/30 outline-none h-20 italic resize-none"
                placeholder="Write additional terms, special instructions..."
              />
            </div>

            {/* SECTION 7: Actions */}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full md:w-auto px-10 py-3.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all min-h-[52px] focus:ring-2 focus:ring-[#B8860B]/20 outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-fo="save-btn"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full md:w-auto justify-center bg-[#B8860B] hover:bg-[#8B6508] text-white px-10 py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-[#B8860B]/20 transition-all min-h-[52px] focus:ring-2 focus:ring-offset-2 focus:ring-[#B8860B] outline-none"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isEditing ? 'Update Invoice' : 'Save Invoice'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title={isEditing ? 'Update Invoice' : 'Save Invoice'}
        message={
          isEditing
            ? 'Update this invoice and override existing records?'
            : 'Save and generate this invoice?'
        }
        confirmText={isEditing ? 'Update' : 'Save'}
        cancelText="Cancel"
      />
    </div>
  );
};
