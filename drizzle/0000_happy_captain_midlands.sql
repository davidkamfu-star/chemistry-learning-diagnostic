CREATE TABLE `diagnostic_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`student_name` text NOT NULL,
	`level` text NOT NULL,
	`exam_title` text NOT NULL,
	`topic_focus` text DEFAULT '全卷' NOT NULL,
	`teacher_notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`report_source` text DEFAULT 'pending' NOT NULL,
	`report_json` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_diagnostic_cases_owner_created` ON `diagnostic_cases` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `diagnostic_files` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`filename` text NOT NULL,
	`r2_key` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `diagnostic_cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_diagnostic_files_case` ON `diagnostic_files` (`case_id`);