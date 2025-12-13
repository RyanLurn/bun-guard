CREATE TABLE `missions` (
	`name` text NOT NULL,
	`version` text NOT NULL,
	`status` text DEFAULT 'watcher_ingested' NOT NULL,
	`verdict` text DEFAULT 'undetermined' NOT NULL,
	`summary` text,
	`sandbox_token` text,
	`created_at` integer DEFAULT (unixepoch('now', 'subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now', 'subsec') * 1000) NOT NULL,
	PRIMARY KEY(`name`, `version`)
);
