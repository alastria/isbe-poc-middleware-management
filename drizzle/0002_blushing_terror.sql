ALTER TABLE "roles" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
-- añade 'basic' si no existe
ALTER TYPE "public"."role_type"
  ADD VALUE IF NOT EXISTS 'basic';

-- añade 'developer' después de basic
ALTER TYPE "public"."role_type"
  ADD VALUE IF NOT EXISTS 'developer' AFTER 'basic';

-- añade 'op_exec' después de developer
ALTER TYPE "public"."role_type"
  ADD VALUE IF NOT EXISTS 'op_exec' AFTER 'developer';

-- añade 'auditor' después de op_exec
ALTER TYPE "public"."role_type"
  ADD VALUE IF NOT EXISTS 'auditor' AFTER 'op_exec';

-- añade 'op_cons' después de auditor
ALTER TYPE "public"."role_type"
  ADD VALUE IF NOT EXISTS 'op_cons' AFTER 'auditor';

ALTER TABLE "roles" ALTER COLUMN "type" SET DATA TYPE "public"."role_type" USING "type"::"public"."role_type";--> statement-breakpoint
ALTER TABLE "managements"
  ALTER COLUMN "selected_role"
  TYPE jsonb
  USING jsonb_build_object('role', "selected_role"::text);