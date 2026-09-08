CREATE TABLE `action_definition` (
	`id` text PRIMARY KEY NOT NULL,
	`action_code` text NOT NULL,
	`category` text NOT NULL,
	`display_name` text NOT NULL,
	`synonyms_json` text DEFAULT '[]' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`content_origin` text DEFAULT 'AUTHORED' NOT NULL,
	`demo_seed_version` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `action_definition_action_code_unique` ON `action_definition` (`action_code`);--> statement-breakpoint
CREATE TABLE `case_action_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`action_code` text NOT NULL,
	`classification` text NOT NULL,
	`result_text` text DEFAULT '' NOT NULL,
	`feedback_text` text DEFAULT '' NOT NULL,
	`concept_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `case_action_rule_case_action_idx` ON `case_action_rule` (`case_id`,`action_code`);--> statement-breakpoint
CREATE TABLE `case_concept` (
	`case_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	PRIMARY KEY(`case_id`, `concept_id`)
);
--> statement-breakpoint
CREATE TABLE `case_finding` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`category` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`units` text,
	`reference_range` text,
	`trigger_action_code` text,
	`initially_visible` integer DEFAULT false NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_finding_case_idx` ON `case_finding` (`case_id`,`display_order`);--> statement-breakpoint
CREATE TABLE `case_prompt` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`stage` text NOT NULL,
	`sequence` integer NOT NULL,
	`prompt_text` text NOT NULL,
	`response_type` text NOT NULL,
	`answer_config_json` text NOT NULL,
	`correct_feedback` text DEFAULT '' NOT NULL,
	`incorrect_feedback` text DEFAULT '' NOT NULL,
	`concept_id` text
);
--> statement-breakpoint
CREATE INDEX `case_prompt_case_stage_idx` ON `case_prompt` (`case_id`,`stage`,`sequence`);--> statement-breakpoint
CREATE TABLE `case_template` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`specialty` text NOT NULL,
	`topic` text NOT NULL,
	`primary_diagnosis` text NOT NULL,
	`difficulty` integer DEFAULT 3 NOT NULL,
	`step3_importance` integer DEFAULT 3 NOT NULL,
	`handoff_script` text NOT NULL,
	`admission_opening` text NOT NULL,
	`teaching_point` text DEFAULT '' NOT NULL,
	`daily_signout` text DEFAULT '' NOT NULL,
	`minimum_rounds_before_discharge` integer DEFAULT 2 NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`content_origin` text DEFAULT 'AUTHORED' NOT NULL,
	`demo_seed_version` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `case_template_code_unique` ON `case_template` (`code`);--> statement-breakpoint
CREATE INDEX `case_template_specialty_idx` ON `case_template` (`specialty`,`topic`);--> statement-breakpoint
CREATE TABLE `concept` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`specialty` text NOT NULL,
	`topic` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`importance` integer DEFAULT 3 NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`content_origin` text DEFAULT 'AUTHORED' NOT NULL,
	`demo_seed_version` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concept_code_unique` ON `concept` (`code`);--> statement-breakpoint
CREATE INDEX `concept_specialty_idx` ON `concept` (`specialty`,`topic`);--> statement-breakpoint
CREATE TABLE `lecture` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`specialty` text NOT NULL,
	`topic` text NOT NULL,
	`lecture_type` text NOT NULL,
	`summary` text NOT NULL,
	`audio_script` text NOT NULL,
	`key_points_json` text DEFAULT '[]' NOT NULL,
	`estimated_minutes` integer DEFAULT 5 NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`content_origin` text DEFAULT 'AUTHORED' NOT NULL,
	`demo_seed_version` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lecture_code_unique` ON `lecture` (`code`);--> statement-breakpoint
CREATE INDEX `lecture_specialty_idx` ON `lecture` (`specialty`,`topic`);--> statement-breakpoint
CREATE TABLE `lecture_concept` (
	`lecture_id` text NOT NULL,
	`concept_id` text NOT NULL,
	PRIMARY KEY(`lecture_id`, `concept_id`)
);
--> statement-breakpoint
CREATE TABLE `patient_action` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_instance_id` text NOT NULL,
	`action_code` text NOT NULL,
	`classification` text NOT NULL,
	`result_text` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `patient_action_patient_idx` ON `patient_action` (`patient_instance_id`);--> statement-breakpoint
CREATE TABLE `patient_instance` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`case_id` text NOT NULL,
	`patient_name` text NOT NULL,
	`room_number` text NOT NULL,
	`entry_mode` text NOT NULL,
	`state` text NOT NULL,
	`assigned_date` text NOT NULL,
	`assigned_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`accepted_at` text,
	`discharged_at` text,
	`rounds_completed` integer DEFAULT 0 NOT NULL,
	`current_round_prompt_index` integer DEFAULT 0 NOT NULL,
	`active_dates_json` text DEFAULT '[]' NOT NULL,
	`last_rounds_date` text,
	`last_interacted_at` text,
	`admission_completed_at` text
);
--> statement-breakpoint
CREATE INDEX `patient_instance_user_state_idx` ON `patient_instance` (`user_id`,`state`);--> statement-breakpoint
CREATE INDEX `patient_instance_case_idx` ON `patient_instance` (`case_id`);--> statement-breakpoint
CREATE TABLE `patient_prompt_response` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_instance_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`stage` text NOT NULL,
	`response` text NOT NULL,
	`correct` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `patient_prompt_response_patient_idx` ON `patient_prompt_response` (`patient_instance_id`);--> statement-breakpoint
