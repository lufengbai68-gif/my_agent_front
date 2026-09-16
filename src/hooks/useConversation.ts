import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createChatParts,
  deleteChatSession,
  getChatSession,
  sendChatMessage,
  ChatApiError,
} from '../api/chat'
import type {
  ConversationAttachment,
  ConversationMessage,
} from '../types/conversation'
import type { ChatApiMessage, ChatGenerationParams, ChatMedia } from '../types/chat'
import type { ReferenceImage } from '../types/generation'
import type {
  AspectRatio,
  GenerationRequest,
  ImageGenerationRequest,
  ImageResolution,
  MotionLevel,
  VideoGenerationRequest,
  VideoResolution,
} from '../types/generation'

function createGenerationParams(request: GenerationRequest): ChatGenerationParams {
  const params: ChatGenerationParams = {}

  if (request.aspectRatio !== 'auto') {
    params.aspect_ratio = request.aspectRatio
  }

  if (request.mode === 'image') {
    params.size = request.resolution.toLowerCase()
    params.n = request.count
    return params
  }

  params.generation_type = request.generationType ?? 'first_last_frame'
  params.resolution = request.resolution.toLowerCase()
  params.duration = request.durationSec
  params.camera_motion = request.motion
  return params
}

function createMessageId() {
  return crypto.randomUUID()
}

function getSessionIdFromUrl(): string | null {
  const sessionId = new URLSearchParams(window.location.search).get('session_id')
  return sessionId || null
}

function updateUrlSessionId(sessionId: string | null) {
  const url = new URL(window.location.href)
  if (sessionId) {
    url.searchParams.set('session_id', sessionId)
  } else {
    url.searchParams.delete('session_id')
  }
  window.history.replaceState(null, '', url)
}

function getAttachments(request: GenerationRequest): ConversationAttachment[] {
  const attachments: ConversationAttachment[] = []
  if (request.referenceImage) {
    const {
      referenceId,
      fileName,
      url,
      uploadId,
      width,
      height,
      expiresAt,
    } = request.referenceImage
    attachments.push({
      referenceId,
      fileName,
      url,
      uploadId,
      purpose:
        request.mode === 'video' && request.generationType === 'first_last_frame'
          ? 'first_frame'
          : 'reference',
      width,
      height,
      expiresAt,
    })
  }
  if (request.mode === 'video' && request.lastFrame) {
    const {
      referenceId,
      fileName,
      url,
      uploadId,
      width,
      height,
      expiresAt,
    } = request.lastFrame
    attachments.push({
      referenceId,
      fileName,
      url,
      uploadId,
      purpose: 'last_frame',
      width,
      height,
      expiresAt,
    })
  }
  return attachments
}

function getReferences(request: GenerationRequest): ReferenceImage[] {
  if (request.mode === 'image') {
    return request.referenceImage ? [request.referenceImage] : []
  }

  return [request.referenceImage, request.lastFrame].filter(
    (image): image is ReferenceImage => Boolean(image),
  )
}

type CreatedUserMessage = ConversationMessage & {
  request: GenerationRequest
}

function createUserMessage({
  id,
  prompt,
  request,
  createdAt,
}: {
  id: string
  prompt: string
  request: GenerationRequest
  createdAt: number
}): CreatedUserMessage {
  const references = getReferences(request)
  const text = removeInvalidReferenceTokens(prompt, references)

  return {
    id,
    role: 'user',
    status: 'succeeded',
    text,
    attachments: getAttachments(request),
    request: { ...request, prompt: text },
    createdAt,
  }
}

function removeInvalidReferenceTokens(
  prompt: string,
  references: ReferenceImage[],
) {
  const referenceFileNames = new Set(references.map((reference) => reference.fileName))
  return prompt.replace(/@[^\s@]+/g, (token) =>
    referenceFileNames.has(token.slice(1)) ? token : '',
  )
}

function createReferenceImages(
  request: GenerationRequest,
): ChatGenerationParams['reference_images'] {
  if (request.mode === 'image') {
    return request.referenceImage
      ? [{
          url: request.referenceImage.url,
          role: '',
          upload_id: request.referenceImage.uploadId,
        }]
      : undefined
  }

  if (request.generationType === 'all_in_one') {
    return request.referenceImage
      ? [{
          url: request.referenceImage.url,
          role: '' as const,
          upload_id: request.referenceImage.uploadId,
        }]
      : undefined
  }

  return [
    request.referenceImage
      ? {
          url: request.referenceImage.url,
          role: 'first_frame' as const,
          upload_id: request.referenceImage.uploadId,
        }
      : null,
    request.lastFrame
      ? {
          url: request.lastFrame.url,
          role: 'last_frame' as const,
          upload_id: request.lastFrame.uploadId,
        }
      : null,
  ].filter((image): image is NonNullable<typeof image> => image !== null)
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url, window.location.href).pathname
    const fileName = pathname.split('/').pop()
    return fileName ? decodeURIComponent(fileName) : url
  } catch {
    return url
  }
}

