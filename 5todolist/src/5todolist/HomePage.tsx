import dayjs from 'dayjs'
import { Archive, CircleHelp, X } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEventHandler,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useTodoStore, type TodoItem } from './todoStore'

const SWIPE_THRESHOLD = 84
const MAX_SWIPE_DISTANCE = 140
const DELETE_UNDO_MS = 3000

function TodoCard({
  todo,
  onToggleDone,
  onView,
  onDeleteBySwipe,
  onArchiveBySwipe,
}: {
  todo: TodoItem
  onToggleDone: (id: string) => void
  onView: (id: string) => void
  onDeleteBySwipe: () => void
  onArchiveBySwipe: () => void
}) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [commitAction, setCommitAction] = useState<'delete' | 'archive' | null>(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const axisLockRef = useRef<'none' | 'x' | 'y'>('none')

  const onPointerDown: PointerEventHandler<HTMLElement> = (event) => {
    if (commitAction) return
    if (!(event.target instanceof Element)) return
    if (event.target.closest('button, input')) return
    pointerIdRef.current = event.pointerId
    axisLockRef.current = 'none'
    startXRef.current = event.clientX
    startYRef.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove: PointerEventHandler<HTMLElement> = (event) => {
    if (pointerIdRef.current !== event.pointerId) return
    const dx = event.clientX - startXRef.current
    const dy = event.clientY - startYRef.current

    if (axisLockRef.current === 'none') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      axisLockRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }

    if (axisLockRef.current === 'y') return

    event.preventDefault()
    setIsDragging(true)
    const bounded = Math.max(-MAX_SWIPE_DISTANCE, Math.min(MAX_SWIPE_DISTANCE, dx))
    setDragX(bounded)
  }

  const commitSwipeAction = (action: 'delete' | 'archive') => {
    setCommitAction(action)
    setIsDragging(false)
    setDragX(action === 'delete' ? MAX_SWIPE_DISTANCE : -MAX_SWIPE_DISTANCE)

    window.setTimeout(() => {
      if (action === 'delete') {
        onDeleteBySwipe()
      } else {
        onArchiveBySwipe()
      }
      setCommitAction(null)
      setDragX(0)
    }, 140)
  }

  const onPointerEnd: PointerEventHandler<HTMLElement> = (event) => {
    if (pointerIdRef.current !== event.pointerId) return

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore release failures
    }

    if (axisLockRef.current === 'x') {
      if (dragX >= SWIPE_THRESHOLD) {
        commitSwipeAction('delete')
      } else if (dragX <= -SWIPE_THRESHOLD) {
        commitSwipeAction('archive')
      } else {
        setIsDragging(false)
        setDragX(0)
      }
    } else {
      setIsDragging(false)
      setDragX(0)
    }

    pointerIdRef.current = null
    axisLockRef.current = 'none'
  }

  const deleteProgress = dragX > 0 ? Math.min(1, dragX / SWIPE_THRESHOLD) : 0
  const archiveProgress = dragX < 0 ? Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD) : 0
  const swipeStyle = {
    '--swipe-x': `${dragX}px`,
    '--delete-progress': `${deleteProgress}`,
    '--archive-progress': `${archiveProgress}`,
  } as CSSProperties

  return (
    <div className="todo-card-swipe-shell" style={swipeStyle}>
      <div className="todo-swipe-reveal todo-swipe-reveal-delete" aria-hidden="true">
        <X size={20} />
        <span>삭제</span>
      </div>
      <div className="todo-swipe-reveal todo-swipe-reveal-archive" aria-hidden="true">
        <Archive size={20} />
        <span>보관함</span>
      </div>
      <article
        className={`todo-card todo-card-swipe${isDragging ? ' is-dragging' : ''}${commitAction ? ` is-committing-${commitAction}` : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <label className="todo-main">
          <input
            type="checkbox"
            checked={todo.isDone}
            onChange={() => onToggleDone(todo.id)}
            aria-label={`${todo.title} 완료 상태 변경`}
          />
          <span>{todo.title}</span>
        </label>
        <div className="todo-actions">
          <button type="button" onClick={() => onView(todo.id)}>
            상세보기
          </button>
        </div>
      </article>
    </div>
  )
}

type PendingDelete = {
  todo: TodoItem
  index: number
  timeoutId: number
}

export function HomePage() {
  const navigate = useNavigate()
  const { todos, toggleDone, removeTodo, archiveTodo, insertTodo } = useTodoStore()
  const activeTodos = useMemo(() => {
    const now = new Date()
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const toLocalDateKey = (isoString: string) => {
      const parsed = new Date(isoString)
      if (Number.isNaN(parsed.getTime())) return ''
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
    }

    return todos.filter((todo) => !todo.archived && toLocalDateKey(todo.createdAt) === todayKey)
  }, [todos])
  const canAdd = activeTodos.length < 5
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [isLimitInfoOpen, setIsLimitInfoOpen] = useState(false)

  useEffect(
    () => () => {
      if (pendingDelete) window.clearTimeout(pendingDelete.timeoutId)
    },
    [pendingDelete],
  )

  useEffect(() => {
    if (!isLimitInfoOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLimitInfoOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLimitInfoOpen])

  const handleDeleteBySwipe = (todo: TodoItem) => {
    if (pendingDelete) {
      window.clearTimeout(pendingDelete.timeoutId)
    }

    const index = todos.findIndex((item) => item.id === todo.id)
    removeTodo(todo.id)

    const timeoutId = window.setTimeout(() => {
      setPendingDelete(null)
    }, DELETE_UNDO_MS)

    setPendingDelete({
      todo,
      index: index >= 0 ? index : 0,
      timeoutId,
    })
  }

  const handleUndoDelete = () => {
    if (!pendingDelete) return
    window.clearTimeout(pendingDelete.timeoutId)
    insertTodo(pendingDelete.todo, pendingDelete.index)
    setPendingDelete(null)
  }

  return (
    <section className="screen">
      <header className="screen-header home-header">
        <h1 className="home-logo">5늘할일</h1>
        <p>{dayjs().format('YYYY.MM.DD')}</p>
      </header>

      <section className="todo-section">
        <h2>오늘 할 일</h2>
        {activeTodos.map((todo) => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onToggleDone={toggleDone}
            onView={(id) => navigate(`/todo/${id}`, { state: { from: 'home' } })}
            onDeleteBySwipe={() => handleDeleteBySwipe(todo)}
            onArchiveBySwipe={() => archiveTodo(todo.id)}
          />
        ))}
        {canAdd ? (
          <>
            <button type="button" className="todo-add-card" onClick={() => navigate('/compose')}>
              오늘 할 일 작성하러 가기 +
            </button>
            <div className="todo-limit-row">
              <p className="todo-limit-note">*최대 5개까지만 등록할 수 있어요.</p>
              <button
                type="button"
                className="todo-limit-info-button"
                aria-label="최대 5개 제한 안내 보기"
                onClick={() => setIsLimitInfoOpen(true)}
              >
                <CircleHelp size={16} />
              </button>
            </div>
          </>
        ) : null}
      </section>
      {isLimitInfoOpen ? (
        <div className="limit-info-overlay" onClick={() => setIsLimitInfoOpen(false)}>
          <article
            className="limit-info-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="limit-info-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="limit-info-header">
              <h3 id="limit-info-title">왜 5개뿐인가요?</h3>
              <button
                type="button"
                className="limit-info-close-button"
                aria-label="안내 닫기"
                onClick={() => setIsLimitInfoOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <p className="limit-info-body">
              할 일이 많아지면 뇌는 무엇부터 할지 고민하다 에너지를 다 써버립니다. 5늘할일은
              당신의 에너지가 분산되지 않도록 가장 중요한 5개에만 집중하게 돕습니다. 10개의
              계획보다 5개의 완료가 당신의 성장을 만듭니다.
            </p>
          </article>
        </div>
      ) : null}
      {pendingDelete ? (
        <aside className="undo-toast" role="status" aria-live="polite">
          <span>삭제됨</span>
          <button type="button" onClick={handleUndoDelete}>
            되돌리기
          </button>
          <span key={pendingDelete.todo.id} className="undo-toast-progress" aria-hidden="true" />
        </aside>
      ) : null}
    </section>
  )
}
