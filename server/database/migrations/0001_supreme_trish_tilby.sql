CREATE TABLE `ai_content_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cache_key` text NOT NULL,
	`report_id` integer,
	`section_code` text,
	`data_hash` text,
	`prompt_version` text,
	`content` text NOT NULL,
	`model` text,
	`prompt_tokens` integer,
	`completion_tokens` integer,
	`total_tokens` integer,
	`generation_time` integer,
	`expires_at` integer,
	`created_at` integer,
	FOREIGN KEY (`report_id`) REFERENCES `esg_reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_content_cache_cache_key_unique` ON `ai_content_cache` (`cache_key`);--> statement-breakpoint
CREATE TABLE `esg_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`period` text NOT NULL,
	`period_type` text DEFAULT 'yearly',
	`template_id` integer,
	`company_name` text,
	`company_logo` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`config` text,
	`progress` integer DEFAULT 0,
	`error_message` text,
	`html_content` text,
	`export_files` text,
	`compliance_summary` text,
	`data_integrity_summary` text,
	`submitted_by` integer,
	`submitted_at` integer,
	`reviewed_by` integer,
	`reviewed_at` integer,
	`review_comment` text,
	`published_by` integer,
	`published_at` integer,
	`created_by` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`template_id`) REFERENCES `report_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`published_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_generation_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` integer NOT NULL,
	`task_type` text NOT NULL,
	`parameters` text,
	`status` text DEFAULT 'pending',
	`progress` integer DEFAULT 0,
	`current_step` text,
	`error_message` text,
	`result` text,
	`started_at` integer,
	`completed_at` integer,
	`created_by` integer,
	`created_at` integer,
	FOREIGN KEY (`report_id`) REFERENCES `esg_reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` integer NOT NULL,
	`section_code` text NOT NULL,
	`title` text NOT NULL,
	`level` integer DEFAULT 1,
	`sort_order` integer DEFAULT 0,
	`content` text,
	`ai_generated_content` text,
	`is_ai_generated` integer DEFAULT false,
	`is_manually_edited` integer DEFAULT false,
	`metrics_data` text,
	`charts_config` text,
	`status` text DEFAULT 'draft',
	`error_message` text,
	`tokens_used` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`report_id`) REFERENCES `esg_reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `report_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_id` integer NOT NULL,
	`version_number` integer NOT NULL,
	`version_tag` text,
	`change_description` text,
	`content_snapshot` text,
	`file_snapshot` text,
	`created_by` integer,
	`created_at` integer,
	FOREIGN KEY (`report_id`) REFERENCES `esg_reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `generated_reports`;--> statement-breakpoint
DROP INDEX "ai_content_cache_cache_key_unique";--> statement-breakpoint
DROP INDEX "compliance_check_batches_batch_no_unique";--> statement-breakpoint
DROP INDEX "compliance_rules_code_unique";--> statement-breakpoint
DROP INDEX "employees_employee_no_unique";--> statement-breakpoint
DROP INDEX "esg_metrics_code_unique";--> statement-breakpoint
DROP INDEX "esg_modules_code_unique";--> statement-breakpoint
DROP INDEX "esg_sub_modules_code_unique";--> statement-breakpoint
DROP INDEX "patents_patent_no_unique";--> statement-breakpoint
DROP INDEX "report_templates_code_unique";--> statement-breakpoint
DROP INDEX "safety_incidents_incident_no_unique";--> statement-breakpoint
DROP INDEX "sessions_token_unique";--> statement-breakpoint
DROP INDEX "suppliers_code_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "role" TO "role" text NOT NULL DEFAULT 'viewer';--> statement-breakpoint
CREATE UNIQUE INDEX `compliance_check_batches_batch_no_unique` ON `compliance_check_batches` (`batch_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `compliance_rules_code_unique` ON `compliance_rules` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `esg_metrics_code_unique` ON `esg_metrics` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `esg_modules_code_unique` ON `esg_modules` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `esg_sub_modules_code_unique` ON `esg_sub_modules` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `patents_patent_no_unique` ON `patents` (`patent_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `report_templates_code_unique` ON `report_templates` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `safety_incidents_incident_no_unique` ON `safety_incidents` (`incident_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `report_templates` ADD `type` text DEFAULT 'annual' NOT NULL;--> statement-breakpoint
ALTER TABLE `report_templates` ADD `config` text NOT NULL;--> statement-breakpoint
ALTER TABLE `report_templates` ADD `standards` text;--> statement-breakpoint
ALTER TABLE `report_templates` ADD `cover_config` text;--> statement-breakpoint
ALTER TABLE `report_templates` ADD `enabled` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `report_templates` ADD `version` text DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE `report_templates` ADD `created_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `report_templates` DROP COLUMN `template_type`;--> statement-breakpoint
ALTER TABLE `report_templates` DROP COLUMN `structure`;--> statement-breakpoint
ALTER TABLE `report_templates` DROP COLUMN `styling`;--> statement-breakpoint
ALTER TABLE `report_templates` DROP COLUMN `is_active`;