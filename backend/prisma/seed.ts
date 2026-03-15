import { PrismaClient, InvoiceStatus, PaymentMode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Clean data
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin User
  const hashedPassword = await bcrypt.hash('admin', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  });

  // 3. Create Customers
  const customers = [
    { name: 'Rajesh Sharma', phone: '9876543210', email: 'rajesh@example.com', address: '12 MG Road Bangalore' },
    { name: 'Priya Patel', phone: '9876543211', email: null, address: '45 Park Street Mumbai' },
    { name: 'Amit Kumar', phone: '9876543212', email: null, address: null },
    { name: 'Sneha Reddy', phone: '9876543213', email: 'sneha@example.com', address: null },
    { name: 'Saroja Tambulkar', phone: '+91 77964 84784', email: 'manik.tambulkar@multigenesys.com', address: 'Multigenesys Private Limited Suratwala Mark Plaz' },
    { name: 'Maanik Patil', phone: '1234567890', email: 'maanik.speaks@gmail.com', address: 'Gunjarga' },
  ];

  const createdCustomers: Record<string, string> = {};
  for (const c of customers) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers[c.name] = cust.id;
  }

  // 4. Create Invoices
  // Simplified seeding for focus areas mentioned in spec
  
  // INV-2024-001 (Rajesh Sharma, PAID, ₹1,81,023)
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-001',
      invoiceDate: new Date('2026-03-10'),
      customerId: createdCustomers['Rajesh Sharma'],
      subtotal: 175750.49,
      gstPercent: 3,
      gstAmount: 5272.51,
      grandTotal: 181023,
      status: InvoiceStatus.PAID,
      items: {
        create: [
          { description: 'Gold Necklace', metalType: '22K', weightGrams: 25.5, ratePerGram: 6500, makingCharges: 10000, lineTotal: 175750.49 }
        ]
      },
      payments: {
        create: [
          { paymentDate: new Date('2026-03-10'), amount: 181023, paymentMode: PaymentMode.CASH, balanceAfter: 0 }
        ]
      }
    }
  });

  // INV-2026-002 (Maanik Patil, PARTIAL, ₹1,59,743)
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-002',
      invoiceDate: new Date('2026-03-15'),
      customerId: createdCustomers['Maanik Patil'],
      subtotal: 155090.29,
      gstPercent: 3,
      gstAmount: 4652.71,
      grandTotal: 159743,
      status: InvoiceStatus.PARTIAL,
      items: {
        create: [
          { description: 'Full Set Jewelry', metalType: '24K', weightGrams: 22, ratePerGram: 6800, makingCharges: 5500, lineTotal: 155090.29 }
        ]
      }
    }
  });

  await prisma.payment.createMany({
    data: [
      { invoiceId: inv2.id, paymentDate: new Date('2026-03-15'), amount: 10000, paymentMode: PaymentMode.CHEQUE, referenceNumber: '1234567890', balanceAfter: 149743 },
      { invoiceId: inv2.id, paymentDate: new Date('2026-03-15'), amount: 49743, paymentMode: PaymentMode.UPI, referenceNumber: '123456789', balanceAfter: 100000 }
    ]
  });

  // INV-2024-005 (Rajesh Sharma, UNPAID, 18K Gold Earrings)
  await prisma.invoice.create({
    data: {
        invoiceNumber: 'INV-2024-005',
        invoiceDate: new Date('2026-03-15'),
        customerId: createdCustomers['Rajesh Sharma'],
        subtotal: 48000,
        gstPercent: 3,
        gstAmount: 1440,
        grandTotal: 49440,
        status: InvoiceStatus.UNPAID,
        items: {
          create: [
            { description: '18K Gold Earrings', metalType: '18K', weightGrams: 8, ratePerGram: 5500, makingCharges: 4000, lineTotal: 48000 }
          ]
        }
    }
  });

  console.log('🌱 Seed data inserted!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
