import type { GenerationTask } from '../types/generation'

interface TaskProgressProps {
  task: GenerationTask
}

/** 状态文案 + 动画渐变进度条（生成中显示在结果区） */
export function TaskProgress({ task }: TaskProgressProps) {
  const elapsed = Math.max(
    0,
    Math.round(((task.finishedAt ?? Date.now()) - task.createdAt) / 1000),
  )
  return (
    <div className="jm-progress">
      <div className="jm-progress__head">
        <span className="jm-progress__label">{task.statusMessage ?? '处理中'}</span>
        {task.status !== 'queued' && task.status !== 'canceled' && (
          <span className="jm-progress__percent">{task.progress}%</span>
        )}
        <span className="jm-progress__elapsed">{elapsed}s</span>
      </div>
      <div className="jm-progress__track">
        <div
          className="jm-progress__bar"
          style={{ width: `${task.progress}%` }}
        />
      </div>
    </div>
  )
}
