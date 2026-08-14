CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_territories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"territory_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_code" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"role_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"joined_at" date,
	"left_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "territories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"province" varchar(255),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_code" varchar(50) NOT NULL,
	"customer_type_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"province" varchar(255),
	"district" varchar(255),
	"territory_id" uuid NOT NULL,
	"contact_name" varchar(255),
	"contact_phone" varchar(30),
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_code" varchar(50) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"product_group_id" uuid NOT NULL,
	"dosage_form" varchar(100) NOT NULL,
	"strength" varchar(100),
	"unit" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_report_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "prescription_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_date" date NOT NULL,
	"employee_id" uuid NOT NULL,
	"territory_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"doctor_name" varchar(255),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_date" date NOT NULL,
	"employee_id" uuid NOT NULL,
	"territory_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_price" numeric(18, 2) NOT NULL,
	"revenue" numeric(18, 2) NOT NULL,
	"source" varchar(50) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tender_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_id" uuid NOT NULL,
	"old_status" varchar(30),
	"new_status" varchar(30) NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "tenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_code" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"territory_id" uuid NOT NULL,
	"tender_name" varchar(255) NOT NULL,
	"description" text,
	"expected_value" numeric(18, 2),
	"start_date" date,
	"submission_date" date,
	"result_date" date,
	"status" varchar(30) DEFAULT 'DRAFT' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"report_date" date NOT NULL,
	"visits_count" integer DEFAULT 0 NOT NULL,
	"new_customers_count" integer DEFAULT 0 NOT NULL,
	"sales_value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"prescription_count" integer DEFAULT 0 NOT NULL,
	"tender_activity" text,
	"summary" text,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"unit" varchar(50) NOT NULL,
	"calculation_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"kpi_definition_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"target_value" numeric(18, 2) NOT NULL,
	"actual_value" numeric(18, 2) NOT NULL,
	"achievement_rate" numeric(9, 4) NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"kpi_definition_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"target_value" numeric(18, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_territories" ADD CONSTRAINT "employee_territories_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_territories" ADD CONSTRAINT "employee_territories_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_customer_type_id_customer_types_id_fk" FOREIGN KEY ("customer_type_id") REFERENCES "public"."customer_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_customers" ADD CONSTRAINT "employee_customers_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_customers" ADD CONSTRAINT "employee_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_group_id_product_groups_id_fk" FOREIGN KEY ("product_group_id") REFERENCES "public"."product_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_report_id_fk" FOREIGN KEY ("prescription_report_id") REFERENCES "public"."prescription_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reports" ADD CONSTRAINT "prescription_reports_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reports" ADD CONSTRAINT "prescription_reports_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reports" ADD CONSTRAINT "prescription_reports_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_status_history" ADD CONSTRAINT "tender_status_history_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_status_history" ADD CONSTRAINT "tender_status_history_changed_by_employees_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_territory_id_territories_id_fk" FOREIGN KEY ("territory_id") REFERENCES "public"."territories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_kpi_definition_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_definition_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_targets" ADD CONSTRAINT "kpi_targets_kpi_definition_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_definition_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_employees_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_code_key" ON "roles" USING btree ("code");--> statement-breakpoint
CREATE INDEX "employee_territories_employee_id_idx" ON "employee_territories" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_territories_territory_id_idx" ON "employee_territories" USING btree ("territory_id");--> statement-breakpoint
CREATE INDEX "employee_territories_active_scope_idx" ON "employee_territories" USING btree ("employee_id","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees" USING btree ("employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_email_key" ON "employees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "employees_role_id_idx" ON "employees" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "territories_code_key" ON "territories" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_types_code_key" ON "customer_types" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_customer_code_key" ON "customers" USING btree ("customer_code");--> statement-breakpoint
CREATE INDEX "customers_territory_id_idx" ON "customers" USING btree ("territory_id");--> statement-breakpoint
CREATE INDEX "customers_customer_type_id_idx" ON "customers" USING btree ("customer_type_id");--> statement-breakpoint
CREATE INDEX "employee_customers_employee_id_idx" ON "employee_customers" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_customers_customer_id_idx" ON "employee_customers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "employee_customers_active_scope_idx" ON "employee_customers" USING btree ("employee_id","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "product_groups_code_key" ON "product_groups" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "products_product_code_key" ON "products" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "products_product_group_id_idx" ON "products" USING btree ("product_group_id");--> statement-breakpoint
CREATE INDEX "prescription_items_prescription_report_id_idx" ON "prescription_items" USING btree ("prescription_report_id");--> statement-breakpoint
CREATE INDEX "prescription_items_product_id_idx" ON "prescription_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "prescription_reports_customer_id_idx" ON "prescription_reports" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "prescription_reports_employee_id_idx" ON "prescription_reports" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "prescription_reports_territory_id_idx" ON "prescription_reports" USING btree ("territory_id");--> statement-breakpoint
CREATE INDEX "prescription_reports_report_date_idx" ON "prescription_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "sales_transactions_customer_id_idx" ON "sales_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sales_transactions_employee_id_idx" ON "sales_transactions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "sales_transactions_territory_id_idx" ON "sales_transactions" USING btree ("territory_id");--> statement-breakpoint
CREATE INDEX "sales_transactions_transaction_date_idx" ON "sales_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "sales_transactions_customer_date_idx" ON "sales_transactions" USING btree ("customer_id","transaction_date");--> statement-breakpoint
CREATE INDEX "tender_status_history_tender_id_idx" ON "tender_status_history" USING btree ("tender_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenders_tender_code_key" ON "tenders" USING btree ("tender_code");--> statement-breakpoint
CREATE INDEX "tenders_customer_id_idx" ON "tenders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "tenders_employee_id_idx" ON "tenders" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "tenders_territory_id_idx" ON "tenders" USING btree ("territory_id");--> statement-breakpoint
CREATE INDEX "tenders_status_idx" ON "tenders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_reports_employee_id_report_date_key" ON "daily_reports" USING btree ("employee_id","report_date");--> statement-breakpoint
CREATE UNIQUE INDEX "kpi_definitions_code_key" ON "kpi_definitions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "kpi_results_employee_id_idx" ON "kpi_results" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "kpi_results_period_idx" ON "kpi_results" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "kpi_targets_employee_id_idx" ON "kpi_targets" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "kpi_targets_period_idx" ON "kpi_targets" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_employee_id_idx" ON "notifications" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "notifications_employee_unread_idx" ON "notifications" USING btree ("employee_id","read_at");