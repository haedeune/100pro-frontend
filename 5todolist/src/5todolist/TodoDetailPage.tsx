import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import { ChevronLeft, Pencil, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTodoStore } from './todoStore'

dayjs.locale('ko')

export function TodoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const updateTodo = useTodoStore((state) => state.updateTodo)
  const todo = useTodoStore((state) => state.todos.find((item) => item.id === id))
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [memo, setMemo] = useState('')
  const [error, setError] = useState('')
  const isPastTodo = dayjs(todo?.createdAt).startOf('day').isBefore(dayjs().startOf('day'))

  if (!id || !todo) return <Navigate to="/home" replace />

  useEffect(() => {
    if (!isEditing) {
      setTitle(todo.title)
      setMemo(todo.memo)
      setError('')
    }
  }, [todo, isEditing])

  const startEdit = () => {
    if (isPastTodo) {
      setError('지난 날짜의 할 일은 수정할 수 없어요.')
      return
    }
    setTitle(todo.title)
    setMemo(todo.memo)
    setError('')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setTitle(todo.title)
    setMemo(todo.memo)
    setError('')
    setIsEditing(false)
  }

  const saveEdit = () => {
    const cleanTitle = title.trim()
    const cleanMemo = memo.trim()

    if (!cleanTitle) {
      setError('할 일 제목을 입력해주세요.')
      return
    }
    if (cleanTitle.length > 40) {
      setError('제목은 40자 이내로 입력해주세요.')
      return
    }
    if (cleanMemo.length > 500) {
      setError('메모는 500자 이내로 입력해주세요.')
      return
    }

    updateTodo(todo.id, { title: cleanTitle, memo: cleanMemo })
    setError('')
    setIsEditing(false)
  }

  const hasUnsavedChanges = isEditing && (title.trim() !== todo.title || memo.trim() !== todo.memo)

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const shouldLeave = window.confirm('저장하지 않고 나가시겠어요?')
      if (!shouldLeave) return
    }
    const routeState = location.state as
      | { from?: 'home' | 'archive' | 'schedule'; selectedDateKey?: string; visibleMonthKey?: string }
      | null

    if (routeState?.from === 'archive') {
      navigate('/archive')
      return
    }
    if (routeState?.from === 'schedule') {
      navigate('/schedule', {
        state: {
          selectedDateKey: routeState.selectedDateKey,
          visibleMonthKey: routeState.visibleMonthKey,
        },
      })
      return
    }
    navigate('/home')
  }

  return (
    <section className="screen detail-screen">
      <article className="detail-content">
        <header className="detail-header-bar">
          <button
            type="button"
            className="detail-icon-button"
            onClick={handleBack}
            aria-label="뒤로가기"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="detail-icon-button"
            onClick={startEdit}
            aria-label="할 일 수정"
            disabled={isEditing || isPastTodo}
          >
            <Pencil size={20} />
          </button>
        </header>

        {isEditing ? (
          <section className="detail-edit-section">
            <label>
              할 일 제목
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={40}
                placeholder="할 일 제목을 입력해주세요."
              />
            </label>
            <label>
              상세 메모
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                maxLength={500}
                rows={7}
                placeholder="상세 메모를 입력해주세요."
              />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <div className="detail-edit-actions">
              <button type="button" className="detail-action-button" onClick={saveEdit}>
                <Save size={16} />
                저장
              </button>
              <button type="button" className="detail-action-button detail-cancel-button" onClick={cancelEdit}>
                <X size={16} />
                취소
              </button>
            </div>
          </section>
        ) : (
          <>
            <h1 className="detail-title">{todo.title}</h1>
            <p className="detail-date">{dayjs(todo.createdAt).format('YYYY.MM.DD dddd')}</p>
            {isPastTodo ? <p className="detail-lock-note">지난 날짜 기록은 읽기 전용이에요.</p> : null}
            <p className="detail-status-text">{todo.isDone ? '완료한 할 일이에요.' : '진행 중인 할 일이에요.'}</p>
            <p className="detail-memo">{todo.memo || '작성된 메모가 없습니다.'}</p>
          </>
        )}
      </article>
    </section>
  )
}
