import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { DB_CONNECTION } from './src/settings';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: DB_CONNECTION.DATABASE_URL!,
  },
});
