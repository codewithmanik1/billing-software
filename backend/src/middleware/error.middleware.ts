import { NextFunction, Request, Response } from 'express';
import { ApiResponse, errorResponse } from '../utils/apiResponse';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(errorResponse(message));
};
