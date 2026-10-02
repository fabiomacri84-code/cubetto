-- Additive migration: preserve all existing lists, items, packs and categories.
ALTER TABLE "List" ADD COLUMN "imageUrl" TEXT, ADD COLUMN "imageAttribution" TEXT, ADD COLUMN "imageSourceUrl" TEXT, ADD COLUMN "imageSource" "ImageSource" NOT NULL DEFAULT 'emoji';
ALTER TABLE "Item" ADD COLUMN "imageAttribution" TEXT, ADD COLUMN "imageSourceUrl" TEXT;
ALTER TABLE "Pack" ADD COLUMN "imageAttribution" TEXT, ADD COLUMN "imageSourceUrl" TEXT;
ALTER TABLE "PackItem" ADD COLUMN "imageAttribution" TEXT, ADD COLUMN "imageSourceUrl" TEXT;
