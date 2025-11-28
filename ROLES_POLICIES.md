# Políticas de Roles - ISBE Middleware Management

Este documento describe las políticas JSON asociadas a cada tipo de rol en el sistema.

## 1. BASIC
**Combinación:** Solo `principal = true`

**Descripción:** Rol básico con acceso limitado a funciones esenciales de la organización.

```json
[
  {
    "action": ["*"],
    "domain": "ISBE",
    "function": "Management",
    "type": "organization"
  },
  {
    "action": ["*"],
    "domain": "ISBE",
    "function": "Support",
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
    "function": "Notifications",
    "type": "organization"
  },
  {
    "action": ["*"],
    "domain": "ISBE",
    "function": "Identity",
    "type": "organization"
  }
]
```

---

## 2. DEVELOPER
**Combinación:** `principal = true` + `proveedor = true`

**Descripción:** Rol completo para desarrolladores con acceso a todas las funciones y servicios de desarrollo.

```json
[
  {
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
    "function": "Support",
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
    "function": "Rgdp",
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
    "function": "Identity",
    "type": "organization"
  }
]
```

---

## 3. OP_EXEC
**Combinación:** `principal = true` + `operator_exec = true`

**Descripción:** Rol de operador ejecutor con acceso completo incluyendo gestión de nodos y permisos.

```json
[
  {
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
    "function": "Support",
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
    "function": "NodeManagement",
    "type": "organization"
  },
  {
    "action": ["*"],
    "domain": "ISBE",
    "function": "Rgdp",
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
    "function": "Identity",
    "type": "organization"
  }
]
```

---

## 4. AUDITOR
**Combinación:** `principal = true` + `auditor = true`

**Descripción:** Rol de auditoría con permisos de solo lectura a nivel de dominio en la mayoría de funciones.

**⚠️ Nota:** Este rol requiere revisión por parte de ISBE al momento de creación.

```json
[
  {
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
    "function": "Support",
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
    "function": "Rgdp",
    "type": "domain"
  },
  {
    "action": ["*"],
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
    "function": "Wizard",
    "type": "domain"
  },
  {
    "action": ["read"],
    "domain": "ISBE",
    "function": "Identity",
    "type": "domain"
  }
]
```

---

## 5. Operador de Nodo de Consenso (OP_CONS)
**Combinación:** `principal = true` + `operator_cons = true`

**Descripción:** Rol de operador consultor/validador con acceso a gestión, nodos, helpdesk y permisos.

**⚠️ Nota:** Este rol requiere revisión por parte de ISBE al momento de creación.

```json
[
  {
    "action": ["*"],
    "domain": "ISBE",
    "function": "Management",
    "type": "organization"
  },
  {
    "action": ["*"],
    "domain": "ISBE",
    "function": "NodeManagement",
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
  }
]
```

---

## Estructura de Política

Cada entrada en el array de políticas tiene la siguiente estructura:

```typescript
{
  "action": string[],      // Acciones permitidas: ["*"] (todas), ["read"], ["write"], etc.
  "domain": string,        // Dominio: "ISBE"
  "function": string,      // Función específica o "*" para todas
  "type": string          // Tipo: "organization" (organización propia) o "domain" (todo el dominio)
}
```

### Diferencia entre `type: organization` y `type: domain`:
- **`organization`**: Permisos limitados a la organización propia del usuario
- **`domain`**: Permisos extendidos a todo el dominio ISBE (usado principalmente en auditoría)

---

## Revisión Automática

El sistema marca automáticamente para revisión manual por ISBE cuando:

1. **Al crear un management:**
   - Si el rol auto-asignado es `auditor` o `op_cons`
   - Campo `need_review = true`
   - Campo `reason_review = "Requires review by ISBE"`

2. **Al actualizar el contrato:**
   - Cualquier actualización del archivo de contrato
   - Campo `need_review = true`
   - Campo `reason_review = "Contract update, verification in progress."`

3. **Al asignar rol manualmente (admin):**
   - Se limpia el estado de revisión
   - Campo `need_review = false`
   - Campo `reason_review = null`
