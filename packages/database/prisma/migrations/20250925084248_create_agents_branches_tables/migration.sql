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
    "slug" TEXT NOT NULL,
    "agent_slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "models" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("slug","agent_slug")
);

-- AddForeignKey
ALTER TABLE "public"."branches" ADD CONSTRAINT "branches_agent_slug_fkey" FOREIGN KEY ("agent_slug") REFERENCES "public"."agents"("slug") ON DELETE CASCADE ON UPDATE NO ACTION;
