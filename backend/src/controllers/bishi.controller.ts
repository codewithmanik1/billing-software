import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';
import ExcelJS from 'exceljs';

// Fallback Enums if Prisma Client fails to export them
export enum BishiStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}
export enum BishiMemberStatus {
  ACTIVE = 'ACTIVE',
  WON = 'WON'
}
export enum BishiPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  DUE = 'DUE',
  EXEMPT = 'EXEMPT'
}
export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
}

// Zod schemas for validation
const createBishiSchema = z.object({
  name: z.string().min(1, 'Bishi name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  durationMonths: z.number().int().min(1, 'Duration must be at least 1 month'),
  monthlyAmount: z.number().positive('Monthly amount must be positive'),
  winnersPerMonth: z.number().int().min(1, 'Winners per month must be at least 1').default(1),
});

const updateBishiSchema = z.object({
  name: z.string().min(1, 'Bishi name is required').optional(),
  startDate: z.string().optional(),
  durationMonths: z.number().int().min(1).optional(),
  monthlyAmount: z.number().positive().optional(),
  winnersPerMonth: z.number().int().min(1).optional(),
  status: z.nativeEnum(BishiStatus).optional(),
});

const addMembersSchema = z.object({
  customerIds: z.array(z.string()).min(1, 'At least one customer is required'),
});

const recordPaymentSchema = z.object({
  bishiMemberId: z.number(),
  monthNumber: z.number(),
  amountPaid: z.number().min(0),
  paymentMode: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const announceWinnersSchema = z.object({
  monthNumber: z.number(),
  monthLabel: z.string(),
  memberIds: z.array(z.number()),
});

// Helper for month label
const getMonthLabel = (startDate: Date, monthNum: number) => {
  const date = addMonths(startDate, monthNum - 1);
  return format(date, 'MMMM yyyy');
};

// @ts-ignore
const bishiModel = prisma.bishi;
// @ts-ignore
const bishiMemberModel = prisma.bishiMember;
// @ts-ignore
const bishiPaymentModel = prisma.bishiPayment;
// @ts-ignore
const bishiWinnerModel = prisma.bishiWinner;

// Bishi Management
export const createBishi = async (req: Request, res: Response) => {
  const parsed = createBishiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  try {
    const bishi = await bishiModel.create({
      data: {
        ...parsed.data,
        startDate: new Date(parsed.data.startDate),
      },
    });
    return res.status(201).json(successResponse(bishi));
  } catch (error) {
    console.error('createBishi error:', error);
    return res.status(500).json(errorResponse('Failed to create Bishi'));
  }
};

export const getAllBishis = async (_req: Request, res: Response) => {
  try {
    const bishis = await bishiModel.findMany({
      include: {
        members: {
          select: {
            id: true,
            status: true,
          }
        },
        _count: {
          select: {
            members: true,
            payments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute additional stats
    const formattedBishis = await Promise.all(bishis.map(async (bishi: any) => {
      const activeMemberCount = bishi.members.filter((m: any) => m.status === BishiMemberStatus.ACTIVE).length;
      const wonCount = bishi.members.filter((m: any) => m.status === BishiMemberStatus.WON).length;

      // Compute additional stats (Up to current month only for outstanding)
      const now = new Date();
      const start = new Date(bishi.startDate);
      const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
      const currentMonthNumber = Math.max(1, Math.min(bishi.durationMonths, diffMonths));

      const collections = await bishiPaymentModel.aggregate({
        where: { bishiId: bishi.id },
        _sum: {
          amountPaid: true,
        }
      });

      const outstanding = await bishiPaymentModel.aggregate({
        where: { 
          bishiId: bishi.id,
          monthNumber: { lte: currentMonthNumber }
        },
        _sum: {
          totalOutstanding: true,
        }
      });
      return {
        ...bishi,
        memberCount: bishi._count.members,
        activeMemberCount,
        wonCount,
        currentMonthNumber,
        totalCollectedAllTime: Number(collections._sum.amountPaid || 0),
        totalOutstandingAllTime: Number(outstanding._sum.totalOutstanding || 0),
      };
    }));

    return res.json(successResponse(formattedBishis));
  } catch (error) {
    console.error('getAllBishis error:', error);
    return res.status(500).json(errorResponse('Failed to fetch Bishi list'));
  }
};

export const getBishiById = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  try {
    const bishi = await bishiModel.findUnique({
      where: { id },
      include: {
        members: {
          include: { customer: true },
          orderBy: { memberNumber: 'asc' }
        },
        winners: {
          include: { bishiMember: { include: { customer: true } } },
          orderBy: { monthNumber: 'desc' }
        },
      }
    });

    if (!bishi) return res.status(404).json(errorResponse('Bishi not found'));

    // Compute month status
    const now = new Date();
    const start = new Date(bishi.startDate);
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
    const currentMonthNumber = Math.max(1, Math.min(bishi.durationMonths, diffMonths));

    // Compute stats for detail view
    const collections = await bishiPaymentModel.aggregate({
      where: { bishiId: bishi.id },
      _sum: {
        amountPaid: true,
      }
    });

    const outstanding = await bishiPaymentModel.aggregate({
      where: { 
        bishiId: bishi.id,
        monthNumber: { lte: currentMonthNumber }
      },
      _sum: {
        totalOutstanding: true,
      }
    });

    return res.json(successResponse({ 
      ...bishi, 
      currentMonthNumber,
      totalCollectedAllTime: Number(collections._sum.amountPaid || 0),
      totalOutstandingAllTime: Number(outstanding._sum.totalOutstanding || 0),
    }));
  } catch (error) {
    console.error('getBishiById error:', error);
    return res.status(500).json(errorResponse('Failed to fetch Bishi details'));
  }
};

export const updateBishi = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  const parsed = updateBishiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  try {
    const data: any = { ...parsed.data };
    if (data.startDate) data.startDate = new Date(data.startDate);

    const bishi = await bishiModel.update({
      where: { id },
      data,
    });
    return res.json(successResponse(bishi));
  } catch (error) {
    console.error('updateBishi error:', error);
    return res.status(500).json(errorResponse('Failed to update Bishi'));
  }
};

export const deleteBishi = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  try {
    // Check if there are any payments made
    const actualPaymentsCount = await bishiPaymentModel.count({
      where: {
        bishiId: id,
        amountPaid: { gt: 0 }
      }
    });

    if (actualPaymentsCount > 0) {
      return res.status(400).json(errorResponse('Cannot delete Bishi with existing payments.'));
    }

    // Use a transaction to delete dependent records first
    await prisma.$transaction([
      bishiPaymentModel.deleteMany({ where: { bishiId: id } }),
      bishiWinnerModel.deleteMany({ where: { bishiId: id } }),
      bishiModel.delete({ where: { id: id } }),
    ]);

    return res.json(successResponse(null, 'Bishi deleted successfully'));
  } catch (error) {
    console.error('deleteBishi error:', error);
    return res.status(500).json(errorResponse('Failed to delete Bishi'));
  }
};

// Member Management
export const addMembers = async (req: Request, res: Response) => {
  const bishiId = parseInt(req.params.id as string);
  if (isNaN(bishiId)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  const parsed = addMembersSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  try {
    // REMOVED: Members can now be added even if payments exist. Dues will be auto-calculated.

    const currentMemberCount = await bishiMemberModel.count({ where: { bishiId: bishiId } });
    
    const newMembers = await Promise.all(parsed.data.customerIds.map(async (customerId, index) => {
      return bishiMemberModel.create({
        data: {
          bishiId: bishiId,
          customerId,
          memberNumber: currentMemberCount + index + 1,
        }
      });
    }));

    return res.status(201).json(successResponse(newMembers));
  } catch (error) {
    console.error('addMembers error:', error);
    return res.status(500).json(errorResponse('Failed to add members'));
  }
};

export const getMembers = async (req: Request, res: Response) => {
  const bishiId = parseInt(req.params.id as string);
  if (isNaN(bishiId)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  try {
    const members = await bishiMemberModel.findMany({
      where: { bishiId: bishiId },
      include: { customer: true },
      orderBy: { memberNumber: 'asc' }
    });
    return res.json(successResponse(members));
  } catch (error) {
    console.error('getMembers error:', error);
    return res.status(500).json(errorResponse('Failed to fetch members'));
  }
};

export const removeMember = async (req: Request, res: Response) => {
  const mid = parseInt(req.params.mid as string);
  if (isNaN(mid)) return res.status(400).json(errorResponse('Invalid Member ID'));

  try {
    const paymentsCount = await bishiPaymentModel.count({ where: { bishiMemberId: mid } });
    if (paymentsCount > 0) {
      return res.status(400).json(errorResponse('Cannot remove member with existing payments.'));
    }
    await bishiMemberModel.delete({ where: { id: mid } });
    return res.json(successResponse(null, 'Member removed successfully'));
  } catch (error) {
    console.error('removeMember error:', error);
    return res.status(500).json(errorResponse('Failed to remove member'));
  }
};

// Payment Management
export const getPaymentsByMonth = async (req: Request, res: Response) => {
  const bishiId = parseInt(req.params.id as string);
  const monthNum = parseInt(req.params.monthNum as string);
  if (isNaN(bishiId) || isNaN(monthNum)) return res.status(400).json(errorResponse('Invalid Bishi ID or Month Number'));

  try {
    const bishi = await bishiModel.findUnique({ where: { id: bishiId } });
    if (!bishi) return res.status(404).json(errorResponse('Bishi not found'));

    const members = await bishiMemberModel.findMany({
      where: { bishiId: bishiId },
      include: { customer: true }
    });

    const monthLabel = getMonthLabel(bishi.startDate, monthNum);

    // Auto-initialize or Sync records
    const records = await Promise.all(members.map(async (member: any) => {
      let record = await bishiPaymentModel.findFirst({
        where: { bishiMemberId: member.id, monthNumber: monthNum }
      });

      // SYNC: If record exists but is unpaid, we MUST verify if dueCarriedForward is correct
      // This handles cases where Month 1 was PAID after Month 2 was already viewed/initialized.
      if (record && (record.status === BishiPaymentStatus.PENDING || record.status === BishiPaymentStatus.DUE || record.status === BishiPaymentStatus.PARTIAL)) {
         const lastRecord = await bishiPaymentModel.findFirst({
           where: { bishiMemberId: member.id, monthNumber: { lt: monthNum } },
           orderBy: { monthNumber: 'desc' }
         });
         
         let latestPrevDue = 0;
         if (lastRecord) {
           const gaps = monthNum - 1 - lastRecord.monthNumber;
           latestPrevDue = Number(lastRecord.totalOutstanding) + (gaps * Number(bishi.monthlyAmount));
         } else {
           latestPrevDue = (monthNum - 1) * Number(bishi.monthlyAmount);
         }

         const expectedTotalPayable = Number(record.amountDue) + latestPrevDue;
         const expectedTotalOutstanding = Math.max(0, expectedTotalPayable - Number(record.amountPaid));

         if (Number(record.dueCarriedForward) !== latestPrevDue || Number(record.totalPayable) !== expectedTotalPayable) {
           record = await bishiPaymentModel.update({
             where: { id: record.id },
             data: {
               dueCarriedForward: latestPrevDue,
               totalPayable: expectedTotalPayable,
               totalOutstanding: expectedTotalOutstanding,
               status: expectedTotalOutstanding === 0 ? BishiPaymentStatus.PAID : 
                       (Number(record.amountPaid) > 0 ? BishiPaymentStatus.PARTIAL : BishiPaymentStatus.PENDING)
             }
           });
         }
      }

      if (!record) {
        // Find latest previous record to calculate carry-forward
        let dueCarriedForward = 0;
        if (monthNum > 1) {
          const lastRecord = await bishiPaymentModel.findFirst({
            where: { bishiMemberId: member.id, monthNumber: { lt: monthNum } },
            orderBy: { monthNumber: 'desc' }
          });

          if (lastRecord) {
            // Found a previous record, carry forward its outstanding + any gaps
            const gaps = monthNum - 1 - lastRecord.monthNumber;
            dueCarriedForward = Number(lastRecord.totalOutstanding) + (gaps * Number(bishi.monthlyAmount));
          } else {
            // No previous record at all, they owe for all months from 1 to monthNum-1
            dueCarriedForward = (monthNum - 1) * Number(bishi.monthlyAmount);
          }
        }

        // Exempt check: If they won in a previous month, amountDue should be 0
        const isExempt = member.status === BishiMemberStatus.WON && member.wonMonthNumber !== null && member.wonMonthNumber < monthNum;
        const amountDue = isExempt ? 0 : Number(bishi.monthlyAmount);
        const st = isExempt ? BishiPaymentStatus.EXEMPT : BishiPaymentStatus.PENDING;
        const totalOutstanding = isExempt ? 0 : (amountDue + dueCarriedForward);

        record = await bishiPaymentModel.create({
          data: {
            bishiId: bishiId,
            bishiMemberId: member.id,
            monthNumber: monthNum,
            monthLabel,
            amountDue,
            dueCarriedForward,
            totalPayable: amountDue + dueCarriedForward,
            amountPaid: 0,
            totalOutstanding,
            status: st,
          }
        });
      }

      return { ...record, member };
    }));

    // Summary
    const summary = {
      totalPayable: (records as any[]).reduce((sum: number, r: any) => sum + Number(r.totalPayable), 0),
      totalCollected: (records as any[]).reduce((sum: number, r: any) => sum + Number(r.amountPaid), 0),
      totalOutstanding: (records as any[]).reduce((sum: number, r: any) => sum + Number(r.totalOutstanding), 0),
      paidCount: (records as any[]).filter((r: any) => r.status === BishiPaymentStatus.PAID).length,
      partialCount: (records as any[]).filter((r: any) => r.status === BishiPaymentStatus.PARTIAL).length,
      dueCount: (records as any[]).filter((r: any) => r.status === BishiPaymentStatus.DUE).length,
      pendingCount: (records as any[]).filter((r: any) => r.status === BishiPaymentStatus.PENDING).length,
      exemptCount: (records as any[]).filter((r: any) => r.status === BishiPaymentStatus.EXEMPT).length,
    };

    return res.json(successResponse({ records, summary, monthLabel }));
  } catch (error) {
    console.error('getPaymentsByMonth error:', error);
    return res.status(500).json(errorResponse('Failed to fetch payments'));
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  const parsed = recordPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  const { bishiMemberId, monthNumber, amountPaid, paymentMode, paymentDate, notes } = parsed.data;

  try {
    const bishiMember = await bishiMemberModel.findUnique({
      where: { id: bishiMemberId },
      include: { bishi: true }
    });
    if (!bishiMember) return res.status(404).json(errorResponse('Member not found'));

    // Get current record or initialize
    let record = await bishiPaymentModel.findFirst({
      where: { bishiMemberId, monthNumber }
    });

    let dueCarriedForward = 0;
    if (monthNumber > 1) {
      const prevRecord = await bishiPaymentModel.findFirst({
        where: { bishiMemberId, monthNumber: monthNumber - 1 }
      });
      dueCarriedForward = Number(prevRecord?.totalOutstanding || 0);
    }

    const amountDue = (bishiMember.status === BishiMemberStatus.WON && bishiMember.wonMonthNumber !== null && bishiMember.wonMonthNumber < monthNumber)
      ? 0 : Number(bishiMember.bishi.monthlyAmount);

    const totalPayable = amountDue + dueCarriedForward;
    const totalOutstanding = Math.max(0, totalPayable - amountPaid);
    
    let status: BishiPaymentStatus = BishiPaymentStatus.DUE;
    if (amountPaid >= totalPayable) status = BishiPaymentStatus.PAID;
    else if (amountPaid > 0) status = BishiPaymentStatus.PARTIAL;

    if (record) {
      record = await bishiPaymentModel.update({
        where: { id: record.id },
        data: {
          amountPaid,
          totalOutstanding,
          status,
          paymentMode: paymentMode as any,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          notes,
          updatedAt: new Date(),
        }
      });
    } else {
      record = await bishiPaymentModel.create({
        data: {
          bishiId: bishiMember.bishiId,
          bishiMemberId,
          monthNumber,
          monthLabel: getMonthLabel(new Date(bishiMember.bishi.startDate), monthNumber),
          amountDue,
          dueCarriedForward,
          totalPayable,
          amountPaid,
          totalOutstanding,
          status,
          paymentMode: paymentMode as any,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          notes,
        }
      });
    }

    return res.json(successResponse(record));
  } catch (error) {
    console.error('recordPayment error:', error);
    return res.status(500).json(errorResponse('Failed to record payment'));
  }
};

// Winner Management
export const announceWinners = async (req: Request, res: Response) => {
  const bishiId = parseInt(req.params.id as string);
  if (isNaN(bishiId)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  const parsed = announceWinnersSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  const { monthNumber, monthLabel, memberIds } = parsed.data;

  if (memberIds.length === 0) {
    return res.status(400).json(errorResponse('No members selected'));
  }

  try {
     const bishi = await bishiModel.findUnique({
       where: { id: bishiId },
       include: { members: true }
     });
     if (!bishi) return res.status(404).json(errorResponse('Bishi not found'));

     // Compute Month Status for locking
     const now = new Date();
     const start = new Date(bishi.startDate);
     const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
     const currentMonthNumber = Math.max(1, Math.min(bishi.durationMonths, diffMonths));

     if (monthNumber < currentMonthNumber) {
       return res.status(400).json(errorResponse('Winner cannot be changed for past months'));
     }

     if (memberIds.length > bishi.winnersPerMonth) {
       return res.status(400).json(errorResponse(`Selection exceeds the limit of ${bishi.winnersPerMonth} winner(s) per month`));
     }

    const updatedBishi = await prisma.$transaction(async (tx) => {
      // 1. Identify and Revert Existing Winners for this Month (Replacement Logic)
      const existingWinners = await tx.bishiWinner.findMany({
        where: { bishiId, monthNumber }
      });

      if (existingWinners.length > 0) {
        const existingMemberIds = existingWinners.map(ew => ew.bishiMemberId);
        
        // REVERT Status and Payments for OLD Winners
        for (const emId of existingMemberIds) {
           await tx.bishiMember.update({
              where: { id: emId },
              data: { status: BishiMemberStatus.ACTIVE, wonMonthNumber: null }
           });

           // Revert current month's payment (unwaive)
           const currentP = await tx.bishiPayment.findFirst({
             where: { bishiMemberId: emId, monthNumber }
           });
           if (currentP) {
             const restoredAmountDue = Number(bishi.monthlyAmount);
             const restoredTotalPayable = restoredAmountDue + Number(currentP.dueCarriedForward);
             const restoredTotalOutstanding = Math.max(0, restoredTotalPayable - Number(currentP.amountPaid));

             await tx.bishiPayment.update({
               where: { id: currentP.id },
               data: {
                 amountDue: restoredAmountDue,
                 totalPayable: restoredTotalPayable,
                 totalOutstanding: restoredTotalOutstanding,
                 status: restoredTotalOutstanding === 0 ? BishiPaymentStatus.PAID : 
                         (Number(currentP.amountPaid) > 0 ? BishiPaymentStatus.PARTIAL : BishiPaymentStatus.PENDING),
                 notes: currentP.notes?.replace(' [WON - WAIVED]', '') || ''
               }
             });
           }

           // Revert future months' payments (unexempt)
           await tx.bishiPayment.updateMany({
             where: { bishiMemberId: emId, monthNumber: { gt: monthNumber } },
             data: {
               amountDue: Number(bishi.monthlyAmount),
               status: BishiPaymentStatus.PENDING
             }
           });
        }

        // Delete the old winner records
        await tx.bishiWinner.deleteMany({
           where: { bishiId, monthNumber }
        });
      }

      // 2. Process New Winners
      for (const mid of memberIds) {
        // Create Winner record
        await tx.bishiWinner.create({
          data: {
            bishiId,
            bishiMemberId: mid,
            monthNumber,
            monthLabel,
            announcedBy: 'Admin',
          }
        });

        // Update Member status
        await tx.bishiMember.update({
          where: { id: mid },
          data: {
            status: BishiMemberStatus.WON,
            wonMonthNumber: monthNumber,
          }
        });

        // 3. Waive outstanding for current month
        const currentPayment = await tx.bishiPayment.findFirst({
          where: { bishiMemberId: mid, monthNumber }
        });
        if (currentPayment) {
          await tx.bishiPayment.update({
            where: { id: currentPayment.id },
            data: { totalOutstanding: 0, status: BishiPaymentStatus.PAID, notes: (currentPayment.notes || '') + ' [WON - WAIVED]' }
          });
        }

        // 4. Create/Update exempt future payments
        for (let m = monthNumber + 1; m <= bishi.durationMonths; m++) {
          const exists = await tx.bishiPayment.findFirst({ where: { bishiMemberId: mid, monthNumber: m } });
          if (!exists) {
            await tx.bishiPayment.create({
              data: {
                bishiId,
                bishiMemberId: mid,
                monthNumber: m,
                monthLabel: getMonthLabel(new Date(bishi.startDate), m),
                amountDue: 0,
                dueCarriedForward: 0,
                totalPayable: 0,
                amountPaid: 0,
                totalOutstanding: 0,
                status: BishiPaymentStatus.EXEMPT,
              }
            });
          } else {
            await tx.bishiPayment.update({
              where: { id: exists.id },
              data: {
                amountDue: 0,
                dueCarriedForward: 0,
                totalPayable: 0,
                amountPaid: 0,
                totalOutstanding: 0,
                status: BishiPaymentStatus.EXEMPT,
              }
            });
          }
        }
      }

      // 5. Check if all members have won
      const remainingActive = await tx.bishiMember.count({
        where: { bishiId, status: BishiMemberStatus.ACTIVE }
      });
      if (remainingActive === 0) {
        await tx.bishi.update({
          where: { id: bishiId },
          data: { status: BishiStatus.COMPLETED }
        });
      }

      return tx.bishi.findUnique({ 
        where: { id: bishiId }, 
        include: { members: { include: { customer: true } }, winners: true } 
      });
    });

    return res.json(successResponse(updatedBishi));
  } catch (error) {
    console.error('announceWinners error:', error);
    return res.status(500).json(errorResponse('Failed to announce winners'));
  }
};

export const getWinners = async (req: Request, res: Response) => {
  const bishiId = parseInt(req.params.id as string);
  if (isNaN(bishiId)) return res.status(400).json(errorResponse('Invalid Bishi ID'));

  try {
    const winners = await bishiWinnerModel.findMany({
      where: { bishiId: bishiId },
      include: { bishiMember: { include: { customer: true } } },
      orderBy: { monthNumber: 'asc' }
    });
    return res.json(successResponse(winners));
  } catch (error) {
    console.error('getWinners error:', error);
    return res.status(500).json(errorResponse('Failed to fetch winners'));
  }
};

// Excel Export
export const exportBishiMonth = async (req: Request, res: Response) => {
  const bishiId = parseInt(req.params.id as string);
  const monthNum = parseInt(req.params.monthNum as string);
  if (isNaN(bishiId) || isNaN(monthNum)) return res.status(400).send('Invalid Bishi ID or Month Number');

  try {
    const bishi = await bishiModel.findUnique({ where: { id: bishiId } });
    if (!bishi) return res.status(404).send('Bishi not found');

    const monthLabel = getMonthLabel(new Date(bishi.startDate), monthNum);
    const payments = await bishiPaymentModel.findMany({
      where: { bishiId: bishiId, monthNumber: monthNum },
      include: { bishiMember: { include: { customer: true } } },
      orderBy: { bishiMember: { memberNumber: 'asc' } }
    });

    const winnersThisMonth = await bishiWinnerModel.findMany({
      where: { bishiId: bishiId, monthNumber: monthNum },
      select: { bishiMemberId: true }
    });
    const winnerIds = winnersThisMonth.map((w: any) => w.bishiMemberId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Month ${monthNum}`);

    // Row 1: Merged title
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Bishi: ${bishi.name} | Month ${monthNum}: ${monthLabel}`;
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8A951' } }; // Gold
    titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Headers
    const headers = ['#', 'Name', 'Phone', 'Monthly Amount', 'Prev Due', 'Total Payable', 'Amount Paid', 'Mode', 'Payment Date', 'Status', 'Winner'];
    worksheet.addRow(headers);
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F0' } };

    // Data rows
    payments.forEach((p: any) => {
      const isWinner = winnerIds.includes(p.bishiMemberId);
      const isExempt = p.status === BishiPaymentStatus.EXEMPT;
      
      const rowData = [
        p.bishiMember.memberNumber,
        p.bishiMember.customer.name,
        p.bishiMember.customer.phone,
        Number(p.amountDue),
        Number(p.dueCarriedForward),
        Number(p.totalPayable),
        Number(p.amountPaid),
        p.paymentMode || '-',
        p.paymentDate ? format(new Date(p.paymentDate), 'dd MMM yyyy') : '-',
        isExempt ? `Exempt (Won Month ${p.bishiMember.wonMonthNumber})` : p.status,
        isWinner ? 'WINNER' : ''
      ];

      const row = worksheet.addRow(rowData);

      if (isWinner) {
        row.font = { bold: true, color: { argb: 'FFCC0000' } }; // Red font
      } else if (isExempt) {
        row.font = { color: { argb: 'FF888888' }, italic: true };
      }

      if (p.status === BishiPaymentStatus.DUE || p.status === BishiPaymentStatus.PARTIAL) {
        const statusCell = row.getCell(9);
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3CD' } }; // Orange
      }
    });

    // Formatting currency
    ['D', 'E', 'F', 'G'].forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##,##0.00';
    });

    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    worksheet.getColumn(2).width = 25; // Name

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Bishi-${bishi.name}-Month${monthNum}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('exportBishiMonth error:', error);
    return res.status(500).send('Failed to generate report');
  }
};
