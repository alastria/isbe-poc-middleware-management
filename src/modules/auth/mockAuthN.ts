import type { Request, Response, NextFunction } from 'express';
import { setContainer, registerRequestAuth, getContainer } from '../../di.js';
import type { AuthZContext } from './jwt.verify.js';
import { FAKE_AUTHZ_CONTEXT } from '../../settings.js';

export function mockAuthN(fake: Partial<AuthZContext> = {}) {
  return function _mockAuthN(_req: Request, _res: Response, next: NextFunction) {
    const parent = getContainer();
    const child = parent.createChildContainer();
    setContainer(child);
    const defaultFakeAuth: AuthZContext = {
      company_id: FAKE_AUTHZ_CONTEXT.COMPANY_ID,
      user_id: FAKE_AUTHZ_CONTEXT.USER_ID,
      role: FAKE_AUTHZ_CONTEXT.ROLE,
      ...fake,
    };
    registerRequestAuth(child, defaultFakeAuth);
    next();
  };
}
