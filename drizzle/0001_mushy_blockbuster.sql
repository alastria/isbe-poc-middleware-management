ALTER TABLE "managements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "managements" ALTER COLUMN "role_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "managements" ADD COLUMN "contract" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "managements" ADD COLUMN "selected_role" "role_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "managements" DROP COLUMN "principal_contract";--> statement-breakpoint
ALTER TABLE "managements" DROP COLUMN "operator_anexo";--> statement-breakpoint
ALTER TABLE "managements" DROP COLUMN "auditor_anexo";