-- CreateEnum
CREATE TYPE "public"."inspection_status" AS ENUM ('draft', 'completed');

-- CreateTable
CREATE TABLE "public"."inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "center_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "mileage_km" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "exterior_colour" TEXT NOT NULL,
    "engine_number" TEXT NOT NULL,
    "chassis_number" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "checks" JSONB NOT NULL,
    "grades" JSONB NOT NULL,
    "checks_passed" INTEGER NOT NULL,
    "checks_failed" INTEGER NOT NULL,
    "photos_captured" INTEGER NOT NULL DEFAULT 0,
    "pass_mark" INTEGER NOT NULL DEFAULT 67,
    "composite_score" INTEGER NOT NULL,
    "status" "public"."inspection_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inspection_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inspection_id" UUID NOT NULL,
    "slot_key" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspections_center_id_created_at_idx" ON "public"."inspections"("center_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "inspection_photos_inspection_id_slot_key_key" ON "public"."inspection_photos"("inspection_id", "slot_key");

-- AddForeignKey
ALTER TABLE "public"."inspections" ADD CONSTRAINT "inspections_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."inspection_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inspections" ADD CONSTRAINT "inspections_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inspection_photos" ADD CONSTRAINT "inspection_photos_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: API uses Prisma (DB role); deny direct Data API access for anon/authenticated
ALTER TABLE "public"."inspections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."inspection_photos" ENABLE ROW LEVEL SECURITY;