function createReferenceFromAttachment(
  attachment: ConversationAttachment,
): ReferenceImage {
  return {
    uploadId: attachment.uploadId ?? attachment.referenceId,
    referenceId: attachment.referenceId,
    fileName: attachment.fileName,
    url: attachment.url,
    mimeType: 'image/jpeg',
    size: 0,
    width: attachment.width ?? 0,
    height: attachment.height ?? 0,
    expiresAt: attachment.expiresAt ?? 0,
  }
}

function toImageCount(value?: number): 1 | 2 | 4 {
  return value === 2 ? 2 : value === 4 ? 4 : 1
}

function toVideoDuration(value?: number): 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 {
  const fallback: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 = 5
  const durations: Array<4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12> =
    [4, 5, 6, 7, 8, 9, 10, 11, 12]
  return durations.find((duration) => duration === value) ?? fallback
}

function mapHistoryMessage(
  message: ChatApiMessage,
): ConversationMessage {
  const originalText = message.text

  if (message.role !== 'user') {
    const media = (message.attachments ?? [])
      .filter((attachment) => attachment.kind === 'generated')
      .map((attachment) => ({
        type: attachment.type,
        url: attachment.url,
        description: attachment.description,
      }) satisfies ChatMedia)

    return {
      id: message.id ?? createMessageId(),
      role: 'model',
      status: message.status ?? 'succeeded',
      text: originalText,
      error: message.error,
      media,
      request: rebuildHistoryRequest(
        '',
        message.request?.model,
        message.request?.generation_params,
        [],
        message.request?.generation_type,
      ),
      createdAt: (message.created_at ?? 0) * 1000,
    }
  }

  const roleByUploadId = new Map(
    (message.request?.generation_params?.reference_images ?? [])
      .filter((reference) => reference.upload_id)
      .map((reference) => [reference.upload_id as string, reference.role]),
  )
  const attachments = (message.attachments ?? [])
    .filter((attachment) => attachment.kind === 'reference' && attachment.url)
    .map((attachment) => {
      const url = attachment.url
      const fileName = attachment.file_name ?? getFileNameFromUrl(url)
      const uploadId = attachment.upload_id ??
        (attachment.kind === 'reference' ? attachment.id : undefined)
      const referenceRole = uploadId ? roleByUploadId.get(uploadId) : undefined
      return {
        referenceId: attachment.id || fileName,
        fileName,
        url,
        uploadId,
        purpose: attachment.purpose && attachment.purpose !== 'output' && attachment.purpose !== 'style' && attachment.purpose !== 'subject'
          ? attachment.purpose
          : referenceRole === 'first_frame'
            ? 'first_frame'
            : referenceRole === 'last_frame'
              ? 'last_frame'
              : 'reference',
        width: attachment.width,
        height: attachment.height,
        expiresAt: attachment.expires_at,
      }
    })

  const storedParams = message.request?.generation_params
  const storedUploadIds = new Set(
    (storedParams?.reference_images ?? [])
      .map((reference) => reference.upload_id)
      .filter(Boolean),
  )
  const paramsWithAttachments: ChatGenerationParams | undefined = storedParams
    ? {
        ...storedParams,
        reference_images: [
          ...(storedParams.reference_images ?? []),
          ...attachments
            .filter((attachment) => attachment.uploadId && !storedUploadIds.has(attachment.uploadId))
            .map((attachment) => ({
              url: '',
              role:
                attachment.purpose === 'first_frame'
                  ? ('first_frame' as const)
                  : attachment.purpose === 'last_frame'
                    ? ('last_frame' as const)
                    : ('' as const),
              upload_id: attachment.uploadId,
            })),
        ],
      }
    : undefined

  const request = rebuildHistoryRequest(
    originalText,
    message.request?.model,
    paramsWithAttachments,
    attachments,
    message.request?.generation_type,
  )

  if (!request) {
    return {
      id: message.id ?? createMessageId(),
      role: 'user',
      status: 'succeeded',
      text: originalText,
      attachments,
      createdAt: (message.created_at ?? 0) * 1000,
    }
  }

  return {
    id: message.id ?? createMessageId(),
    role: 'user',
    status: message.status ?? 'succeeded',
    text: originalText,
    attachments,
    request,
    createdAt: (message.created_at ?? 0) * 1000,
  }
}

