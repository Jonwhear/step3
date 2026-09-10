CREATE TABLE `case_imaging_result` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`study_name` text NOT NULL,
	`modality` text DEFAULT 'OTHER' NOT NULL,
	`performed_label` text DEFAULT '' NOT NULL,
	`impression` text NOT NULL,
	`findings_text` text DEFAULT '' NOT NULL,
	`trigger_action_code` text,
	`image_asset_path` text,
	`thumbnail_asset_path` text,
	`clinical_role` text DEFAULT 'CONTEXT' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_imaging_result_case_idx` ON `case_imaging_result` (`case_id`,`display_order`);--> statement-breakpoint
CREATE TABLE `case_lab_result` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`lab_definition_id` text NOT NULL,
	`value` text NOT NULL,
	`flag` text DEFAULT 'NORMAL' NOT NULL,
	`trigger_action_code` text,
	`collected_label` text DEFAULT '' NOT NULL,
	`clinical_role` text DEFAULT 'CONTEXT' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_lab_result_case_idx` ON `case_lab_result` (`case_id`,`display_order`);--> statement-breakpoint
CREATE TABLE `case_problem` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`label` text NOT NULL,
	`assessment_text` text DEFAULT '' NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`is_expected` integer DEFAULT true NOT NULL,
	`concept_id` text,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_problem_case_idx` ON `case_problem` (`case_id`,`display_order`);--> statement-breakpoint
CREATE TABLE `case_problem_option` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_id` text NOT NULL,
	`label` text NOT NULL,
	`classification` text NOT NULL,
	`action_code` text,
	`feedback_text` text DEFAULT '' NOT NULL,
	`concept_id` text,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_problem_option_problem_idx` ON `case_problem_option` (`problem_id`,`display_order`);--> statement-breakpoint
CREATE TABLE `case_revision` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`version` integer NOT NULL,
	`snapshot_json` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `case_revision_case_idx` ON `case_revision` (`case_id`,`version`);--> statement-breakpoint
CREATE TABLE `content_pack` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`version` text DEFAULT '1.0.0' NOT NULL,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_source` (
	`id` text PRIMARY KEY NOT NULL,
	`source_type` text NOT NULL,
	`title` text NOT NULL,
	`source_identifier` text DEFAULT '' NOT NULL,
	`section` text DEFAULT '' NOT NULL,
	`subsection` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` text DEFAULT '' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`pack_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `content_source_type_idx` ON `content_source` (`source_type`);--> statement-breakpoint
CREATE TABLE `evidence_link` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`content_source_id` text NOT NULL,
	`source_fragment_id` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `evidence_link_entity_idx` ON `evidence_link` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `evidence_link_source_idx` ON `evidence_link` (`content_source_id`);--> statement-breakpoint
CREATE TABLE `hospital_room` (
	`id` text PRIMARY KEY NOT NULL,
	`unit` text NOT NULL,
	`room_number` text NOT NULL,
	`room_type` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hospital_room_unit_number_idx` ON `hospital_room` (`unit`,`room_number`);--> statement-breakpoint
CREATE INDEX `hospital_room_type_idx` ON `hospital_room` (`room_type`,`display_order`);--> statement-breakpoint
CREATE TABLE `lab_definition` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`display_name` text NOT NULL,
	`units` text DEFAULT '' NOT NULL,
	`reference_low` real,
	`reference_high` real,
	`reference_text` text,
	`sex_specific_range_json` text,
	`category` text DEFAULT 'OTHER' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`content_origin` text DEFAULT 'AUTHORED' NOT NULL,
	`demo_seed_version` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lab_definition_code_unique` ON `lab_definition` (`code`);--> statement-breakpoint
CREATE INDEX `lab_definition_category_idx` ON `lab_definition` (`category`,`display_order`);--> statement-breakpoint
CREATE TABLE `learning_point` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`specialty` text DEFAULT '' NOT NULL,
	`topic` text DEFAULT '' NOT NULL,
	`importance` integer DEFAULT 3 NOT NULL,
	`content_source_id` text,
	`source_fragment_id` text,
	`status` text DEFAULT 'UNPROCESSED' NOT NULL,
	`review_status` text DEFAULT 'UNREVIEWED' NOT NULL,
	`canonical_learning_point_id` text,
	`is_canonical` integer DEFAULT true NOT NULL,
	`pack_id` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_point_code_unique` ON `learning_point` (`code`);--> statement-breakpoint
CREATE INDEX `learning_point_status_idx` ON `learning_point` (`status`);--> statement-breakpoint
CREATE INDEX `learning_point_specialty_idx` ON `learning_point` (`specialty`,`topic`);--> statement-breakpoint
CREATE INDEX `learning_point_canonical_idx` ON `learning_point` (`canonical_learning_point_id`);--> statement-breakpoint
CREATE TABLE `learning_point_mapping` (
	`id` text PRIMARY KEY NOT NULL,
	`learning_point_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`case_id` text,
	`lecture_id` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_point_mapping_unique_idx` ON `learning_point_mapping` (`learning_point_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `learning_point_mapping_entity_idx` ON `learning_point_mapping` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `learning_point_mapping_case_idx` ON `learning_point_mapping` (`case_id`);--> statement-breakpoint
CREATE TABLE `lecture_section` (
	`id` text PRIMARY KEY NOT NULL,
	`lecture_id` text NOT NULL,
	`heading` text NOT NULL,
	`body` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`tts_order` integer DEFAULT 0 NOT NULL,
	`media_type` text,
	`media_asset_path` text,
	`caption` text,
	`alt_text` text
);
--> statement-breakpoint
CREATE INDEX `lecture_section_lecture_idx` ON `lecture_section` (`lecture_id`,`display_order`);--> statement-breakpoint
CREATE TABLE `patient_plan_selection` (
	`patient_instance_id` text NOT NULL,
	`option_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	PRIMARY KEY(`patient_instance_id`, `option_id`)
);
--> statement-breakpoint
CREATE TABLE `patient_problem` (
	`patient_instance_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`added_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	PRIMARY KEY(`patient_instance_id`, `problem_id`)
);
--> statement-breakpoint
CREATE TABLE `patient_visual` (
	`patient_instance_id` text PRIMARY KEY NOT NULL,
	`asset_type` text DEFAULT 'INITIALS' NOT NULL,
	`asset_path` text,
	`fallback_initials` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_fragment` (
	`id` text PRIMARY KEY NOT NULL,
	`content_source_id` text NOT NULL,
	`fragment_index` integer NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`raw_text` text NOT NULL,
	`normalized_text` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_fragment_source_index_idx` ON `source_fragment` (`content_source_id`,`fragment_index`);--> statement-breakpoint
ALTER TABLE `case_finding` ADD `clinical_role` text DEFAULT 'CONTEXT' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_prompt` ADD `why_correct` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_prompt` ADD `why_others_wrong` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_prompt` ADD `case_evidence` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_prompt` ADD `detailed_explanation` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `status` text DEFAULT 'PUBLISHED' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `review_status` text DEFAULT 'UNREVIEWED' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `case_template` ADD `review_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `pack_id` text;--> statement-breakpoint
ALTER TABLE `case_template` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `created_by` text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `derived_from_case_id` text;--> statement-breakpoint
ALTER TABLE `case_template` ADD `patient_age_years` integer;--> statement-breakpoint
ALTER TABLE `case_template` ADD `patient_sex` text;--> statement-breakpoint
ALTER TABLE `case_template` ADD `chief_complaint` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `code_status` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `case_template` ADD `allergies` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `case_template_status_idx` ON `case_template` (`status`);--> statement-breakpoint
ALTER TABLE `patient_instance` ADD `location_type` text DEFAULT 'INPATIENT' NOT NULL;--> statement-breakpoint
ALTER TABLE `patient_instance` ADD `room_id` text;--> statement-breakpoint
CREATE INDEX `patient_instance_room_idx` ON `patient_instance` (`room_id`);