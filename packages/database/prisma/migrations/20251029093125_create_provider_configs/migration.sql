-- CreateTable
CREATE TABLE "providerConfigs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "providerConfigs_pkey" PRIMARY KEY ("id")
);

-- Partial indexes are not supported by Prisma, so we need to create them manually.
CREATE UNIQUE INDEX "providerConfigs_name_created_by_key" ON "providerConfigs"("name", "created_by") WHERE "deleted_at" IS NULL;
