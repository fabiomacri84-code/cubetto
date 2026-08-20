-- CreateTable
CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presence_listId_updatedAt_idx" ON "Presence"("listId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Presence_listId_userId_key" ON "Presence"("listId", "userId");

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
