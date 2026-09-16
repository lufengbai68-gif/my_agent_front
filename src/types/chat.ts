export type ChatErrorCode =
  | 'invalid_request'
  | 'session_not_found'
  | 'agent_not_found'
  | 'request_too_large'
  | 'upstream_error'
  | 'internal_error'
  | 'uploads_disabled'
  | 'missing_file'
  | 'bad_request'
  | 'open_failed'
  | 'too_large'
  | 'unsupported_mime'
  | 'upload_failed'
  | 'meta_persist_failed'
  | 'not_found'
  | 'delete_failed'
  | 'meta_failed'

export interface ChatUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatGenerationParams {
  aspect_ratio?: string
  generation_type?: 'first_last_frame' | 'all_in_one'
  size?: string
  resolution?: string
  width?: number
  height?: number
  duration?: number
  fps?: number
  n?: number
  seed?: number
  negative_prompt?: string
  camera_motion?: string
  watermark?: boolean
  reference_images?: Array<{
    url: string
    role: '' | 'subject' | 'style' | 'first_frame' | 'last_frame'
    upload_id?: string
  }>
}

export interface ChatMedia {
  type: 'image' | 'video' | 'audio'
  url: string
  description?: string
}

export interface ChatHistoryAttachment {
  id: string
  kind: 'reference' | 'generated'
  type: 'image' | 'video' | 'audio'
  url: string
  upload_id?: string
  purpose?: 'reference' | 'first_frame' | 'last_frame' | 'output' | 'style' | 'subject'
  file_name?: string
  mime_type?: string
  width?: number
  height?: number
  expires_at?: number
  description?: string
  sort_order?: number
}

export interface ChatHistoryRequest {
  model?: string
  mode?: 'image' | 'video' | ''
  generation_type?: 'first_last_frame' | 'all_in_one'
  generation_params?: ChatGenerationParams
}

export interface ChatUpload {
  id: string
  url: string
  filename: string
  mime_type: string
  size: number
  width: number
  height: number
  purpose: string
  session_id?: string
  expires_at: number
}

export interface ChatSessionSummary {
  id: string
  created_at: number
  updated_at: number
  message_count: number
  preview: string
}

export interface ChatSessionPage {
  sessions: ChatSessionSummary[]
  total: number
  limit: number
  offset: number
}

export type ChatPart =
  | { type: 'text'; text: string }
  | {
      type: 'image_url'
      image_url: { url: string }
      base64_data?: string
      mime_type?: string
      detail?: 'high' | 'low' | 'auto'
      upload_id?: string
      name?: string
    }
  | { type: 'audio_url'; base64_data: string; mime_type: string }
  | {
      type: 'video_url'
      url?: string
      base64_data?: string
      mime_type?: string
    }
  | {
      type: 'file_url'
      url?: string
      base64_data?: string
      mime_type?: string
      name?: string
    }

export interface ChatRequest {
  session_id?: string
  model?: string
  generation_params?: ChatGenerationParams
  parts: ChatPart[]
  stream?: boolean
}

export interface ChatResponse {
  session_id: string
  agent: string
  role: string
  content: string
  finish_reason: string
  usage?: ChatUsage
  created_at: number
  media?: ChatMedia[]
}

export type ChatStreamEvent =
  | { type: 'chunk'; agent: string; delta: string }
  | { type: 'tool_start'; tool_name: string; tool_call_id: string }
  | {
      type: 'media_ready'
      tool_name: string
      tool_call_id: string
      media: ChatMedia[]
    }
  | {
    type: 'done'
    session_id: string
    agent: string
    finish_reason: string
    usage: ChatUsage
  }
  | { type: 'error'; session_id?: string; message: string }

export interface ChatApiMessage {
  turn_id?: string
  request_id?: string
  seq?: number
  role: 'user' | 'assistant'
  id?: string
  status?: 'succeeded' | 'failed' | 'canceled' | 'pending' | 'streaming'
  text: string
  error?: string
  created_at?: number
  request?: ChatHistoryRequest
  attachments?: ChatHistoryAttachment[]
}

export interface ChatSessionHistory {
  id: string
  messages: ChatApiMessage[]
}


export type ChatModelType = 'image' | 'video' | 'audio'

export interface ChatModelCapabilities {
  text: boolean
  image: boolean
  audio: boolean
  video: boolean
  file: boolean
}

export interface ChatModelInfo {
  key: string
  label: string
  model_type: ChatModelType
  capabilities: ChatModelCapabilities
}

export interface ChatModelList {
  models: ChatModelInfo[]
}
