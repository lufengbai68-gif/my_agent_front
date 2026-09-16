import { PROMPT_MAX_LENGTH } from '../constants/options'
import { useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import type { ReferenceImage } from '../types/generation'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  attachments?: ReactNode
  attachmentsLabel?: string
  references?: ReferenceImage[]
  onSubmit?: () => void
}

interface MentionState {
  start: number
  query: string
  style?: CSSProperties
}

type PromptSegment =
  | { type: 'text'; value: string }
  | { type: 'reference'; value: string }

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getMentionStyle(
  value: string,
  mentionStart: number,
  textarea: HTMLTextAreaElement,
): CSSProperties {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const computedStyle = window.getComputedStyle(textarea)
  const prompt = textarea.closest<HTMLElement>('.jm-prompt')
  const textareaRect = textarea.getBoundingClientRect()
  const promptRect = prompt?.getBoundingClientRect()
  if (context) {
    context.font = computedStyle.font
  }

  const atRight = context
    ? context.measureText(value.slice(0, mentionStart + 1)).width
    : mentionStart * parseFloat(computedStyle.fontSize)
  const lineIndex = value.slice(0, mentionStart).split('\n').length - 1
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || 18
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0

  return {
    left: Math.max(
      (promptRect ? textareaRect.left - promptRect.left : textarea.offsetLeft)
        + Number.parseFloat(computedStyle.paddingLeft) + atRight,
      promptRect ? textareaRect.left - promptRect.left : textarea.offsetLeft,
    ),
    top: Math.max(
      (promptRect ? textareaRect.top - promptRect.top : textarea.offsetTop)
        + paddingTop + (lineIndex + 1) * lineHeight - textarea.scrollTop + 10,
      (promptRect ? textareaRect.top - promptRect.top : textarea.offsetTop)
        + paddingTop + lineHeight,
    ),
  }
}

function getMentionState(value: string, caret: number): MentionState | null {
  const before = value.slice(0, caret)
  const match = /@([^\s@]*)$/.exec(before)
  if (!match) return null
  const at = match[0].indexOf('@')
  return { start: match.index + at, query: match[1] }
}

function getReferenceAtCaret(
  value: string,
  caret: number,
  references: ReferenceImage[],
) {
  const beforeMatch = /@([^\s@]*)$/.exec(value.slice(0, caret))
  if (!beforeMatch) return null

  const afterMatch = /^[^\s@]*/.exec(value.slice(caret))
  const token = `${beforeMatch[1]}${afterMatch?.[0] ?? ''}`
  return references.find((reference) => reference.fileName === token) ?? null
}

function getReferenceTokenRect(
  value: string,
  tokenStart: number,
  tokenEnd: number,
  textarea: HTMLTextAreaElement,
) {
  const mirror = document.createElement('div')
  const computedStyle = window.getComputedStyle(textarea)
  const token = document.createElement('span')
  const textareaRect = textarea.getBoundingClientRect()

  Object.assign(mirror.style, {
    position: 'fixed',
    left: `${textareaRect.left}px`,
    top: `${textareaRect.top}px`,
    height: `${textarea.clientHeight}px`,
    opacity: '0',
    pointerEvents: 'none',
    boxSizing: computedStyle.boxSizing,
    width: `${textarea.clientWidth}px`,
    padding: computedStyle.padding,
    border: computedStyle.border,
    font: computedStyle.font,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: computedStyle.wordBreak,
    overflow: 'hidden',
    zIndex: '999999',
  })
  mirror.scrollTop = textarea.scrollTop
  token.textContent = value.slice(tokenStart, tokenEnd)
  mirror.append(
    document.createTextNode(value.slice(0, tokenStart)),
    token,
    document.createTextNode(value.slice(tokenEnd)),
  )
  document.body.appendChild(mirror)
  const rect = token.getBoundingClientRect()
  mirror.remove()

  return rect
}

function getCaretOffsetFromPoint(
  textarea: HTMLTextAreaElement,
  x: number,
  y: number,
) {
  const mirror = document.createElement('div')
  const computedStyle = window.getComputedStyle(textarea)
  const textareaRect = textarea.getBoundingClientRect()

  Object.assign(mirror.style, {
    position: 'fixed',
    left: `${textareaRect.left}px`,
    top: `${textareaRect.top}px`,
    width: `${textarea.clientWidth}px`,
    height: `${textarea.clientHeight}px`,
    padding: computedStyle.padding,
    border: computedStyle.border,
    font: computedStyle.font,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: computedStyle.wordBreak,
    overflow: 'hidden',
    opacity: '0',
    pointerEvents: 'auto',
    zIndex: '999999',
  })
  mirror.scrollTop = textarea.scrollTop
  mirror.textContent = textarea.value
  document.body.appendChild(mirror)

  const position = document.caretPositionFromPoint?.(x, y)
  const offset = position && mirror.contains(position.offsetNode)
    ? position.offset
    : document.caretRangeFromPoint?.(x, y)
      ? document.caretRangeFromPoint(x, y)!.startOffset
      : 0

  mirror.remove()
  return offset
}

