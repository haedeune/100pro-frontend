import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  addTodo: (title: string, memo?: string, createdAt?: string, userEmail?: string) => { ok: boolean; reason?: string }
  toggleDone: (id: string) => void
  removeTodo: (id: string) => void
  insertTodo: (todo: TodoItem, index?: number) => void
  updateTodo: (id: string, values: { title?: string; memo?: string }) => void
  archiveTodo: (id: string) => void
  restoreTodo: (id: string) => void
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
const oneDayMs = 24 * 60 * 60 * 1000
const dateFromToday = (dayOffset: number, hour = 9, minute = 30) => {
  const target = new Date(startOfToday.getTime() + dayOffset * oneDayMs)
  target.setHours(hour, minute, 0, 0)
  return target.toISOString()
}

/** 목업용: 특정 연·월·일 로컬 날짜의 ISO 문자열 (캘린더 스티커 0~5단계 목업) */
const fixedDate = (year: number, month: number, day: number, hour = 9, minute = 30) => {
  const d = new Date(year, month - 1, day, hour, minute, 0, 0)
  return d.toISOString()
}

const mergeSeedById = <T extends { id: string }>(items: T[], seeds: T[]) => {
  const existingIds = new Set(items.map((item) => item.id))
  const missingSeeds = seeds.filter((seed) => !existingIds.has(seed.id))
  return [...items, ...missingSeeds]
}

