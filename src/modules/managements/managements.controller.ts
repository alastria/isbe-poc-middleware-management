import { type RequestHandler } from 'express';
import type { Multer } from 'multer';
import { getContainer } from '../../di.js';
import { CustomError, ErrorCode } from '../../utils/errors.js';
import { ManagementsService } from './managements.service.js';
import { upload, generateFileMetadata } from '../../utils/fileStorage.js';

// Middleware de multer para manejar subida de archivos
export const uploadMiddleware: ReturnType<Multer['fields']> = upload.fields([
  { name: 'principal_contract', maxCount: 1 },
  { name: 'operator_anexo', maxCount: 1 },
  { name: 'auditor_anexo', maxCount: 1 }
]);

export const createManagement: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.body ?? {};
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!files?.principal_contract || files.principal_contract.length === 0) {
    return res.status(400).json({ error: 'principal_contract file is required' });
  }

  // Generar metadata de los archivos subidos
  const principalContractFile = files.principal_contract[0];
  if (!principalContractFile) {
    return res.status(400).json({ error: 'principal_contract file is invalid' });
  }

  const principal_contract = generateFileMetadata(principalContractFile);
  const operator_anexo = files.operator_anexo && files.operator_anexo.length > 0 && files.operator_anexo[0]
    ? generateFileMetadata(files.operator_anexo[0])
    : undefined;
  const auditor_anexo = files.auditor_anexo && files.auditor_anexo.length > 0 && files.auditor_anexo[0]
    ? generateFileMetadata(files.auditor_anexo[0])
    : undefined;

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const row = await managementsService.create({
      organization_identifier,
      principal_contract,
      ...(operator_anexo && { operator_anexo }),
      ...(auditor_anexo && { auditor_anexo })
    });

    return res.status(201).json(row);
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(400).json({ code: error.code, error: error.message });
    }
    console.error('createManagement error:', error);
    return res.status(500).json({ error: 'Failed to create management' });
  }
};

// PUT para usuarios: Actualizar documentos/anexos
export const updateManagementDocuments: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'At least one file is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  // Generar metadata solo para los archivos que se hayan subido
  const updateData: any = {};

  if (files?.principal_contract && files.principal_contract.length > 0 && files.principal_contract[0]) {
    updateData.principal_contract = generateFileMetadata(files.principal_contract[0]);
  }

  if (files?.operator_anexo && files.operator_anexo.length > 0 && files.operator_anexo[0]) {
    updateData.operator_anexo = generateFileMetadata(files.operator_anexo[0]);
  }

  if (files?.auditor_anexo && files.auditor_anexo.length > 0 && files.auditor_anexo[0]) {
    updateData.auditor_anexo = generateFileMetadata(files.auditor_anexo[0]);
  }

  try {
    const row = await managementsService.update(organization_identifier, updateData);

    return res.status(200).json(row);
  } catch (error) {
    if (error instanceof CustomError) {
      const statusCode = error.code === ErrorCode.NOT_FOUND ? 404 : 400;
      return res.status(statusCode).json({ code: error.code, error: error.message });
    }
    console.error('updateManagementDocuments error:', error);
    return res.status(500).json({ error: 'Failed to update management documents' });
  }
};

// PUT para admin: Asignar rol y políticas
export const updateManagementRole: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};
  const { role_id } = req.body ?? {};

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!role_id) {
    return res.status(400).json({ error: 'role_id is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const row = await managementsService.update(organization_identifier, {
      role_id: parseInt(role_id, 10)
    });

    return res.status(200).json(row);
  } catch (error) {
    if (error instanceof CustomError) {
      const statusCode = error.code === ErrorCode.NOT_FOUND ? 404 : 400;
      return res.status(statusCode).json({ code: error.code, error: error.message });
    }
    console.error('updateManagementRole error:', error);
    return res.status(500).json({ error: 'Failed to update management role' });
  }
};

export const getManagementByOrganization: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const management = await managementsService.getByOrganization(organization_identifier);
    return res.status(200).json(management);
  } catch (error) {
    if (error instanceof CustomError && error.code === ErrorCode.NOT_FOUND) {
      return res.status(404).json({ code: error.code, error: error.message });
    }
    console.error('getManagementByOrganization error:', error);
    return res.status(500).json({ error: 'Failed to get management' });
  }
};

export const getAllManagementsAdmin: RequestHandler = async (req, res) => {
  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const managements = await managementsService.getAll();
    return res.status(200).json(managements);
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(400).json({ code: error.code, error: error.message });
    }
    console.error('getAllManagementsAdmin error:', error);
    return res.status(500).json({ error: 'Failed to list managements' });
  }
};

export const getManagementById: RequestHandler = async (req, res) => {
  const { id } = req.params ?? {};

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const management = await managementsService.getById(Number(id));
    return res.status(200).json(management);
  } catch (error) {
    if (error instanceof CustomError && error.code === ErrorCode.NOT_FOUND) {
      return res.status(404).json({ code: error.code, error: error.message });
    }
    console.error('getManagementById error:', error);
    return res.status(500).json({ error: 'Failed to get management' });
  }
};
