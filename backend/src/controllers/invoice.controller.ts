import { Request, Response } from 'express';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { generateNextInvoiceNumber } from '../utils/invoiceNumber';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  metalType: z.string().min(1, 'Metal type is required'),
  weightGrams: z.number().positive('Weight must be positive'),
  ratePerGram: z.number().positive('Rate must be positive'),
  makingCharges: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
});

const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  gstPercent: z.number().min(0).max(100).default(3),
  additionalDiscount: z.number().min(0).default(0),
  discount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

export const getAllInvoices = async (req: Request, res: Response) => {
  const { search, status, page = '1', limit = '10', fromDate, toDate } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: Prisma.InvoiceWhereInput = {};
    if (status && status !== 'all') {
      where.status = status as InvoiceStatus;
    }
    const effectiveFromDate = fromDate || req.query.startDate;
    const effectiveToDate = toDate || req.query.endDate;

    if (effectiveFromDate || effectiveToDate) {
      where.invoiceDate = {};
      if (effectiveFromDate) {
        const d = new Date(String(effectiveFromDate));
        if (!isNaN(d.getTime())) (where.invoiceDate as Prisma.DateTimeFilter).gte = d;
      }
      if (effectiveToDate) {
        const d = new Date(String(effectiveToDate));
        if (!isNaN(d.getTime())) (where.invoiceDate as Prisma.DateTimeFilter).lte = d;
      }
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
        { customer: { name: { contains: String(search), mode: 'insensitive' } } },
        { customer: { phone: { contains: String(search), mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          payments: { select: { amount: true, paymentDate: true } },
          _count: { select: { items: true } },
        },
        skip,
        take: limitNum,
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const formattedInvoices = invoices.map((inv) => {
      const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const grandTotal = Number(inv.grandTotal);
      const lastPayment = inv.payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];

      return {
        ...inv,
        totalPaid,
        pendingBalance: grandTotal - totalPaid,
        balanceDue: grandTotal - totalPaid,
        percentPaid: grandTotal > 0 ? (totalPaid / grandTotal) * 100 : 0,
        itemCount: inv._count.items,
        lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
      };
    });

    return res.json(
      successResponse({
        invoices: formattedInvoices,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0,
          hasNext: skip + limitNum < total,
          hasPrev: pageNum > 1,
        },
      })
    );
  } catch (error) {
    console.error('getAllInvoices error:', error);
    return res.status(500).json(errorResponse('Failed to fetch invoices'));
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) return res.status(404).json(errorResponse('Invoice not found'));

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const grandTotal = Number(invoice.grandTotal);

    return res.json(
      successResponse({
        ...invoice,
        totalPaid,
        pendingBalance: grandTotal - totalPaid,
        balanceDue: grandTotal - totalPaid,
        percentPaid: grandTotal > 0 ? (totalPaid / grandTotal) * 100 : 0,
      })
    );
  } catch (error) {
    console.error('getInvoiceById error:', error);
    return res.status(500).json(errorResponse('Failed to fetch invoice'));
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  const { customerId, invoiceDate, dueDate, items, gstPercent, notes, terms } = parsed.data;
  const additionalDiscount = parsed.data.additionalDiscount || parsed.data.discount || 0;

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json(errorResponse('Customer not found'));
    }

    const invoiceNumber = await generateNextInvoiceNumber();

    let subtotal = 0;
    const itemsData = items.map((item, index) => {
      const lineTotal =
        Number(item.weightGrams) * Number(item.ratePerGram) +
        Number(item.makingCharges || 0) -
        Number(item.discount || 0);
      subtotal += lineTotal;
      return {
        ...item,
        lineTotal,
        sortOrder: index,
      };
    });

    const gstAmount = (subtotal - additionalDiscount) * (gstPercent / 100);
    const grandTotal = subtotal - additionalDiscount + gstAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        customerId,
        subtotal,
        gstPercent,
        gstAmount,
        additionalDiscount,
        grandTotal,
        notes,
        terms,
        status: InvoiceStatus.UNPAID,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return res.status(201).json(successResponse(invoice));
  } catch (error) {
    console.error('createInvoice error:', error);
    return res.status(500).json(errorResponse('Failed to create invoice'));
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { customerId, invoiceDate, dueDate, items, gstPercent, additionalDiscount, discount, notes, terms } = req.body;

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existingInvoice) return res.status(404).json(errorResponse('Invoice not found'));

    const totalPaid = existingInvoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let subtotal = 0;
    const itemsData = items.map((item: { description: string; metalType: string; weightGrams: number; ratePerGram: number; makingCharges?: number; discount?: number }, index: number) => {
      const lineTotal =
        Number(item.weightGrams) * Number(item.ratePerGram) +
        Number(item.makingCharges || 0) -
        Number(item.discount || 0);
      subtotal += lineTotal;
      return {
        description: item.description,
        metalType: item.metalType,
        weightGrams: item.weightGrams,
        ratePerGram: item.ratePerGram,
        makingCharges: item.makingCharges || 0,
        discount: item.discount || 0,
        lineTotal,
        sortOrder: index,
      };
    });

    const effectiveDiscount = Number(additionalDiscount || discount || 0);
    const gstAmount = (subtotal - effectiveDiscount) * (Number(gstPercent) / 100);
    const grandTotal = subtotal - effectiveDiscount + gstAmount;

    if (totalPaid > grandTotal) {
      return res.status(400).json(errorResponse(`Cannot update: New total ${grandTotal} is less than amount already paid ${totalPaid}`));
    }

    let nextStatus: InvoiceStatus = InvoiceStatus.UNPAID;
    if (totalPaid >= grandTotal && grandTotal > 0) nextStatus = InvoiceStatus.PAID;
    else if (totalPaid > 0) nextStatus = InvoiceStatus.PARTIAL;

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          customerId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes: notes || null,
          terms: terms || null,
          subtotal,
          gstPercent: Number(gstPercent),
          gstAmount,
          additionalDiscount: effectiveDiscount,
          grandTotal,
          status: nextStatus,
          items: {
            create: itemsData,
          },
        },
        include: { items: true, customer: true },
      });
    });

    return res.json(successResponse(updatedInvoice));
  } catch (error) {
    console.error('updateInvoice error:', error);
    return res.status(500).json(errorResponse('Failed to update invoice'));
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const inv = await prisma.invoice.delete({ where: { id } });
    return res.json(successResponse(null, `Invoice ${inv.invoiceNumber} deleted successfully`));
  } catch (error) {
    console.error('deleteInvoice error:', error);
    return res.status(500).json(errorResponse('Failed to delete invoice'));
  }
};

export const getNextNumber = async (_req: Request, res: Response) => {
  try {
    const next = await generateNextInvoiceNumber();
    return res.json(successResponse({ nextNumber: next }));
  } catch (error) {
    console.error('getNextNumber error:', error);
    return res.status(500).json(errorResponse('Failed to generate invoice number'));
  }
};
