ALTER TABLE `boulders` RENAME TO `routes`;--> statement-breakpoint
ALTER TABLE `areas` RENAME COLUMN `parent` TO `parent_fk`;--> statement-breakpoint
ALTER TABLE `ascents` RENAME COLUMN `boulder` TO `route_fk`;--> statement-breakpoint
ALTER TABLE `crags` RENAME COLUMN `parent` TO `area_fk`;--> statement-breakpoint
ALTER TABLE `files` RENAME COLUMN `boulder_fk` TO `route_fk`;--> statement-breakpoint
ALTER TABLE `first_ascents` RENAME COLUMN `boulder_fk` TO `route_fk`;--> statement-breakpoint
ALTER TABLE `routes` RENAME COLUMN `parent` TO `crag_fk`;--> statement-breakpoint
/*
 SQLite does not support "Dropping foreign key" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/