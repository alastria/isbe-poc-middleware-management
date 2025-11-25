import express, { type Express, type RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import managementsRouter from './modules/managements/managements.routes.js';
import { DEPLOYMENT } from './settings.js';
import cors from 'cors';
import { Registry, collectDefaultMetrics, Counter } from 'prom-client'

// create a registry to hold metrics
const registry = new Registry()

// enable default metrics like CPU usage, memory usage, etc.
collectDefaultMetrics({ register: registry })

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiPath = join(__dirname, 'docs', 'openapi.yaml');
const openapiDoc = YAML.parse(readFileSync(openapiPath, 'utf8'));
const allowlist = DEPLOYMENT.ALLOWED_ORIGINS;

export const createApp = (opts: { authMiddleware: RequestHandler }): Express => {
  const app = express();
  app.set('trust proxy', 1);
  if (allowlist.length > 0) {
    app.use(
      cors({
        origin: (origin, cb) => {
          if (!origin || allowlist.includes(origin)) return cb(null, true);
          return cb(new Error('Not allowed by CORS'), false);
        },
        optionsSuccessStatus: 200,
      }),
    );
  } else {
    // sin allowlist ⇒ abrir para todos (por defecto origin="*")
    app.use(cors());
  }

  app.use(express.json());

  // Servir archivos estáticos desde el directorio uploads
  const uploadsPath = join(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });
  // expose the metrics for Prometheus to scrape
  app.get('/metrics', async (req, res) => {
    const result = await registry.metrics()
    res.set('Content-Type', registry.contentType)
    res.send(result)
  });
  app.get('/swagger.json', (req, res) => {
    const base = DEPLOYMENT.PUBLIC_BASE_URL
      ? `${DEPLOYMENT.PUBLIC_BASE_URL}`
      : `${req.protocol}://${req.get('host')}`;
    res.json({ ...openapiDoc, servers: [{ url: base }] });
  });
  app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      explorer: true,
      swaggerOptions: { url: '/swagger.json', persistAuthorization: true },
    }),
  );

  app.use('/api', opts.authMiddleware);

  app.use('/api/managements', managementsRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
};

export default createApp;
