-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "emailEncrypted" TEXT NOT NULL,
    "emailIv" TEXT NOT NULL,
    "emailTag" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "zipCodeEncrypted" TEXT,
    "zipCodeIv" TEXT,
    "zipCodeTag" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "profilePublic" BOOLEAN NOT NULL DEFAULT false,
    "votesPublic" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "congress" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT,
    "summary" TEXT,
    "aiSummary" TEXT,
    "introducedDate" TIMESTAMP(3) NOT NULL,
    "latestActionDate" TIMESTAMP(3),
    "latestActionText" TEXT,
    "status" TEXT NOT NULL,
    "originChamber" TEXT NOT NULL,
    "policyArea" TEXT,
    "subjects" TEXT[],
    "sponsors" JSONB NOT NULL,
    "cosponsors" JSONB,
    "actions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "reasoningEncrypted" TEXT,
    "reasoningIv" TEXT,
    "reasoningTag" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "confidence" INTEGER,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillVoteAggregate" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "yesCount" INTEGER NOT NULL DEFAULT 0,
    "noCount" INTEGER NOT NULL DEFAULT 0,
    "abstainCount" INTEGER NOT NULL DEFAULT 0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "lastVoteAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillVoteAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProCon" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProCon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Impact" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "demographic" TEXT,
    "impactType" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "detailedAnalysis" TEXT NOT NULL,
    "affectedGroups" TEXT[],
    "confidence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Impact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representative" (
    "id" TEXT NOT NULL,
    "bioguideId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT,
    "chamber" TEXT NOT NULL,
    "termStart" TIMESTAMP(3) NOT NULL,
    "currentTerm" BOOLEAN NOT NULL DEFAULT true,
    "committees" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Representative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "billId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddressHash" TEXT,
    "metadata" JSONB,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");

-- CreateIndex
CREATE INDEX "User_emailHash_idx" ON "User"("emailHash");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "Bill_policyArea_idx" ON "Bill"("policyArea");

-- CreateIndex
CREATE INDEX "Bill_status_idx" ON "Bill"("status");

-- CreateIndex
CREATE INDEX "Bill_introducedDate_idx" ON "Bill"("introducedDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_congress_billType_billNumber_key" ON "Bill"("congress", "billType", "billNumber");

-- CreateIndex
CREATE INDEX "Vote_billId_idx" ON "Vote"("billId");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_userId_billId_key" ON "Vote"("userId", "billId");

-- CreateIndex
CREATE UNIQUE INDEX "BillVoteAggregate_billId_key" ON "BillVoteAggregate"("billId");

-- CreateIndex
CREATE INDEX "BillVoteAggregate_billId_idx" ON "BillVoteAggregate"("billId");

-- CreateIndex
CREATE INDEX "ProCon_billId_idx" ON "ProCon"("billId");

-- CreateIndex
CREATE INDEX "ProCon_billId_type_idx" ON "ProCon"("billId", "type");

-- CreateIndex
CREATE INDEX "Impact_billId_idx" ON "Impact"("billId");

-- CreateIndex
CREATE INDEX "Impact_category_idx" ON "Impact"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Representative_bioguideId_key" ON "Representative"("bioguideId");

-- CreateIndex
CREATE INDEX "Representative_state_idx" ON "Representative"("state");

-- CreateIndex
CREATE INDEX "Representative_bioguideId_idx" ON "Representative"("bioguideId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_eventType_timestamp_idx" ON "AuditLog"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProCon" ADD CONSTRAINT "ProCon_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Impact" ADD CONSTRAINT "Impact_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
