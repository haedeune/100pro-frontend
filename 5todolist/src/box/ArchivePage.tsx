import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useTodoStore } from '../5todolist/todoStore'
import { useAuthStore } from '../authetication/authStore'

export function ArchivePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const todos = useTodoStore((state) => state.todos)
  const removeTodo = useTodoStore((state) => state.removeTodo)
  const restoreTodo = useTodoStore((state) => state.restoreTodo)
  const [menuTodoId, setMenuTodoId] = useState<string | null>(null)

  const archivedTodos = useMemo(() => todos.filter((todo) => todo.archived), [todos])
  const activeArchived = useMemo(
    () => archivedTodos.filter((todo) => !todo.isDone),
    [archivedTodos],
  )

  const hasAlerted = useRef(false)

  useEffect(() => {
    if (!isAuthenticated && !hasAlerted.current) {
      hasAlerted.current = true
      alert("보관함은 로그인 후 이용 가능한 기능입니다.")
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  useEffect(() => {
    if (!menuTodoId) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('.archive-actions-wrap')) return
      setMenuTodoId(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [menuTodoId])

  return (
    <section className="screen archive-screen">
      <header className="screen-header archive-header">
        <h1>보관함</h1>
      </header>

      <section className="archive-section">
        {activeArchived.map((todo) => (
          <article
            key={todo.id}
            className="todo-card archive-card archive-card-clickable"
            style={{ alignItems: 'flex-start' }}
            onClick={() => {
              setMenuTodoId(null)
              navigate(`/todo/${todo.id}`, { state: { from: 'archive' } })
            }}
          >
            <div className="archive-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
              <p className="archive-title">{todo.title}</p>
              <p className="archive-date" style={{ fontSize: '12px', color: '#999', fontWeight: 400 }}>
                {dayjs(todo.createdAt).format('YYYY.MM.DD')}
              </p>
            </div>
            <div className="archive-actions-wrap">
              <button
                type="button"
                className="archive-more-button"
                aria-label={`${todo.title} 메뉴 열기`}
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuTodoId((current) => (current === todo.id ? null : todo.id))
                }}
              >
                ...
              </button>
              {menuTodoId === todo.id ? (
                <div className="archive-menu" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      restoreTodo(todo.id)
                      setMenuTodoId(null)
                    }}
                  >
                    오늘 할일
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      removeTodo(todo.id)
                      setMenuTodoId(null)
                    }}
                  >
                    삭제
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}
