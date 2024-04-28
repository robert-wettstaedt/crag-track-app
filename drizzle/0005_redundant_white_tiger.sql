ALTER TABLE `crags` RENAME TO `blocks`;--> statement-breakpoint
ALTER TABLE `files` RENAME COLUMN `crag_fk` TO `block_fk`;--> statement-breakpoint
ALTER TABLE `routes` RENAME COLUMN `crag_fk` TO `block_fk`;