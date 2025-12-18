import 'reflect-metadata';
import { createApp } from './app.js';
import 'dotenv/config';
import { connectDatabase } from './db/db.js';
import { runMigrations } from './db/migrate.js';
import { container } from 'tsyringe';
import { registerDbInstance, setContainer } from './di.js';
import { authenticate } from './modules/auth/authN.middleware.js';
import { DEPLOYMENT } from './settings.js';

const PORT = Number(DEPLOYMENT.PORT);

async function startServer() {
  console.log('Iniciando servidor...');

  let db;
  try {
    db = await connectDatabase();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }

  console.log('Preparando para ejecutar migraciones...');
  await runMigrations()
    .then(() => {
      console.log('Migraciones completadas con éxito.');
    })
    .catch((err) => {
      console.error('Error durante la ejecución de las migraciones:', err);
      process.exit(1);
    });

  const di = container.createChildContainer();
  setContainer(di);
  registerDbInstance(db);

  // TODO: habilitar autenticación
  const authMw = authenticate;

  const app = createApp({ authMiddleware: authMw });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal en la aplicación:', err);
  process.exit(1);
});
