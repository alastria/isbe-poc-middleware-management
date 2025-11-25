# Implementación de Almacenamiento de Archivos en Disco Local

## 📦 Instalación de Dependencias

```bash
pnpm add multer
pnpm add -D @types/multer
```

## 📁 Estructura de Directorios

El sistema creará automáticamente el directorio `/uploads` en la raíz del proyecto para almacenar los archivos.

```
isbe-poc-middleware-management/
├── src/
├── uploads/              # ← Archivos subidos (creado automáticamente)
│   ├── ORG-2024-001_principal_contract_1234567890_contrato.pdf
│   ├── ORG-2024-001_operator_anexo_1234567891_anexo.pdf
│   └── ...
└── ...
```

## 🔧 Configuración en Docker

### docker-compose.yaml

Añade un volumen para persistir los archivos:

```yaml
services:
  managements_api:
    build: .
    volumes:
      - ./uploads:/app/uploads  # ← Añadir esta línea
      - ./src:/app/src
    # ... resto de configuración
```

### .dockerignore

Añade para evitar copiar archivos temporales:

```
uploads/
node_modules/
```

## 🚀 Uso en el Controller

Actualiza `managements.controller.ts` para manejar archivos:

```typescript
import { upload, generateFileMetadata } from '../../utils/fileStorage.js';

// Configurar multer para manejar múltiples archivos
export const uploadMiddleware = upload.fields([
  { name: 'principal_contract', maxCount: 1 },
  { name: 'operator_anexo', maxCount: 1 },
  { name: 'auditor_anexo', maxCount: 1 }
]);

export const createManagement: RequestHandler = async (req, res) => {
  const { organization_identifier, role_id } = req.body ?? {};
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!files?.principal_contract) {
    return res.status(400).json({ error: 'principal_contract file is required' });
  }

  // Generar metadata de los archivos
  const principal_contract = generateFileMetadata(files.principal_contract[0]);
  const operator_anexo = files.operator_anexo ? generateFileMetadata(files.operator_anexo[0]) : undefined;
  const auditor_anexo = files.auditor_anexo ? generateFileMetadata(files.auditor_anexo[0]) : undefined;

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const row = await managementsService.create({
      organization_identifier,
      principal_contract,
      operator_anexo,
      auditor_anexo,
      role_id: role_id ? parseInt(role_id, 10) : undefined
    });

    return res.status(201).json(row);
  } catch (error) {
    // ... manejo de errores
  }
};
```

## 🛣️ Actualización de Rutas

Actualiza `managements.routes.ts`:

```typescript
import { uploadMiddleware } from './managements.controller.js';

// POST - Crear con middleware de upload
managementsRouter.post('/', uploadMiddleware, createManagement);

// PUT - Actualizar con middleware de upload
managementsRouter.put('/:organization_identifier', uploadMiddleware, updateManagement);
```

## 📤 Servir Archivos Estáticos

En `app.ts`, añade:

```typescript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

## 🧪 Probar con curl

### Crear un management con archivos:

```bash
curl -X POST http://localhost:3000/api/managements \
  -F "organization_identifier=ORG-2024-001" \
  -F "principal_contract=@/path/to/contract.pdf" \
  -F "operator_anexo=@/path/to/anexo.pdf" \
  -F "role_id=1"
```

### Actualizar un management:

```bash
curl -X PUT http://localhost:3000/api/managements/ORG-2024-001 \
  -F "operator_anexo=@/path/to/new_anexo.pdf" \
  -F "role_id=2"
```

## 🗑️ Limpieza de Archivos

Si eliminas un management, considera eliminar también sus archivos del disco usando la función `deleteFile` de `fileStorage.ts`.

## ⚠️ Consideraciones de Seguridad

1. **Validación de tipos**: Ya implementada en `fileFilter`
2. **Límite de tamaño**: 10MB por archivo (configurable en `fileStorage.ts`)
3. **Nombres de archivo**: Se sanitizan automáticamente
4. **Permisos**: Asegúrate de que el directorio `/uploads` tenga permisos adecuados

## 📝 Ejemplo de Response

```json
{
  "id": 42,
  "organization_identifier": "ORG-2024-001",
  "principal_contract": {
    "url": "/uploads/ORG-2024-001_principal_contract_1732545123456_contrato.pdf",
    "filename": "contrato.pdf",
    "size": 1048576,
    "mimeType": "application/pdf"
  },
  "operator_anexo": {
    "url": "/uploads/ORG-2024-001_operator_anexo_1732545123457_anexo.pdf",
    "filename": "anexo.pdf",
    "size": 524288,
    "mimeType": "application/pdf"
  },
  "auditor_anexo": null,
  "role_id": 1,
  "created_at": "2024-11-25T15:45:23.456Z",
  "modified_at": "2024-11-25T15:45:23.456Z"
}
```
