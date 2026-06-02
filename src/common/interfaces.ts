import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: 'admin' | 'client' | 'rider';
  };
}
