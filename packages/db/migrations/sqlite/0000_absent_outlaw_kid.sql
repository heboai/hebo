CREATE TABLE `agent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`user_id` text NOT NULL,
	`version_id` integer,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`version_id`) REFERENCES `version`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `version` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version` text DEFAULT 'main' NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