const seedTodos: TodoItem[] = [
  // 목업: 2/16~2/21 캘린더 스티커 0~5단계 표시용 (차례대로 done0 ~ done5)
  { id: 'd0216-1', title: '2/16 할 일 1', memo: '스티커 0단계', isDone: false, archived: false, createdAt: fixedDate(2026, 2, 16, 9, 0), userEmail: 'test@test.com' },
  { id: 'd0217-1', title: '2/17 할 일 1', memo: '스티커 1단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 17, 9, 0), userEmail: 'test@test.com' },
  { id: 'd0218-1', title: '2/18 할 일 1', memo: '스티커 2단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 18, 9, 0), userEmail: 'test@test.com' },
  { id: 'd0218-2', title: '2/18 할 일 2', memo: '스티커 2단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 18, 10, 0), userEmail: 'test@test.com' },
  { id: 'd0219-1', title: '2/19 할 일 1', memo: '스티커 3단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 19, 9, 0), userEmail: 'test@test.com' },
  { id: 'd0219-2', title: '2/19 할 일 2', memo: '스티커 3단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 19, 10, 0), userEmail: 'test@test.com' },
  { id: 'd0219-3', title: '2/19 할 일 3', memo: '스티커 3단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 19, 11, 0), userEmail: 'test@test.com' },
  { id: 'd0220-1', title: '2/20 할 일 1', memo: '스티커 4단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 20, 9, 0), userEmail: 'test@test.com' },
  { id: 'd0220-2', title: '2/20 할 일 2', memo: '스티커 4단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 20, 10, 0), userEmail: 'test@test.com' },
  { id: 'd0220-3', title: '2/20 할 일 3', memo: '스티커 4단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 20, 11, 0), userEmail: 'test@test.com' },
  { id: 'd0220-4', title: '2/20 할 일 4', memo: '스티커 4단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 20, 12, 0), userEmail: 'test@test.com' },
  { id: 'd0221-1', title: '2/21 할 일 1', memo: '스티커 5단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 21, 9, 0), userEmail: 'test@test.com' },
  { id: 'd0221-2', title: '2/21 할 일 2', memo: '스티커 5단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 21, 10, 0), userEmail: 'test@test.com' },
  { id: 'd0221-3', title: '2/21 할 일 3', memo: '스티커 5단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 21, 11, 0), userEmail: 'test@test.com' },
  { id: 'd0221-4', title: '2/21 할 일 4', memo: '스티커 5단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 21, 12, 0), userEmail: 'test@test.com' },
  { id: 'd0221-5', title: '2/21 할 일 5', memo: '스티커 5단계', isDone: true, archived: false, createdAt: fixedDate(2026, 2, 21, 13, 0), userEmail: 'test@test.com' },
  {
    id: 'today-1',
    title: '고객 미팅 준비',
    memo: '발표 자료 최종 점검하고 질문 리스트 정리하기',
    isDone: false,
    archived: false,
    createdAt: dateFromToday(0, 10, 0),
    userEmail: 'test@test.com',
  },
  {
    id: 'd23-1',
    title: '프로젝트 기획안 정리',
    memo: '핵심 요구사항/범위/리스크 항목까지 문서화',
    isDone: false,
    archived: false,
    createdAt: dateFromToday(-1, 9, 20),
    userEmail: 'test@test.com',
  },
  {
    id: 'd23-2',
    title: '팀 회의록 작성',
    memo: '결정사항과 담당자 액션 아이템 정리 완료',
    isDone: true,
    archived: false,
    createdAt: dateFromToday(-1, 11, 15),
    userEmail: 'test@test.com',
  },
  {
    id: 'd23-3',
    title: '발표 리허설',
    memo: '타이밍 체크까지 마무리',
    isDone: true,
    archived: false,
    createdAt: dateFromToday(-1, 13, 50),
    userEmail: 'test@test.com',
  },
  {
    id: 'd23-4',
    title: '자료 백업',
    memo: '백업 데이터는 필요 시 오늘 할 일로 다시 지정',
    isDone: false,
    archived: true,
    createdAt: dateFromToday(-1, 16, 40),
    userEmail: 'test@test.com',
  },
  {
    id: 'd22-1',
    title: '주간 목표 정리',
    memo: '이번 주 반드시 끝낼 일 3개 우선순위로 선정',
    isDone: false,
    archived: false,
    createdAt: dateFromToday(-2, 9, 10),
    userEmail: 'test@test.com',
  },
  {
    id: 'd22-2',
    title: '고객 문의 답변',
    memo: '오전 문의 2건 답변 완료',
    isDone: false,
    archived: false,
    createdAt: dateFromToday(-2, 10, 45),
    userEmail: 'test@test.com',
  },
  {
    id: 'd22-3',
    title: '초안 검토',
    memo: '2월 22일 초안 1차 검토 완료',
    isDone: true,
    archived: false,
    createdAt: dateFromToday(-2, 11, 20),
    userEmail: 'test@test.com',
  },
  {
    id: 'd22-4',
    title: '참고 링크 정리',
    memo: '지금은 보류, 필요하면 오늘 할 일로 재지정',
    isDone: false,
    archived: true,
    createdAt: dateFromToday(-2, 15, 40),
    userEmail: 'test@test.com',
  },
]

const seedDeletedTodos: DeletedTodoItem[] = [
  {
    id: 'deleted-d23',
    title: '불필요 스크린샷 정리',
    memo: '중복 캡처 파일 정리 후 삭제',
    isDone: true,
    archived: false,
    createdAt: dateFromToday(-1, 18, 15),
    deletedAt: dateFromToday(0, 9, 0),
    userEmail: 'test@test.com',
  },
  {
    id: 'deleted-d22',
    title: '중복 메모 정리',
    memo: '통합 완료 후 기존 메모 삭제',
    isDone: true,
    archived: false,
    createdAt: dateFromToday(-2, 18, 40),
    deletedAt: dateFromToday(-1, 9, 30),
    userEmail: 'test@test.com',
  },
]

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: seedTodos,
      deletedTodos: seedDeletedTodos,
      addTodo: (title: string, memo = '', createdAt?: string, userEmail?: string) => {
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
        const newTodo: TodoItem = {
          id: createTodoId(),
          title: cleanTitle,
          memo: memo.trim(),
          isDone: false,
          archived: false,
          createdAt: normalizedCreatedAt,
          userEmail,
        }
        set((state) => ({ todos: [newTodo, ...state.todos] }))
        return { ok: true }
      },
      toggleDone: (id: string) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, isDone: !todo.isDone } : todo,
          ),
        })),
      removeTodo: (id: string) =>
        set((state) => {
          const target = state.todos.find((todo) => todo.id === id)
          return {
            todos: state.todos.filter((todo) => todo.id !== id),
            deletedTodos: target
              ? [{ ...target, deletedAt: new Date().toISOString() }, ...state.deletedTodos]
              : state.deletedTodos,
          }
        }),
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
      updateTodo: (id: string, values: { title?: string; memo?: string }) =>
        set((state) => ({
          todos: state.todos.map((todo) => {
            if (todo.id !== id) return todo
            return {
              ...todo,
              title: values.title ?? todo.title,
              memo: values.memo ?? todo.memo,
            }
          }),
        })),
      archiveTodo: (id: string) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id && !todo.isDone ? { ...todo, archived: true } : todo,
          ),
        })),
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
          todos: mergeSeedById(persistedTodos, seedTodos),
          deletedTodos: mergeSeedById(persistedDeletedTodos, seedDeletedTodos),
        }
      },
    },
  ),
)
