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
function parseSponsorList(data: any): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return []
}

// Derive bill status from latestActionText
function deriveStatus(details: any): string {
  const actionText = (details.latestAction?.text || '').toLowerCase()
  if (actionText.includes('became public law') || actionText.includes('signed by president')) return 'enacted'
  if (actionText.includes('passed senate') && actionText.includes('passed house')) return 'passed_both'
  if (actionText.includes('resolving differences') || actionText.includes('conference')) return 'resolving_differences'
  if (actionText.includes('passed senate') || actionText.includes('passed house') || actionText.includes('held at the desk')) return 'passed_chamber'
  if (actionText.includes('placed on senate legislative calendar') || actionText.includes('placed on the union calendar') || actionText.includes('reported by')) return 'reported'
  if (actionText.includes('committee') || actionText.includes('hearing') || actionText.includes('subcommittee')) return 'in_committee'
  return details.status || 'introduced'
}

// Normalize originChamber
function normalizeOriginChamber(details: any, billType: string): string {
  if (details.originChamber) {
    const chamber = details.originChamber.toLowerCase()
    if (chamber === 'senate' || chamber === 'house') return chamber
  }
  if (billType.toUpperCase().startsWith('S')) return 'senate'
  return 'house'
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class BillService {
  static async syncBills() {
    try {
      const bills = await CongressAPI.getRecentBills(118, 50)

      if (!bills || !Array.isArray(bills) || bills.length === 0) {
        console.warn('No bills returned from Congress API')
        return { success: true, count: 0 }
      }

      let synced = 0
      let skipped = 0

      for (const billData of bills) {
        try {
          const congressStr = String(billData.congress)
          const billType = String(billData.type)
          const billNumber = String(billData.number)

          const details = await CongressAPI.getBillDetails(
            parseInt(congressStr),
            billType,
            billNumber
          )

          const introducedDate = safeDate(billData.introducedDate) || safeDate(details.introducedDate)
          const latestActionDate = safeDate(details.latestAction?.actionDate)

          if (!introducedDate) {
            console.warn(`Skipping bill ${billType}${billNumber}: no valid introducedDate`)
            skipped++
            continue
          }

          const title = details.title || billData.title || `${billType} ${billNumber}`

          await prisma.bill.upsert({
            where: {
              congress_billType_billNumber: {
                congress: congressStr,
                billType: billType,
                billNumber: billNumber,
              }
            },
            create: {
              congress: congressStr,
              billType: billType,
              billNumber: billNumber,
              title,
              shortTitle: details.shortTitle || null,
              summary: details.summary?.text || null,
              introducedDate,
              latestActionDate,
              latestActionText: details.latestAction?.text || null,
              status: deriveStatus(details),
              originChamber: normalizeOriginChamber(details, billType),
              policyArea: details.policyArea?.name || null,
              subjects: parseSubjects(details.subjects),
              sponsors: parseSponsorList(details.sponsors),
              cosponsors: parseSponsorList(details.cosponsors),
            },
            update: {
              title,
              shortTitle: details.shortTitle || null,
              summary: details.summary?.text || null,
              latestActionDate,
              latestActionText: details.latestAction?.text || null,
              status: deriveStatus(details),
              policyArea: details.policyArea?.name || null,
              subjects: parseSubjects(details.subjects),
              sponsors: parseSponsorList(details.sponsors),
              cosponsors: parseSponsorList(details.cosponsors),
            }
          })

          synced++
          if (synced % 10 === 0) await delay(500)
        } catch (billError) {
          console.error(`Error syncing bill ${billData.type || 'unknown'}${billData.number || ''}:`, billError)
          skipped++
          continue
        }
      }

      console.log(`Sync complete: ${synced} synced, ${skipped} skipped out of ${bills.length}`)
      return { success: true, count: synced, skipped }
    } catch (error) {
      console.error('Bill sync error:', error)
      throw error
    }
  }

  /**
   * Fetch the full text of a bill from Congress.gov and save to database.
   * Called on-demand (when viewing a bill) rather than during bulk sync.
   */
  static async fetchAndSaveBillText(billId: string): Promise<string | null> {
    const bill = await prisma.bill.findUnique({ where: { id: billId } })
    if (!bill) return null

    // If we already have text, return it
    if (bill.fullText) return bill.fullText

    const text = await CongressAPI.fetchBillTextContent(
      parseInt(bill.congress),
      bill.billType,
      bill.billNumber
    )

    if (text) {
      await prisma.bill.update({
        where: { id: billId },
        data: { fullText: text },
      })
    }

    return text
  }

  static async getBills(filters?: {
    policyArea?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    
    if (filters?.policyArea) where.policyArea = filters.policyArea
    if (filters?.status) where.status = filters.status
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
          include: {
            user: {
              select: {
                id: true,
                clerkId: true,
                firstName: true,
                lastName: true,
                createdAt: true,
              }
            }
          }
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
      return { yesCount: 0, noCount: 0, abstainCount: 0, totalVotes: 0 }
    }

    return aggregate
  }

  static async updateVoteAggregate(billId: string) {
    const votes = await prisma.vote.groupBy({
      by: ['position'],
      where: { billId },
      _count: true
    })

    const stats = { yesCount: 0, noCount: 0, abstainCount: 0, totalVotes: 0 }

    votes.forEach(v => {
      const count = typeof v._count === 'number' ? v._count : (v._count as any)?._all || 0
      if (v.position === 'yes') stats.yesCount = count
      if (v.position === 'no') stats.noCount = count
      if (v.position === 'abstain') stats.abstainCount = count
      stats.totalVotes += count
    })

    await prisma.billVoteAggregate.upsert({
      where: { billId },
      create: { billId, ...stats, lastVoteAt: new Date() },
      update: { ...stats, lastVoteAt: new Date() }
    })

    return stats
  }
}
