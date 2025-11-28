import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import 'dotenv/config';
import { DB_CONNECTION } from '../settings.js';
import { roles } from './schema.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';

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

    // Ejecutar seed data
    await seedData(db);
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }
}

async function seedData(db: ReturnType<typeof drizzle>) {
  console.log('Running seed data...');

  try {
    // Leer el archivo seed.sql
    const seedSqlPath = join(process.cwd(), 'drizzle', 'seed.sql');
    const seedSql = readFileSync(seedSqlPath, 'utf-8');

    // Ejecutar el SQL directamente (incluye ON CONFLICT para sobrescribir)
    await db.execute(sql.raw(seedSql));

    console.log('✅ Seed data executed successfully!');
  } catch (error) {
    console.error('Failed to execute seed data:', error);
    // No hacemos exit para que el servidor pueda arrancar aunque falle el seed
  }
}
