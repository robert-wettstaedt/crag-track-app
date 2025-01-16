DROP INDEX IF EXISTS "files_type_idx";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN IF EXISTS "type";