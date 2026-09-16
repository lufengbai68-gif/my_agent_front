import { useRef, useState } from 'react'
import {
  REFERENCE_IMAGE_MAX_BYTES,
  REFERENCE_IMAGE_TYPES,
} from '../constants/options'
import { uploadReferenceImage } from '../api/chat'
import type { ReferenceImage, ReferenceImagePurpose } from '../types/generation'

interface ImageUploaderProps {
  value: ReferenceImage | null
  onChange: (value: ReferenceImage | null) => void
  disabled?: boolean
  className?: string
  title?: string
  label?: string
  referenceId?: string
  purpose: ReferenceImagePurpose
}

/** 参考图上传：先 POST /v1/uploads，再保存预签名 URL */
export function ImageUploader({
  value,
  onChange,
  disabled,
  className,
  title,
  label,
  referenceId,
  purpose,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    if (!REFERENCE_IMAGE_TYPES.includes(file.type)) {
      setError('仅支持 PNG / JPG / WebP 图片')
      return
    }
    if (file.size > REFERENCE_IMAGE_MAX_BYTES) {
      setError('图片大小不能超过 10MB')
      return
    }

    setIsUploading(true)
    try {
      const upload = await uploadReferenceImage(file, purpose)
      onChange({
        uploadId: upload.id,
        referenceId: referenceId ?? `img_${crypto.randomUUID().slice(0, 8)}`,
        fileName: upload.filename,
        url: upload.url,
        mimeType: upload.mime_type,
        size: upload.size,
        width: upload.width,
        height: upload.height,
        expiresAt: upload.expires_at,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={className ? `jm-uploader ${className}` : 'jm-uploader'}>
      {value ? (
        <button
          type="button"
          className="jm-uploader__thumb"
          title={`${value.fileName}（点击移除）`}
          disabled={disabled || isUploading}
          onClick={() => onChange(null)}
        >
          <img src={value.url} alt={value.fileName} />
          <span className="jm-uploader__reference">@{value.fileName}</span>
          <span className="jm-uploader__remove" aria-hidden="true">
            ×
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="jm-uploader__add"
          title={title ?? '上传参考图（图生视频）'}
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) void handleFile(file)
          }}
        >
          <span className="jm-uploader__plus" aria-hidden="true">
            +
          </span>
          {label && <span className="jm-uploader__label">{label}</span>}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={REFERENCE_IMAGE_TYPES.join(',')}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {error && (
        <span className="jm-uploader__error" role="alert">
          {error}
        </span>
      )}
      {isUploading && (
        <span className="jm-uploader__loading" aria-hidden="true">
          <span className="jm-spinner" />
        </span>
      )}
    </div>
  )
}
