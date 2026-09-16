import { useEffect, useRef, useState } from 'react'
import { MediaList } from './ChatMedia'
import type { ConversationMessage } from '../types/conversation'
import type { GenerationRequest } from '../types/generation'
import type { ConversationAttachment } from '../types/conversation'

interface ConversationPanelProps {
  messages: ConversationMessage[]
  onEditRequest: (request: GenerationRequest) => void
  onRegenerate: (request: GenerationRequest) => void
  onRetry: (request: GenerationRequest) => void
}

function MessageActions({
  message,
  onEdit,
  onRegenerate,
  onRetry,
}: {
  message: ConversationMessage
  onEdit: () => void
  onRegenerate: () => void
  onRetry: () => void
}) {
  if (message.status === 'pending' || message.status === 'streaming') {
    return null
  }

  return (
    <div className="jm-conversation__actions">
      {message.request && (
        <>
          <button type="button" className="jm-conversation__action" onClick={onEdit}>
            <img src="/icons/message-edit.svg" alt="" aria-hidden="true" />
            重新编辑
          </button>
          <button
            type="button"
            className="jm-conversation__action"
            onClick={onRegenerate}
          >
            <img src="/icons/message-refresh.svg" alt="" aria-hidden="true" />
            再次生成
          </button>
        </>
      )}
      {message.status === 'failed' && message.request && (
        <button type="button" className="jm-conversation__action" onClick={onRetry}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12a8 8 0 1 0 2.5-5.8M4 3v5h5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          重试
        </button>
      )}
    </div>
  )
}

type UserMessageSegment =
  | { type: 'text'; value: string }
  | { type: 'reference'; attachment: ConversationAttachment }

function parseUserMessage(
  text: string,
  attachments: ConversationAttachment[],
): UserMessageSegment[] {
  if (!text || attachments.length === 0) {
    return text ? [{ type: 'text', value: text }] : []
  }

  const segments: UserMessageSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(/@([^\s@]+)/g)) {
    const matchIndex = match.index ?? 0
    if (matchIndex > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, matchIndex) })
    }
    const reference = match[1]
    const attachment = attachments.find(
      (item) => item.fileName === reference || item.referenceId === reference,
    )
    if (attachment) {
      segments.push({ type: 'reference', attachment })
    }
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

function UserMessageContent({
  text,
  attachments,
}: {
  text: string
  attachments: ConversationAttachment[]
}) {
  const [previewedAttachment, setPreviewedAttachment] =
    useState<ConversationAttachment | null>(null)
  const segments = parseUserMessage(text, attachments)

  return (
    <p>
      {segments.map((segment, index) =>
        segment.type === 'text' ? (
          <span key={`text-${index}`}>{segment.value}</span>
        ) : (
          <button
            key={segment.attachment.fileName}
            type="button"
            className="jm-reference-token"
            onMouseEnter={() => setPreviewedAttachment(segment.attachment)}
            onMouseLeave={() => setPreviewedAttachment(null)}
          >
            <img src={segment.attachment.url} alt="" />
            <span>{segment.attachment.fileName}</span>
            {previewedAttachment?.fileName === segment.attachment.fileName && (
              <span className="jm-reference-token__preview">
                <img src={previewedAttachment.url} alt={previewedAttachment.fileName} />
              </span>
            )}
          </button>
        ),
      )}
    </p>
  )
}

