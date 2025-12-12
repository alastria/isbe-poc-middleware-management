import { type RequestHandler } from 'express';
import type { Multer } from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { getContainer } from '../../di.js';
import { CustomError, ErrorCode } from '../../utils/errors.js';
import { ManagementsService } from './managements.service.js';
import { upload, generateFileMetadata, deleteFile } from '../../utils/fileStorage.js';
import type { SelectedRole } from '../../db/schema.js';

// Middleware de multer para manejar subida de archivos
export const uploadMiddleware: ReturnType<Multer['fields']> = upload.fields([
  { name: 'contract', maxCount: 1 }
]);

export const createManagement: RequestHandler = async (req, res) => {
  const { organization_identifier, selected_role } = req.body ?? {};
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!selected_role) {
    return res.status(400).json({ error: 'selected_role is required' });
  }

  // Validar y parsear selected_role
  let parsedSelectedRole: SelectedRole;
  try {
    parsedSelectedRole = typeof selected_role === 'string' ? JSON.parse(selected_role) : selected_role;

    // Validar estructura
    if (
      (parsedSelectedRole.principal !== true && typeof parsedSelectedRole.principal !== 'boolean') ||
      (parsedSelectedRole.auditor !== undefined && typeof parsedSelectedRole.auditor !== 'boolean') ||
      (parsedSelectedRole.developer !== undefined && typeof parsedSelectedRole.developer !== 'boolean') ||
      (parsedSelectedRole.op_exec !== undefined && typeof parsedSelectedRole.op_exec !== 'boolean') ||
      (parsedSelectedRole.op_cons !== undefined && typeof parsedSelectedRole.op_cons !== 'boolean')
    ) {
      throw new Error('Invalid selected_role structure');
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: 'selected_role must be a valid JSON with principal (required), auditor, developer, op_exec, op_cons (all optional boolean)'
    });
  }

  if (!files?.contract || files.contract.length === 0) {
    return res.status(400).json({ error: 'contract file is required' });
  }

  // Generar metadata del archivo subido
  const contractFile = files.contract[0];
  if (!contractFile) {
    return res.status(400).json({ error: 'contract file is invalid' });
  }

  const contract = generateFileMetadata(contractFile);

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const row = await managementsService.create({
      organization_identifier,
      contract,
      selected_role: parsedSelectedRole
    });

    return res.status(201).json(row);
  } catch (error) {
    if (error instanceof CustomError) {
      //Eliminar archivo si hubo error al crear el management
      const deleteResult = deleteFile(contract.savedName);
      if (deleteResult) {
        return res.status(400).json({ code: error.code, error: error.message });
      }
    }
    console.error('createManagement error:', error);
    return res.status(500).json({ error: 'Failed to create management' });
  }
};

// GET para descargar el documento/contrato
export const downloadManagementDocument: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const management = await managementsService.getByOrganization(organization_identifier);

    if (!management.contract || typeof management.contract !== 'object') {
      return res.status(404).json({ error: 'Contract document not found' });
    }

    const contractMetadata = management.contract as any;
    const filePath = path.join(process.cwd(), contractMetadata.url);

    // Verificar que el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Contract file not found on disk' });
    }

    // Enviar el archivo para descarga
    res.setHeader('Content-Type', contractMetadata.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${contractMetadata.filename}"`);

    return res.sendFile(filePath);
  } catch (error) {
    if (error instanceof CustomError && error.code === ErrorCode.NOT_FOUND) {
      return res.status(404).json({ code: error.code, error: error.message });
    }
    console.error('downloadManagementDocument error:', error);
    return res.status(500).json({ error: 'Failed to download document' });
  }
};

// PUT para usuarios: Actualizar contrato
export const updateManagementContract: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!files?.contract || files.contract.length === 0) {
    return res.status(400).json({ error: 'contract file is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  const contractFile = files.contract[0];
  if (!contractFile) {
    return res.status(400).json({ error: 'contract file is invalid' });
  }

  const contract = generateFileMetadata(contractFile);

  try {
    const row = await managementsService.updateContract(organization_identifier, contract);

    return res.status(200).json(row);
  } catch (error) {
    if (error instanceof CustomError) {
      const statusCode = error.code === ErrorCode.NOT_FOUND ? 404 : 400;
      return res.status(statusCode).json({ code: error.code, error: error.message });
    }
    console.error('updateManagementContract error:', error);
    return res.status(500).json({ error: 'Failed to update contract' });
  }
};

// PUT para admin: Asignar rol y políticas
export const updateManagementRole: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};
  const { role_type, selected_role } = req.body ?? {};

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  if (!role_type) {
    return res.status(400).json({ error: 'role_type is required' });
  }

  // Validar que role_type sea válido
  const validRoleTypes = ['basic', 'developer', 'op_exec', 'auditor', 'op_cons'];
  if (!validRoleTypes.includes(role_type)) {
    return res.status(400).json({
      error: 'Invalid role_type. Must be one of: basic, developer, op_exec, auditor, op_cons'
    });
  }

  // Validar selected_role si se proporciona
  let parsedSelectedRole: SelectedRole | undefined;
  if (selected_role) {
    try {
      parsedSelectedRole = typeof selected_role === 'string' ? JSON.parse(selected_role) : selected_role;

      // Validar estructura
      if (
        !parsedSelectedRole ||
        typeof parsedSelectedRole.principal !== 'boolean' ||
        (parsedSelectedRole.auditor !== undefined && typeof parsedSelectedRole.auditor !== 'boolean') ||
        (parsedSelectedRole.developer !== undefined && typeof parsedSelectedRole.developer !== 'boolean') ||
        (parsedSelectedRole.op_exec !== undefined && typeof parsedSelectedRole.op_exec !== 'boolean') ||
        (parsedSelectedRole.op_cons !== undefined && typeof parsedSelectedRole.op_cons !== 'boolean')
      ) {
        throw new Error('Invalid selected_role structure');
      }
    } catch (err) {
      return res.status(400).json({
        error: 'selected_role must be a valid JSON with principal (required), auditor, developer, op_exec, op_cons (all boolean)'
      });
    }
  }

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const row = await managementsService.updateRoleByType(organization_identifier, role_type, parsedSelectedRole);

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

export const deleteManagementByOrganization: RequestHandler = async (req, res) => {
  const { organization_identifier } = req.params ?? {};

  if (!organization_identifier) {
    return res.status(400).json({ error: 'organization_identifier is required' });
  }

  const managementsService = getContainer().resolve(ManagementsService);

  try {
    const result = await managementsService.deleteByOrganization(organization_identifier);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof CustomError && error.code === ErrorCode.NOT_FOUND) {
      return res.status(404).json({ code: error.code, error: error.message });
    }
    console.error('deleteManagementByOrganization error:', error);
    return res.status(500).json({ error: 'Failed to delete management' });
  }
};
