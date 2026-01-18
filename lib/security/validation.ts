import { z } from 'zod'

export const schemas = {
  vote: z.object({
    billId: z.string().cuid(),
    position: z.enum(['yes', 'no', 'abstain']),
    reasoning: z.string().max(500).optional(),
    confidence: z.number().min(1).max(5).optional(),
    isAnonymous: z.boolean().default(true),
  }),
  
  userProfile: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  }),
  
  preferences: z.object({
    profilePublic: z.boolean().optional(),
    votesPublic: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
  }),
}

export function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}
