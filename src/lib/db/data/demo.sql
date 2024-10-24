PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `areas` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` text DEFAULT 'area' NOT NULL,
	`parent_fk` integer, `description` text,
	FOREIGN KEY (`parent_fk`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO areas VALUES('2024-05-23 08:16:07',1,1,'Ticino','ticino','area',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 08:16:19',2,1,'Chironico','chironico','crag',1,NULL);
INSERT INTO areas VALUES('2024-05-23 08:16:30',3,1,'Nivo alta','nivo-alta','sector',2,NULL);
INSERT INTO areas VALUES('2024-05-23 08:20:32',4,1,'Savoie','savoie','area',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 08:21:07',5,1,'La Salève','la-salve','crag',4,NULL);
INSERT INTO areas VALUES('2024-05-23 08:21:22',6,1,'Chaos des blocs du Salève','chaos-des-blocs-du-salve','sector',5,NULL);
INSERT INTO areas VALUES('2024-05-23 08:27:52',7,1,'Lappnor','lappnor','crag',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 08:29:37',8,1,'Happy Auer','happy-auer','sector',7,NULL);
INSERT INTO areas VALUES('2024-05-23 08:37:18',9,1,'Red Rock','red-rock','area',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 08:37:28',10,1,'Black Velvet Canyon','black-velvet-canyon','crag',9,NULL);
INSERT INTO areas VALUES('2024-05-23 08:39:36',11,1,'Wet Dream','wet-dream','sector',10,NULL);
INSERT INTO areas VALUES('2024-05-23 08:46:33',12,1,'Boulder','boulder','area',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 08:47:05',13,1,'Eldorado Canyon','eldorado-canyon','crag',12,NULL);
INSERT INTO areas VALUES('2024-05-23 09:11:13',14,1,'Fontainebleau','fontainebleau','area',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 09:13:24',15,1,'Cuvier','cuvier','crag',14,NULL);
INSERT INTO areas VALUES('2024-05-23 09:16:08',16,1,'Bas Cuvier','bas-cuvier','sector',15,NULL);
INSERT INTO areas VALUES('2024-05-23 09:26:49',17,1,'Cresiano','cresiano','crag',1,NULL);
INSERT INTO areas VALUES('2024-05-23 09:27:11',18,1,'Dreamtime','dreamtime','sector',17,NULL);
INSERT INTO areas VALUES('2024-05-23 09:36:45',19,1,'Yosemite','yosemite','area',NULL,NULL);
INSERT INTO areas VALUES('2024-05-23 09:37:05',20,1,'Yosemite Valley','yosemite-valley','crag',19,NULL);
INSERT INTO areas VALUES('2024-05-23 09:37:14',21,1,'Camp 4','camp-4','sector',20,NULL);
CREATE TABLE `ascents` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_by` integer NOT NULL,
	`date_time` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`notes` text,
	`type` text NOT NULL,
	`route_fk` integer NOT NULL
