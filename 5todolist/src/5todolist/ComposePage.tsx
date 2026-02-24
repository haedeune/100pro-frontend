import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useTodoStore } from './todoStore'

const composeSchema = z.object({
  title: z.string().min(1, '할 일을 입력해주세요.').max(40, '40자 이내로 입력해주세요.'),
  memo: z.string().max(500, '메모는 500자 이내로 입력해주세요.').optional(),
})

type ComposeValues = z.infer<typeof composeSchema>

export function ComposePage() {
  const navigate = useNavigate()
  const { addTodo, todos } = useTodoStore()
  const [submitError, setSubmitError] = useState('')
  const activeCount = useMemo(() => {
    const localDateStr = (iso: string) => {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    const todayStr = localDateStr(new Date().toISOString())
    return todos.filter((todo) => !todo.archived && localDateStr(todo.createdAt) === todayStr).length
  }, [todos])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComposeValues>({
    resolver: zodResolver(composeSchema),
    defaultValues: { title: '', memo: '' },
  })

  const onSubmit = async (values: ComposeValues) => {
    try {
      const result = await addTodo(values.title, values.memo ?? '')
      if (!result.ok) {
        setSubmitError(result.reason ?? '등록 실패')
        return
      }
      navigate('/home', { replace: true })
    } catch {
      setSubmitError('등록 중 오류가 발생했어요. 다시 시도해주세요.')
    }
  }

  return (
    <section className="screen">
      <header className="screen-header home-header">
        <h1>할 일 등록</h1>
        <p>오늘 할 일은 최대 5개까지 등록할 수 있어요. ({activeCount}/5)</p>
      </header>

      <form className="compose-form" onSubmit={handleSubmit(onSubmit)}>
        <label>
          할 일 제목
          <input type="text" placeholder="예: 프로젝트 기획안 정리" {...register('title')} />
          {errors.title ? <span className="error-text">{errors.title.message}</span> : null}
        </label>
        <label>
          상세 메모
          <textarea rows={5} placeholder="할 일 메모를 작성해주세요." {...register('memo')} />
        </label>
        {submitError ? <p className="error-text">{submitError}</p> : null}
        <button type="submit" className="primary-button">
          등록하기
        </button>
      </form>
    </section>
  )
}