function rebuildHistoryRequest(
  text: string,
  model: string | undefined,
  params: ChatGenerationParams | undefined,
  attachments: ConversationAttachment[],
  generationType?: 'first_last_frame' | 'all_in_one',
): GenerationRequest | undefined {
  if (!model || !params) return undefined

  const references = new Map(
    (params.reference_images ?? [])
      .filter((reference) => reference.upload_id)
      .map((reference) => [reference.upload_id as string, reference]),
  )
  const findReference = (role: string) => {
    const generationReference = Array.from(references.values())
      .find((reference) => reference.role === role)
    if (!generationReference?.upload_id) return null

    const attachment = attachments.find(
      (item) => item.uploadId === generationReference.upload_id,
    )
    return attachment ? createReferenceFromAttachment(attachment) : null
  }

  if (typeof params.duration === 'number') {
    const resolvedGenerationType =
      generationType ??
      ((params.reference_images ?? []).some(
        (reference) => reference.role === 'first_frame' || reference.role === 'last_frame',
      )
        ? 'first_last_frame'
        : 'all_in_one')
    const request: VideoGenerationRequest = {
      mode: 'video',
      prompt: text,
      model,
      generationType: resolvedGenerationType,
      aspectRatio: (params.aspect_ratio ?? 'auto') as AspectRatio,
      durationSec: toVideoDuration(params.duration),
      resolution: (params.resolution ?? '720P') as VideoResolution,
      motion: (params.camera_motion ?? 'smooth') as MotionLevel,
      referenceImage: findReference('first_frame'),
      lastFrame: findReference('last_frame'),
    }
    return request
  }

  const request: ImageGenerationRequest = {
    mode: 'image',
    prompt: text,
    model,
    aspectRatio: (params.aspect_ratio ?? 'auto') as AspectRatio,
    resolution: (params.resolution ?? '1K') as ImageResolution,
    count: toImageCount(params.n),
    referenceImage: findReference(''),
  }
  return request
}

export function useConversation() {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const sessionIdRef = useRef<string | null>(getSessionIdFromUrl())
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasLoadedSessionRef = useRef(false)

  useEffect(() => {
    localStorage.removeItem('artvis-chat-session-id')
    localStorage.removeItem('artvis-chat-messages')
  }, [])

  useEffect(() => {
    const sessionId = sessionIdRef.current
    if (!sessionId) return
    if (hasLoadedSessionRef.current) return
    hasLoadedSessionRef.current = true

    void getChatSession(sessionId)
      .then((history) => {
        const messages = history.messages.map((message) =>
          mapHistoryMessage(message),
        )
        return messages
      })
      .then((messages) => setMessages(messages))
      .catch((error: unknown) => {
        setSubmitError(
          error instanceof Error ? error.message : '加载会话历史失败',
        )
      })
  }, [])

  const updateMessage = useCallback(
    (messageId: string, updater: (message: ConversationMessage) => ConversationMessage) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === messageId ? updater(message) : message)),
      )
    },
    [],
  )

  const submitMessage = useCallback(
    (request: GenerationRequest) => {
      if (isBusy) return

      const userMessage = createUserMessage({
        id: createMessageId(),
        prompt: request.prompt,
        request,
        createdAt: Date.now(),
      })
      const parts = createChatParts(userMessage.text ?? '')
      getReferences(userMessage.request).forEach((reference) => {
        parts.push({
          type: 'image_url',
          image_url: { url: reference.url },
          mime_type: reference.mimeType,
          name: reference.fileName,
          upload_id: reference.uploadId,
        })
      })
      const assistantId = createMessageId()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setSubmitError(null)
      setIsBusy(true)
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          id: assistantId,
          role: 'model',
          status: 'streaming',
          text: '',
          pendingTools: [],
          request: userMessage.request,
          createdAt: Date.now(),
        },
      ])

      void sendChatMessage(
        {
          session_id: sessionIdRef.current ?? undefined,
          model: userMessage.request.model,
          generation_params: {
            ...createGenerationParams(userMessage.request),
            reference_images: createReferenceImages(userMessage.request),
          },
          stream: true,
          parts,
        },
        {
          signal: controller.signal,
          onChunk: (delta) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              status: 'streaming',
              text: `${message.text ?? ''}${delta}`,
            }))
          },
          onToolStart: (toolCallId, toolName) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              pendingTools: [
                ...(message.pendingTools ?? []).filter((tool) => tool.id !== toolCallId),
                { id: toolCallId, type: toolName, since: Date.now() },
              ],
            }))
          },
          onMediaReady: (media, toolCallId) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              media: [...(message.media ?? []), ...media],
              pendingTools: toolCallId
                ? (message.pendingTools ?? []).filter((tool) => tool.id !== toolCallId)
                : message.pendingTools,
            }))
          },
        },
      )
        .then((result) => {
          sessionIdRef.current = result.sessionId
          updateUrlSessionId(result.sessionId)
          updateMessage(assistantId, (message) => ({
            ...message,
            status: 'succeeded',
            text: result.content,
            media: result.media,
            pendingTools: [],
          }))
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            updateMessage(assistantId, (message) => ({
              ...message,
              status: 'canceled',
            }))
            return
          }

          const messageText = error instanceof Error ? error.message : '发送失败'
          if (error instanceof ChatApiError && error.sessionId) {
            sessionIdRef.current = error.sessionId
            updateUrlSessionId(error.sessionId)
          }
          setSubmitError(messageText)
          updateMessage(assistantId, (message) => ({
            ...message,
            status: 'failed',
            error: messageText,
          }))
        })
        .finally(() => {
          abortControllerRef.current = null
          setIsBusy(false)
        })
    },
    [isBusy, updateMessage],
  )

  const cancelMessage = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const clearSession = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (!sessionId) return

    await deleteChatSession(sessionId)
    sessionIdRef.current = null
    updateUrlSessionId(null)
    setMessages([])
  }, [])

  return {
    messages,
    isBusy,
    submitError,
    submitMessage,
    cancelMessage,
    clearSession,
  }
}
