import type { GenerationService } from './generationService'
import { MockGenerationService } from './mockAdapter'
import { VolcanoGenerationService } from './volcanoAdapter'

/**
 * 服务选择：默认 Mock，仅当 VITE_USE_MOCK === 'false' 时切真实适配器。
 * env 变量在 dev server 启动/构建时静态内联，修改 .env.local 后需重启。
 */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export const generationService: GenerationService = useMock
  ? new MockGenerationService()
  : new VolcanoGenerationService(
      import.meta.env.VITE_API_BASE_URL ?? '',
      import.meta.env.VITE_API_KEY,
    )

export const usingMock = useMock
