import prisma from '@/lib/prisma'
import { CongressAPI } from '@/lib/api/congress'

export class BillService {
  static async syncBills() {
    try {
      const bills = await CongressAPI.getRecentBills(118, 50)
      
      for (const billData of bills) {
        const details = await CongressAPI.getBillDetails(
          parseInt(billData.congress),
          billData.type,
          billData.number
        )

        await prisma.bill.upsert({
          where: {
            congress_billType_billNumber: {
              congress: billData.congress,
              billType: billData.type,
              billNumber: billData.number,
            }
          },
          create: {
            congress: billData.congress,
            billType: billData.type,
            billNumber: billData.number,
            title: details.title || billData.title,
            shortTitle: details.shortTitle,
            summary: details.summary?.text,
            introducedDate: new Date(billData.introducedDate),
            latestActionDate: details.latestAction?.actionDate 
              ? new Date(details.latestAction.actionDate) 
              : null,
            latestActionText: details.latestAction?.text,
            status: details.status || 'introduced',
            originChamber: details.originChamber || 'house',
            policyArea: details.policyArea?.name,
            subjects: details.subjects?.map((s: any) => s.name) || [],
            sponsors: details.sponsors || [],
            cosponsors: details.cosponsors || [],
          },
          update: {
            title: details.title || billData.title,
            shortTitle: details.shortTitle,
            summary: details.summary?.text,
            latestActionDate: details.latestAction?.actionDate 
              ? new Date(details.latestAction.actionDate) 
              : null,
            latestActionText: details.latestAction?.text,
            status: details.status || 'introduced',
            policyArea: details.policyArea?.name,
            subjects: details.subjects?.map((s: any) => s.name) || [],
            sponsors: details.sponsors || [],
            cosponsors: details.cosponsors || [],
          }
        })
      }

      return { success: true, count: bills.length }
    } catch (error) {
      console.error('Bill sync error:', error)
      throw error
    }
  }

  static async getBills(filters?: {
    policyArea?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    
    if (filters?.policyArea) {
      where.policyArea = filters.policyArea
    }
    
    if (filters?.status) {
      where.status = filters.status
    }
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
        orderBy: { introducedDate: 'desc' },
        include: {
          _count: { select: { votes: true } }
        }
      }),
      prisma.bill.count({ where })
    ])

    return { bills, total }
  }

  static async getBillById(id: string) {
    return await prisma.bill.findUnique({
      where: { id },
      include: {
        votes: {
          where: { isAnonymous: false },
          include: { user: true }
        },
        prosCons: true,
        impacts: true,
        _count: { select: { votes: true } }
      }
    })
  }

  static async getBillVoteStats(billId: string) {
    const aggregate = await prisma.billVoteAggregate.findUnique({
      where: { billId }
    })

    if (!aggregate) {
      return {
        yesCount: 0,
        noCount: 0,
        abstainCount: 0,
        totalVotes: 0
      }
    }

    return aggregate
  }

  static async updateVoteAggregate(billId: string) {
    const votes = await prisma.vote.groupBy({
      by: ['position'],
      where: { billId },
      _count: true
    })

    const stats = {
      yesCount: 0,
      noCount: 0,
      abstainCount: 0,
      totalVotes: 0
    }

    votes.forEach(v => {
      if (v.position === 'yes') stats.yesCount = v._count
      if (v.position === 'no') stats.noCount = v._count
      if (v.position === 'abstain') stats.abstainCount = v._count
      stats.totalVotes += v._count
    })

    await prisma.billVoteAggregate.upsert({
      where: { billId },
      create: { billId, ...stats, lastVoteAt: new Date() },
      update: { ...stats, lastVoteAt: new Date() }
    })

    return stats
  }
}
