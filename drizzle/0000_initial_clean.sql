-- Drop old tables if they exist
DROP TABLE IF EXISTS "notifications" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "managements" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "roles" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "role" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "role_type" CASCADE;--> statement-breakpoint

-- Create new enum type
CREATE TYPE "public"."role_type" AS ENUM('developer', 'operator', 'auditor');--> statement-breakpoint

-- Create roles table
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "role_type" NOT NULL,
	"policies" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_type_unique" UNIQUE("type")
);
--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Create managements table
CREATE TABLE "managements" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_identifier" text NOT NULL,
	"principal_contract" jsonb NOT NULL,
	"operator_anexo" jsonb,
	"auditor_anexo" jsonb,
	"role_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "managements_organization_identifier_unique" UNIQUE("organization_identifier")
);
--> statement-breakpoint
ALTER TABLE "managements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "managements" ADD CONSTRAINT "managements_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;
