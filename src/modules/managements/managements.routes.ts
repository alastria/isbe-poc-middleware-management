import { Router } from 'express';
import { authorize } from '../auth/authZ.middleware.js';
import { USER_ROLES } from '../../settings.js';
import {
  uploadMiddleware,
  createManagement,
  updateManagementDocuments,
  updateManagementRole,
  getManagementByOrganization,
  getAllManagementsAdmin,
  getManagementById
} from './managements.controller.js';

const managementsRouter: Router = Router();

// POST - Crear un nuevo management con archivos (sin role_id)
managementsRouter.post('/', uploadMiddleware, createManagement);

// PUT - Actualizar documentos/anexos (para usuarios de la organización)
managementsRouter.put('/:organization_identifier/documents', uploadMiddleware, updateManagementDocuments);

// PUT - Asignar/cambiar rol (solo admin)
// managementsRouter.put('/:organization_identifier/role', authorize({ rolesAny: [USER_ROLES.ADMIN] }), updateManagementRole);
managementsRouter.put('/:organization_identifier/role', updateManagementRole);

// GET - Obtener management por organization_identifier (para la organización)
managementsRouter.get('/organization/:organization_identifier', getManagementByOrganization);

// GET - Obtener todos los managements (solo admin)
// managementsRouter.get('/admin/all', authorize({ rolesAny: [USER_ROLES.ADMIN] }), getAllManagementsAdmin);
managementsRouter.get('/admin/all', getAllManagementsAdmin);

// GET - Obtener management por id
managementsRouter.get('/:id', getManagementById);

export default managementsRouter;