function parsePromptSegments(
  value: string,
  references: ReferenceImage[],
): PromptSegment[] {
  if (!value || references.length === 0) {
    return value ? [{ type: 'text', value }] : []
  }

  const pattern = new RegExp(
    `@(${references
      .map((reference) => escapeRegExp(reference.fileName))
      .sort((left, right) => right.length - left.length)
      .join('|')})`,
    'g',
  )
  const segments: PromptSegment[] = []
  let lastIndex = 0

  for (const match of value.matchAll(pattern)) {
    const matchIndex = match.index ?? 0
    if (matchIndex > lastIndex) {
      segments.push({ type: 'text', value: value.slice(lastIndex, matchIndex) })
    }
    segments.push({ type: 'reference', value: match[0] })
    lastIndex = matchIndex + match[0].length
  }

  if (lastIndex < value.length) {
    segments.push({ type: 'text', value: value.slice(lastIndex) })
  }

  return segments
}

function getReferenceTokenRange(
  value: string,
  references: ReferenceImage[],
  selectionStart: number,
  selectionEnd: number,
  key: 'Backspace' | 'Delete',
) {
  if (references.length === 0) return null

  const pattern = new RegExp(
    `@(${references
      .map((reference) => escapeRegExp(reference.fileName))
      .sort((left, right) => right.length - left.length)
      .join('|')})`,
    'g',
  )

  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0
    const end = start + match[0].length
    const overlaps = selectionStart < end && selectionEnd > start
    const touchesForBackspace = selectionStart === selectionEnd &&
      selectionStart > start &&
      selectionStart <= end
    const afterTrailingSpaceForBackspace = selectionStart === selectionEnd &&
      selectionStart === end + 1 &&
      value.slice(end, end + 1) === ' '
    const touchesForDelete = selectionStart === selectionEnd &&
      selectionStart >= start &&
      selectionStart < end

    if (key === 'Backspace') {
      if (afterTrailingSpaceForBackspace) {
        return { start, end: end + 1 }
      }
      if (overlaps || touchesForBackspace) {
        return { start, end }
      }
    } else if (overlaps || touchesForDelete) {
      return { start, end }
    }
  }

  return null
}

