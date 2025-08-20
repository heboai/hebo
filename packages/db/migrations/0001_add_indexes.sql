DROP INDEX "unique_slug";--> statement-breakpoint
CREATE INDEX "idx_agents_created_at_not_deleted" ON "agents" USING btree ("created_at") WHERE "agents"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_agents_slug_not_deleted" ON "agents" USING btree ("slug") WHERE "agents"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_branches_agent_created_at_not_deleted" ON "branches" USING btree ("agent_id","created_at") WHERE "branches"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_branches_agent_slug_not_deleted" ON "branches" USING btree ("agent_id","slug") WHERE "branches"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_slug" ON "agents" USING btree (LOWER("slug")) WHERE "agents"."deleted_at" is null;