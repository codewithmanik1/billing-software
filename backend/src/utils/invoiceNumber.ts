import prisma from './prisma';

export const generateNextInvoiceNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `INV-${currentYear}-`;

  // Sort by createdAt so we always get the truly most-recent invoice
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: yearPrefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const parts = lastInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${yearPrefix}${nextSeq.toString().padStart(4, '0')}`;
};
