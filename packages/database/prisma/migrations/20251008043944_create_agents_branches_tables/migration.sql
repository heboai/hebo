-- CreateTable
CREATE TABLE "public"."Agents" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branches" (
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

    CONSTRAINT "Branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agents_slug_key" ON "public"."Agents"("slug");

-- CreateIndex
CREATE INDEX "Branches_agent_slug_slug_idx" ON "public"."Branches"("agent_slug", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_Branches_slug_Agents" ON "public"."Branches"("slug", "agent_slug") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "public"."Branches" ADD CONSTRAINT "Branches_agent_slug_fkey" FOREIGN KEY ("agent_slug") REFERENCES "public"."Agents"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
