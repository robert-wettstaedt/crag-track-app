CREATE TABLE `routes_to_tags` (
	`route_fk` integer NOT NULL,
	`tag_fk` text NOT NULL,
	PRIMARY KEY(`route_fk`, `tag_fk`),
	FOREIGN KEY (`route_fk`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_fk`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL
);