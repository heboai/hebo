-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "agent_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "models" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_slug_key" ON "agents"("slug");

-- CreateIndex
CREATE INDEX "branches_agent_slug_slug_idx" ON "branches"("agent_slug", "slug");

-- The following index has been added manually because Prisma doesn't support partial indexes
-- CreateIndex
CREATE UNIQUE INDEX "unique_active_branches_slug_agents" ON "branches"("slug", "agent_slug") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_agent_slug_fkey" FOREIGN KEY ("agent_slug") REFERENCES "agents"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
