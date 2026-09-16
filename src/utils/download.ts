/**
 * 跨域下载：`<a download>` 对跨域 URL 无效（文件名被忽略），
 * 故走 fetch → blob → objectURL；失败时兜底新开标签页。
 */
export async function downloadUrl(url: string, fileName: string): Promise<void> {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

/** 从 URL 提取扩展名，兜底 png */
function extOf(url: string): string {
  const match = /\.(png|jpe?g|webp|gif|mp4|webm)(?=\?|$)/i.exec(url)
  return match ? match[1].toLowerCase() : 'png'
}

export function buildFileName(kind: 'image' | 'video', taskId: string, index: number): string {
  return `artvis-${kind}-${taskId}-${index + 1}.${extOf(kind === 'image' ? 'x.png' : 'x.mp4') === 'mp4' ? 'mp4' : 'png'}`
}
