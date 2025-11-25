import { inject, injectable } from 'tsyringe';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

import { DB_TOKEN } from '../../di.js';
import { CustomError, ErrorCode } from '../../utils/errors.js';
import * as schema from '../../db/schema.js';
import { managements, type RoleType } from '../../db/schema.js';

type DocumentMetadata = {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
};

type ManagementInput = {
  organization_identifier: string;
  principal_contract: DocumentMetadata;
  operator_anexo?: DocumentMetadata;
  auditor_anexo?: DocumentMetadata;
  role_id?: number; // Opcional, se añade después mediante modificación
};

@injectable()
export class ManagementsService {
  constructor(@inject(DB_TOKEN) private readonly db: NodePgDatabase<typeof schema>) {}

  async create(input: ManagementInput) {
    try {
      const rows = await this.db.insert(managements).values(input).returning();

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
        .select()
        .from(managements)
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
        .select()
        .from(managements)
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
}
