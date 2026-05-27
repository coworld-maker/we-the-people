import { currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { EncryptionService } from '@/lib/security/encryption'

export class UserService {
  static async getCurrentUser() {
    const clerkUser = await currentUser()
    if (!clerkUser) return null

    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    })

    if (!user) {
      const email = clerkUser.emailAddresses[0]?.emailAddress
      if (!email) throw new Error('No email found')

      const emailHash = EncryptionService.hash(email)

      // Check if this email exists under a different Clerk ID (e.g. dev→prod migration)
      const existingByEmail = await prisma.user.findUnique({ where: { emailHash } })

      if (existingByEmail) {
        // Re-link the existing account to the new Clerk production ID
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId: clerkUser.id,
            firstName: clerkUser.firstName ?? existingByEmail.firstName,
            lastName: clerkUser.lastName ?? existingByEmail.lastName,
            lastLoginAt: new Date(),
          },
        })
      } else {
        const encryptedEmail = EncryptionService.encrypt(email)
        user = await prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            emailEncrypted: encryptedEmail.encrypted,
            emailIv: encryptedEmail.iv,
            emailTag: encryptedEmail.tag,
            emailHash,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            lastLoginAt: new Date(),
          },
        })
      }
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    }

    return user
  }

  static async updateProfile(userId: string, data: {
    firstName?: string
    lastName?: string
    zipCode?: string
  }) {
    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
    }

    if (data.zipCode) {
      const encrypted = EncryptionService.encrypt(data.zipCode)
      updateData.zipCodeEncrypted = encrypted.encrypted
      updateData.zipCodeIv = encrypted.iv
      updateData.zipCodeTag = encrypted.tag
    }

    return await prisma.user.update({
      where: { id: userId },
      data: updateData
    })
  }

  static async updatePreferences(userId: string, preferences: {
    profilePublic?: boolean
    votesPublic?: boolean
    emailNotifications?: boolean
  }) {
    return await prisma.user.update({
      where: { id: userId },
      data: preferences
    })
  }

  static async getUserWithVotes(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        votes: {
          include: { bill: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }
}
