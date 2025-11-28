import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import 'dotenv/config';
import { DB_CONNECTION } from '../settings.js';
import { roles } from './schema.js';

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
  console.log('Checking seed data...');

  try {
    // Verificar si ya existen roles
    const existingRoles = await db.select().from(roles);

    if (existingRoles.length === 0) {
      console.log('Inserting seed data for roles...');

      // Insertar roles con sus políticas
      await db.insert(roles).values([
        {
          type: 'basic',
          policies: [{
            action: ['read'],
            domain: 'ISBE',
            function: '*',
            type: 'organization'
          }]
        },
        {
          type: 'developer',
          policies: [{
            action: ['*'],
            domain: 'ISBE',
            function: '*',
            type: 'organization'
          }]
        },
        {
          type: 'op_exec',
          policies: [
            {
              action: ['*'],
              domain: 'ISBE',
              function: '*',
              type: 'organization'
            },
            {
              action: ['*'],
              domain: 'ISBE',
              function: 'NodeManagement',
              type: 'organization'
            }
          ]
        },
        {
          type: 'auditor',
          policies: [{
            action: ['read'],
            domain: 'ISBE',
            function: '*',
            type: 'domain'
          }]
        },
        {
          type: 'op_cons',
          policies: [{
            action: ['*'],
            domain: 'ISBE',
            function: 'NodeManager',
            type: 'organization'
          },
        {
            action: ['*'],
            domain: 'ISBE',
            function: 'Permisionado',
            type: 'organization'
          }]
        }
      ]);

      console.log('✅ Seed data inserted successfully!');
    } else {
      console.log(`✓ Roles already exist (${existingRoles.length} found), skipping seed data`);
    }
  } catch (error) {
    console.error('Failed to insert seed data:', error);
    // No hacemos exit para que el servidor pueda arrancar aunque falle el seed
  }
}
