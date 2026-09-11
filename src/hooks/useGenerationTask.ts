import { useCallback, useEffect, useRef, useState } from 'react'
import { generationService } from '../api'
import type { GenerationRequest, GenerationTask } from '../types/generation'

/** 轮询间隔（env 可调，默认 1500ms） */
const POLL_INTERVAL =
  Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 1500

/** 硬超时：超过即判失败，防止无限轮询 */
const TASK_TIMEOUT_MS = 3 * 60 * 1000

export interface UseGenerationTask {
  /** 当前任务（含终态）；null = 空闲 */
  task: GenerationTask | null
  /** queued || running */
  isBusy: boolean
  /** 提交请求异常时的错误信息（网络失败等，非任务失败） */
  submitError: string | null
  submit: (request: GenerationRequest) => void
  cancel: () => void
  /** 回到空闲态（清除已展示的结果） */
  reset: () => void
}

/**
 * 生成任务生命周期：submit → 轮询 getTask → 终态。
 *
 * 轮询以 effect + activeTaskId 实现（而非在 submit 事件里启动），
 * cleanup 时中止 AbortController —— React 18/19 StrictMode 双挂载时
 * 第一条轮询链被正确中止，最终仅存活一条。
 */
export function useGenerationTask(): UseGenerationTask {
  const [task, setTask] = useState<GenerationTask | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  /** 提交时缓存 request：真实适配器轮询响应不含 request，用它补齐 */
  const requestCache = useRef(new Map<string, GenerationRequest>())

  const submit = useCallback((request: GenerationRequest) => {
    setSubmitError(null)
    setTask({
      id: 'pending',
      mode: request.mode,
      request,
      status: 'queued',
      progress: 0,
      statusMessage: '正在提交…',
      results: [],
      createdAt: Date.now(),
    })
    generationService
      .submitTask(request)
      .then(({ taskId }) => {
        requestCache.current.set(taskId, request)
        setActiveTaskId(taskId)
      })
      .catch((err: unknown) => {
        setTask(null)
        setSubmitError(
          err instanceof Error ? err.message : '提交任务失败，请检查网络后重试',
        )
      })
  }, [])

  // 轮询 effect：activeTaskId 变化（或 null）时重开/停止
  useEffect(() => {
    if (!activeTaskId) return

    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | null = null

    const poll = async () => {
      try {
        const next = await generationService.getTask(activeTaskId, controller.signal)
        if (controller.signal.aborted) return

        // 用提交时缓存的 request 补齐（真实适配器的响应不含它）
        const request = requestCache.current.get(activeTaskId)
        const merged = request ? { ...next, request } : next

        // 超时保护
        if (
          merged.status !== 'succeeded' &&
          merged.status !== 'failed' &&
          merged.status !== 'canceled' &&
          Date.now() - merged.createdAt > TASK_TIMEOUT_MS
        ) {
          setTask({
            ...merged,
            status: 'failed',
            statusMessage: '生成超时',
            error: '生成超时，请稍后重试',
            finishedAt: Date.now(),
          })
          return
        }

        setTask(merged)

        if (merged.status === 'queued' || merged.status === 'running') {
          timer = setTimeout(poll, POLL_INTERVAL)
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setTask({
          id: activeTaskId,
          mode: requestCache.current.get(activeTaskId)?.mode ?? 'image',
          request: requestCache.current.get(activeTaskId) ?? ({} as GenerationRequest),
          status: 'failed',
          progress: 0,
          statusMessage: '生成失败',
          error: err instanceof Error ? err.message : '查询任务失败',
          results: [],
          createdAt: Date.now(),
          finishedAt: Date.now(),
        })
      }
    }

    void poll()

    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [activeTaskId])

  const cancel = useCallback(() => {
    if (!activeTaskId) return
    const taskId = activeTaskId
    setActiveTaskId(null)
    setTask((prev) =>
      prev && (prev.status === 'queued' || prev.status === 'running')
        ? {
            ...prev,
            status: 'canceled',
            statusMessage: '已取消',
            finishedAt: Date.now(),
          }
        : prev,
    )
    // 尽力通知服务端；失败静默（取消本质是"停止等待"）
    void generationService.cancelTask?.(taskId).catch(() => {})
  }, [activeTaskId])

  const reset = useCallback(() => {
    setActiveTaskId(null)
    setTask(null)
    setSubmitError(null)
  }, [])

  const isBusy =
    task?.status === 'queued' || task?.status === 'running' || task?.id === 'pending'

  return { task, isBusy, submitError, submit, cancel, reset }
}
