import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
});

export const getAllCustomers = async (req: Request, res: Response) => {
  const { search, page = '1', limit = '10' } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { phone: { contains: String(search), mode: 'insensitive' } },
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
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.customer.count({ where }),
    ]);

    const formattedCustomers = customers.map((c) => {
      const totalInvoices = c._count.invoices;
      let totalAmount = 0;
      let totalPaid = 0;

      c.invoices.forEach((inv) => {
        totalAmount += Number(inv.grandTotal);
        inv.payments.forEach((p) => {
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
          page: pageNum,
          limit: limitNum,
          totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 0,
          hasNext: skip + limitNum < total,
          hasPrev: pageNum > 1,
        },
      })
    );
  } catch (error) {
    console.error('getAllCustomers error:', error);
    return res.status(500).json(errorResponse('Failed to fetch customers'));
  }
};

export const getAutocomplete = async (req: Request, res: Response) => {
  const { q } = req.query;
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: String(q || ''), mode: 'insensitive' } },
          { phone: { contains: String(q || ''), mode: 'insensitive' } },
        ],
      },
      take: 5,
    });
    return res.json(successResponse(customers));
  } catch (error) {
    console.error('getAutocomplete error:', error);
    return res.status(500).json(errorResponse('Failed to search customers'));
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  try {
    const customer = await prisma.customer.create({ data: parsed.data });
    return res.status(201).json(successResponse(customer));
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json(errorResponse('A customer with this phone number already exists'));
    }
    console.error('createCustomer error:', error);
    return res.status(500).json(errorResponse('Failed to create customer'));
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: parsed.data,
    });
    return res.json(successResponse(customer));
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json(errorResponse('A customer with this phone number already exists'));
    }
    console.error('updateCustomer error:', error);
    return res.status(500).json(errorResponse('Failed to update customer'));
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const invoicesCount = await prisma.invoice.count({ where: { customerId: id } });
    if (invoicesCount > 0) {
      return res.status(400).json(errorResponse('Cannot delete customer with existing invoices. Delete invoices first.'));
    }
    await prisma.customer.delete({ where: { id } });
    return res.json(successResponse(null, 'Customer deleted successfully'));
  } catch (error) {
    console.error('deleteCustomer error:', error);
    return res.status(500).json(errorResponse('Failed to delete customer'));
  }
};