CREATE TABLE `patient_revealed_finding` (
	`patient_instance_id` text NOT NULL,
	`finding_id` text NOT NULL,
	`revealed_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	PRIMARY KEY(`patient_instance_id`, `finding_id`)
);
--> statement-breakpoint
CREATE TABLE `rotation_block` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`specialty` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rotation_block_user_idx` ON `rotation_block` (`user_id`,`start_date`);--> statement-breakpoint
CREATE TABLE `scheduler_run` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`run_date` text NOT NULL,
	`debug_json` text DEFAULT '{}' NOT NULL,
	`new_patients_assigned` integer DEFAULT 0 NOT NULL,
	`lecture_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scheduler_run_unique_idx` ON `scheduler_run` (`user_id`,`run_date`);--> statement-breakpoint
CREATE TABLE `study_event` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`patient_instance_id` text,
	`case_id` text,
	`concept_id` text,
	`lecture_id` text,
	`event_type` text NOT NULL,
	`response` text,
	`correct` integer,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`event_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `study_event_user_date_idx` ON `study_event` (`user_id`,`event_date`);--> statement-breakpoint
CREATE INDEX `study_event_type_idx` ON `study_event` (`user_id`,`event_type`);--> statement-breakpoint
CREATE TABLE `user_concept_state` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`exposures` integer DEFAULT 0 NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`incorrect_count` integer DEFAULT 0 NOT NULL,
	`consecutive_correct` integer DEFAULT 0 NOT NULL,
	`mastery_level` integer DEFAULT 0 NOT NULL,
	`last_seen_at` text,
	`next_due_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_concept_state_unique_idx` ON `user_concept_state` (`user_id`,`concept_id`);--> statement-breakpoint
CREATE INDEX `user_concept_state_due_idx` ON `user_concept_state` (`user_id`,`next_due_at`);--> statement-breakpoint
CREATE TABLE `user_lecture_state` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`lecture_id` text NOT NULL,
	`status` text DEFAULT 'NOT_STARTED' NOT NULL,
	`started_at` text,
	`completed_at` text,
	`scheduled_date` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_lecture_state_unique_idx` ON `user_lecture_state` (`user_id`,`lecture_id`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`degree` text NOT NULL,
	`specialty` text NOT NULL,
	`step3_date` text NOT NULL,
	`target_patient_count` integer NOT NULL,
	`study_start_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_setting` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	PRIMARY KEY(`user_id`, `key`)
);
