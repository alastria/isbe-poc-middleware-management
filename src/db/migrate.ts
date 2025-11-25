import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import 'dotenv/config';
import { DB_CONNECTION } from '../settings.js';

export async function runMigrations() {
  console.log('Running database migrations...');

  const connectionString = DB_CONNECTION.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not defined in environment variables');
  }

  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });
  try {
    await migrate(db, {
      migrationsFolder: './drizzle',
      migrationsTable: 'drizzle_migrations_managements',
    });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }
}
