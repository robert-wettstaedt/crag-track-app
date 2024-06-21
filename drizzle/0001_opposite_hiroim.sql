CREATE TABLE `geolocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lat` real NOT NULL,
	`long` real NOT NULL,
	`area_fk` integer,
	`block_fk` integer
);
--> statement-breakpoint
ALTER TABLE `blocks` ADD `geolocation_fk` integer;--> statement-breakpoint
ALTER TABLE `blocks` DROP COLUMN `lat`;--> statement-breakpoint
ALTER TABLE `blocks` DROP COLUMN `long`;