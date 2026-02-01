CREATE TABLE `air_emission_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`emission_source` text NOT NULL,
	`pollutant_type` text NOT NULL,
	`concentration` real,
	`concentration_unit` text,
	`emission_rate` real,
	`emission_rate_unit` text,
	`total_emission` real,
	`total_emission_unit` text,
	`standard_limit` real,
	`is_compliant` integer DEFAULT true,
	`treatment_facility` text,
	`permit_no` text,
	`facility` text,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `board_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gender` text,
	`birth_year` integer,
	`nationality` text,
	`education` text,
	`position` text NOT NULL,
	`is_independent` integer DEFAULT false,
	`is_executive` integer DEFAULT false,
	`appointment_date` text,
	`term_end_date` text,
	`tenure` real,
	`other_positions` text,
	`attendance_rate` real,
	`expertise` text,
	`status` text DEFAULT 'active',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `calculation_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_id` integer NOT NULL,
	`record_id` integer,
	`period` text NOT NULL,
	`formula_id` integer,
	`input_data` text,
	`calculated_value` real,
	`calculated_at` integer,
	`status` text DEFAULT 'success',
	`error_message` text,
	`execution_time` integer,
	FOREIGN KEY (`metric_id`) REFERENCES `esg_metrics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`record_id`) REFERENCES `esg_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`formula_id`) REFERENCES `metric_formulas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `carbon_emissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`scope` integer NOT NULL,
	`category` text NOT NULL,
	`source` text NOT NULL,
	`activity_data` real,
	`activity_unit` text,
	`emission_factor` real,
	`emission` real NOT NULL,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cert_type` text NOT NULL,
	`cert_name` text NOT NULL,
	`cert_no` text,
	`issuer` text,
	`issue_date` text,
	`expiry_date` text,
	`scope` text,
	`level` text,
	`facility` text,
	`status` text DEFAULT 'valid',
	`org_unit_id` integer,
	`file_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `company_financials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`revenue` real,
	`net_profit` real,
	`total_assets` real,
	`production_output` real,
	`production_unit` text,
	`employee_count` integer,
	`avg_employee_count` real,
	`operating_area` real,
	`currency` text DEFAULT 'CNY',
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `compliance_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` integer,
	`before_snapshot` text,
	`after_snapshot` text,
	`change_description` text,
	`operator_id` integer,
	`operator_ip` text,
	`operated_at` integer,
	FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `compliance_check_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`batch_no` text NOT NULL,
	`scope` text NOT NULL,
	`parameters` text,
	`status` text DEFAULT 'pending',
	`statistics` text,
	`started_at` integer,
	`completed_at` integer,
	`triggered_by` integer,
	`trigger_type` text DEFAULT 'manual',
	`created_at` integer,
	FOREIGN KEY (`triggered_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `compliance_check_batches_batch_no_unique` ON `compliance_check_batches` (`batch_no`);--> statement-breakpoint
CREATE TABLE `compliance_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rule_id` integer NOT NULL,
	`record_id` integer,
	`metric_code` text,
	`period` text NOT NULL,
	`org_unit_id` integer,
	`status` text NOT NULL,
	`checked_value` text,
	`expected_value` text,
	`details` text,
	`checked_at` integer,
	`trigger_type` text DEFAULT 'auto',
	`checked_by` integer,
	`resolve_status` text DEFAULT 'pending',
	`resolve_remark` text,
	`resolved_by` integer,
	`resolved_at` integer,
	`created_at` integer,
	FOREIGN KEY (`rule_id`) REFERENCES `compliance_rules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`record_id`) REFERENCES `esg_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`checked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `compliance_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`rule_type` text NOT NULL,
	`target_metrics` text,
	`target_sub_modules` text,
	`condition` text NOT NULL,
	`severity` text DEFAULT 'warning' NOT NULL,
	`regulation` text,
	`message` text NOT NULL,
	`suggestion` text,
	`trigger_on` text DEFAULT 'submit',
	`priority` integer DEFAULT 100,
	`enabled` integer DEFAULT true,
	`applicable_periods` text DEFAULT 'all',
	`created_by` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `compliance_rules_code_unique` ON `compliance_rules` (`code`);--> statement-breakpoint
