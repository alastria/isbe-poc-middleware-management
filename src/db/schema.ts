import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';

export const roleTypeEnum = pgEnum('role_type', [
  'basic',        // solo principal
  'developer',    // principal + proveedor
  'op_exec',      // principal + operator_exec
  'auditor',      // principal + auditor
  'op_cons'     // principal + operator_cons
]);

// Tipo para selected_role
export type SelectedRole = {
  principal: boolean;
  auditor: boolean|undefined
  proveedor: boolean|undefined
  operator_exec: boolean|undefined
  operator_cons: boolean|undefined
};

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
  contract: jsonb('contract').notNull(), // Metadata del documento: {url, filename, size, mimeType}
  selected_role: jsonb('selected_role').notNull().$type<SelectedRole>(), // JSON con roles seleccionados
  role_id: integer('role_id')
    .references(() => roles.id, { onDelete: 'restrict' }), // Ahora es opcional, se añade después
  need_review: boolean('need_review').notNull().default(false),
  reason_review: text('reason_review'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  modified_at: timestamp('modified_at').notNull().defaultNow(),
}).enableRLS();

export type RoleType = (typeof roleTypeEnum.enumValues)[number];
