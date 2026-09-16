import type {
  ChatMedia,
  ChatPart,
  ChatRequest,
  ChatModelList,
  ChatResponse,
  ChatSessionHistory,
  ChatSessionPage,
  ChatStreamEvent,
  ChatUsage,
  ChatUpload,
} from '../types/chat'
import type { ReferenceImagePurpose } from '../types/generation'

const API_BASE_URL = (
  import.meta.env.VITE_CHAT_API_BASE_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  ''
).replace(/\/+$/, '')
const API_KEY = import.meta.env.VITE_API_KEY

export interface ChatSendOptions {
  signal?: AbortSignal
  onChunk?: (delta: string) => void
  onToolStart?: (toolCallId: string, toolName: string) => void
  onMediaReady?: (media: ChatMedia[], toolCallId?: string) => void
}

export interface ChatSendResult {
  sessionId: string
  agent: string
  content: string
  finishReason: string
  usage?: ChatUsage
  media?: ChatMedia[]
}

export class ChatApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly sessionId?: string

  constructor(
    status: number,
    code: string | undefined,
    message: string,
    sessionId?: string,
  ) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
    this.code = code
    this.sessionId = sessionId
  }
}

function authHeaders(): Record<string, string> {
  return API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}
}

function getCurrentSessionId(): string | undefined {
  return new URLSearchParams(window.location.search).get('session_id') || undefined
}

async function parseErrorResponse(response: Response): Promise<never> {
  let code: string | undefined
  let message = `${response.status} ${response.statusText}`

  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string }
    }
    code = payload.error?.code
    message = payload.error?.message ?? message
  } catch {
    // HTTP 错误体不一定是 JSON，保留状态码文案。
  }

  throw new ChatApiError(response.status, code, message)
}

async function readSse(
  response: Response,
  options: ChatSendOptions,
): Promise<ChatSendResult> {
  if (!response.body) {
    throw new ChatApiError(500, 'internal_error', '响应没有可读流')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let result: ChatSendResult = {
    sessionId: '',
    agent: '',
    content: '',
    finishReason: 'stop',
    media: [],
  }

  const handleEvent = (eventText: string) => {
    const dataLines = eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())

    if (dataLines.length === 0) return

    const payload = JSON.parse(dataLines.join('\n')) as ChatStreamEvent
    if (payload.type === 'chunk') {
      result.content += payload.delta
      result.agent = payload.agent
      options.onChunk?.(payload.delta)
      return
    }

    if (payload.type === 'tool_start') {
      options.onToolStart?.(payload.tool_call_id, payload.tool_name)
      return
    }

    if (payload.type === 'media_ready') {
      result.media = [...(result.media ?? []), ...payload.media]
      options.onMediaReady?.(payload.media, payload.tool_call_id)
      return
    }

    if (payload.type === 'done') {
      result = {
        ...result,
        sessionId: payload.session_id,
        agent: payload.agent,
        finishReason: payload.finish_reason,
        usage: payload.usage,
      }
      return
    }

    throw new ChatApiError(
      502,
      'upstream_error',
      payload.message,
      payload.session_id,
    )
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() ?? ''
    events.forEach(handleEvent)
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    handleEvent(buffer)
  }

  return result
}

export async function sendChatMessage(
  request: ChatRequest,
  options: ChatSendOptions = {},
): Promise<ChatSendResult> {
  if (!request.parts.some((part) => part.type === 'text' && part.text)) {
    throw new ChatApiError(400, 'invalid_request', 'parts must include a text part')
  }

  const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: request.stream ? 'text/event-stream' : 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(request),
    signal: options.signal,
  })

  if (!response.ok) {
    await parseErrorResponse(response)
  }

  if (request.stream) {
    return readSse(response, options)
  }

  const payload = (await response.json()) as ChatResponse
  return {
    sessionId: payload.session_id,
    agent: payload.agent,
    content: payload.content,
    finishReason: payload.finish_reason,
    usage: payload.usage,
    media: payload.media ?? [],
  }
}

