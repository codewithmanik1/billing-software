import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Trash2, Plus, FileText, IndianRupee, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Pagination } from '../../components/ui/Pagination';
import mjLogo from '../../assets/mj_logo.png';
import { useProfile } from '../../context/ProfileContext';

// Convert image to base64 for reliable print rendering
const getBase64Logo = (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(mjLogo);
      }
    };
    img.onerror = () => resolve(mjLogo);
    img.src = mjLogo;
  });
};

const paymentSchema = z.object({
  paymentDate: z.string(),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'details';
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeletePaymentOpen, setIsDeletePaymentOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [payPage, setPayPage] = useState(1);
  const [payPerPage, setPayPerPage] = useState(5);
  const { profile } = useProfile();
  const [base64Logo, setBase64Logo] = useState<string>(mjLogo);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBase64Logo().then(setBase64Logo);
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Fetching data
  const { data: invoiceRes, isLoading, error } = useQuery({
    queryKey: ['invoice-detail', id],
    queryFn: async () => {
      const res = await api.get(`/invoices/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const invoice = invoiceRes?.data;
  const invoicePayments = invoice?.payments || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      amount: invoice?.balanceDue || 0,
      paymentMode: 'CASH',
    }
  });

  // Mutations
  const addPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => api.post('/payments', { ...data, invoiceId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      reset();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to record payment'),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api.delete(`/payments/${paymentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment record removed');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Failed to delete payment'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#B8860B] animate-spin mb-4" />
        <p className="text-gray-500 italic">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="p-6 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10 text-center max-w-md">
           <FileText size={48} className="mx-auto text-red-400 mb-4 opacity-30" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invoice Not Found</h2>
            <p className="text-sm text-gray-500 mb-6">The requested invoice could not be found.</p>
           <button onClick={() => navigate('/invoices')} className="btn-primary px-8">Return to Registry</button>
        </div>
      </div>
    );
  }

  const { customer, items } = invoice;

  const handleOpenPayment = () => {
    reset({
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      amount: Number(invoice.balanceDue),
      paymentMode: 'CASH'
    });
    setIsPaymentModalOpen(true);
  };

  const onPaymentSubmit = (data: PaymentFormData) => {
    if (data.amount > Number(invoice.balanceDue)) {
      toast.error(`Payment exceeds pending balance of ${formatCurrency(Number(invoice.balanceDue))}`);
      return;
    }
    addPaymentMutation.mutate(data);
  };

  const handleDeletePayment = () => {
    if (deletingPaymentId) {
      deletePaymentMutation.mutate(deletingPaymentId);
      setIsDeletePaymentOpen(false);
      setDeletingPaymentId(null);
    }
  };

  // Compute running balance for the payments table
  const sortedPayments = [...invoicePayments].sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const paymentsWithBalance = (() => {
    let balance = Number(invoice.grandTotal);
    return sortedPayments.map(p => {
      balance -= Number(p.amount);
      return { ...p, balanceAfter: balance };
    }).reverse();
  })();

  const paginatedPayments = paymentsWithBalance.slice(
    (payPage - 1) * payPerPage,
    payPage * payPerPage
  );

  const handlePrint = () => {
    const images = printRef.current?.querySelectorAll('img') || [];
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    Promise.all(imagePromises).then(() => {
      // Temporarily clear title to remove browser header text
      const originalTitle = document.title;
      document.title = ' ';
      window.print();
      document.title = originalTitle;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 border border-gray-200 dark:border-dark-800 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[#1A1209] dark:text-[#F5F5F0]">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-3">
               <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                 invoice.status === 'PAID' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                 invoice.status === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                 'bg-red-500/10 text-red-600 dark:text-red-400'
               }`}>
                 {invoice.status}
               </span>
               <span className="text-[11px] text-gray-400 font-medium">Record ID: {invoice.id.slice(0,8).toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={16} /> Print Invoice
          </button>
          {Number(invoice.balanceDue) > 0 && (
            <button onClick={handleOpenPayment} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-gold/20">
              <Plus size={18} /> Record Receipt
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-900/50 rounded-2xl w-fit mb-6 print:hidden border border-gray-200 dark:border-dark-800">
        <button 
          onClick={() => setSearchParams({ tab: 'details' })}
          className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${currentTab === 'details' ? 'bg-white dark:bg-dark-800 text-[#B8860B] shadow-sm' : 'text-gray-500 hover:text-[#B8860B]'}`}
        >
          Invoice Overview
        </button>
        <button 
          onClick={() => setSearchParams({ tab: 'payments' })}
          className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${currentTab === 'payments' ? 'bg-white dark:bg-dark-800 text-[#B8860B] shadow-sm' : 'text-gray-500 hover:text-[#B8860B]'}`}
        >
          Payments
          <span className="bg-gray-100 dark:bg-dark-700 text-gray-500 text-xs px-2 py-0.5 rounded-full">{invoicePayments.length}</span>
        </button>
      </div>

      {currentTab === 'details' ? (
        <div id="printable-invoice" ref={printRef} className="card p-10 print:shadow-none print:border-none print:p-0 bg-white text-gray-900 border-gray-100 shadow-xl rounded-2xl">
          {/* Printable Invoice Header */}
          <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-[#B8860B]">
            <div className="flex items-center gap-6">
              <img
                src={base64Logo}
                alt={profile.name}
                onError={(e) => {
                  e.currentTarget.src = '/mj_logo.png';
                }}
                className="w-20 h-20 rounded-2xl object-contain bg-[#FBF0E4] p-1 border border-[#B8860B]/30"
              />
              <div>
                <h2 className="text-2xl font-bold text-[#1A1209]">{profile.name}</h2>
                <div className="mt-2 space-y-1">
                   <p className="text-[#6B5E4A] text-xs font-medium font-sans">{profile.address}</p>
                   <p className="text-[#6B5E4A] text-xs font-medium font-sans">Mob: {profile.phone} &nbsp;|&nbsp; Email: {profile.email}</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="bg-[#B8860B] text-white px-6 py-2 rounded-lg inline-block font-bold uppercase tracking-[0.3em] text-sm mb-4">Tax Invoice</div>
              <div className="space-y-1">
                 <p className="text-[#1A1209] text-xl font-bold font-mono">{invoice.invoiceNumber}</p>
                 <p className="text-[#6B5E4A] text-[10px] font-bold uppercase tracking-wider">Dated: {format(new Date(invoice.invoiceDate), 'dd MMMM yyyy')}</p>
                 <div className="mt-3">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${Number(invoice.balanceDue) === 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                       {Number(invoice.balanceDue) === 0 ? 'SETTLED' : 'OUTSTANDING'}
                    </span>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
               <h3 className="text-[10px] font-bold text-[#B8860B] mb-4 uppercase tracking-[0.2em] pl-1 border-l-2 border-[#B8860B]">Billing Recipient</h3>
               <p className="font-bold text-xl text-[#1A1209]">{customer.name}</p>
               <div className="mt-3 space-y-1.5">
                  <p className="text-gray-600 text-sm flex items-center gap-2">📱 {customer.phone}</p>
                  {customer.address && <p className="text-gray-500 text-xs leading-relaxed mt-2 italic">{customer.address}</p>}
               </div>
            </div>
            
            <div className="flex flex-col justify-end items-end p-6 border border-gray-100 rounded-2xl">
               <p className="text-[10px] font-bold text-[#9A9A8A] uppercase tracking-widest mb-1">Total Valuation</p>
               <p className="text-3xl font-bold text-[#1A1209]">{formatCurrency(Number(invoice.grandTotal))}</p>
            </div>
          </div>

          <div className="mb-10 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#B8860B] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Description of Ornament</th>
                  <th className="px-4 py-4 font-bold text-center uppercase tracking-widest text-[10px]">Purity</th>
                  <th className="px-4 py-4 font-bold text-right uppercase tracking-widest text-[10px]">Net Wt (g)</th>
                  <th className="px-4 py-4 font-bold text-right uppercase tracking-widest text-[10px]">Today's Rate</th>
                  <th className="px-4 py-4 font-bold text-right uppercase tracking-widest text-[10px]">Making</th>
                  <th className="px-6 py-4 font-bold text-right uppercase tracking-widest text-[10px]">Taxable Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item: Record<string, unknown>, idx: number) => (
                  <tr key={item.id || idx} className="text-gray-800 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                       <div className="font-bold text-gray-900">{item.description}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{item.metalType}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{item.weightGrams}g</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(Number(item.ratePerGram))}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(Number(item.makingCharges || 0))}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{formatCurrency(Number(item.lineTotal || item.amount || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-12">
            <div className="w-full md:w-5/12 p-6 bg-[#B8860B]/5 rounded-2xl border border-[#B8860B]/10 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Aggregate Value</span>
                <span className="font-bold text-gray-900">{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Central GST (1.5%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(Number(invoice.gstAmount) / 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">State GST (1.5%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(Number(invoice.gstAmount) / 2)}</span>
              </div>
              <div className="border-t border-[#B8860B]/20 pt-4 flex justify-between">
                <span className="text-gray-900 font-bold uppercase tracking-widest text-xs">Total Payable</span>
                <span className="text-xl font-bold text-[#1A1209]">{formatCurrency(Number(invoice.grandTotal))}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-green-600">
                <p className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Amount Collected</p>
                <span>{formatCurrency(Number(invoice.totalPaid))}</span>
              </div>
              {Number(invoice.balanceDue) > 0 && (
                 <div className="bg-red-500 text-white p-3 rounded-xl flex justify-between items-center shadow-lg shadow-red-500/20">
                    <span className="font-bold uppercase tracking-widest text-[10px]">Balance Due</span>
                    <span className="text-lg font-bold">{formatCurrency(Number(invoice.balanceDue))}</span>
                 </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-6">
               {invoice.notes && (
                 <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#B8860B]">
                   <h3 className="text-[10px] font-bold text-[#B8860B] mb-1 uppercase tracking-widest">Internal Remarks</h3>
                   <p className="text-gray-600 text-xs leading-relaxed italic">"{invoice.notes}"</p>
                 </div>
               )}
               
               <div className="p-4 bg-[#B8860B]/5 rounded-xl border border-[#B8860B]/10">
                  <h3 className="text-[10px] font-bold text-[#B8860B] mb-2 uppercase tracking-widest">Terms of Service</h3>
                  <ul className="text-[9px] text-gray-500 list-disc pl-4 space-y-1 font-medium">
                     <li>Goods once sold will not be taken back without proper valuation.</li>
                     <li>Standard purity certifications are guaranteed by {profile.name}.</li>
                     <li>Disputes are subject to City Jurisdiction only.</li>
                     <li>This is a computer generated invoice and requires no physical seal.</li>
                  </ul>
               </div>
            </div>
            
            <div className="flex flex-col justify-end items-center text-center">
                <div className="mb-6 opacity-30">
                   <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1A1209]">Digitally Authenticated By</p>
                </div>
                <div className="font-bold text-xl text-[#1A1209] mb-4 uppercase border-b-2 border-gray-200 pb-1">
                  {profile.name}
                </div>
                <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Authorized Signature</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-0 flex flex-col shadow-lg border-gray-100 rounded-2xl overflow-hidden">
           <div className="p-8 border-b border-gray-100 dark:border-dark-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/10">
             <div>
                <h2 className="text-2xl font-serif text-[#1A1209] dark:text-[#F5F5F0]">Ledger Overview</h2>
                <div className="flex items-center gap-4 mt-2">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aggregate Collected:</p>
                   <p className="text-lg font-bold text-green-600 font-mono tracking-tight">{formatCurrency(Number(invoice.totalPaid))}</p>
                </div>
             </div>
             {Number(invoice.balanceDue) > 0 && (
                <div className="text-right">
                   <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1 font-mono">Pending Balance</p>
                   <p className="text-2xl font-bold text-red-500 tracking-tight">{formatCurrency(Number(invoice.balanceDue))}</p>
                </div>
             )}
           </div>

           <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#B8860B] text-white">
                <tr>
                  <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px]">Payment Date</th>
                  <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Method</th>
                  <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Reference</th>
                  <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Credit</th>
                  <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">Balance Due</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-widest text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
                {paymentsWithBalance.length > 0 ? (
                  paginatedPayments.map((p) => (
                    <tr key={p.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150 group">
                      <td className="px-8 py-5 text-gray-600 dark:text-gray-300 font-medium">
                         {format(new Date(p.paymentDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-5">
                        <span className="capitalize text-[#B8860B] bg-[#B8860B]/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest">
                          {p.paymentMode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-gray-400 font-mono text-xs">{p.referenceNumber || '- - -'}</td>
                      <td className="px-6 py-5 text-right font-bold text-green-600 text-lg">+{formatCurrency(Number(p.amount))}</td>
                      <td className="px-6 py-5 text-right font-medium text-gray-400 font-mono">{formatCurrency(p.balanceAfter)}</td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center group-hover:opacity-100 opacity-60 transition-opacity">
                          <button
                            onClick={() => {
                              setDeletingPaymentId(p.id);
                              setIsDeletePaymentOpen(true);
                            }}
                            className="p-2.5 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                            title="Delete Payment"
                            aria-label="Delete Payment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                       <div className="flex flex-col items-center justify-center">
                         <div className="p-6 bg-gray-50 dark:bg-dark-800 rounded-full mb-4">
                            <IndianRupee size={48} className="text-gray-200" />
                         </div>
                         <p className="font-serif italic text-gray-400 text-lg">No collections have been recorded</p>
                         <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Settle account by recording a payment</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {paymentsWithBalance.length > 0 && (
             <div className="p-6 border-t border-gray-100 dark:border-dark-800 bg-gray-50/20">
               <Pagination
                 currentPage={payPage}
                 totalItems={paymentsWithBalance.length}
                 itemsPerPage={payPerPage}
                 onPageChange={setPayPage}
                 onItemsPerPageChange={(n) => { setPayPerPage(n); setPayPage(1); }}
                 itemsPerPageOptions={[5, 10, 25]}
                 entityName="transactions"
               />
             </div>
          )}
         </div>
      )}

      {/* Delete Payment Confirmation Modal */}
      <Modal isOpen={isDeletePaymentOpen} onClose={() => setIsDeletePaymentOpen(false)} title="Delete Payment">
        <div className="space-y-6 pt-2">
          <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-500/5 rounded-xl border border-red-100 dark:border-red-500/10">
            <div className="p-2 bg-red-500 rounded-lg text-white">
              <Trash2 size={24} />
            </div>
            <div>
              <p className="font-bold text-red-600 dark:text-red-400">Delete this payment record?</p>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">This will increase the pending balance on this invoice.</p>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeletePaymentOpen(false)} className="px-5 py-2 text-gray-500 hover:text-gray-700 font-bold uppercase tracking-wider text-xs">Cancel</button>
            <button
              onClick={handleDeletePayment}
              disabled={deletePaymentMutation.isPending}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {deletePaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Collection">
        <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Payment Date <span className="text-red-500">*</span></label>
              <input type="date" {...register('paymentDate')} className="input-field py-3" />
              {errors.paymentDate && <p className="text-red-500 text-[10px] font-bold">{errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider flex justify-between">
                <span>Credit Amount <span className="text-red-500">*</span></span>
                <span className="text-[#B8860B]">Balance: {formatCurrency(Number(invoice.balanceDue))}</span>
              </label>
              <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="input-field text-right py-3 font-mono font-bold text-lg" placeholder="0.00" />
              {errors.amount && <p className="text-red-500 text-[10px] font-bold">{errors.amount.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Payment Instrument <span className="text-red-500">*</span></label>
              <select {...register('paymentMode')} className="input-field py-3 font-medium">
                <option value="CASH">Cash Payment</option>
                <option value="UPI">UPI Transfer</option>
                <option value="CARD">Debit/Credit Card</option>
                <option value="BANK_TRANSFER">NEFT/IMPS Transfer</option>
                <option value="CHEQUE">Cheque / demand Draft</option>
              </select>
              {errors.paymentMode && <p className="text-red-500 text-[10px] font-bold">{errors.paymentMode.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Reference / TID</label>
              <input type="text" {...register('referenceNumber')} className="input-field py-3 font-mono text-xs uppercase" placeholder="TXN-123456789" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#6B5E4A] dark:text-[#F5F5F0] uppercase tracking-wider">Payment Remarks</label>
            <textarea {...register('notes')} className="input-field min-h-[80px] py-3 text-sm italic" placeholder="Add optional payment details..." />
          </div>

          <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-100 dark:border-dark-800">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-6 py-2.5 text-[#6B5E4A] font-bold text-xs uppercase tracking-widest">Discard</button>
            <button 
              type="submit" 
              className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-gold/20"
              disabled={addPaymentMutation.isPending}
            >
              {addPaymentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />} 
              Confirm Collection
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

