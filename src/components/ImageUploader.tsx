import { useRef, useState } from 'react'
import {
  REFERENCE_IMAGE_MAX_BYTES,
  REFERENCE_IMAGE_TYPES,
} from '../constants/options'
import type { ReferenceImage } from '../types/generation'

interface ImageUploaderProps {
  value: ReferenceImage | null
  onChange: (value: ReferenceImage | null) => void
  disabled?: boolean
}

/** 图生视频参考图上传：类型/大小校验 → dataUrl 缩略图 */
export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setError(null)
    if (!REFERENCE_IMAGE_TYPES.includes(file.type)) {
      setError('仅支持 PNG / JPG / WebP 图片')
      return
    }
    if (file.size > REFERENCE_IMAGE_MAX_BYTES) {
      setError('图片大小不能超过 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onChange({ fileName: file.name, dataUrl: String(reader.result) })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="jm-uploader">
      <span className="jm-field__label">参考图（图生视频，可选）</span>
      {value ? (
        <div className="jm-uploader__preview">
          <img src={value.dataUrl} alt={value.fileName} />
          <div className="jm-uploader__info">
            <span className="jm-uploader__name" title={value.fileName}>
              {value.fileName}
            </span>
            <button
              type="button"
              className="jm-uploader__remove"
              disabled={disabled}
              onClick={() => onChange(null)}
            >
              移除
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="jm-uploader__zone"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <span className="jm-uploader__icon" aria-hidden="true">
            ＋
          </span>
          <span>点击或拖入图片</span>
          <span className="jm-uploader__hint">PNG / JPG / WebP，≤ 5MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={REFERENCE_IMAGE_TYPES.join(',')}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {error && <p className="jm-uploader__error">{error}</p>}
    </div>
  )
}
