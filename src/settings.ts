import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

dotenv.config({ path: envFile });

export const AUTH_N_ENABLED = process.env.AUTH_N_ENABLED === 'true';

export const DEPLOYMENT = {
  PORT: process.env.PORT ?? 3000,
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
};

export const USER_ROLES = {
  ADMIN: 'admin',
  DEVELOPER: 'developer',
  OPERATOR: 'operator',
};

export const DB_CONNECTION = {
  DATABASE_URL: process.env.DATABASE_URL
};

type AuthSettings = {
  ISSUER: string;
  JWKS_URI: string;
  AUDIENCE?: string | undefined;
};

export const AUTH: AuthSettings = {
  ISSUER: process.env.KEYCLOAK_ISSUER ?? '',
  AUDIENCE: process.env.KEYCLOAK_AUDIENCE ?? undefined,
  JWKS_URI: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
};

export const FAKE_AUTHZ_CONTEXT = {
  COMPANY_ID: process.env.FAKE_COMPANY_ID ?? 'dev-company',
  USER_ID: process.env.FAKE_USER_ID ?? 'dev-user',
  ROLE: process.env.FAKE_ROLE ?? 'USER',
};
