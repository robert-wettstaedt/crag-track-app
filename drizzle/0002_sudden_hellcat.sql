CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`mime` text,
	`type` text NOT NULL,
	`boulder_fk` integer,
	`crag_fk` integer
);
