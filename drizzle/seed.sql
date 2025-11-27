-- Datos semilla para la base de datos de ISBE POC Middleware Management
-- Este script se puede ejecutar manualmente si es necesario
-- NOTA: El seed automático se ejecuta desde src/db/migrate.ts al iniciar la aplicación

-- ====================================
-- 1. INSERTAR ROLES CON SUS POLÍTICAS
-- ====================================
-- Este seed se ejecuta automáticamente al arrancar, pero puedes ejecutarlo manualmente con:
-- docker compose exec -T postgres psql -U postgres -d isbe_middleware < drizzle/seed.sql

INSERT INTO roles (type, policies) VALUES
  ('developer', '[{
      "action": ["*"],
      "domain": "ISBE",
      "function": "*",
      "type": "organization"
    }]'::jsonb),

  ('operator', '[{
      "action": ["*"],
      "domain": "ISBE",
      "function": "*",
      "type": "organization"
    }, {
      "action": ["*"],
      "domain": "ISBE",
      "function": "NodeManagement",
      "type": "organization"
    }]'::jsonb),

  ('auditor', '[{
      "action": ["read"],
      "domain": "ISBE",
      "function": "*",
      "type": "domain"
    }]'::jsonb)
ON CONFLICT (type) DO UPDATE SET
  policies = EXCLUDED.policies,
  modified_at = NOW();


-- ====================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- ====================================

-- Mostrar roles creados
SELECT
  id,
  type,
  policies
FROM roles
ORDER BY id;

-- Fin del script de datos semilla
