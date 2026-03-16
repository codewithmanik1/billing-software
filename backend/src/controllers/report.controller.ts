import { Request, Response } from 'express';
import { InvoiceStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';

export const getSummary = async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;

  try {
    const where: Prisma.InvoiceWhereInput = {};
    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) {
        const d = new Date(String(fromDate));
        if (!isNaN(d.getTime())) (where.invoiceDate as Prisma.DateTimeFilter).gte = d;
      }
      if (toDate) {
        const d = new Date(String(toDate));
        if (!isNaN(d.getTime())) (where.invoiceDate as Prisma.DateTimeFilter).lte = d;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        grandTotal: true,
        status: true,
        payments: { select: { amount: true } },
      },
    });

    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal), 0);
    const totalCollected = invoices.reduce((sum, inv) =>
      sum + inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0
    );

    const summary = {
      totalSalesGenerated: totalSales,
      totalAmountCollected: totalCollected,
      totalAmountPending: totalSales - totalCollected,
      recoveryRate: totalSales > 0 ? (totalCollected / totalSales) * 100 : 0,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
      partialCount: invoices.filter((i) => i.status === InvoiceStatus.PARTIAL).length,
      unpaidCount: invoices.filter((i) => i.status === InvoiceStatus.UNPAID).length,
      pendingInvoiceCount: invoices.filter((i) => i.status !== InvoiceStatus.PAID).length,
    };

    return res.json(successResponse(summary));
  } catch (error) {
    console.error('getSummary error:', error);
    return res.status(500).json(errorResponse('Failed to fetch summary'));
  }
};

export const getOutstanding = async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: Prisma.InvoiceWhereInput = { status: { not: InvoiceStatus.PAID } };
    const [invoices, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          payments: { select: { amount: true } },
        },
        skip,
        take: limitNum,
        orderBy: { invoiceDate: 'asc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const formatted = invoices.map((inv) => {
      const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const diff = new Date().getTime() - inv.invoiceDate.getTime();
      const daysPending = Math.floor(diff / (1000 * 60 * 60 * 24));

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        status: inv.status,
        grandTotal: inv.grandTotal,
        totalPaid: paid,
        pendingBalance: Number(inv.grandTotal) - paid,
        customer: inv.customer,
        daysPending,
      };
    });

    return res.json(successResponse({
      invoices: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0,
      }
    }));
  } catch (error) {
    console.error('getOutstanding error:', error);
    return res.status(500).json(errorResponse('Failed to fetch outstanding invoices'));
  }
};

export const getCollections = async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  try {
    const where: Prisma.PaymentWhereInput = {};
    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) (where.paymentDate as Prisma.DateTimeFilter).gte = new Date(String(fromDate));
      if (toDate) (where.paymentDate as Prisma.DateTimeFilter).lte = new Date(String(toDate));
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        paymentDate: true,
        amount: true,
      }
    });

    const dailyMap: Record<string, { date: string, collected: number, invoiceCount: number }> = {};
    payments.forEach(p => {
      const d = p.paymentDate.toISOString().split('T')[0];
      if (!dailyMap[d]) dailyMap[d] = { date: d, collected: 0, invoiceCount: 0 };
      dailyMap[d].collected += Number(p.amount);
      dailyMap[d].invoiceCount += 1;
    });

    return res.json(successResponse({
      daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
    }));
  } catch (error) {
    console.error('getCollections error:', error);
    return res.status(500).json(errorResponse('Failed to fetch collections'));
  }
};

export const getTopCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        invoices: {
          include: { payments: true }
        }
      }
    });

    const formatted = customers.map(c => {
      let totalPurchase = 0;
      let totalPaid = 0;
      c.invoices.forEach(inv => {
        totalPurchase += Number(inv.grandTotal);
        totalPaid += inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      });

      return {
        customer: { id: c.id, name: c.name, phone: c.phone },
        totalPurchase,
        totalPaid,
        outstandingBalance: totalPurchase - totalPaid,
        invoiceCount: c.invoices.length
      };
    }).sort((a, b) => b.totalPurchase - a.totalPurchase).slice(0, 10);

    return res.json(successResponse(formatted));
  } catch (error) {
    console.error('getTopCustomers error:', error);
    return res.status(500).json(errorResponse('Failed to fetch top customers'));
  }
};

export const getPaymentModes = async (req: Request, res: Response) => {
  const { fromDate, toDate } = req.query;
  try {
    const where: Prisma.PaymentWhereInput = {};
    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) (where.paymentDate as Prisma.DateTimeFilter).gte = new Date(String(fromDate));
      if (toDate) (where.paymentDate as Prisma.DateTimeFilter).lte = new Date(String(toDate));
    }

    const payments = await prisma.payment.findMany({ where });
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const modesMap: Record<string, { mode: string, count: number, total: number }> = {};
    payments.forEach(p => {
      if (!modesMap[p.paymentMode]) modesMap[p.paymentMode] = { mode: p.paymentMode, count: 0, total: 0 };
      modesMap[p.paymentMode].count += 1;
      modesMap[p.paymentMode].total += Number(p.amount);
    });

    const formatted = Object.values(modesMap).map(m => ({
      ...m,
      percentage: totalCollected > 0 ? (m.total / totalCollected) * 100 : 0
    }));

    return res.json(successResponse(formatted));
  } catch (error) {
    console.error('getPaymentModes error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payment modes'));
  }
};
