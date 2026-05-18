-- Per-state impact scores from AI analysis, plus generation timestamp
ALTER TABLE "Bill" ADD COLUMN "stateImpacts" JSONB;
ALTER TABLE "Bill" ADD COLUMN "stateImpactsAt" TIMESTAMP(3);
