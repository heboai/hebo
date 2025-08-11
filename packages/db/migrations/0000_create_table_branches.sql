CREATE TABLE "branches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'main' NOT NULL,
	"agent" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_by" text,
	"deleted_at" timestamp with time zone
);
