import { useEffect, useRef, useState } from 'react'
import { getChatModels } from '../api/chat'
import type { ChatModelCapabilities, ChatModelInfo } from '../types/chat'
import type { ModelOption } from '../types/generation'

function createCapabilitiesDescription(
  capabilities: ChatModelCapabilities,
): string {
  const labels: Array<[keyof ChatModelCapabilities, string]> = [
    ['text', '文本'],
    ['image', '图片'],
    ['video', '视频'],
    ['audio', '音频'],
    ['file', '文件'],
  ]

  return `支持输入：${labels
    .filter(([key]) => capabilities[key])
    .map(([, label]) => label)
    .join('、')}`
}

function toModelOption(model: ChatModelInfo): ModelOption | null {
  if (model.model_type !== 'image' && model.model_type !== 'video') {
    return null
  }

  return {
    id: model.key,
    name: model.label,
    mode: model.model_type,
    description: createCapabilitiesDescription(model.capabilities),
    capabilities: model.capabilities,
  }
}

export function useChatModels() {
  const [models, setModels] = useState<ModelOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    void getChatModels()
      .then((payload) => {
        const nextModels = payload.models
          .map(toModelOption)
          .filter((model): model is ModelOption => model !== null)
        setModels(nextModels)
        setError(null)
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : '加载模型列表失败')
      })
      .finally(() => {
        setIsLoading(false)
      })

  }, [])

  return { models, isLoading, error }
}
