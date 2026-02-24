import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '../authetication/authStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export type TodoItem = {
  id: string
  title: string
  memo: string
  isDone: boolean
  archived: boolean
  createdAt: string
  userEmail?: string
}

export type DeletedTodoItem = TodoItem & {
  deletedAt: string
}

type TodoState = {
  todos: TodoItem[]
  deletedTodos: DeletedTodoItem[]
  addTodo: (title: string, memo?: string, createdAt?: string, userEmail?: string) => Promise<{ ok: boolean; reason?: string }>
  toggleDone: (id: string) => Promise<void>
  removeTodo: (id: string) => Promise<void>
  insertTodo: (todo: TodoItem, index?: number) => void
  updateTodo: (id: string, values: { title?: string; memo?: string }) => Promise<void>
  archiveTodo: (id: string) => Promise<void>
  restoreTodo: (id: string) => void
  fetchTodos: () => Promise<void>
  migrateAndFetch: () => Promise<void>
  clearStore: () => void
}

const MAX_TODOS = 5
const createTodoId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const todayLocalStart = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

const isPastLocalDate = (isoString: string) => {
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed < todayLocalStart()
}

const toLocalDateKey = (isoString: string) => {
  const parsed = new Date(isoString)
  if (Number.isNaN(parsed.getTime())) return ''
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const now = new Date()
const startOfToday = new Date(now)
startOfToday.setHours(9, 30, 0, 0)

const seedTodos: TodoItem[] = []
const seedDeletedTodos: DeletedTodoItem[] = []

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: seedTodos,
      deletedTodos: seedDeletedTodos,
      addTodo: async (title: string, memo = '', createdAt?: string, userEmail?: string) => {
        const todayKey = toLocalDateKey(new Date().toISOString())
        const activeCount = get().todos.filter(
          (todo) => !todo.archived && toLocalDateKey(todo.createdAt) === todayKey,
        ).length
        if (activeCount >= MAX_TODOS) {
          return { ok: false, reason: '오늘 할 일은 최대 5개까지 가능합니다.' }
        }
        const cleanTitle = title.trim()
        if (!cleanTitle) {
          return { ok: false, reason: '할 일 제목을 입력해주세요.' }
        }
        const normalizedCreatedAt = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()
        if (Number.isNaN(new Date(normalizedCreatedAt).getTime())) {
          return { ok: false, reason: '등록 날짜가 올바르지 않아요.' }
        }
        if (isPastLocalDate(normalizedCreatedAt)) {
          return { ok: false, reason: '과거 날짜의 할 일은 등록할 수 없어요.' }
        }

        let newTodo: TodoItem = {
          id: createTodoId(), // Will be overwritten if API succeeds
          title: cleanTitle,
          memo: memo.trim(),
          isDone: false,
          archived: false,
          createdAt: normalizedCreatedAt,
          userEmail,
        }

        const token = useAuthStore.getState().token
        if (token) {
          try {
            const res = await fetch(`${API_BASE}/tasks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: cleanTitle,
                description: memo.trim(),
                due_date: normalizedCreatedAt,
              }),
            })
            if (!res.ok) throw new Error('API add failed')
            const data = await res.json()
            newTodo.id = String(data.id)
            newTodo.createdAt = `${data.due_date}Z`
          } catch (e) {
            console.error('Failed to add task to remote', e)
            return { ok: false, reason: '서버 통신 에러' }
          }
        }

        set((state) => ({ todos: [newTodo, ...state.todos] }))
        return { ok: true }
      },
      toggleDone: async (id: string) => {
        const token = useAuthStore.getState().token
        const target = get().todos.find(t => t.id === id)
        if (token && target && !target.id.startsWith('todo-')) {
          try {
            await fetch(`${API_BASE}/tasks/${id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status: target.isDone ? 'pending' : 'completed' }),
            })
          } catch (e) { console.error('toggle API failed') }
        }
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, isDone: !todo.isDone } : todo,
          ),
        }))
      },
      removeTodo: async (id: string) => {
        const token = useAuthStore.getState().token
        const target = get().todos.find(t => t.id === id)
        if (token && target && !target.id.startsWith('todo-')) {
          try {
            await fetch(`${API_BASE}/tasks/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            })
          } catch (e) { console.error('delete API failed') }
        }

        set((state) => {
          return {
            todos: state.todos.filter((todo) => todo.id !== id),
            deletedTodos: target
              ? [{ ...target, deletedAt: new Date().toISOString() }, ...state.deletedTodos]
              : state.deletedTodos,
          }
        })
      },
      insertTodo: (todo: TodoItem, index = 0) =>
        set((state) => {
          const nextTodos = [...state.todos]
          const safeIndex = Math.max(0, Math.min(index, nextTodos.length))
          nextTodos.splice(safeIndex, 0, todo)
          return {
            todos: nextTodos,
            deletedTodos: state.deletedTodos.filter((item) => item.id !== todo.id),
          }
        }),
      updateTodo: async (id: string, values: { title?: string; memo?: string }) => {
        const token = useAuthStore.getState().token
        const target = get().todos.find(t => t.id === id)
        if (token && target && !target.id.startsWith('todo-')) {
          try {
            await fetch(`${API_BASE}/tasks/${id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ title: values.title ?? target.title, description: values.memo ?? target.memo }),
            })
          } catch (e) { console.error('patch API failed') }
        }

        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.id !== id) return todo
            return {
              ...todo,
              title: values.title ?? todo.title,
              memo: values.memo ?? todo.memo,
            }
          }),
        }))
      },
      archiveTodo: async (id: string) => {
        const token = useAuthStore.getState().token
        const target = get().todos.find(t => t.id === id)
        if (token && target && !target.id.startsWith('todo-')) {
          try {
            await fetch(`${API_BASE}/tasks/${id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ is_archived: true }),
            })
          } catch (e) { console.error('archive API failed') }
        }

        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id && !todo.isDone ? { ...todo, archived: true } : todo,
          ),
        }))
      },
      restoreTodo: (id: string) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? {
                ...todo,
                archived: false,
                isDone: false,
                createdAt: new Date().toISOString(),
              }
              : todo,
          ),
        })),
      fetchTodos: async () => {
        const token = useAuthStore.getState().token
        if (!token) return // guest mode: keep using local

        try {
          // Fetch active tasks
          const res = await fetch(`${API_BASE}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (!res.ok) throw new Error('Failed to fetch tasks')
          const activeTasks = await res.json()

          // Fetch archived tasks
          const archiveRes = await fetch(`${API_BASE}/tasks/archive`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const archivedTasks = archiveRes.ok ? await archiveRes.json() : []

          const combined = [...activeTasks, ...archivedTasks].map((t: any) => ({
            id: String(t.id),
            title: t.title,
            memo: t.description ?? '',
            isDone: t.status === 'completed',
            archived: t.is_archived,
            createdAt: t.due_date,
            userEmail: 'backend',
          }))

          set({ todos: combined })
        } catch (e) {
          console.error('[fetchTodos]', e)
        }
      },
      migrateAndFetch: async () => {
        const token = useAuthStore.getState().token
        if (!token) return

        const currentTodos = get().todos
        const guestTodos = currentTodos.filter(t => t.id.startsWith('todo-'))

        // Upload each guest todo to the backend
        for (const t of guestTodos) {
          try {
            const res = await fetch(`${API_BASE}/tasks`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                title: t.title,
                description: t.memo,
                due_date: t.createdAt
              })
            })
            if (res.ok) {
              const data = await res.json()
              const newId = String(data.id)
              // If it was done or archived, patch it
              if (t.isDone || t.archived) {
                await fetch(`${API_BASE}/tasks/${newId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    status: t.isDone ? 'completed' : 'pending',
                    is_archived: t.archived
                  })
                })
              }
            }
          } catch (e) {
            console.error('Failed to migrate guest todo', e)
          }
        }

        // After migration, fetch the clean slate from backend
        await get().fetchTodos()
      },
      clearStore: () => {
        set({ todos: [], deletedTodos: [] })
      }
    }),
    {
      name: 'five-todo-store',
      version: 2,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<TodoState>) ?? {}
        const persistedTodos = Array.isArray(persisted.todos) ? persisted.todos : currentState.todos
        const persistedDeletedTodos = Array.isArray(persisted.deletedTodos) ? persisted.deletedTodos : []

        return {
          ...currentState,
          ...persisted,
          todos: persistedTodos,
          deletedTodos: persistedDeletedTodos,
        }
      },
    },
  ),
)
