import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, Invoice, Payment } from '../types';
import { mockCustomers, mockInvoices, mockPayments } from './mockData';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
}

interface DataState {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  
  // App initialization
  hasSeeded: boolean;
  seedData: () => void;

  // Customer Actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Invoice Actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Payment Actions
  addPayment: (payment: Payment) => void;
  deletePayment: (id: string) => void;
}

type StoreState = AuthState & DataState;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth State
      isAuthenticated: false,
    user: null,
    theme: 'dark' as 'dark' | 'light', // kept for any remaining references; ThemeContext now handles this
    
    // Auth Actions
    login: () => set({ isAuthenticated: true, user: { username: 'admin' } }),
    logout: () => set({ isAuthenticated: false, user: null }),
    toggleTheme: () => {},

      // Data State
      customers: [],
      invoices: [],
      payments: [],
      hasSeeded: false,

      seedData: () => {
        if (!get().hasSeeded) {
          set({
            customers: mockCustomers,
            invoices: mockInvoices,
            payments: mockPayments,
            hasSeeded: true
          });
        }
      },

      // Customers
      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (id, data) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      // Invoices
      addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (id, data) => set((state) => ({
        invoices: state.invoices.map(i => i.id === id ? { ...i, ...data } : i)
      })),
      deleteInvoice: (id) => set((state) => {
        // Find and delete associated payments
        const remainingPayments = state.payments.filter(p => p.invoiceId !== id);
        return {
          invoices: state.invoices.filter(i => i.id !== id),
          payments: remainingPayments
        };
      }),

      // Payments
      addPayment: (payment) => set((state) => {
        const newPayments = [...state.payments, payment];
        
        // Update the corresponding invoice amounts
        const updatedInvoices = state.invoices.map(inv => {
          if (inv.id === payment.invoiceId) {
            const newAmountPaid = inv.amountPaid + payment.amount;
            const newPendingAmount = inv.totalAmount - newAmountPaid;
            let newStatus: Invoice['status'] = 'unpaid';
            if (newPendingAmount <= 0) newStatus = 'paid';
            else if (newAmountPaid > 0) newStatus = 'partial';
            
            return {
              ...inv,
              amountPaid: newAmountPaid,
              pendingAmount: newPendingAmount,
              status: newStatus
            };
          }
          return inv;
        });

        return {
          payments: newPayments,
          invoices: updatedInvoices
        };
      }),

      deletePayment: (id) => set((state) => {
        const paymentToDelete = state.payments.find(p => p.id === id);
        if (!paymentToDelete) return state;

        const filteredPayments = state.payments.filter(p => p.id !== id);
        
        // Revert the amount effectively by recalculating from remaining payments
        const updatedInvoices = state.invoices.map(inv => {
          if (inv.id === paymentToDelete.invoiceId) {
            const invoicePayments = filteredPayments.filter(p => p.invoiceId === inv.id);
            const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
            const pending = inv.totalAmount - totalPaid;
            
            let status: Invoice['status'] = 'unpaid';
            if (pending <= 0) status = 'paid';
            else if (totalPaid > 0) status = 'partial';

            return {
              ...inv,
              amountPaid: totalPaid,
              pendingAmount: pending,
              status
            };
          }
          return inv;
        });

        return {
          payments: filteredPayments,
          invoices: updatedInvoices
        };
      })
    }),
    {
      name: 'gold-shop-storage',
      // We don't want to persist auth state indefinitely in this demo if desired, 
      // but the instructions ask for persistent session via localStorage.
      partialize: (state) => state,
    }
  )
);
