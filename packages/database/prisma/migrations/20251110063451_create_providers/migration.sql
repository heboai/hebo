-- CreateTable
CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- Partial indexes are not supported by Prisma, so we need to create them manually.
CREATE UNIQUE INDEX "providers_name_created_by_key" ON "providers"("name", "created_by") WHERE "deleted_at" IS NULL;
