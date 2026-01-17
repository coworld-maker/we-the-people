import prisma from '@/lib/prisma'
import { EncryptionService } from '@/lib/security/encryption'
import { BillService } from './billService'

export class VoteService {
  static async castVote(
    userId: string,
    billId: string,
    position: 'yes' | 'no' | 'abstain',
    reasoning?: string,
    confidence?: number,
    isAnonymous: boolean = true,
    ipAddress?: string
  ) {
    let reasoningData = {}
    
    if (reasoning) {
      const encrypted = EncryptionService.encrypt(reasoning)
      reasoningData = {
        reasoningEncrypted: encrypted.encrypted,
        reasoningIv: encrypted.iv,
        reasoningTag: encrypted.tag,
      }
    }

    const ipHash = ipAddress ? EncryptionService.hash(ipAddress) : null

    const vote = await prisma.vote.upsert({
      where: {
        userId_billId: { userId, billId }
      },
      create: {
        userId,
        billId,
        position,
        ...reasoningData,
        confidence,
        isAnonymous,
        ipHash,
      },
      update: {
        position,
        ...reasoningData,
        confidence,
        isAnonymous,
        updatedAt: new Date(),
      },
      include: { bill: true }
    })

    // Update aggregates
    await BillService.updateVoteAggregate(billId)

    // Log audit event
    await prisma.auditLog.create({
      data: {
        eventType: 'VOTE_CAST',
        severity: 'INFO',
        userId,
        ipAddressHash: ipHash,
        metadata: { billId, position, isAnonymous },
        message: `Vote cast on bill ${billId}`
      }
    })

    return vote
  }

  static async getUserVote(userId: string, billId: string) {
    const vote = await prisma.vote.findUnique({
      where: {
        userId_billId: { userId, billId }
      }
    })

    if (!vote) return null

    let reasoning = null
    if (vote.reasoningEncrypted && vote.reasoningIv && vote.reasoningTag) {
      try {
        reasoning = EncryptionService.decrypt({
          encrypted: vote.reasoningEncrypted,
          iv: vote.reasoningIv,
          tag: vote.reasoningTag,
        })
      } catch (error) {
        console.error('Failed to decrypt reasoning:', error)
      }
    }

    return { ...vote, reasoning }
  }

  static async getUserVotes(userId: string, limit: number = 50) {
    return await prisma.vote.findMany({
      where: { userId },
      include: { bill: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  static async deleteVote(userId: string, billId: string) {
    await prisma.vote.delete({
      where: {
        userId_billId: { userId, billId }
      }
    })

    // Update aggregates
    await BillService.updateVoteAggregate(billId)

    // Log audit event
    await prisma.auditLog.create({
      data: {
        eventType: 'VOTE_DELETED',
        severity: 'INFO',
        userId,
        metadata: { billId },
        message: `Vote deleted on bill ${billId}`
      }
    })
  }

  static async getVoteStats(userId: string) {
    const votes = await prisma.vote.groupBy({
      by: ['position'],
      where: { userId },
      _count: true
    })

    return {
      total: votes.reduce((sum, v) => sum + v._count, 0),
      yes: votes.find(v => v.position === 'yes')?._count || 0,
      no: votes.find(v => v.position === 'no')?._count || 0,
      abstain: votes.find(v => v.position === 'abstain')?._count || 0,
    }
  }
}
