import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env';

dotenv.config({ path: envFile });

export const DEPLOYMENT = {
  PORT: process.env.PORT ?? 3000,
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
};

export const DB_CONNECTION = {
  DATABASE_URL: process.env.DATABASE_URL
};

type AuthSettings = {
  JWKS_URI: string;
  API_KEYS: string[];
};

export const AUTH: AuthSettings = {
  JWKS_URI: `${process.env.KEYCLOAK_JWKS_URI}`,
  API_KEYS: (process.env.API_KEYS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
