import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/apiResponse';

const prisma = new PrismaClient();

export const getAllCustomers = async (req: Request, res: Response) => {
  const { search, page = '1', limit = '10' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const where = search
      ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' as any } },
            { phone: { contains: String(search), mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { invoices: true } },
          invoices: {
            select: {
              grandTotal: true,
              payments: { select: { amount: true } },
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);

    const formattedCustomers = customers.map((c: any) => {
      const totalInvoices = c._count.invoices;
      let totalAmount = 0;
      let totalPaid = 0;

      c.invoices.forEach((inv: any) => {
        totalAmount += Number(inv.grandTotal);
        inv.payments.forEach((p: any) => {
          totalPaid += Number(p.amount);
        });
      });

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        gstin: c.gstin,
        createdAt: c.createdAt,
        totalInvoices,
        totalPaid,
        outstandingBalance: totalAmount - totalPaid,
      };
    });

    return res.json(
      successResponse({
        customers: formattedCustomers,
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

export const getAutocomplete = async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: String(q || ''), mode: 'insensitive' as any } },
          { phone: { contains: String(q || ''), mode: 'insensitive' as any } },
        ],
      },
      take: 5,
    });
    return res.json(successResponse(customers));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    return res.status(201).json(successResponse(customer));
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json(errorResponse('A customer with this phone number already exists'));
    }
    return res.status(500).json(errorResponse(error.message));
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const customer = await prisma.customer.update({
      where: { id: id as string },
      data: req.body,
    });
    return res.json(successResponse(customer));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  try {
    const invoicesCount = await prisma.invoice.count({ where: { customerId: id as string } });
    if (invoicesCount > 0) {
      return res.status(400).json(errorResponse('Cannot delete customer with existing invoices. Delete invoices first.'));
    }
    await prisma.customer.delete({ where: { id: id as string } });
    return res.json(successResponse(null, 'Customer deleted successfully'));
  } catch (error: any) {
    return res.status(500).json(errorResponse(error.message));
  }
};
