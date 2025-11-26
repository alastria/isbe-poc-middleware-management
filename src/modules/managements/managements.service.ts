import { inject, injectable } from 'tsyringe';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { DB_TOKEN } from '../../di.js';
import { CustomError, ErrorCode } from '../../utils/errors.js';
import * as schema from '../../db/schema.js';
import { managements, roles, type RoleType } from '../../db/schema.js';

type DocumentMetadata = {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
};

type ManagementInput = {
  organization_identifier: string;
  contract: DocumentMetadata;
  selected_role: RoleType;
  role_id?: number; // Opcional, se añade después mediante modificación
};

@injectable()
export class ManagementsService {
  constructor(@inject(DB_TOKEN) private readonly db: NodePgDatabase<typeof schema>) {}

  async create(input: ManagementInput) {
    try {
      let roleId = input.role_id;

      // Si selected_role es 'operator' o 'developer', asignar automáticamente el role_id
      if ((input.selected_role === 'operator' || input.selected_role === 'developer') && !roleId) {
        const [role] = await this.db
          .select()
          .from(roles)
          .where(eq(roles.type, input.selected_role))
          .limit(1);

        if (role) {
          roleId = role.id;
        }
      }

      const rows = await this.db
        .insert(managements)
        .values({ ...input, role_id: roleId })
        .returning();

      if (!rows?.length) {
        throw new CustomError(ErrorCode.DB_OPERATION_FAILED, 'Insert returned no rows.');
      }
      return rows[0];
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to create management.',
        err instanceof Error ? err : undefined,
      );
    }
  }

  async update(organization_identifier: string, input: Partial<ManagementInput>) {
    try {
      const rows = await this.db
        .update(managements)
        .set({ ...input, modified_at: new Date() })
        .where(eq(managements.organization_identifier, organization_identifier))
        .returning();

      if (!rows?.length) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Management not found');
      }
      return rows[0];
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to update management.',
        err instanceof Error ? err : undefined,
      );
    }
  }

  async getByOrganization(organization_identifier: string) {
    try {
      const [row] = await this.db
        .select({
          id: managements.id,
          organization_identifier: managements.organization_identifier,
          contract: managements.contract,
          selected_role: managements.selected_role,
          role_id: managements.role_id,
          created_at: managements.created_at,
          modified_at: managements.modified_at,
          role: {
            id: roles.id,
            type: roles.type,
            policies: roles.policies,
            created_at: roles.created_at,
            modified_at: roles.modified_at,
          },
        })
        .from(managements)
        .leftJoin(roles, eq(managements.role_id, roles.id))
        .where(eq(managements.organization_identifier, organization_identifier))
        .limit(1);

      if (!row) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Management not found');
      }

      return row;
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to get management',
        err instanceof Error ? err : undefined,
      );
    }
  }

  async getAll() {
    try {
      const rows = await this.db.select().from(managements);
      return rows;
    } catch (err) {
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to list managements',
        err instanceof Error ? err : undefined,
      );
    }
  }

  async getById(id: number) {
    try {
      const [row] = await this.db
        .select({
          id: managements.id,
          organization_identifier: managements.organization_identifier,
          contract: managements.contract,
          selected_role: managements.selected_role,
          role_id: managements.role_id,
          created_at: managements.created_at,
          modified_at: managements.modified_at,
          role: {
            id: roles.id,
            type: roles.type,
            policies: roles.policies,
            created_at: roles.created_at,
            modified_at: roles.modified_at,
          },
        })
        .from(managements)
        .leftJoin(roles, eq(managements.role_id, roles.id))
        .where(eq(managements.id, id))
        .limit(1);

      if (!row) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Management not found');
      }

      return row;
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to get management',
        err instanceof Error ? err : undefined,
      );
    }
  }

  async updateRoleByType(organization_identifier: string, roleType: RoleType) {
    try {
      // Buscar el role_id correspondiente al type
      const [role] = await this.db
        .select()
        .from(roles)
        .where(eq(roles.type, roleType))
        .limit(1);

      if (!role) {
        throw new CustomError(ErrorCode.NOT_FOUND, `Role type '${roleType}' not found`);
      }

      // Actualizar el management con el role_id encontrado
      const rows = await this.db
        .update(managements)
        .set({ role_id: role.id, modified_at: new Date() })
        .where(eq(managements.organization_identifier, organization_identifier))
        .returning();

      if (!rows?.length) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Management not found');
      }

      return rows[0];
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to update management role',
        err instanceof Error ? err : undefined,
      );
    }
  }
}
