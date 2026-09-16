import { useCallback, useEffect, useRef, useState } from 'react'
import { listChatSessions } from '../api/chat'
import type { ChatSessionSummary } from '../types/chat'

const SESSION_PAGE_SIZE = 50

export function useSessionList() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const hasInitialLoadRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const page = await listChatSessions(SESSION_PAGE_SIZE, sessions.length)
      setSessions((previous) => [
        ...previous,
        ...page.sessions.filter(
          (session) => !previous.some((item) => item.id === session.id),
        ),
      ])
      setTotal(page.total)
      setHasMore(page.sessions.length + sessions.length < page.total)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '加载会话列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [hasMore, isLoading, sessions.length])

  useEffect(() => {
    if (hasInitialLoadRef.current) return
    hasInitialLoadRef.current = true
    void loadMore()
    // 只在首次挂载时加载第一页；后续分页由列表 UI 显式触发。
  }, [])

  return { sessions, total, isLoading, error, hasMore, loadMore }
}
