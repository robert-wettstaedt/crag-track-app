PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `areas` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` text DEFAULT 'area' NOT NULL,
	`parent_fk` integer,
	FOREIGN KEY (`parent_fk`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO areas VALUES('2024-05-23 08:16:07',1,1,'Ticino','ticino','area',NULL);
INSERT INTO areas VALUES('2024-05-23 08:16:19',2,1,'Chironico','chironico','crag',1);
INSERT INTO areas VALUES('2024-05-23 08:16:30',3,1,'Nivo alta','nivo-alta','sector',2);
INSERT INTO areas VALUES('2024-05-23 08:20:32',4,1,'Savoie','savoie','area',NULL);
INSERT INTO areas VALUES('2024-05-23 08:21:07',5,1,'La Salève','la-salve','crag',4);
INSERT INTO areas VALUES('2024-05-23 08:21:22',6,1,'Chaos des blocs du Salève','chaos-des-blocs-du-salve','sector',5);
INSERT INTO areas VALUES('2024-05-23 08:27:52',7,1,'Lappnor','lappnor','crag',NULL);
INSERT INTO areas VALUES('2024-05-23 08:29:37',8,1,'Happy Auer','happy-auer','sector',7);
INSERT INTO areas VALUES('2024-05-23 08:37:18',9,1,'Red Rock','red-rock','area',NULL);
INSERT INTO areas VALUES('2024-05-23 08:37:28',10,1,'Black Velvet Canyon','black-velvet-canyon','crag',9);
INSERT INTO areas VALUES('2024-05-23 08:39:36',11,1,'Wet Dream','wet-dream','sector',10);
INSERT INTO areas VALUES('2024-05-23 08:46:33',12,1,'Boulder','boulder','area',NULL);
INSERT INTO areas VALUES('2024-05-23 08:47:05',13,1,'Eldorado Canyon','eldorado-canyon','crag',12);
INSERT INTO areas VALUES('2024-05-23 09:11:13',14,1,'Fontainebleau','fontainebleau','area',NULL);
INSERT INTO areas VALUES('2024-05-23 09:13:24',15,1,'Cuvier','cuvier','crag',14);
INSERT INTO areas VALUES('2024-05-23 09:16:08',16,1,'Bas Cuvier','bas-cuvier','sector',15);
INSERT INTO areas VALUES('2024-05-23 09:26:49',17,1,'Cresiano','cresiano','crag',1);
INSERT INTO areas VALUES('2024-05-23 09:27:11',18,1,'Dreamtime','dreamtime','sector',17);
INSERT INTO areas VALUES('2024-05-23 09:36:45',19,1,'Yosemite','yosemite','area',NULL);
INSERT INTO areas VALUES('2024-05-23 09:37:05',20,1,'Yosemite Valley','yosemite-valley','crag',19);
INSERT INTO areas VALUES('2024-05-23 09:37:14',21,1,'Camp 4','camp-4','sector',20);
CREATE TABLE `ascents` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` integer NOT NULL,
	`date_time` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`grade` text,
	`notes` text,
	`type` text NOT NULL,
	`route_fk` integer NOT NULL
);
INSERT INTO ascents VALUES('2024-05-23 08:18:28',1,1,'2022-04-06',NULL,'','attempt',1);
INSERT INTO ascents VALUES('2024-05-23 08:24:50',2,1,'2023-10-18',NULL,'','attempt',2);
INSERT INTO ascents VALUES('2024-05-23 08:31:17',4,1,'2016-10-23',NULL,'','attempt',3);
INSERT INTO ascents VALUES('2024-05-23 08:33:48',5,1,'2023-04-12',NULL,'','attempt',3);
INSERT INTO ascents VALUES('2024-05-23 08:33:57',6,1,'2023-12-27',NULL,'','attempt',3);
INSERT INTO ascents VALUES('2024-05-23 08:34:13',7,1,'2024-03-26',NULL,'','attempt',3);
INSERT INTO ascents VALUES('2024-05-23 08:44:05',8,1,'2021-03-30',NULL,'','attempt',4);
INSERT INTO ascents VALUES('2024-05-23 08:44:16',9,1,'2024-02-20',NULL,'','attempt',4);
INSERT INTO ascents VALUES('2024-05-23 08:51:12',10,1,'2022-05-01',NULL,'','attempt',5);
INSERT INTO ascents VALUES('2024-05-23 09:22:37',11,1,'2024-04-01',NULL,'','flash',6);
INSERT INTO ascents VALUES('2024-05-23 09:28:46',14,1,'2024-04-01',NULL,'','flash',7);
INSERT INTO ascents VALUES('2024-05-23 09:34:15',15,1,'2022-10-19',NULL,'','attempt',1);
INSERT INTO ascents VALUES('2024-05-23 09:34:24',16,1,'2022-10-31',NULL,'','attempt',1);
INSERT INTO ascents VALUES('2024-05-23 09:34:32',17,1,'2022-12-15',NULL,'','attempt',1);
INSERT INTO ascents VALUES('2024-05-23 09:34:44',18,1,'2023-12-21',NULL,'','attempt',1);
INSERT INTO ascents VALUES('2024-05-23 09:40:12',19,1,'2024-04-01',NULL,'','flash',8);
CREATE TABLE `blocks` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`area_fk` integer NOT NULL
, `geolocation_fk` integer);
INSERT INTO blocks VALUES('2024-05-23 08:16:37',1,1,'Blocco 18','blocco-18',3,1);
INSERT INTO blocks VALUES('2024-05-23 08:21:43',2,1,'Le Coin','le-coin',6,2);
INSERT INTO blocks VALUES('2024-05-23 08:30:00',3,1,'Burden of Dreams','burden-of-dreams',8,3);
INSERT INTO blocks VALUES('2024-05-23 08:39:44',4,1,'Sleepwalker','sleepwalker',11,4);
INSERT INTO blocks VALUES('2024-05-23 08:48:03',5,1,'Tron','tron',13,5);
INSERT INTO blocks VALUES('2024-05-23 09:19:34',6,1,'La Marie Rose','la-marie-rose',16,6);
INSERT INTO blocks VALUES('2024-05-23 09:27:18',7,1,'Masso 11b','masso-11b',18,NULL);
INSERT INTO blocks VALUES('2024-05-23 09:37:24',8,1,'Big Columbia Boulder','big-columbia-boulder',21,7);
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`type` text NOT NULL,
	`area_fk` integer,
	`ascent_fk` integer,
	`route_fk` integer,
	`block_fk` integer
);
CREATE TABLE `first_ascents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`climber_name` text,
	`year` integer,
	`route_fk` integer NOT NULL,
	`climber_fk` integer
);
INSERT INTO first_ascents VALUES(1,'Dave Graham',2002,7,NULL);
INSERT INTO first_ascents VALUES(2,'Nalle Hukkataival',2016,3,NULL);
INSERT INTO first_ascents VALUES(3,'Daniel Woods',2021,4,NULL);
INSERT INTO first_ascents VALUES(4,'Shawn Raboutou',2022,1,NULL);
INSERT INTO first_ascents VALUES(5,'Shawn Raboutou',2022,5,NULL);
INSERT INTO first_ascents VALUES(6,'Charles Albert',2023,2,NULL);
CREATE TABLE `topo_routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`top_type` text NOT NULL,
	`path` text,
	`route_fk` integer,
	`topo_fk` integer
);
CREATE TABLE `topos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`block_fk` integer,
	`file_fk` integer
);
CREATE TABLE `routes` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`grade` text,
	`grading_scale` text NOT NULL,
	`block_fk` integer NOT NULL,
	`first_ascent_fk` integer
);
INSERT INTO routes VALUES('2024-05-23 08:17:48',1,1,'Alphane','alphane','','9A','FB',1,4);
INSERT INTO routes VALUES('2024-05-23 08:24:03',2,1,'L''Ombre du Voyageur','lombre-du-voyageur','','9A','FB',2,6);
INSERT INTO routes VALUES('2024-05-23 08:30:06',3,1,'Burden of Dreams','burden-of-dreams','First 9A in the world set by Nalle Hukkataival in October 2016. Grade proposed by Nalle Hukkataival after several years of trials. During these years, Hukkataival "very quickly" solved several 8C and 8C+ boulder problems throughout the world, including Gioia. Compared to these other problems, Burden of Dreams felt "way way harder". The route was finally repeated and confirmed as solid 9A in April 2023 by Will Bosi.','9A','FB',3,2);
INSERT INTO routes VALUES('2024-05-23 08:41:25',4,1,'Return of the Sleepwalker','return-of-the-sleepwalker','Sit start to ''Sleepwalker''.','17','V',4,3);
INSERT INTO routes VALUES('2024-05-23 08:50:23',5,1,'Megatron','megatron','','17','V',5,5);
INSERT INTO routes VALUES('2024-05-23 09:20:58',6,1,'La Marie Rose','la-marie-rose',replace(replace('- This is pure climbing history - the first 6A in the world and probably Fontainebleau''s most famous boulder. An absolute must-do for every visitor - if you find a way through the crowds around. Applause guaranteed in case of success!\r\n- Slighlty overhanging wall with polished holds, followed by a sloper top-out. Even today not to be underestimated, especially for the shorter ones.\r\n','\r',char(13)),'\n',char(10)),'6A','FB',6,NULL);
INSERT INTO routes VALUES('2024-05-23 09:27:41',7,1,'Dreamtime','dreamtime','World''s first 8C! In 2002, Dave Graham repeated it by finding a different solution. He used a heel-hook to make the brutal start sequence easier, and downgraded the problem to easy 8B+. Most of the following repeaters, including Adam Ondra, Chris Sharma, and Daniel Woods adopted Graham''s solution and agreed with him about the grade.','8B+','FB',7,1);
INSERT INTO routes VALUES('2024-05-23 09:40:04',8,1,'Midnight Lightning','midnight-lightning','Midnight Lightning is a problem on the Columbia Boulder in Camp 4 of Yosemite National Park. It has been described as the world''s most famous bouldering problem.The route had been easily identified by a chalk lightning bolt drawn by John Bachar in 1978 while attempting the problem with John Yablonski and Ron Kauk. In May 2013, the iconic chalk lightning bolt was scrubbed off the face of the boulder. The bolt was re-drawn in the same location a few days later.','8','V',8,NULL);
CREATE TABLE `users` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`user_name` text NOT NULL
);
INSERT INTO users VALUES('2024-05-23 08:09:12',1,'demo@climbing-log.com','demo_user');
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			);
INSERT INTO __drizzle_migrations VALUES(NULL,'a7489d95b3b1b8c43deaa9b9947f96c8d6c446a1f620224a24b0db6ddfeaf1d7',1718902591499);
INSERT INTO __drizzle_migrations VALUES(NULL,'6a7eb7b9e3449ef14c7de0a250168b551a6bb78e4dedf28dffa23a7024197062',1718980851169);
CREATE TABLE `routes_to_tags` (
	`route_fk` integer NOT NULL,
	`tag_fk` text NOT NULL,
	PRIMARY KEY(`route_fk`, `tag_fk`),
	FOREIGN KEY (`route_fk`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_fk`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO routes_to_tags VALUES(1,'highball');
