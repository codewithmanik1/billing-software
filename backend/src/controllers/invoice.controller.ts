import { Request, Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { generateNextInvoiceNumber } from '../utils/invoiceNumber';

const prisma = new PrismaClient();

export const getAllInvoices = async (req: Request, res: Response) => {
  const { search, status, page = '1', limit = '10', fromDate, toDate } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status as InvoiceStatus;
    }
    const effectiveFromDate = fromDate || req.query.startDate;
    const effectiveToDate = toDate || req.query.endDate;

    if (effectiveFromDate || effectiveToDate) {
      where.invoiceDate = {};
      if (effectiveFromDate) {
        const d = new Date(String(effectiveFromDate));
        if (!isNaN(d.getTime())) where.invoiceDate.gte = d;
      }
      if (effectiveToDate) {
        const d = new Date(String(effectiveToDate));
        if (!isNaN(d.getTime())) where.invoiceDate.lte = d;
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
        take: Number(limit),
        orderBy: { invoiceDate: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const formattedInvoices = invoices.map((inv) => {
      const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const lastPayment = inv.payments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];

      return {
        ...inv,
        totalPaid,
        pendingBalance: Number(inv.grandTotal) - totalPaid,
        percentPaid: (totalPaid / Number(inv.grandTotal)) * 100,
        itemCount: inv._count.items,
        lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
      };
    });

    return res.json(
      successResponse({
        invoices: formattedInvoices,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: skip + Number(limit) < total,
          hasPrev: Number(page) > 1,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: id as string },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!invoice) return res.status(404).json(errorResponse('Invoice not found'));

    const totalPaid = (invoice as any).payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return res.json(
      successResponse({
        ...invoice,
        totalPaid,
        pendingBalance: Number(invoice.grandTotal) - totalPaid,
        percentPaid: (totalPaid / Number(invoice.grandTotal)) * 100,
      })
    );
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  const { customerId, invoiceDate, dueDate, items, gstPercent, additionalDiscount, notes, terms } = req.body;

  try {
    const invoiceNumber = await generateNextInvoiceNumber();

    // 2. Calculate each item's lineTotal and subtotal
    let subtotal = 0;
    const itemsData = items.map((item: any, index: number) => {
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

    const gstAmount = (subtotal - Number(additionalDiscount || 0)) * (Number(gstPercent) / 100);
    const grandTotal = subtotal - Number(additionalDiscount || 0) + gstAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        customerId,
        subtotal,
        gstPercent: Number(gstPercent),
        gstAmount,
        additionalDiscount: Number(additionalDiscount || 0),
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
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const updateInvoice = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { items, gstPercent, additionalDiscount, ...rest } = req.body;

  try {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: id as string },
      include: { payments: true },
    });

    if (!existingInvoice) return res.status(404).json(errorResponse('Invoice not found'));

    const totalPaid = (existingInvoice as any).payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    let subtotal = 0;
    const itemsData = items.map((item: any, index: number) => {
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

    const gstAmount = (subtotal - Number(additionalDiscount || 0)) * (Number(gstPercent) / 100);
    const grandTotal = subtotal - Number(additionalDiscount || 0) + gstAmount;

    if (totalPaid > grandTotal) {
      return res.status(400).json(errorResponse(`Cannot update: New total ${grandTotal} is less than amount already paid ${totalPaid}`));
    }

    let nextStatus: InvoiceStatus = InvoiceStatus.UNPAID;
    if (totalPaid >= grandTotal) nextStatus = InvoiceStatus.PAID;
    else if (totalPaid > 0) nextStatus = InvoiceStatus.PARTIAL;

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id as string } });
      return tx.invoice.update({
        where: { id: id as string },
        data: {
          ...rest,
          invoiceDate: rest.invoiceDate ? new Date(rest.invoiceDate) : undefined,
          dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
          subtotal,
          gstPercent: Number(gstPercent),
          gstAmount,
          additionalDiscount: Number(additionalDiscount || 0),
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
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const inv = await prisma.invoice.delete({ where: { id: id as string } });
    return res.json(successResponse(null, `Invoice ${inv.invoiceNumber} deleted successfully`));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const getNextNumber = async (req: Request, res: Response) => {
    const next = await generateNextInvoiceNumber();
    return res.json(successResponse({ nextNumber: next }));
};
