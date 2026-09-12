CREATE TABLE `patient_observation` (
	`patient_instance_id` text NOT NULL,
	`observation_key` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`units` text,
	`hospital_day` integer NOT NULL,
	`recorded_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	PRIMARY KEY(`patient_instance_id`, `observation_key`, `hospital_day`)
);
--> statement-breakpoint
CREATE INDEX `patient_observation_patient_idx` ON `patient_observation` (`patient_instance_id`,`observation_key`);