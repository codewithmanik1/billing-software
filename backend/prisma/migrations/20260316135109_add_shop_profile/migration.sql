-- CreateTable
CREATE TABLE "shop_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'More Jewellers',
    "tagline" TEXT NOT NULL DEFAULT 'Premium Gold & Silver Jewellery',
    "phone" TEXT NOT NULL DEFAULT '6281 218 824',
    "email" TEXT NOT NULL DEFAULT 'morejewellers45@gmail.com',
    "address" TEXT NOT NULL DEFAULT 'Main Road, Mehkar - 585416, Tq. Bhalki, Dist. Bidar, Karnataka',
    "gstin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_profiles_pkey" PRIMARY KEY ("id")
);
