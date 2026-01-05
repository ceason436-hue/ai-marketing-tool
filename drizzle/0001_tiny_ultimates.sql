CREATE TABLE `brand_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('logo','color','image','font') NOT NULL,
	`url` varchar(512),
	`value` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`style` varchar(64) NOT NULL,
	`prospectusContent` json,
	`videoScriptContent` json,
	`posterElements` json,
	`posterUrl` varchar(512),
	`videoUrl` varchar(512),
	`platformContents` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_history_id` PRIMARY KEY(`id`)
);
