import multer, { type FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Request } from 'express';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio base para almacenar archivos
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Crear directorio si no existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generar nombre único: organizationId_fieldname_timestamp_original
    const organizationId = (req.body?.organization_identifier || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${organizationId}_${file.fieldname}_${timestamp}_${basename}${ext}`;
    cb(null, filename);
  }
});

// Filtro de tipos de archivo permitidos
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo por archivo
  }
});

// Función para generar metadata del archivo
export const generateFileMetadata = (file: Express.Multer.File) => {
  return {
    url: `/uploads/${file.filename}`,
    filename: file.originalname,
    size: file.size,
    mimeType: file.mimetype
  };
};

// Función para eliminar archivo del disco
export const deleteFile = (filename: string): boolean => {
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};
