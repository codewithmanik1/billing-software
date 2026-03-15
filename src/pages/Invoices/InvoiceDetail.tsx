import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Plus, Trash2, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Pagination } from '../../components/ui/Pagination';
import mjLogo from '../../assets/mj_logo.png';

const paymentSchema = z.object({
  date: z.string(),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.enum(['cash', 'upi', 'card', 'bank_transfer', 'cheque']),
  referenceNumber: z.string().optional(),
  note: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'details';
  
  const { invoices, payments, addPayment, deletePayment } = useStore();
  const invoice = invoices.find(i => i.id === id);
  const invoicePayments = payments.filter(p => p.invoiceId === id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payPage, setPayPage] = useState(1);
  const [payPerPage, setPayPerPage] = useState(5);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: invoice?.pendingAmount || 0,
      paymentMode: 'cash',
    }
  });

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-serif text-gray-900 dark:text-white mb-4">Invoice Not Found</h2>
        <button onClick={() => navigate('/invoices')} className="btn-primary">Back to Invoices</button>
      </div>
    );
  }

  const { customer, items } = invoice;

  const handleOpenPayment = () => {
    reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: invoice.pendingAmount,
      paymentMode: 'cash'
    });
    setIsPaymentModalOpen(true);
  };

  const onPaymentSubmit = (data: PaymentFormData) => {
    if (data.amount > invoice.pendingAmount) {
      toast.error(`Amount cannot exceed pending balance of ${formatCurrency(invoice.pendingAmount)}`);
      return;
    }
    
    addPayment({
      id: `p-${Date.now()}`,
      invoiceId: invoice.id,
      ...data,
      date: new Date(data.date).toISOString()
    });
    
    toast.success('Payment recorded successfully');
    setIsPaymentModalOpen(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment record? This will revert the invoice balance.')) {
      deletePayment(paymentId);
      toast.success('Payment deleted successfully');
    }
  };

  // Compute running balance for the payments table
  let runningBalance = invoice.totalAmount;
  const paymentsWithBalance = [...invoicePayments].reverse().map(p => {
    runningBalance -= p.amount;
    return { ...p, balanceAfter: runningBalance };
  }).reverse();

  const paginatedPayments = paymentsWithBalance.slice(
    (payPage - 1) * payPerPage,
    payPage * payPerPage
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 bg-white dark:bg-dark-800 hover:bg-gray-100 dark:bg-dark-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white print:hidden">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-serif text-gray-900 dark:text-white">{invoice.invoiceNumber}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
            invoice.status === 'paid' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
            invoice.status === 'partial' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
            'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {invoice.status}
          </span>
        </div>
        
        <div className="flex gap-3 print:hidden">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
            <Printer size={18} /> Print
          </button>
          {invoice.pendingAmount > 0 && (
            <button onClick={handleOpenPayment} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-dark-700 mb-6 print:hidden">
        <button 
          onClick={() => setSearchParams({ tab: 'details' })}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${currentTab === 'details' ? 'border-gold text-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
        >
          Invoice Details
        </button>
        <button 
          onClick={() => setSearchParams({ tab: 'payments' })}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${currentTab === 'payments' ? 'border-gold text-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'}`}
        >
          Payment History
          <span className="bg-gray-100 dark:bg-dark-700 text-xs px-2 py-0.5 rounded-full">{invoicePayments.length}</span>
        </button>
      </div>

      {currentTab === 'details' ? (
        <div id="printable-invoice" className="card p-8 print:shadow-none print:border-none print:p-0 bg-white text-gray-900 border-gray-200">
          {/* Printable Invoice Header/Letterhead */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-red-800">
            {/* Left: Logo + Shop details */}
            <div className="flex items-center gap-4">
              <img
                src={mjLogo}
                alt="More Jwellers"
                className="w-16 h-16 rounded-lg object-contain"
                style={{ background: '#FBF0E4', padding: '3px', border: '1px solid #C8A96E' }}
              />
              <div>
                <h2
                  className="text-red-800 text-2xl font-bold tracking-[0.1em] uppercase"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  More Jwellers
                </h2>
                <p className="text-[#6B5E4A] text-xs font-medium mt-1">Premium Gold & Silver Jewellery</p>
                <p className="text-[#6B5E4A] text-xs">📞 +91 XXXXX XXXXX &nbsp;|&nbsp; 📍 Your Address, City</p>
                <p className="text-[#6B5E4A] text-xs">GSTIN: 29ABCDE1234F1Z5</p>
              </div>
            </div>

            {/* Right: Invoice title + label */}
            <div className="text-right">
              <h1
                className="text-red-800 text-4xl font-bold tracking-widest uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Invoice
              </h1>
              <p className="text-gray-900 text-sm font-bold mt-2 tracking-widest">{invoice.invoiceNumber}</p>
              <p className="text-[#6B5E4A] text-xs mt-1">Date: {format(new Date(invoice.date), 'dd MMM yyyy')}</p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Billed To</h3>
            <p className="font-bold text-lg text-gray-900">{customer.name}</p>
            <p className="text-gray-600">{customer.phone}</p>
            {customer.email && <p className="text-gray-600">{customer.email}</p>}
            {customer.address && <p className="text-gray-600 mt-1">{customer.address}</p>}
          </div>

          <div className="mb-8">
            <table className="w-full text-sm text-left">
              <thead className="bg-gold-dark text-gray-900 dark:text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Description</th>
                  <th className="px-4 py-3 font-semibold text-center">Purity</th>
                  <th className="px-4 py-3 font-semibold text-right">Net Wt (g)</th>
                  <th className="px-4 py-3 font-semibold text-right">Rate/g</th>
                  <th className="px-4 py-3 font-semibold text-right">MC</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="text-gray-800 hidden-print-border">
                    <td className="px-4 py-4">{item.itemName}</td>
                    <td className="px-4 py-4 text-center">{item.purity}</td>
                    <td className="px-4 py-4 text-right">{item.weightGrams}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(item.ratePerGram)}</td>
                    <td className="px-4 py-4 text-right">{formatCurrency(item.makingCharges)}</td>
                    <td className="px-4 py-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-12">
            <div className="w-full md:w-1/2 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 border-b border-gray-200 pb-3">
                <span>GST ({invoice.gstPercent}%)</span>
                <span>{formatCurrency(invoice.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
                <span>Grand Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Amount Paid</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-red-700 font-bold bg-red-50 p-2 rounded border border-red-100">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.pendingAmount)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Notes:</h3>
                <p className="text-gray-600 italic">{invoice.notes}</p>
              </div>
            )}
            
            <div className="flex justify-between items-end mt-16 text-center text-sm text-gray-600">
              <div>
                <div className="border-t border-gray-400 w-48 mx-auto pt-2">Customer Signature</div>
              </div>
              <div>
                <div 
                  className="font-serif font-bold text-xl text-red-800 mb-4 tracking-widest uppercase"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  More Jwellers
                </div>
                <div className="border-t border-gray-400 w-48 mx-auto pt-2 text-gray-800">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-0 flex flex-col">
           {/* Payment History View */}
           <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex justify-between items-center bg-white dark:bg-dark-800">
             <div>
               <h2 className="text-xl font-serif text-gray-900 dark:text-white mb-1">Payment History</h2>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total Billed: {formatCurrency(invoice.totalAmount)} | Pending: <span className="text-red-400 font-medium">{formatCurrency(invoice.pendingAmount)}</span></p>
             </div>
           </div>

           <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F0E8] dark:bg-[#0A0A0A] border-b border-[#E8E0D0] dark:border-[#2E2E2E] text-[#6B5E4A] dark:text-[#9A9A8A]">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Mode</th>
                  <th className="px-6 py-3 font-medium">Reference</th>
                  <th className="px-6 py-3 font-medium text-right">Amount Paid</th>
                  <th className="px-6 py-3 font-medium text-right">Balance After</th>
                  <th className="px-6 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D0] dark:divide-[#2E2E2E]">
                {paymentsWithBalance.length > 0 ? (
                  paginatedPayments.map((p) => (
                    <tr key={p.id} className="bg-white dark:bg-[#141414] hover:bg-[#FFF8E7] dark:hover:bg-[#1F1A0E] transition-colors duration-150">
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-md text-xs font-medium">
                          {p.paymentMode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{p.referenceNumber || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-400">+{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-300">{formatCurrency(p.balanceAfter)}</td>
                      <td className="px-6 py-4 flex justify-center">
                        <button 
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100 dark:bg-dark-700"
                          title="Delete Payment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                       <div className="flex flex-col items-center justify-center text-gray-500">
                         <IndianRupee size={48} className="mb-4 opacity-20" />
                         <p>No payments recorded yet.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E8E0D0] dark:border-[#2E2E2E]">
            <Pagination
              currentPage={payPage}
              totalItems={paymentsWithBalance.length}
              itemsPerPage={payPerPage}
              onPageChange={setPayPage}
              onItemsPerPageChange={(n) => { setPayPerPage(n); setPayPage(1); }}
              itemsPerPageOptions={[5, 10, 25]}
              entityName="payments"
            />
          </div>
         </div>
      )}

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Date <span className="text-red-500">*</span></label>
            <input type="date" {...register('date')} className="input-field" />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 flex justify-between">
              <span>Amount <span className="text-red-500">*</span></span>
              <span className="text-gold text-xs">Max: {formatCurrency(invoice.pendingAmount)}</span>
            </label>
            <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="input-field text-right" placeholder="0.00" />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Payment Mode <span className="text-red-500">*</span></label>
            <select {...register('paymentMode')} className="input-field">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
            {errors.paymentMode && <p className="text-red-500 text-xs mt-1">{errors.paymentMode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Reference Number</label>
            <input type="text" {...register('referenceNumber')} className="input-field" placeholder="Transaction ID, Cheque No, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Notes</label>
            <textarea {...register('note')} className="input-field min-h-[60px]" placeholder="Optional details..." />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Record Payment
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
