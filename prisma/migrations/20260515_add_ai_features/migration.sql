-- Add AI fields to Transaction table
ALTER TABLE "transactions" ADD COLUMN "aiCategoryConfidence" DOUBLE PRECISION,
ADD COLUMN "aiCategorizedAt" TIMESTAMP(3),
ADD COLUMN "isAnomalous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "anomalyReason" TEXT;

-- Create InsightCache table
CREATE TABLE "insight_caches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_caches_pkey" PRIMARY KEY ("id")
);

-- Create AICategory table
CREATE TABLE "ai_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "predictedCategory" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actualCategory" TEXT,
    "feedback" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_categories_pkey" PRIMARY KEY ("id")
);

-- Create indices
CREATE UNIQUE INDEX "insight_caches_userId_type_period_key" ON "insight_caches"("userId", "type", "period");
CREATE INDEX "insight_caches_userId_expiresAt_idx" ON "insight_caches"("userId", "expiresAt");
CREATE INDEX "ai_categories_userId_idx" ON "ai_categories"("userId");

-- Add foreign keys
ALTER TABLE "insight_caches" ADD CONSTRAINT "insight_caches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "ai_categories" ADD CONSTRAINT "ai_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