export async function getChatSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<ChatSessionHistory> {
  const response = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}`, {
    headers: { ...authHeaders() },
    signal,
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
  const payload = (await response.json()) as {
    session: ChatSessionHistory
  }
  return payload.session
}

export async function deleteChatSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
    signal,
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
}

export async function getChatModels(
  signal?: AbortSignal,
): Promise<ChatModelList> {
  const response = await fetch(`${API_BASE_URL}/v1/models`, { signal })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
  return (await response.json()) as ChatModelList
}

export async function listChatSessions(
  limit = 50,
  offset = 0,
  signal?: AbortSignal,
): Promise<ChatSessionPage> {
  const response = await fetch(
    `${API_BASE_URL}/v1/sessions?limit=${limit}&offset=${offset}`,
    { headers: { ...authHeaders() }, signal },
  )
  if (!response.ok) {
    await parseErrorResponse(response)
  }
  return (await response.json()) as ChatSessionPage
}

export async function getSessionUploads(
  sessionId: string,
  signal?: AbortSignal,
): Promise<ChatUpload[]> {
  const response = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}/uploads`, {
    headers: { ...authHeaders() },
    signal,
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
  const payload = (await response.json()) as { uploads: ChatUpload[] }
  return payload.uploads ?? []
}

export async function uploadReferenceImage(
  file: File,
  purpose: ReferenceImagePurpose,
  signal?: AbortSignal,
): Promise<ChatUpload> {
  const send = async (withSession: boolean): Promise<Response> => {
    const sessionId = withSession ? getCurrentSessionId() : undefined
    return fetch(`${API_BASE_URL}/v1/uploads`, {
      method: 'POST',
      headers: {
        ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
        ...authHeaders(),
      },
      body: formData,
      signal: signal ?? AbortSignal.timeout(30_000),
    })
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('purpose', purpose)

  const response = await send(true).catch(async (error: unknown) => {
    if (
      error instanceof ChatApiError &&
      error.status === 404 &&
      error.code === 'session_not_found'
    ) {
      return send(false)
    }
    throw error
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
  return (await response.json()) as ChatUpload
}

export async function getUploadMeta(
  uploadId: string,
  signal?: AbortSignal,
): Promise<ChatUpload> {
  const response = await fetch(`${API_BASE_URL}/v1/uploads/${uploadId}/meta`, {
    headers: { ...authHeaders() },
    signal,
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
  return (await response.json()) as ChatUpload
}

export async function deleteUpload(
  uploadId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/v1/uploads/${uploadId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
    signal,
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
}

export async function getChatHealth(signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/healthz`, {
    headers: { ...authHeaders() },
    signal,
  })
  if (!response.ok) {
    await parseErrorResponse(response)
  }
}

export function createChatParts(
  text: string,
  attachments: Array<{ dataUrl: string; fileName?: string }> = [],
): ChatPart[] {
  const parts: ChatPart[] = []
  if (text) {
    parts.push({ type: 'text', text })
  }

  attachments.forEach((attachment) => {
    const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(attachment.dataUrl)
    if (!match) {
      throw new Error('仅支持 base64 格式的本地附件')
    }

    const [, mimeType, base64Data] = match
    if (mimeType.startsWith('image/')) {
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64Data}` },
        mime_type: mimeType,
      })
      return
    }

    if (mimeType.startsWith('video/')) {
      parts.push({ type: 'video_url', base64_data: base64Data, mime_type: mimeType })
      return
    }

    if (mimeType.startsWith('audio/')) {
      parts.push({ type: 'audio_url', base64_data: base64Data, mime_type: mimeType })
      return
    }

    parts.push({
      type: 'file_url',
      base64_data: base64Data,
      mime_type: mimeType,
      name: attachment.fileName,
    })
  })

  return parts
}
