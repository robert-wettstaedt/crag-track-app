CREATE TABLE "grades" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"FB" text,
	"V" text
);
--> statement-breakpoint
ALTER TABLE "user_external_resources" RENAME TO "user_settings";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "user_external_resources_fk" TO "user_settings_fk";--> statement-breakpoint
ALTER TABLE "ascents" ADD "grade_fk" integer;--> statement-breakpoint
ALTER TABLE "routes" ADD "grade_fk" integer;--> statement-breakpoint
ALTER TABLE "user_settings" ADD "grading_scale" text DEFAULT 'FB' NOT NULL;