export function PromptInput({
  value,
  onChange,
  disabled,
  attachments,
  attachmentsLabel = '首尾帧上传',
  references = [],
  onSubmit,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [mention, setMention] = useState<MentionState | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [previewedReference, setPreviewedReference] = useState<ReferenceImage | null>(null)
  const [previewStyle, setPreviewStyle] = useState<CSSProperties | null>(null)
  const filteredReferences = references.filter((reference) =>
    reference.fileName.toLowerCase().includes(mention?.query.toLowerCase() ?? ''),
  )
  const selectedReference = filteredReferences[mentionIndex]

  const insertReference = (reference: ReferenceImage) => {
    if (!mention || !textareaRef.current) return
    const caret = textareaRef.current.selectionStart ?? value.length
    const nextValue = `${value.slice(0, mention.start)}@${reference.fileName} ${value.slice(caret)}`
    onChange(nextValue.slice(0, PROMPT_MAX_LENGTH))
    setMention(null)
    setMentionIndex(0)
    const nextCaret = mention.start + reference.fileName.length + 2
    window.setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret)
    }, 0)
  }

  const removeReferenceToken = (tokenStart: number, tokenEnd: number) => {
    const nextValue = `${value.slice(0, tokenStart)}${value.slice(tokenEnd).replace(/^ /, '')}`
    onChange(nextValue.slice(0, PROMPT_MAX_LENGTH))
    setMention(null)
    setMentionIndex(0)
    setPreviewedReference(null)
    setPreviewStyle(null)
    window.setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(tokenStart, tokenStart)
    }, 0)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (event.key === 'Backspace' || event.key === 'Delete') &&
      textareaRef.current
    ) {
      const token = getReferenceTokenRange(
        value,
        references,
        textareaRef.current.selectionStart,
        textareaRef.current.selectionEnd,
        event.key,
      )
      if (token) {
        event.preventDefault()
        removeReferenceToken(token.start, token.end)
        return
      }
    }

    if (mention && filteredReferences.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setMentionIndex((index) => (index + 1) % filteredReferences.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setMentionIndex((index) => (index - 1 + filteredReferences.length) % filteredReferences.length)
        return
      }
      if (event.key === 'Enter' && selectedReference) {
        event.preventDefault()
        insertReference(selectedReference)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMention(null)
        return
      }
    }

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className={attachments ? 'jm-prompt is-canvas has-attachments' : 'jm-prompt is-canvas'}>
      {attachments && (
        <div className="jm-prompt__attachments" aria-label={attachmentsLabel}>
          {attachments}
        </div>
      )}
      <div className="jm-prompt__input-shell">
        <textarea
          ref={textareaRef}
          id="jm-prompt-input"
          className="jm-prompt__textarea"
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value.slice(0, PROMPT_MAX_LENGTH)
            onChange(nextValue)
            const nextMention = getMentionState(nextValue, event.target.selectionStart)
            setMention(
              nextMention && textareaRef.current
                ? {
                    ...nextMention,
                    style: getMentionStyle(
                      nextValue,
                      nextMention.start,
                      textareaRef.current,
                    ),
                  }
                : null,
            )
            setMentionIndex(0)
          }}
          onScroll={(event) => {
            if (mirrorRef.current) {
              mirrorRef.current.scrollTop = event.currentTarget.scrollTop
            }
          }}
          onMouseMove={(event: MouseEvent<HTMLTextAreaElement>) => {
            const textarea = event.currentTarget
          const caret = getCaretOffsetFromPoint(
            event.currentTarget,
            event.clientX,
            event.clientY,
          )
            const reference = getReferenceAtCaret(textarea.value, caret, references)
            setPreviewedReference(reference)

            if (!reference) {
              setPreviewStyle(null)
              return
            }

            const beforeCaret = textarea.value.slice(0, caret)
            const beforeMatch = /@([^\s@]*)$/.exec(beforeCaret)
            const tokenStart = caret - (beforeMatch?.[1].length ?? 0) - 1
            const tokenEnd = tokenStart + reference.fileName.length + 1
            const tokenRect = getReferenceTokenRect(
              textarea.value,
              tokenStart,
              tokenEnd,
              textarea,
            )
            const container = textarea.closest<HTMLElement>('.jm-prompt')
            if (!container) return

          const containerRect = container.getBoundingClientRect()
          const previewWidth = Math.min(
            tokenRect.width,
            reference.width || tokenRect.width,
          )
          const previewHeight = reference.width && reference.height
            ? previewWidth * (reference.height / reference.width) + 2
            : previewWidth + 2
          const left = tokenRect.left - containerRect.left
            const belowTop = tokenRect.bottom + 6
            const aboveTop = tokenRect.top - previewHeight - 6
            const belowFits = belowTop + previewHeight <= window.innerHeight - 8
            const aboveFits = aboveTop >= 8
            const top = belowFits
              ? belowTop
              : aboveFits
                ? aboveTop
                : belowTop >= tokenRect.top
                  ? belowTop
                  : aboveTop

            setPreviewStyle({
              left,
              top: top - containerRect.top,
              width: previewWidth,
            })
          }}
          onMouseLeave={() => setPreviewedReference(null)}
          onKeyDown={handleKeyDown}
          placeholder="输入文字，描述你想创作的画面内容、运动方式等。例如：一个毛毡风格的小花猫，在喷泉边喝水"
          rows={2}
          disabled={disabled}
        />
        <div
          ref={mirrorRef}
          className="jm-prompt__textarea-mirror"
          aria-hidden="true"
        >
          <span>
            {parsePromptSegments(value, references).map((segment, index) =>
              segment.type === 'reference' ? (
                <span key={`${segment.value}-${index}`} className="jm-prompt__reference-token">
                  {segment.value}
                </span>
              ) : (
                <span key={`text-${index}`}>{segment.value}</span>
              ),
            )}
          </span>
        </div>
      </div>
      {mention && references.length > 0 && (
        <div
          className="jm-prompt__mentions"
          role="listbox"
          style={mention.style}
        >
          <span className="jm-prompt__mentions-title">上传参考</span>
          {filteredReferences.length > 0 ? (
            filteredReferences.map((reference, index) => (
              <button
                key={`${reference.uploadId}-${reference.fileName}`}
                type="button"
                role="option"
                aria-selected={index === mentionIndex}
                className={index === mentionIndex ? 'is-active' : ''}
                onMouseEnter={() => {
                  setPreviewedReference(reference)
                  setPreviewStyle(null)
                }}
                onMouseLeave={() => setPreviewedReference(null)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  insertReference(reference)
                }}
              >
                <img src={reference.url} alt="" />
                <small>{reference.fileName}</small>
              </button>
            ))
          ) : (
            <span className="jm-prompt__mentions-empty">
              {references.length === 0 ? '请先上传参考图' : '没有匹配的引用'}
            </span>
          )}
        </div>
      )}
      {previewedReference && (
        <div className="jm-prompt__mention-preview" style={previewStyle ?? undefined}>
          <img src={previewedReference.url} alt={previewedReference.fileName} />
        </div>
      )}
    </div>
  )
}
