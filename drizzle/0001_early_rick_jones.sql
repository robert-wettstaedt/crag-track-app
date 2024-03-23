CREATE TABLE `ascents` (
	`boulder` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_by` integer NOT NULL,
	`date_time` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`grade` text,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notes` text,
	`type` text,
	FOREIGN KEY (`boulder`) REFERENCES `boulders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