, "grade_fk" integer);
INSERT INTO ascents VALUES('2024-05-23 08:18:28',1,1,'2022-04-06','','attempt',1,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:24:50',2,1,'2023-10-18','','attempt',2,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:31:17',4,1,'2016-10-23','','attempt',3,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:33:48',5,1,'2023-04-12','','attempt',3,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:33:57',6,1,'2023-12-27','','attempt',3,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:34:13',7,1,'2024-03-26','','attempt',3,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:44:05',8,1,'2021-03-30','','attempt',4,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:44:16',9,1,'2024-02-20','','attempt',4,NULL);
INSERT INTO ascents VALUES('2024-05-23 08:51:12',10,1,'2022-05-01','','attempt',5,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:22:37',11,1,'2024-04-01','','flash',6,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:28:46',14,1,'2024-04-01','','flash',7,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:34:15',15,1,'2022-10-19','','attempt',1,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:34:24',16,1,'2022-10-31','','attempt',1,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:34:32',17,1,'2022-12-15','','attempt',1,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:34:44',18,1,'2023-12-21','','attempt',1,NULL);
INSERT INTO ascents VALUES('2024-05-23 09:40:12',19,1,'2024-04-01','','flash',8,NULL);
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
INSERT INTO blocks VALUES('2024-05-23 09:27:18',7,1,'Masso 11b','masso-11b',18,8);
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
	`block_fk` integer NOT NULL,
	`first_ascent_fk` integer
, `rating` integer, `external_resources_fk` integer, "grade_fk" integer);
INSERT INTO routes VALUES('2024-05-23 08:17:48',1,1,'Alphane','alphane','',1,4,3,1,21);
INSERT INTO routes VALUES('2024-05-23 08:24:03',2,1,'L''Ombre du Voyageur','lombre-du-voyageur','',2,6,NULL,2,21);
INSERT INTO routes VALUES('2024-05-23 08:30:06',3,1,'Burden of Dreams','burden-of-dreams','First 9A in the world set by Nalle Hukkataival in October 2016. Grade proposed by Nalle Hukkataival after several years of trials. During these years, Hukkataival "very quickly" solved several 8C and 8C+ boulder problems throughout the world, including Gioia. Compared to these other problems, Burden of Dreams felt "way way harder". The route was finally repeated and confirmed as solid 9A in April 2023 by Will Bosi.',3,2,3,3,21);
INSERT INTO routes VALUES('2024-05-23 08:41:25',4,1,'Return of the Sleepwalker','return-of-the-sleepwalker','Sit start to ''Sleepwalker''.',4,3,2,4,21);
INSERT INTO routes VALUES('2024-05-23 08:50:23',5,1,'Megatron','megatron','',5,5,1,5,21);
INSERT INTO routes VALUES('2024-05-23 09:20:58',6,1,'La Marie Rose','la-marie-rose',replace(replace('- This is pure climbing history - the first 6A in the world and probably Fontainebleau''s most famous boulder. An absolute must-do for every visitor - if you find a way through the crowds around. Applause guaranteed in case of success!\r\n- Slighlty overhanging wall with polished holds, followed by a sloper top-out. Even today not to be underestimated, especially for the shorter ones.\r\n','\r',char(13)),'\n',char(10)),6,NULL,3,6,3);
INSERT INTO routes VALUES('2024-05-23 09:27:41',7,1,'Dreamtime','dreamtime','World''s first 8C! In 2002, Dave Graham repeated it by finding a different solution. He used a heel-hook to make the brutal start sequence easier, and downgraded the problem to easy 8B+. Most of the following repeaters, including Adam Ondra, Chris Sharma, and Daniel Woods adopted Graham''s solution and agreed with him about the grade.',7,1,1,7,18);
INSERT INTO routes VALUES('2024-05-23 09:40:04',8,1,'Midnight Lightning','midnight-lightning','Midnight Lightning is a problem on the Columbia Boulder in Camp 4 of Yosemite National Park. It has been described as the world''s most famous bouldering problem.The route had been easily identified by a chalk lightning bolt drawn by John Bachar in 1978 while attempting the problem with John Yablonski and Ron Kauk. In May 2013, the iconic chalk lightning bolt was scrubbed off the face of the boulder. The bolt was re-drawn in the same location a few days later.',8,NULL,2,8,11);
CREATE TABLE `users` (
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`user_name` text NOT NULL
, "user_settings_fk" integer);
INSERT INTO users VALUES('2024-05-23 08:09:12',1,'demo@crag-track.com','demo_user',1);
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			);
INSERT INTO __drizzle_migrations VALUES(NULL,'a7489d95b3b1b8c43deaa9b9947f96c8d6c446a1f620224a24b0db6ddfeaf1d7',1718902591499);
INSERT INTO __drizzle_migrations VALUES(NULL,'6a7eb7b9e3449ef14c7de0a250168b551a6bb78e4dedf28dffa23a7024197062',1718980851169);
INSERT INTO __drizzle_migrations VALUES(NULL,'4a7933f0ef0557b2485d3abef11327e8e684e2700d239a1ee510c5e02e25fce1',1719499418076);
INSERT INTO __drizzle_migrations VALUES(NULL,'22708d3f09e0937e4dc18dfbc87eaca2e8abd5ade2b5d656d585cab39f256859',1723192641236);
INSERT INTO __drizzle_migrations VALUES(NULL,'a7489d95b3b1b8c43deaa9b9947f96c8d6c446a1f620224a24b0db6ddfeaf1d7',1718902591499);
INSERT INTO __drizzle_migrations VALUES(NULL,'6a7eb7b9e3449ef14c7de0a250168b551a6bb78e4dedf28dffa23a7024197062',1718980851169);
INSERT INTO __drizzle_migrations VALUES(NULL,'4a7933f0ef0557b2485d3abef11327e8e684e2700d239a1ee510c5e02e25fce1',1719499418076);
INSERT INTO __drizzle_migrations VALUES(NULL,'505debddece4f7ba9c5457497b44798ddd89f748428df31a9626ed87b5ad5d80',1726129661598);
INSERT INTO __drizzle_migrations VALUES(NULL,'49a827c0a5576b321a3672b697ca14b499a86325bfbec1ff10953563e572e969',1726158542515);
INSERT INTO __drizzle_migrations VALUES(NULL,'b047162d28b8f7e0a65298dff5f57c767f2a5c586669fa124efc52dfed933faf',1729520789486);
CREATE TABLE `routes_to_tags` (
	`route_fk` integer NOT NULL,
	`tag_fk` text NOT NULL,
	PRIMARY KEY(`route_fk`, `tag_fk`),
	FOREIGN KEY (`route_fk`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_fk`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
INSERT INTO routes_to_tags VALUES(2,'SD');
INSERT INTO routes_to_tags VALUES(5,'SD');
INSERT INTO routes_to_tags VALUES(3,'SD');
INSERT INTO routes_to_tags VALUES(4,'SD');
INSERT INTO routes_to_tags VALUES(1,'highball');
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
INSERT INTO geolocations VALUES(1,46.43184902217183208,8.846767029222553092,NULL,1);
INSERT INTO geolocations VALUES(2,46.13586517270780262,6.162738144519858352,NULL,2);
INSERT INTO geolocations VALUES(3,60.42321878473171637,26.13660426102206813,NULL,3);
INSERT INTO geolocations VALUES(4,36.03593032212525316,-115.4629665696934779,NULL,4);
INSERT INTO geolocations VALUES(5,39.93034879531376191,-105.3000010875812648,NULL,5);
INSERT INTO geolocations VALUES(6,48.44724936187334662,2.638029924940648029,NULL,6);
INSERT INTO geolocations VALUES(7,37.74173208522759638,-119.6036540539970616,NULL,8);
INSERT INTO geolocations VALUES(8,46.28960000000000007,9.005509999999999237,NULL,7);
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
INSERT INTO route_external_resource_27crags VALUES(1,'Alphane',484982,'Route',NULL,NULL,'Alphane (9A), The alphane moon, Chironico North',22,46.42660000000000053,8.847300000000000609,'/crags/chironico/routes/alphane','https://27crags.com//crags/chironico/routes/alphane',1);
INSERT INTO route_external_resource_27crags VALUES(2,'Burden of Dreams',191751,'Route',NULL,NULL,'Burden of Dreams (9A), Happy Auer, Lappnor',513,60.4152999999999949,26.11880000000000023,'/crags/lappnor/routes/burden-of-dreams','https://27crags.com//crags/lappnor/routes/burden-of-dreams',3);
INSERT INTO route_external_resource_27crags VALUES(3,'Dreamtime',299118,'Route',NULL,NULL,'Dreamtime (8B+), Cresciano',21,46.28960000000000007,9.005509999999999237,'/crags/cresciano/routes/dreamtime-299118','https://27crags.com//crags/cresciano/routes/dreamtime-299118',7);
INSERT INTO route_external_resource_27crags VALUES(4,'Midnight Lightning',3525,'Route',NULL,NULL,'Midnight Lightning (7B+), Columbia Boulders, Camp 4',559,37.74320000000000163,-119.6029999999999945,'/crags/camp-4/routes/midnight-lightning','https://27crags.com//crags/camp-4/routes/midnight-lightning',8);
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
INSERT INTO route_external_resource_8a VALUES(1,'Alphane','alphane',596086,'Chironico','chironico','switzerland','Switzerland','Ticino','ticino','Unknown Sector','unknown-sector-bf2cf',35,3,1,5.0,'9A','https://www.8a.nu/crags/bouldering/switzerland/chironico/sectors/unknown-sector-bf2cf/routes/alphane',1);
INSERT INTO route_external_resource_8a VALUES(2,'Burden of Dreams','burden-of-dreams',574279,'Lappnor','lappnor','finland','Finland',NULL,NULL,'Unknown Sector','unknown-sector-6c1b2',35,3,1,5.0,'9A','https://www.8a.nu/crags/bouldering/finland/lappnor/sectors/unknown-sector-6c1b2/routes/burden-of-dreams',3);
INSERT INTO route_external_resource_8a VALUES(3,'Return of the Sleepwalker','return-of-the-sleepwalker',549813,'Black Velvet Canyon','black-velvet-canyon','united-states','United States of America','Red Rock (NV)','red-rock-nv','Wet Dream Area','wet-dream',35,3,1,5.0,'9A','https://www.8a.nu/crags/bouldering/united-states/black-velvet-canyon/sectors/wet-dream/routes/return-of-the-sleepwalker',4);
INSERT INTO route_external_resource_8a VALUES(4,'Midnight lightning','midnight-lightning',139321,'Rila Monastery','rila-monastery','bulgaria','Bulgaria','Rila','rila','Camp 4','camp-4',25,3,1,4.75,'7B','https://www.8a.nu/crags/bouldering/bulgaria/rila-monastery/sectors/camp-4/routes/midnight-lightning',8);
CREATE TABLE `route_external_resource_the_crag` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`description` text,
	`grade` text,
	`node` integer,
	`rating` integer,
	`tags` text,
	`url` text,
	`external_resources_fk` integer NOT NULL
);
INSERT INTO route_external_resource_the_crag VALUES(1,'Alphane',replace('Was initially a project by Dave Graham.\nFA: Shawn Raboutou, 6 Apr 2022','\n',char(10)),'9A',6522579351,3,'','https://www.thecrag.com/route/6522579351',1);
INSERT INTO route_external_resource_the_crag VALUES(2,'L''Ombre du Voyageur','FA: Charles Albert, 2023','9A',8643101238,0,'','https://www.thecrag.com/route/8643101238',2);
INSERT INTO route_external_resource_the_crag VALUES(3,'Burden of Dreams',replace('First 9A in the world set by Nalle Hukkataival in October 2016. Grade proposed by Nalle Hukkataival after several years of trials. During these years, Hukkataival "very quickly" solved several 8C and 8C+ boulder problems throughout the world, including Gioia. Compared to these other problems, Burden of Dreams felt "way way harder". The route was finally repeated and confirmed as solid 9A in April 2023 by Will Bosi William Bosi .  FA Youtube Longer documentary was also released.\nFA: Nalle Hukkataival, 23 Oct 2016','\n',char(10)),'9A',2885506158,0,'','https://www.thecrag.com/route/2885506158',3);
INSERT INTO route_external_resource_the_crag VALUES(4,'Return of the Sleepwalker',replace('Sit start to ''Sleepwalker''.\nFA: Daniel Woods, 30 Mar 2021','\n',char(10)),'17',4616657709,0,'','https://www.thecrag.com/route/4616657709',4);
INSERT INTO route_external_resource_the_crag VALUES(5,'Megatron',replace('Low start to "Tron".\nFA: Shawn Raboutou, 2022','\n',char(10)),'17',6853042506,0,'','https://www.thecrag.com/route/6853042506',5);
INSERT INTO route_external_resource_the_crag VALUES(6,'La Marie Rose',replace('This is pure climbing history - the first 6A in the world and probably Fontainebleau''s most famous boulder. An absolute must-do for every visitor - if you find a way through the crowds around. Applause guaranteed in case of success!Slighlty overhanging wall with polished holds, followed by a sloper top-out. Even today not to be underestimated, especially for the shorter ones.\nFA: René Ferlet, 1946','\n',char(10)),'6A',14019247,3,'','https://www.thecrag.com/route/14019247',6);
INSERT INTO route_external_resource_the_crag VALUES(7,'Dreamtime',replace('World''s first 8C! In 2002, Dave Graham repeated it by finding a different solution. He used a heel-hook to make the brutal start sequence easier, and downgraded the problem to easy 8B+. Most of the following repeaters, including Adam Ondra, Chris Sharma, and Daniel Woods adopted Graham''s solution and agreed with him about the grade.RepetitionsLinks\nFA: Fred Nicole, 2000','\n',char(10)),'8B+ 7B+',392120331,3,'','https://www.thecrag.com/route/392120331',7);
INSERT INTO route_external_resource_the_crag VALUES(8,'Midnight Lightning',replace('Midnight Lightning is a problem on the Columbia Boulder in Camp 4 of Yosemite National Park. It has been described as the world''s most famous bouldering problem.The route had been easily identified by a chalk lightning bolt drawn by John Bachar in 1978 while attempting the problem with John Yablonski and Ron Kauk. In May 2013, the iconic chalk lightning bolt was scrubbed off the face of the boulder. The bolt was re-drawn in the same location a few days later.\nFFA: Ron Kauk, 1978','\n',char(10)),'87B',18620449,3,'','https://www.thecrag.com/route/18620449',8);
CREATE TABLE `route_external_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`route_fk` integer NOT NULL,
	`external_resource_8a_fk` integer,
	`external_resource_27crags_fk` integer,
	`external_resource_the_crag_fk` integer
);
INSERT INTO route_external_resources VALUES(1,1,1,1,1);
INSERT INTO route_external_resources VALUES(2,2,NULL,NULL,2);
INSERT INTO route_external_resources VALUES(3,3,2,2,3);
INSERT INTO route_external_resources VALUES(4,4,3,NULL,4);
INSERT INTO route_external_resources VALUES(5,5,NULL,NULL,5);
INSERT INTO route_external_resources VALUES(6,6,NULL,NULL,6);
INSERT INTO route_external_resources VALUES(7,7,NULL,3,7);
INSERT INTO route_external_resources VALUES(8,8,4,4,8);
CREATE TABLE IF NOT EXISTS "user_settings" (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_fk` integer NOT NULL,
	`cookie_8a` text,
	`cookie_27crags` text,
	`cookie_the_crag` text
, "grading_scale" text DEFAULT 'FB' NOT NULL);
INSERT INTO user_settings VALUES(1,1,NULL,NULL,NULL,'FB');
CREATE TABLE IF NOT EXISTS "grades" (
	"id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	"FB" text,
	"V" text
);
INSERT INTO grades VALUES(0,'FB 5A','V1');
INSERT INTO grades VALUES(1,'FB 5B','V1');
INSERT INTO grades VALUES(2,'FB 5C','V2');
INSERT INTO grades VALUES(3,'FB 6A','V3');
INSERT INTO grades VALUES(4,'FB 6A+','V3');
INSERT INTO grades VALUES(5,'FB 6B','V4');
INSERT INTO grades VALUES(6,'FB 6B+','V4');
INSERT INTO grades VALUES(7,'FB 6C','V5');
INSERT INTO grades VALUES(8,'FB 6C+','V5');
INSERT INTO grades VALUES(9,'FB 7A','V6');
INSERT INTO grades VALUES(10,'FB 7A+','V7');
INSERT INTO grades VALUES(11,'FB 7B','V8');
INSERT INTO grades VALUES(12,'FB 7B+','V8');
INSERT INTO grades VALUES(13,'FB 7C','V9');
INSERT INTO grades VALUES(14,'FB 7C+','V10');
INSERT INTO grades VALUES(15,'FB 8A','V11');
INSERT INTO grades VALUES(16,'FB 8A+','V12');
INSERT INTO grades VALUES(17,'FB 8B','V13');
INSERT INTO grades VALUES(18,'FB 8B+','V14');
INSERT INTO grades VALUES(19,'FB 8C','V15');
INSERT INTO grades VALUES(20,'FB 8C+','V16');
INSERT INTO grades VALUES(21,'FB 9A','V17');
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',2);
INSERT INTO sqlite_sequence VALUES('areas',21);
INSERT INTO sqlite_sequence VALUES('blocks',8);
INSERT INTO sqlite_sequence VALUES('routes',8);
INSERT INTO sqlite_sequence VALUES('ascents',19);
INSERT INTO sqlite_sequence VALUES('first_ascents',6);
INSERT INTO sqlite_sequence VALUES('geolocations',7);
INSERT INTO sqlite_sequence VALUES('grades',21);
INSERT INTO sqlite_sequence VALUES('user_settings',1);
COMMIT;