CREATE TABLE `donations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`donation_date` text NOT NULL,
	`donation_type` text NOT NULL,
	`category` text,
	`recipient` text,
	`amount` real,
	`currency` text DEFAULT 'CNY',
	`volunteer_hours` real,
	`volunteer_count` integer,
	`description` text,
	`proof` text,
	`remark` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `employee_work_time` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer,
	`employee_no` text,
	`period` text NOT NULL,
	`regular_hours` real NOT NULL,
	`overtime_hours` real DEFAULT 0,
	`overtime_compensation` text,
	`paid_leave_days` real DEFAULT 0,
	`sick_leave_days` real DEFAULT 0,
	`maternity_leave_days` real DEFAULT 0,
	`paternity_leave_days` real DEFAULT 0,
	`annual_leave_days` real DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_no` text NOT NULL,
	`name` text NOT NULL,
	`gender` text,
	`birth_date` text,
	`id_card` text,
	`phone` text,
	`email` text,
	`department` text,
	`position` text,
	`level` text,
	`employee_type` text,
	`is_party_member` integer DEFAULT false,
	`is_union_member` integer DEFAULT false,
	`is_disabled` integer DEFAULT false,
	`is_minority` integer DEFAULT false,
	`education` text,
	`hire_date` text,
	`leave_date` text,
	`leave_reason` text,
	`status` text DEFAULT 'active',
	`org_unit_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);--> statement-breakpoint
CREATE TABLE `energy_consumption` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`energy_type` text NOT NULL,
	`consumption` real NOT NULL,
	`unit` text NOT NULL,
	`cost` real,
	`facility` text,
	`source` text,
	`is_renewable` integer DEFAULT false,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `environment_investments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`investment_category` text NOT NULL,
	`project_name` text,
	`investment_amount` real NOT NULL,
	`expected_effect` text,
	`actual_effect` text,
	`start_date` text,
	`completion_date` text,
	`status` text DEFAULT 'planned',
	`facility` text,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `environmental_compliance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`record_date` text NOT NULL,
	`record_type` text NOT NULL,
	`authority` text,
	`description` text,
	`penalty_amount` real,
	`corrective_action` text,
	`due_date` text,
	`completion_date` text,
	`status` text DEFAULT 'open',
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `esg_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sub_module_id` integer NOT NULL,
	`parent_id` integer,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`level` integer DEFAULT 3,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`sub_module_id`) REFERENCES `esg_sub_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `esg_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`field_type` text DEFAULT 'text' NOT NULL,
	`field_config` text,
	`frequency` text DEFAULT 'yearly',
	`required` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`enabled` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `esg_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `esg_metrics_code_unique` ON `esg_metrics` (`code`);--> statement-breakpoint
CREATE TABLE `esg_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `esg_modules_code_unique` ON `esg_modules` (`code`);--> statement-breakpoint
CREATE TABLE `esg_record_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`record_id` integer NOT NULL,
	`file_id` integer NOT NULL,
	`description` text,
	`created_at` integer,
	FOREIGN KEY (`record_id`) REFERENCES `esg_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `esg_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_id` integer NOT NULL,
	`period` text NOT NULL,
	`org_unit_id` integer,
	`value_number` real,
	`value_text` text,
	`value_json` text,
	`status` text DEFAULT 'draft',
	`remark` text,
	`submitted_by` integer,
	`submitted_at` integer,
	`approved_by` integer,
	`approved_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`metric_id`) REFERENCES `esg_metrics`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `esg_sub_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`module_id`) REFERENCES `esg_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `esg_sub_modules_code_unique` ON `esg_sub_modules` (`code`);--> statement-breakpoint
CREATE TABLE `executives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gender` text,
	`birth_year` integer,
	`education` text,
	`position` text NOT NULL,
	`appointment_date` text,
	`tenure` real,
	`annual_salary` real,
	`bonus` real,
	`equity` real,
	`shareholding` real,
	`shareholding_ratio` real,
	`performance_rating` text,
	`training_hours` real,
	`status` text DEFAULT 'active',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `field_mapping_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`data_source` text NOT NULL,
	`source_system` text,
	`description` text,
	`mappings` text NOT NULL,
	`value_transforms` text,
	`field_aliases` text,
	`is_default` integer DEFAULT false,
	`usage_count` integer DEFAULT 0,
	`created_by` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`path` text NOT NULL,
	`category` text DEFAULT 'general',
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `generated_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer,
	`title` text NOT NULL,
	`period` text NOT NULL,
	`report_year` integer NOT NULL,
	`status` text DEFAULT 'draft',
	`content` text,
	`summary` text,
	`file_path` text,
	`file_format` text,
	`generated_by` integer,
	`generated_at` integer,
	`published_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`template_id`) REFERENCES `report_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `material_consumption` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`material_category` text NOT NULL,
	`material_name` text NOT NULL,
	`material_code` text,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`cost` real,
	`is_renewable` integer DEFAULT false,
	`is_recycled` integer DEFAULT false,
	`recycled_ratio` real,
	`supplier` text,
	`facility` text,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meeting_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meeting_type` text NOT NULL,
	`meeting_no` text,
	`meeting_date` text NOT NULL,
	`meeting_name` text,
	`attendees_count` integer,
	`total_members` integer,
	`attendance_rate` real,
	`resolutions_count` integer,
	`approved_count` integer,
	`key_resolutions` text,
	`minutes` text,
	`status` text DEFAULT 'completed',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `metric_formulas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_id` integer NOT NULL,
	`formula_type` text NOT NULL,
	`data_source` text NOT NULL,
	`formula` text NOT NULL,
	`aggregation` text,
	`filters` text,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`metric_id`) REFERENCES `esg_metrics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `noise_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`record_date` text NOT NULL,
	`location` text NOT NULL,
	`location_type` text,
	`monitoring_time` text,
	`decibel_level` real NOT NULL,
	`standard_limit` real,
	`is_compliant` integer DEFAULT true,
	`noise_source` text,
	`control_measures` text,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `org_units` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`sort_order` integer DEFAULT 0,
	`enabled` integer DEFAULT true,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `patents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patent_no` text NOT NULL,
	`patent_name` text NOT NULL,
	`patent_type` text NOT NULL,
	`application_date` text,
	`grant_date` text,
	`expiry_date` text,
	`inventors` text,
	`is_green` integer DEFAULT false,
	`status` text DEFAULT 'pending',
	`annual_fee` real,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patents_patent_no_unique` ON `patents` (`patent_no`);--> statement-breakpoint
