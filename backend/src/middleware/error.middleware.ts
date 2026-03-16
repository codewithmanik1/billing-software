import { NextFunction, Request, Response } from 'express';
import { errorResponse } from '../utils/apiResponse';

export const errorMiddleware = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('❌ Error:', err);

  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (err.message || 'Internal Server Error');

  res.status(statusCode).json(errorResponse(message));
};
