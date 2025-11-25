import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt.verify.js';
import { getContainer, registerRequestAuth, setContainer } from '../../di.js';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  console.log('Start authentication...');

  try {
    const auth = req.header('authorization') ?? '';
    console.log(auth);

    const [, token] = auth.split(' ');
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

    const authZContext = await verifyAccessToken(token);

    const parent = getContainer();
    const child = parent.createChildContainer();
    setContainer(child);
    registerRequestAuth(child, {
      company_id: authZContext.company_id,
      user_id: authZContext.user_id,
      role: authZContext.role,
    });

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
