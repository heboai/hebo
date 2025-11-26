-- CreateTable
CREATE TABLE "provider_configs" (
    "id" UUID NOT NULL,
    "provider_slug" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "provider_configs_pkey" PRIMARY KEY ("id")
);
