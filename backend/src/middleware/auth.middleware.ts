import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/apiResponse';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
};

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json(errorResponse('Not authorized, no token'));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as Record<string, unknown>;
    (req as unknown as Record<string, unknown>).user = decoded;
    next();
  } catch (_error) {
    return res.status(401).json(errorResponse('Not authorized, token failed'));
  }
};
