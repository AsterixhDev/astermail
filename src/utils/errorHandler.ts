import { ErrorResponse } from '../types';

export const handleError = (error: unknown): ErrorResponse => {
  if (error instanceof Error) {
    return {
      status: 'error',
      message: error.message,
      details: error.stack,
    };
  }

  return {
    status: 'error',
    message: 'An unknown error occurred',
    details: error,
  };
};
