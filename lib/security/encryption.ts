import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const ALGORITHM = 'aes-256-gcm'

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

export class EncryptionService {
  static encrypt(text: string): EncryptedData {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    }
    
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    )
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }
  }
  
  static decrypt(data: EncryptedData): string {
    if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not set')
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      Buffer.from(data.iv, 'hex')
    )
    
    decipher.setAuthTag(Buffer.from(data.tag, 'hex'))
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
  
  static hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex')
  }
  
  static generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex')
  }
}
