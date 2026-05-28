-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "stylePrefs" TEXT NOT NULL,
    "nextShipmentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubscriptionShipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "items" TEXT NOT NULL,
    "shippedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionShipment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArtistDesign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productType" TEXT NOT NULL DEFAULT 'TSHIRT',
    "price" REAL NOT NULL DEFAULT 29.99,
    "svg" TEXT NOT NULL,
    "badge" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArtistDesign_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ArtistDesign" ("artistId", "badge", "category", "createdAt", "id", "price", "salesCount", "status", "svg", "title", "totalEarned", "updatedAt") SELECT "artistId", "badge", "category", "createdAt", "id", "price", "salesCount", "status", "svg", "title", "totalEarned", "updatedAt" FROM "ArtistDesign";
DROP TABLE "ArtistDesign";
ALTER TABLE "new_ArtistDesign" RENAME TO "ArtistDesign";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
