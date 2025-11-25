import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import pg from 'pg';
import { DB_CONNECTION } from '../settings.js';

export async function connectDatabase(role: string): Promise<NodePgDatabase<typeof schema>> {
  const connectionString = DB_CONNECTION.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Error: DATABASE_URL no está definida en las variables de entorno.');
  }

  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });

  // Probar la conexión
  await db.execute('SELECT 1');

  console.log('Conexión exitosa a la base de datos.');
  return db;
}
