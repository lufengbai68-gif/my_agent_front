import type { GenerationRequest, GenerationTask, SubmitTaskResponse } from '../types/generation'

/**
 * 生成服务接口。适配器只做纯异步传输（提交/查询/取消），
 * 轮询节奏由 hooks/useGenerationTask 控制——这与真实生成 API
 * （创建任务 → 轮询任务直至完成）的交互形态一致。
 */
export interface GenerationService {
  /** 提交生成任务，返回服务端分配的任务 id */
  submitTask(
    request: GenerationRequest,
    signal?: AbortSignal,
  ): Promise<SubmitTaskResponse>

  /** 查询任务当前状态（进度/结果） */
  getTask(taskId: string, signal?: AbortSignal): Promise<GenerationTask>

  /** 尽力取消。可选——真实厂商通常无法中止已开始的渲染 */
  cancelTask?(taskId: string, signal?: AbortSignal): Promise<void>
}