CREATE TABLE `product_incidents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`incident_no` text NOT NULL,
	`incident_date` text NOT NULL,
	`incident_type` text NOT NULL,
	`product_name` text NOT NULL,
	`product_batch` text,
	`affected_quantity` integer,
	`description` text,
	`root_cause` text,
	`corrective_action` text,
	`compensation_amount` real,
	`resolution` text,
	`resolution_date` text,
	`status` text DEFAULT 'open',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `rd_investment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`project_name` text,
	`project_category` text,
	`investment_amount` real NOT NULL,
	`is_green` integer DEFAULT false,
	`personnel_count` integer,
	`personnel_cost` real,
	`equipment_cost` real,
	`material_cost` real,
	`department` text,
	`status` text DEFAULT 'active',
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `report_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`template_type` text DEFAULT 'annual',
	`structure` text,
	`styling` text,
	`is_default` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `report_templates_code_unique` ON `report_templates` (`code`);--> statement-breakpoint
CREATE TABLE `safety_incidents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`incident_no` text NOT NULL,
	`incident_date` text NOT NULL,
	`incident_type` text NOT NULL,
	`severity` text NOT NULL,
	`location` text,
	`description` text,
	`root_cause` text,
	`injured_count` integer DEFAULT 0,
	`fatal_count` integer DEFAULT 0,
	`lost_days` real DEFAULT 0,
	`direct_cost` real,
	`corrective_action` text,
	`status` text DEFAULT 'open',
	`org_unit_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `safety_incidents_incident_no_unique` ON `safety_incidents` (`incident_no`);--> statement-breakpoint
CREATE TABLE `salary_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer,
	`employee_no` text,
	`period` text NOT NULL,
	`base_salary` real NOT NULL,
	`bonus` real DEFAULT 0,
	`allowance` real DEFAULT 0,
	`overtime_pay` real DEFAULT 0,
	`total_compensation` real,
	`social_insurance` real DEFAULT 0,
	`housing_fund` real DEFAULT 0,
	`gender` text,
	`department` text,
	`position` text,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `shareholders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`shareholder_type` text,
	`share_type` text,
	`share_count` real,
	`share_ratio` real,
	`voting_rights` real,
	`is_pledged` integer DEFAULT false,
	`pledge_ratio` real,
	`is_frozen` integer DEFAULT false,
	`is_related_party` integer DEFAULT false,
	`registration_date` text,
	`status` text DEFAULT 'active',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `supervisors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gender` text,
	`birth_year` integer,
	`education` text,
	`position` text NOT NULL,
	`is_external` integer DEFAULT false,
	`is_employee_rep` integer DEFAULT false,
	`appointment_date` text,
	`term_end_date` text,
	`tenure` real,
	`attendance_rate` real,
	`questions_raised` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`region` text,
	`country` text,
	`is_local` integer DEFAULT false,
	`contract_amount` real,
	`esg_rating` text,
	`has_certification` integer DEFAULT false,
	`certifications` text,
	`audit_date` text,
	`audit_result` text,
	`status` text DEFAULT 'active',
	`remark` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suppliers_code_unique` ON `suppliers` (`code`);--> statement-breakpoint
CREATE TABLE `training_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer,
	`training_type` text NOT NULL,
	`training_name` text NOT NULL,
	`training_date` text NOT NULL,
	`duration` real NOT NULL,
	`cost` real,
	`provider` text,
	`is_online` integer DEFAULT false,
	`is_passed` integer DEFAULT true,
	`certificate` text,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `waste_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`waste_type` text NOT NULL,
	`waste_name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`disposal_method` text,
	`disposal_vendor` text,
	`is_compliant` integer DEFAULT true,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `waste_water_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`discharge_type` text NOT NULL,
	`pollutant_type` text,
	`concentration` real,
	`concentration_unit` text,
	`volume` real NOT NULL,
	`volume_unit` text DEFAULT 'm3' NOT NULL,
	`standard_limit` real,
	`is_compliant` integer DEFAULT true,
	`treatment_method` text,
	`facility` text,
	`permit_no` text,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `water_consumption` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`water_type` text NOT NULL,
	`source` text,
	`volume` real NOT NULL,
	`unit` text DEFAULT 'm3' NOT NULL,
	`cost` real,
	`facility` text,
	`org_unit_id` integer,
	`remark` text,
	`created_at` integer,
	FOREIGN KEY (`org_unit_id`) REFERENCES `org_units`(`id`) ON UPDATE no action ON DELETE no action
);
