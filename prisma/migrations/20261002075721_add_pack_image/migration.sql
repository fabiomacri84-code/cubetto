-- AlterTable
ALTER TABLE "Pack" ADD COLUMN     "imageSource" "ImageSource" NOT NULL DEFAULT 'emoji',
ADD COLUMN     "imageUrl" TEXT;
