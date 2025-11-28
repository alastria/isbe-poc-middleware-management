CREATE TYPE "public"."role_type" AS ENUM('basic', 'developer', 'op_exec', 'auditor', 'op_cons');--> statement-breakpoint
CREATE TABLE "managements" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_identifier" text NOT NULL,
	"contract" jsonb NOT NULL,
	"selected_role" jsonb NOT NULL,
	"role_id" integer,
	"need_review" boolean DEFAULT false NOT NULL,
	"reason_review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"modified_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "managements_organization_identifier_unique" UNIQUE("organization_identifier")
);
--> statement-breakpoint
ALTER TABLE "managements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "managements" ADD CONSTRAINT "managements_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;