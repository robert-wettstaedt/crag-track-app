CREATE TABLE `route_external_resource_27crags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`searchable_id` integer,
	`searchable_type` text,
	`country_name` text,
	`location_name` text,
	`description` text,
	`crag_id` integer,
	`latitude` real,
	`longitude` real,
	`path` text,
	`url` text,
	`external_resources_fk` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `route_external_resource_8a` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zlaggable_name` text,
	`zlaggable_slug` text,
	`zlaggable_id` integer,
	`crag_name` text,
	`crag_slug` text,
	`country_slug` text,
	`country_name` text,
	`area_name` text,
	`area_slug` text,
	`sector_name` text,
	`sector_slug` text,
	`grade_index` integer,
	`type` integer,
	`category` integer,
	`average_rating` real,
	`difficulty` text,
	`url` text,
	`external_resources_fk` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `route_external_resource_the_crag` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`description` text,
	`grade` text,
	`grading_scale` text,
	`node` integer,
	`rating` integer,
	`tags` text,
	`url` text,
	`external_resources_fk` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `route_external_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`route_fk` integer NOT NULL,
	`external_resource_8a_fk` integer,
	`external_resource_27crags_fk` integer,
	`external_resource_the_crag_fk` integer
);
--> statement-breakpoint
CREATE TABLE `user_external_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_fk` integer NOT NULL,
	`cookie_8a` text,
	`cookie_27crags` text,
	`cookie_the_crag` text
);
--> statement-breakpoint
ALTER TABLE `routes` ADD `external_resources_fk` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `user_external_resources_fk` integer;