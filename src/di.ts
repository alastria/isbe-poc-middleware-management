import { container, type DependencyContainer } from 'tsyringe';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema.js';
import type { AuthZContext } from './modules/auth/jwt.verify.js';

export const DB_TOKEN: unique symbol = Symbol('DB_TOKEN');
export const AUTH_TOKEN: unique symbol = Symbol('AUTH_TOKEN');

let currentContainer: DependencyContainer = container;

export function setContainer(c: DependencyContainer) {
  currentContainer = c;
}
export function getContainer(): DependencyContainer {
  return currentContainer;
}

export function registerDbInstance(db: NodePgDatabase<typeof schema>) {
  currentContainer.registerInstance(DB_TOKEN, db);
}

export function registerRequestAuth(di: DependencyContainer, ctx: AuthZContext) {
  di.registerInstance(AUTH_TOKEN, ctx);
}
