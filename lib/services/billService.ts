import prisma from '@/lib/prisma'
import { CongressAPI } from '@/lib/api/congress'

// Safely convert subjects from any format to string array
function parseSubjects(subjects: any): string[] {
  if (!subjects) return []
  if (Array.isArray(subjects)) return subjects.map((s: any) => s.name || s).filter(Boolean)
  if (subjects.subject && Array.isArray(subjects.subject)) return subjects.subject.map((s: any) => s.name || s).filter(Boolean)
  if (subjects.legislativeSubjects && Array.isArray(subjects.legislativeSubjects)) return subjects.legislativeSubjects.map((s: any) => s.name || s).filter(Boolean)
  if (typeof subjects === 'string') return [subjects]
  return []
}

// Safely parse a date string — returns a valid Date or null
function safeDate(value: any): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// Safely convert sponsors/cosponsors to an array
// Congress API sometimes returns { count, url } instead of an actual array
function parseSponsorList(data: any): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return []
}

export class BillService {
  static async syncBills() {
    try {
      const bills = await CongressAPI.getRecentBills(118, 50)
      let synced = 0

      for (const billData of bills) {
        try {
          const details = await CongressAPI.getBillDetails(
            parseInt(billData.congress),
            billData.type,
            billData.number
          )

          const introducedDate = safeDate(billData.introducedDate) || safeDate(details.introducedDate)
          const latestActionDate = safeDate(details.latestAction?.actionDate)

          // Skip bills with no valid introduced date (required field)
          if (!introducedDate) {
            console.warn(`Skipping bill ${billData.type}${billData.number}: no valid introducedDate`)
            continue
          }

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
              shortTitle: details.shortTitle || null,
              summary: details.summary?.text || null,
              introducedDate,
              latestActionDate,
              latestActionText: details.latestAction?.text || null,
              status: details.status || 'introduced',
              originChamber: details.originChamber || 'house',
              policyArea: details.policyArea?.name || null,
              subjects: parseSubjects(details.subjects),
              sponsors: parseSponsorList(details.sponsors),
              cosponsors: parseSponsorList(details.cosponsors),
            },
            update: {
              title: details.title || billData.title,
              shortTitle: details.shortTitle || null,
              summary: details.summary?.text || null,
              latestActionDate,
              latestActionText: details.latestAction?.text || null,
              status: details.status || 'introduced',
              policyArea: details.policyArea?.name || null,
              subjects: parseSubjects(details.subjects),
              sponsors: parseSponsorList(details.sponsors),
              cosponsors: parseSponsorList(details.cosponsors),
            }
          })

          synced++
        } catch (billError) {
          console.error(`Error syncing bill ${billData.type}${billData.number}:`, billError)
          // Continue syncing other bills instead of failing entirely
          continue
        }
      }

      return { success: true, count: synced }
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
