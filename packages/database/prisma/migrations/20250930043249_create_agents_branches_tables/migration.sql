-- CreateTable
CREATE TABLE "public"."agents" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "public"."branches" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "agent_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "models" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_branch_slug_agent_slug" ON "public"."branches"("slug", "agent_slug");

-- CreateIndex
CREATE INDEX "idx_branch_agent_slug" ON "public"."branches"("agent_slug");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_branch_slug_agent" ON "public"."branches"("slug", "agent_slug") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_agent_slug_fkey" FOREIGN KEY ("agent_slug") REFERENCES "public"."agents"("slug") ON DELETE CASCADE ON UPDATE NO ACTION;
