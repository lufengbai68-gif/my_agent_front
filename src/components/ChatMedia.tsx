import { useState } from 'react'
import type { ChatMedia } from '../types/chat'

interface MediaListProps {
  media: ChatMedia[]
  posterUrl?: string
}

interface MediaCardProps {
  media: ChatMedia
  posterUrl?: string
}

function ImageCard({ media }: { media: ChatMedia }) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'failed'>('loading')
  const [attempt, setAttempt] = useState(0)

  if (loadState === 'failed') {
    return (
      <button
        type="button"
        className="jm-media-card is-error"
        onClick={() => {
          setAttempt((value) => value + 1)
          setLoadState('loading')
        }}
      >
        图片加载失败，点击重试
      </button>
    )
  }

  return (
    <div className={`jm-media-card ${loadState === 'loading' ? 'is-loading' : ''}`}>
      <img
        key={`${media.url}-${attempt}`}
        src={media.url}
        alt={media.description || '生成图片'}
        loading="lazy"
        onLoad={() => setLoadState('loaded')}
        onError={() => setLoadState('failed')}
      />
      {loadState === 'loading' && <span className="jm-spinner" aria-hidden="true" />}
    </div>
  )
}

function VideoCard({ media, posterUrl }: MediaCardProps) {
  return (
    <div className="jm-media-card is-video">
      <video
        src={media.url}
        poster={posterUrl}
        controls
        preload="metadata"
      >
        当前浏览器不支持视频播放
      </video>
    </div>
  )
}

export function MediaList({ media, posterUrl }: MediaListProps) {
  if (media.length === 0) return null

  return (
    <div className={`jm-media-list is-count-${Math.min(media.length, 4)}`}>
      {media.map((item, index) => {
        if (item.type === 'image') {
          return <ImageCard key={`${item.url}-${index}`} media={item} />
        }

        if (item.type === 'video') {
          return (
            <VideoCard
              key={`${item.url}-${index}`}
              media={item}
              posterUrl={posterUrl}
            />
          )
        }

        return (
          <audio key={`${item.url}-${index}`} src={item.url} controls preload="metadata" />
        )
      })}
    </div>
  )
}
