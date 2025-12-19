import { Router } from 'express';
import {
  uploadMiddleware,
  createManagement,
  downloadManagementDocument,
  updateManagementContract,
  updateManagementRole,
  getManagementByOrganization,
  getAllManagementsAdmin,
  getManagementById,
  deleteManagementByOrganization
} from './managements.controller.js';
import { authorize } from '../auth/authZ.middleware.js';

const managementsRouter: Router = Router();

// All admin routes require all actions (read, write, delete) on ISBE/BaaS with domain type
const organizationPowerRequirement = {
  domain: 'ISBE',
  function: 'Management',
  type: 'organization', // Only domain admins can access admin endpoints
  action: ['*'], // Requires all actions or "*"
};
const adminPowerRequirement = {
  domain: 'ISBE',
  function: 'Management',
  type: 'domain', // Only domain admins can access admin endpoints
  action: ['*'], // Requires all actions or "*"
};

// POST - Crear un nuevo management con archivos (sin role_id)
managementsRouter.post(
  '/',
  authorize({
    requirePower: [
      { ...adminPowerRequirement, action: ["write", "*"] }
    ]
  }),
  uploadMiddleware,
  createManagement
);

// GET - Descargar el documento/contrato
managementsRouter.get(
  '/:organization_identifier/documents',
  authorize({
    requirePower: [
      { ...organizationPowerRequirement, action: ['read', '*'] },
      { ...adminPowerRequirement, action: ['*', 'read'] }
    ]
  }),
  downloadManagementDocument
);

// PUT - Actualizar contrato (para usuarios de la organización)
managementsRouter.put(
  '/:organization_identifier/contract',
  authorize({
    requirePower: [
      { ...adminPowerRequirement, action: ['write', '*'] }
    ]
  }),
  uploadMiddleware,
  updateManagementContract
);

// PUT - Asignar/cambiar rol (solo admin);
managementsRouter.put(
  '/:organization_identifier/role',
  authorize({
    requirePower: [
      { ...adminPowerRequirement, action: ['*'] }
    ]
  }),
  updateManagementRole
);

// GET - Obtener management por organization_identifier (para la organización)
managementsRouter.get(
  '/organization/:organization_identifier',
  authorize({
    requirePower: [
        { ...organizationPowerRequirement, action: ['read', '*'] },
      { ...adminPowerRequirement, action: ['*', 'read'] }
    ]
  }),
  getManagementByOrganization
);

// GET - Obtener todos los managements (solo admin)
managementsRouter.get(
  '/admin/all',
  authorize({
    requirePower: [
      { ...adminPowerRequirement, action: ['*', 'read'] }
    ]
  }),
  getAllManagementsAdmin
);

// GET - Obtener management por id
managementsRouter.get(
  '/:id',
  authorize({
    requirePower: [
      { ...organizationPowerRequirement, action: ['read', '*'] },
      { ...adminPowerRequirement, action: ['*', 'read'] }
    ]
  }),
  getManagementById
);

// DELETE - Eliminar management por organization_identifier
managementsRouter.delete(
  '/organization/:organization_identifier',
  authorize({
    requirePower: [
      { ...adminPowerRequirement, action: ['*', "write"] }
    ]
  }),
  deleteManagementByOrganization
);

export default managementsRouter;
