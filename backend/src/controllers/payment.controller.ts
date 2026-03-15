import { Request, Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const recordPayment = async (req: Request, res: Response) => {
  const { invoiceId, paymentDate, amount, paymentMode, referenceNumber, notes } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return res.status(404).json(errorResponse('Invoice not found'));

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Number(invoice.grandTotal) - totalPaid;

    if (Number(amount) > pendingBalance) {
      return res.status(400).json(errorResponse(`Payment amount ₹${amount} exceeds pending balance ₹${pendingBalance}`));
    }

    const balanceAfter = pendingBalance - Number(amount);

    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId,
          paymentDate: new Date(paymentDate),
          amount: Number(amount),
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
          totalPaid: totalPaid + Number(amount),
          pendingBalance: balanceAfter,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const getPaymentsByInvoice = async (req: Request, res: Response) => {
  const { invoiceId } = req.params;
  try {
    const payments = await prisma.payment.findMany({
      where: { invoiceId: invoiceId as string },
      orderBy: { paymentDate: 'desc' },
    });
    return res.json(successResponse(payments));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: id as string },
      include: { invoice: { include: { payments: true } } },
    });

    if (!payment) return res.status(404).json(errorResponse('Payment not found'));

    const invoiceId = payment.invoiceId;
    const remainingPayments = (payment as any).invoice.payments.filter((p: any) => p.id !== id);
    const totalPaid = remainingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const grandTotal = Number((payment as any).invoice.grandTotal);
    const pending = grandTotal - totalPaid;

    let nextStatus: InvoiceStatus = InvoiceStatus.UNPAID;
    if (pending <= 0) nextStatus = InvoiceStatus.PAID;
    else if (totalPaid > 0) nextStatus = InvoiceStatus.PARTIAL;

    await prisma.$transaction([
      prisma.payment.delete({ where: { id: id as string } }),
      prisma.invoice.update({
        where: { id: invoiceId as string },
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
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
