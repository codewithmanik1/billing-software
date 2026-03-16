import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse, errorResponse } from '../utils/apiResponse';

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  tagline: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

export const getProfile = async (_req: Request, res: Response) => {
  try {
    let profile = await prisma.shopProfile.findFirst();
    if (!profile) {
      profile = await prisma.shopProfile.create({ data: {} });
    }
    return res.json(successResponse(profile));
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json(errorResponse('Failed to fetch profile'));
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(errorResponse('Validation failed', parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))));
  }

  try {
    let profile = await prisma.shopProfile.findFirst();
    if (!profile) {
      profile = await prisma.shopProfile.create({ data: parsed.data });
    } else {
      profile = await prisma.shopProfile.update({
        where: { id: profile.id },
        data: parsed.data,
      });
    }
    return res.json(successResponse(profile));
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json(errorResponse('Failed to update profile'));
  }
};
