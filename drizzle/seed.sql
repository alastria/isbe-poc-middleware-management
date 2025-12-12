-- Datos semilla para la base de datos de ISBE POC Middleware Management
-- Este script se puede ejecutar manualmente si es necesario
-- NOTA: El seed automático se ejecuta desde src/db/migrate.ts al iniciar la aplicación

-- ====================================
-- 1. INSERTAR ROLES CON SUS POLÍTICAS
-- ====================================
-- Este seed se ejecuta automáticamente al arrancar, pero puedes ejecutarlo manualmente con:
-- docker compose exec -T postgres psql -U postgres -d isbe_middleware < drizzle/seed.sql

-- Nuevos tipos de roles basados en la combinación de selected_role:
-- basic: solo principal
-- developer: principal + proveedor
-- op_exec: principal + operator_exec
-- auditor: principal + auditor
-- op_cons: principal + operator_cons

INSERT INTO roles (type, policies) VALUES
  ('basic', '[{
      "action": ["*"],
      "domain": "ISBE",
      "function": "Management",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Helpdesk",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Faucet",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Wizard",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notarization",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notifications",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Identity",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Enrollment",
      "type": "organization"
    },
    {
      "action": ["Execute"],
      "domain": "ISBE",
      "function": "Onboarding",
      "type": "organization"
    }]'::jsonb),

  ('developer', '[{
      "action": ["*"],
      "domain": "ISBE",
      "function": "*",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Management",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Helpdesk",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "BaaS",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Faucet",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Rgpd",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notifications",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Sc",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Wizard",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notarization",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Tokenization",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Identity",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Enrollment",
      "type": "organization"
    },
    {
      "action": ["Execute"],
      "domain": "ISBE",
      "function": "Onboarding",
      "type": "organization"
    },
    {
      "action": ["Create", "Update", "Delete"],
      "domain": "ISBE",
      "function": "ProductOffering",
      "type": "organization"
    }]'::jsonb),

  ('op_exec', '[{
      "action": ["*"],
      "domain": "ISBE",
      "function": "*",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Management",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Helpdesk",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "BaaS",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Faucet",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Permissioning",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Rgpd",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notifications",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Sc",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notarization",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Tokenization",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Identity",
      "type": "organization"
    },
    {
      "action": ["ReadPerm", "WritePerm", "ReadQBFT", "WriteQBFT"],
      "domain": "ISBE",
      "function": "NodeManager",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Enrollment",
      "type": "organization"
    },
    {
      "action": ["Execute"],
      "domain": "ISBE",
      "function": "Onboarding",
      "type": "organization"
    },
    {
      "action": ["Create", "Update", "Delete"],
      "domain": "ISBE",
      "function": "ProductOffering",
      "type": "organization"
    }, {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Rgpd",
      "type": "organization"
    },{
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notifications",
      "type": "organization"
    },{
      "action": ["*"],
      "domain": "ISBE",
      "function": "Sc",
      "type": "organization"
    },{
      "action": ["*"],
      "domain": "ISBE",
      "function": "Wizard",
      "type": "organization"
    },{
      "action": ["*"],
      "domain": "ISBE",
      "function": "Identity",
      "type": "organization"
    },{
      "action": [ "Create","Update","Delete" ],
      "domain": "ISBE",
      "function": "ProductOffering",
      "type": "organization"
}]'::jsonb),

  ('auditor', '[{
      "action": ["read"],
      "domain": "ISBE",
      "function": "*",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Management",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Helpdesk",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "BaaS",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Faucet",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Permissioning",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Rgpd",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Notifications",
      "type": "organization"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Sc",
      "type": "domain"
    },
    {
      "action": ["read"],
      "domain": "ISBE",
      "function": "Identity",
      "type": "domain"
    },
    {
      "action": ["Execute"],
      "domain": "ISBE",
      "function": "Onboarding",
      "type": "domain"
    }]'::jsonb),

  ('op_cons', '[{
      "action": ["*"],
      "domain": "ISBE",
      "function": "Management",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Helpdesk",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Permissioning",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Notifications",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Identity",
      "type": "organization"
    },
    {
      "action": ["ReadPerm", "WritePerm", "ReadQBFT", "WriteQBFT"],
      "domain": "ISBE",
      "function": "NodeManager",
      "type": "organization"
    },
    {
      "action": ["*"],
      "domain": "ISBE",
      "function": "Enrollment",
      "type": "organization"
    },
    {
      "action": ["Execute"],
      "domain": "ISBE",
      "function": "Onboarding",
      "type": "organization"
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
