import type { Request, Response, NextFunction } from 'express';
import { AUTH_TOKEN, getContainer } from '../../di.js';
import type { AuthZContext } from './jwt.verify.js';

type Rule = {
  rolesAny?: string[];
};

export function authorize(rule: Rule = {}) {
  const allowed = (rule.rolesAny ?? []).map((r) => r.toUpperCase());

  return (_req: Request, res: Response, next: NextFunction) => {
    const di = getContainer();

    if (!di.isRegistered?.(AUTH_TOKEN, true)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const auth = di.resolve<AuthZContext>(AUTH_TOKEN);
    const userRole = String(auth.role ?? '').toUpperCase();

    if (allowed.length > 0 && !allowed.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}
