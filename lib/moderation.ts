// Basic content moderation for discussion board
// Filters obscene/hateful content before saving

const BLOCKED_PATTERNS = [
  // Profanity patterns (partial list - expand as needed)
  /\bf+u+c+k+/gi,
  /\bs+h+i+t+/gi,
  /\ba+s+s+h+o+l+e/gi,
  /\bb+i+t+c+h/gi,
  /\bd+a+m+n/gi,
  /\bc+u+n+t/gi,
  /\bd+i+c+k/gi,
  /\bp+u+s+s+y/gi,
  /\bn+i+g+g/gi,
  /\bf+a+g+g/gi,
  /\br+e+t+a+r+d/gi,
  /\bk+i+l+l\s+(your|my|him|her|them)self/gi,
  /\bk+y+s\b/gi,
]

const SPAM_PATTERNS = [
  /(.)\1{5,}/g,                    // Same character repeated 6+ times
  /(https?:\/\/\S+\s*){3,}/g,     // 3+ URLs
  /\b(buy now|click here|free money|act now)\b/gi,
]

export interface ModerationResult {
  allowed: boolean
  reason?: string
  filtered?: string
}

export function moderateContent(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return { allowed: false, reason: 'Content cannot be empty.' }
  }

  if (content.length > 2000) {
    return { allowed: false, reason: 'Content exceeds 2000 character limit.' }
  }

  // Check for blocked words
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: 'Your comment contains language that violates our community guidelines. Please keep the discussion respectful and constructive.',
      }
    }
  }

  // Check for spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        allowed: false,
        reason: 'Your comment was flagged as potential spam. Please try rephrasing.',
      }
    }
  }

  // All caps check (more than 70% caps and longer than 20 chars = yelling)
  if (content.length > 20) {
    const upperCount = (content.match(/[A-Z]/g) || []).length
    const letterCount = (content.match(/[a-zA-Z]/g) || []).length
    if (letterCount > 0 && upperCount / letterCount > 0.7) {
      return {
        allowed: false,
        reason: 'Please avoid typing in all caps. It comes across as shouting.',
      }
    }
  }

  return { allowed: true }
}
