import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateNextInvoiceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `INV-${currentYear}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${yearPrefix}${nextSeq.toString().padStart(4, '0')}`;
};
