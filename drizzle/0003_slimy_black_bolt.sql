CREATE TABLE `first_ascents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`climber_name` text,
	`year` integer,
	`boulder_fk` integer NOT NULL,
	`climber_fk` integer
);
--> statement-breakpoint
ALTER TABLE boulders ADD `first_ascent_fk` integer;