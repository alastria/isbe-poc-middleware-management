import { inject, injectable } from 'tsyringe';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { DB_TOKEN } from '../../di.js';
import { CustomError, ErrorCode } from '../../utils/errors.js';
import * as schema from '../../db/schema.js';
import { managements, roles, type RoleType, type SelectedRole } from '../../db/schema.js';

type DocumentMetadata = {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
};

type ManagementInput = {
  organization_identifier: string;
  contract: DocumentMetadata;
  selected_role: SelectedRole;
  role_id?: number; // Opcional, se añade después mediante modificación
};

@injectable()
export class ManagementsService {
  constructor(@inject(DB_TOKEN) private readonly db: NodePgDatabase<typeof schema>) {}

  // Función auxiliar para determinar el tipo de rol basado en selected_role
  private determineRoleType(selectedRole: SelectedRole): RoleType | null {
    const { principal, auditor, developer, op_exec, op_cons } = selectedRole;

    // Si no está principal, no hay rol válido
    if (!principal) {
      return null;
    }

    // Contar cuántos roles adicionales están activos
    const additionalRoles = [auditor, developer, op_exec, op_cons].filter(Boolean).length;

    // Solo principal -> basic
    if (additionalRoles === 0) {
      return 'basic';
    }

    // Principal + un rol adicional
    if (additionalRoles === 1) {
      if (developer) return 'developer';
      if (op_exec) return 'op_exec';
      if (auditor) return 'auditor';
      if (op_cons) return 'op_cons';
    }

    // Si hay múltiples roles adicionales, no asignamos automáticamente
    // El admin tendrá que decidir manualmente
    return null;
  }

  async create(input: ManagementInput) {
    try {
      let roleId = input.role_id;
      let needReview = false;
      let reasonReview: string | null = null;

      // Si no se proporciona role_id, intentar determinar automáticamente
      if (!roleId && input.selected_role) {
        const roleType = this.determineRoleType(input.selected_role);

        if (roleType) {
          // Buscar el role_id correspondiente
          const [role] = await this.db
            .select()
            .from(roles)
            .where(eq(roles.type, roleType))
            .limit(1);

          if (role) {
            roleId = role.id;
          }

          // Si el rol es auditor o op_cons, marcar para revisión por ISBE
          if (roleType === 'auditor' || roleType === 'op_cons') {
            needReview = true;
            reasonReview = 'Requires review by ISBE';
          }
        }
      }

      const rows = await this.db
        .insert(managements)
        .values({
          ...input,
          role_id: roleId,
          need_review: needReview,
          reason_review: reasonReview
        })
        .returning();

      if (!rows?.length) {
        throw new CustomError(ErrorCode.DB_OPERATION_FAILED, 'Insert returned no rows.');
      }

      // Obtener el management completo con la foreign key del role
      const createdId = rows[0]?.id;
      if (!createdId) {
        throw new CustomError(ErrorCode.DB_OPERATION_FAILED, 'Created management has no ID.');
      }

      const management = await this.getById(createdId);

      // Devolver solo id, organization_identifier y powers (policies del rol)
      return {
        id: management.id,
        organization_identifier: management.organization_identifier,
        powers: JSON.stringify(management.role?.policies) || null
      };
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

      // Obtener el management completo con la foreign key del role
      const management = await this.getByOrganization(organization_identifier);
      return management;
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to update management.',
        err instanceof Error ? err : undefined,
      );
    }
  }

  async updateContract(organization_identifier: string, contract: DocumentMetadata) {
    try {
      const rows = await this.db
        .update(managements)
        .set({
          contract,
          need_review: true,
          reason_review: 'Contract update, verification in progress.',
          modified_at: new Date()
        })
        .where(eq(managements.organization_identifier, organization_identifier))
        .returning();

      if (!rows?.length) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Management not found');
      }

      // Obtener el management completo con la foreign key del role
      const management = await this.getByOrganization(organization_identifier);
      return management;
    } catch (err) {
      if (err instanceof CustomError) throw err;
      throw new CustomError(
        ErrorCode.DB_OPERATION_FAILED,
        'Failed to update contract.',
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
          need_review: managements.need_review,
          reason_review: managements.reason_review,
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
          need_review: managements.need_review,
          reason_review: managements.reason_review,
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

  async updateRoleByType(organization_identifier: string, roleType: RoleType, selectedRole?: SelectedRole) {
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

      // Preparar actualización: role_id, limpiar need_review y reason_review
      const updateData: any = {
        role_id: role.id,
        need_review: false,
        reason_review: null,
        modified_at: new Date()
      };

      // Si se proporciona selected_role, también actualizarlo
      if (selectedRole) {
        updateData.selected_role = selectedRole;
      }

      // Actualizar el management
      const rows = await this.db
        .update(managements)
        .set(updateData)
        .where(eq(managements.organization_identifier, organization_identifier))
        .returning();

      if (!rows?.length) {
        throw new CustomError(ErrorCode.NOT_FOUND, 'Management not found');
      }

      // Obtener el management completo con la foreign key del role
      const management = await this.getByOrganization(organization_identifier);
      return management;
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
