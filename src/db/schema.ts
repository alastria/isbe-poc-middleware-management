import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

export const roleTypeEnum = pgEnum('role_type', ['developer', 'operator', 'auditor']);

// Tabla de roles con sus políticas
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  type: roleTypeEnum('type').notNull().unique(),
  policies: jsonb('policies').notNull(), // JSON con las políticas asociadas al rol
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow(),
}).enableRLS();

// Tabla principal de managements (gestiones)
export const managements = pgTable('managements', {
  id: serial('id').primaryKey(),
  organization_identifier: text('organization_identifier').notNull().unique(),
  principal_contract: jsonb('principal_contract').notNull(), // Metadata del documento: {url, filename, size, mimeType}
  operator_anexo: jsonb('operator_anexo'), // Metadata del documento (opcional)
  auditor_anexo: jsonb('auditor_anexo'), // Metadata del documento (opcional)
  role_id: integer('role_id')
    .references(() => roles.id, { onDelete: 'restrict' }), // Ahora es opcional, se añade después
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow(),
}).enableRLS();

export type RoleType = (typeof roleTypeEnum.enumValues)[number];
