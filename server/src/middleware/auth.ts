import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is required.' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string | number };
    } catch (error) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    const userId = typeof decoded.id === 'string' ? Number(decoded.id) : decoded.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
};
