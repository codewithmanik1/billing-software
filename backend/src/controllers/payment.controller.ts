import { Request, Response } from 'express';
import { InvoiceStatus } from '@prisma/client';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD']),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const recordPayment = async (req: Request, res: Response) => {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  const { invoiceId, paymentDate, amount, paymentMode, referenceNumber, notes } = parsed.data;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return res.status(404).json(errorResponse('Invoice not found'));

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Number(invoice.grandTotal) - totalPaid;

    if (amount > pendingBalance) {
      return res.status(400).json(errorResponse(`Payment amount ₹${amount} exceeds pending balance ₹${pendingBalance}`));
    }

    const balanceAfter = pendingBalance - amount;

    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId,
          paymentDate: new Date(paymentDate),
          amount,
          paymentMode,
          referenceNumber,
          notes,
          balanceAfter,
        },
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: balanceAfter === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
        },
      }),
    ]);

    return res.status(201).json(
      successResponse({
        payment,
        invoice: {
          status: updatedInvoice.status,
          totalPaid: totalPaid + amount,
          pendingBalance: balanceAfter,
        },
      })
    );
  } catch (error) {
    console.error('recordPayment error:', error);
    return res.status(500).json(errorResponse('Failed to record payment'));
  }
};

export const getPaymentsByInvoice = async (req: Request, res: Response) => {
  const invoiceId = req.params.invoiceId as string;
  try {
    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
    return res.json(successResponse(payments));
  } catch (error) {
    console.error('getPaymentsByInvoice error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payments'));
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { invoice: { include: { payments: true } } },
    });

    if (!payment) return res.status(404).json(errorResponse('Payment not found'));

    const invoiceId = payment.invoiceId;
    const remainingPayments = payment.invoice.payments.filter((p) => p.id !== id);
    const totalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const grandTotal = Number(payment.invoice.grandTotal);
    const pending = grandTotal - totalPaid;

    let nextStatus: InvoiceStatus = InvoiceStatus.UNPAID;
    if (pending <= 0 && grandTotal > 0) nextStatus = InvoiceStatus.PAID;
    else if (totalPaid > 0) nextStatus = InvoiceStatus.PARTIAL;

    await prisma.$transaction([
      prisma.payment.delete({ where: { id } }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: nextStatus },
      }),
    ]);

    return res.json(
      successResponse({
        status: nextStatus,
        totalPaid,
        pendingBalance: pending,
      })
    );
  } catch (error) {
    console.error('deletePayment error:', error);
    return res.status(500).json(errorResponse('Failed to delete payment'));
  }
};
