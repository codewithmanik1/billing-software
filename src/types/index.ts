export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface InvoiceItem {
  id: string;
  itemName: string;        // e.g. "22K Gold Necklace"
  purity: '24K' | '22K' | '18K' | '14K';
  weightGrams: number;
  ratePerGram: number;
  makingCharges: number;
  amount: number;          // auto-calculated
}

export interface Invoice {
  id: string;              // e.g. "INV-2024-001"
  invoiceNumber: string;
  date: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  amountPaid: number;      // sum of all payments
  pendingAmount: number;   // totalAmount - amountPaid
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  paymentMode: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  note?: string;
}
