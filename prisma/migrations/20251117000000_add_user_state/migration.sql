-- Add optional 2-letter state code to User for state-level sentiment aggregation
ALTER TABLE "User" ADD COLUMN "state" TEXT;

-- Lookup index for grouping votes by user state
CREATE INDEX "User_state_idx" ON "User"("state");
