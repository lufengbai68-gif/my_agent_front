import type { ChatMedia } from './chat'
import type { GenerationRequest } from './generation'

export type ConversationRole = 'user' | 'model'
export type ConversationStatus =
  | 'pending'
  | 'streaming'
  | 'succeeded'
  | 'failed'
  | 'canceled'

export interface ConversationAttachment {
  referenceId: string
  fileName: string
  url: string
  mimeType?: string
  uploadId?: string
  purpose?: 'reference' | 'first_frame' | 'last_frame'
  width?: number
  height?: number
  expiresAt?: number
}

export interface ConversationMessage {
  id: string
  role: ConversationRole
  status: ConversationStatus
  text?: string
  attachments?: ConversationAttachment[]
  media?: ChatMedia[]
  pendingTools?: Array<{ id: string; type: string; since: number }>
  request?: GenerationRequest
  error?: string
  createdAt: number
}
