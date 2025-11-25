import 'reflect-metadata';
import { createApp } from './app.js';
import 'dotenv/config';
import { connectDatabase } from './db/db.js';
import { runMigrations } from './db/migrate.js';
import { container } from 'tsyringe';
import { registerDbInstance, setContainer } from './di.js';
import { AUTH_N_ENABLED, DEPLOYMENT } from './settings.js';
import { authenticate } from './modules/auth/authN.middleware.js';
import { mockAuthN } from './modules/auth/mockAuthN.js';
import { getRole } from './modules/roles/roleStore.js';

const PORT = Number(DEPLOYMENT.PORT);

async function startServer() {
  console.log('Iniciando servidor...');

  let db;
  try {
    let role = getRole();
    if (role === null || role === undefined) {
      role = 'USER';
      //throw new Error('No se ha recibido un valor válido para role');
    }
    // TODO: is necessary the db role?
    db = await connectDatabase(role);
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

  const authMw = AUTH_N_ENABLED === false ? mockAuthN() : authenticate;
  console.log(`>> The authenticaion is set to: ${AUTH_N_ENABLED}`);

  const app = createApp({ authMiddleware: authMw });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal en la aplicación:', err);
  process.exit(1);
});
