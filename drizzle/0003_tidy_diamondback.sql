ALTER TABLE "managements" ADD COLUMN "need_review" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "managements" ADD COLUMN "reason_review" text;