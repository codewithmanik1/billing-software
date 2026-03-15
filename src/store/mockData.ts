import type { Customer, Invoice, Payment } from '../types';
import { subDays } from 'date-fns';

export const mockCustomers: Customer[] = [
  { id: 'c-1', name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@example.com', address: '12 MG Road, Bangalore' },
  { id: 'c-2', name: 'Priya Patel', phone: '9876543211', address: '45 Park Street, Mumbai' },
  { id: 'c-3', name: 'Amit Kumar', phone: '9876543212' },
  { id: 'c-4', name: 'Sneha Reddy', phone: '9876543213', email: 'sneha@example.com' },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    date: subDays(new Date(), 5).toISOString(),
    customer: mockCustomers[0],
    items: [
      { id: 'i-1', itemName: '22K Gold Necklace', purity: '22K', weightGrams: 25.5, ratePerGram: 6500, makingCharges: 15000, amount: 180750 },
    ],
    subtotal: 180750,
    discount: 5000,
    gstPercent: 3,
    gstAmount: 5272.5,
    totalAmount: 181022.5,
    amountPaid: 181022.5,
    pendingAmount: 0,
    status: 'paid',
    notes: 'Wedding collection',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2024-002',
    date: subDays(new Date(), 4).toISOString(),
    customer: mockCustomers[1],
    items: [
      { id: 'i-2', itemName: '24K Gold Coin', purity: '24K', weightGrams: 10, ratePerGram: 6800, makingCharges: 500, amount: 68500 },
      { id: 'i-3', itemName: '18K Diamond Ring', purity: '18K', weightGrams: 4, ratePerGram: 5500, makingCharges: 8000, amount: 30000 },
    ],
    subtotal: 98500,
    discount: 0,
    gstPercent: 3,
    gstAmount: 2955,
    totalAmount: 101455,
    amountPaid: 50000,
    pendingAmount: 51455,
    status: 'partial',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2024-003',
    date: subDays(new Date(), 2).toISOString(),
    customer: mockCustomers[2],
    items: [
      { id: 'i-4', itemName: '22K Gold Bangles (Set of 4)', purity: '22K', weightGrams: 48, ratePerGram: 6500, makingCharges: 24000, amount: 336000 },
    ],
    subtotal: 336000,
    discount: 10000,
    gstPercent: 3,
    gstAmount: 9780,
    totalAmount: 335780,
    amountPaid: 0,
    pendingAmount: 335780,
    status: 'unpaid',
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2024-004',
    date: subDays(new Date(), 1).toISOString(),
    customer: mockCustomers[3],
    items: [
      { id: 'i-5', itemName: '22K Gold Chain', purity: '22K', weightGrams: 15, ratePerGram: 6500, makingCharges: 6000, amount: 103500 },
    ],
    subtotal: 103500,
    discount: 0,
    gstPercent: 3,
    gstAmount: 3105,
    totalAmount: 106605,
    amountPaid: 106605,
    pendingAmount: 0,
    status: 'paid',
  },
  {
    id: 'inv-5',
    invoiceNumber: 'INV-2024-005',
    date: new Date().toISOString(),
    customer: mockCustomers[0],
    items: [
      { id: 'i-6', itemName: '18K Gold Earrings', purity: '18K', weightGrams: 8, ratePerGram: 5500, makingCharges: 4000, amount: 48000 },
    ],
    subtotal: 48000,
    discount: 0,
    gstPercent: 3,
    gstAmount: 1440,
    totalAmount: 49440,
    amountPaid: 20000,
    pendingAmount: 29440,
    status: 'partial',
  }
];

export const mockPayments: Payment[] = [
  { id: 'p-1', invoiceId: 'inv-1', date: subDays(new Date(), 5).toISOString(), amount: 181022.5, paymentMode: 'bank_transfer', referenceNumber: 'IMPS123456' },
  { id: 'p-2', invoiceId: 'inv-2', date: subDays(new Date(), 4).toISOString(), amount: 50000, paymentMode: 'upi', referenceNumber: 'UPI987654' },
  { id: 'p-3', invoiceId: 'inv-4', date: subDays(new Date(), 1).toISOString(), amount: 106605, paymentMode: 'card', referenceNumber: 'TXN456789' },
  { id: 'p-4', invoiceId: 'inv-5', date: new Date().toISOString(), amount: 20000, paymentMode: 'cash' },
];