function FrameAttachments({
  attachments,
}: {
  attachments: ConversationAttachment[]
}) {
  const [previewedPurpose, setPreviewedPurpose] = useState<
    'first_frame' | 'last_frame' | null
  >(null)

  return (
    <div className="jm-frame-attachments">
      {attachments.map((attachment, index) => {
        const purpose = attachment.purpose === 'first_frame' || attachment.purpose === 'last_frame'
          ? attachment.purpose
          : index === 0
            ? 'first_frame'
            : 'last_frame'
        return (
          <button
            key={`${purpose}-${attachment.referenceId}-${index}`}
            type="button"
            className={`jm-frame-attachment is-${purpose === 'first_frame' ? 'first' : 'last'}`}
            onMouseEnter={() => setPreviewedPurpose(purpose)}
            onMouseLeave={() => setPreviewedPurpose(null)}
          >
            <img
              className="jm-frame-attachment__thumbnail"
              src={attachment.url}
              alt={purpose === 'first_frame' ? '首帧' : '尾帧'}
            />
            {previewedPurpose === purpose && (
              <span className="jm-frame-attachment__preview">
                <img src={attachment.url} alt={attachment.fileName} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function ConversationItem({
  message,
  onEditRequest,
  onRegenerate,
  onRetry,
}: {
  message: ConversationMessage
  onEditRequest: (request: GenerationRequest) => void
  onRegenerate: (request: GenerationRequest) => void
  onRetry: (request: GenerationRequest) => void
}) {
  const isUser = message.role === 'user'

  return (
    <div className={`jm-conversation__item ${isUser ? 'is-user' : 'is-model'}`}>
      <div className="jm-conversation__message">
        {isUser ? (
          <div className="jm-conversation__bubble">
            {message.request?.mode === 'video' &&
              message.request.generationType === 'first_last_frame' &&
              message.attachments && message.attachments.length > 0 && (
                <FrameAttachments
                  attachments={message.attachments.filter((attachment) =>
                    attachment.purpose === 'first_frame' ||
                    attachment.purpose === 'last_frame'
                  )}
                />
              )}
            {message.text && message.attachments && (
              <UserMessageContent
                text={message.text}
                attachments={message.attachments}
              />
            )}
            {message.text && !message.attachments && <p>{message.text}</p>}
            {!(message.request?.mode === 'video' && message.request.generationType === 'first_last_frame') && message.attachments && message.attachments.length > 0 && (() => {
              const referencedFileNames = new Set(
                (message.text?.match(/@[^\s@]+/g) ?? []).map((token) => token.slice(1)),
              )
              const standaloneAttachments = message.attachments.filter(
                (attachment) => !referencedFileNames.has(attachment.fileName),
              )
              return standaloneAttachments.length > 0 ? (
                <div className="jm-conversation__attachments">
                  {standaloneAttachments.map((attachment, index) => (
                    <img
                      key={`${attachment.fileName}-${index}`}
                      src={attachment.url}
                      alt={attachment.fileName}
                    />
                  ))}
                </div>
              ) : null
            })()}
          </div>
        ) : (
          <>
            {message.status === 'pending' || message.status === 'streaming' ? (
              <>
                {message.media && message.media.length > 0 && (
                  <MediaList media={message.media} />
                )}
                {message.pendingTools?.map((tool) => (
                  <div key={tool.id} className="jm-conversation__pending-tool">
                    <span className="jm-spinner" aria-hidden="true" />
                    {tool.type === 'generate_video' ? '正在生成视频…' : '正在生成图片…'}
                  </div>
                ))}
                <div className="jm-conversation__status">
                  <span className="jm-spinner" aria-hidden="true" />
                  {message.text || '正在回复…'}
                </div>
              </>
            ) : (
              <>
                {message.status === 'succeeded' && message.text && (
                  <p className="jm-conversation__text">{message.text}</p>
                )}
                {message.status === 'succeeded' && message.media && message.media.length > 0 && (
                  <MediaList media={message.media} />
                )}
                {message.status === 'failed' && (
                  <p className="jm-conversation__error">
                    {message.error ?? '回复失败'}
                  </p>
                )}
              </>
            )}
            <MessageActions
              message={message}
              onEdit={() => {
                if (message.request) onEditRequest(message.request)
              }}
              onRegenerate={() => {
                if (message.request) onRegenerate(message.request)
              }}
              onRetry={() => {
                if (message.request) onRetry(message.request)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

export function ConversationPanel({
  messages,
  onEditRequest,
  onRegenerate,
  onRetry,
}: ConversationPanelProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = panelRef.current?.parentElement
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length])

  return (
    <section ref={panelRef} className="jm-conversation" aria-label="对话记录">
      <div className="jm-conversation__canvas">
        {messages.length === 0 ? (
          <div className="jm-conversation__empty">
            <p>开始你的第一次创作对话</p>
          </div>
        ) : (
          messages.map((message) => (
            <ConversationItem
              key={message.id}
              message={message}
              onEditRequest={onEditRequest}
              onRegenerate={onRegenerate}
              onRetry={onRetry}
            />
          ))
        )}
      </div>
    </section>
  )
}