INSERT INTO routes_to_tags VALUES(2,'SD');
INSERT INTO routes_to_tags VALUES(4,'SD');
INSERT INTO routes_to_tags VALUES(3,'SD');
INSERT INTO routes_to_tags VALUES(5,'SD');
INSERT INTO routes_to_tags VALUES(7,'SD');
INSERT INTO routes_to_tags VALUES(8,'highball');
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL
);
INSERT INTO tags VALUES('SD');
INSERT INTO tags VALUES('highball');
CREATE TABLE `geolocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lat` real NOT NULL,
	`long` real NOT NULL,
	`area_fk` integer,
	`block_fk` integer
);
INSERT INTO geolocations VALUES(1,46.431849022171833851,8.8467670292225530914,NULL,1);
INSERT INTO geolocations VALUES(2,46.135865172707806181,6.162738144519858352,NULL,2);
INSERT INTO geolocations VALUES(3,60.423218784731718145,26.136604261022067241,NULL,3);
INSERT INTO geolocations VALUES(4,36.035930322125251379,-115.46296656969348148,NULL,4);
INSERT INTO geolocations VALUES(5,39.930348795313763687,-105.30000108758126309,NULL,5);
INSERT INTO geolocations VALUES(6,48.4472493618733413,2.6380299249406480299,NULL,6);
INSERT INTO geolocations VALUES(7,37.741732085227597259,-119.60365405399706517,NULL,8);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',2);
INSERT INTO sqlite_sequence VALUES('areas',21);
INSERT INTO sqlite_sequence VALUES('blocks',8);
INSERT INTO sqlite_sequence VALUES('routes',8);
INSERT INTO sqlite_sequence VALUES('ascents',19);
INSERT INTO sqlite_sequence VALUES('first_ascents',6);
INSERT INTO sqlite_sequence VALUES('geolocations',7);
COMMIT;
