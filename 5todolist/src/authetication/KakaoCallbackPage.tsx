import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from './authStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export function KakaoCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const loginWithToken = useAuthStore((state) => state.loginWithToken)
  const token = useAuthStore((state) => state.token)
  const [failed, setFailed] = useState(false)
  const [failReason, setFailReason] = useState('')
  const hasFetched = useRef(false)

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  useEffect(() => {
    if (error || !code) {
      console.error('[Kakao] error param or missing code:', { error, code })
      setFailReason(`카카오 에러: ${error ?? 'code 없음'}`)
      setFailed(true)
      return
    }

    if (hasFetched.current) return
    hasFetched.current = true

    const savedState = sessionStorage.getItem('kakao_oauth_state')
    const redirectTo = sessionStorage.getItem('kakao_oauth_redirect') ?? '/home'
    const action = sessionStorage.getItem('kakao_oauth_action') ?? 'login'

    sessionStorage.removeItem('kakao_oauth_state')
    sessionStorage.removeItem('kakao_oauth_redirect')
    sessionStorage.removeItem('kakao_oauth_action')

    if (!savedState || savedState !== state) {
      console.error('[Kakao] state mismatch:', { savedState, state })
      setFailReason('state 불일치 — 처음부터 다시 시도해주세요.')
      setFailed(true)
      return
    }

    console.log('[Kakao] code 수신, 백엔드로 전송 중... (action:', action, ')')

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (action === 'link' && token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    fetch(`${API_BASE}/auth/kakao`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 409 && body.detail?.code === 'ACCOUNT_COLLISION_REQUIRE_PASSWORD') {
            return Promise.reject({
              isCollision: true,
              data: body.detail.data,
              message: body.detail.message,
            })
          }
          throw new Error(`백엔드 ${res.status}: ${body.detail ?? 'unknown'}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log('[Kakao] 로그인 성공, 유저:', data.user)
        loginWithToken(data.access_token, data.user, 'kakao')
        navigate(redirectTo, { replace: true })
      })
      .catch((err: any) => {
        if (err.isCollision) {
          console.warn('[Kakao] 계정 충돌 발생 -> 비밀번호 재검증 화면으로 이동')
          navigate('/login', {
            replace: true,
            state: {
              collision: true,
              email: err.data.email,
              tempToken: err.data.temp_token,
              message: err.message,
              redirectTo,
            },
          })
          return
        }
        console.error('[Kakao] 백엔드 호출 실패:', err.message || err)
        setFailReason(err.message || '로그인 중 에러가 발생했습니다.')
        setFailed(true)
      })
  }, [code, error, loginWithToken, navigate, state])

  if (failed) {
    return (
      <section className="screen screen-center">
        <h1>로그인 처리 중 오류</h1>
        <p className="error-text">카카오 로그인에 실패했습니다.</p>
        {failReason ? <p style={{ fontSize: '13px', color: '#999' }}>{failReason}</p> : null}
        <button onClick={() => navigate('/login', { replace: true })}>로그인으로 돌아가기</button>
      </section>
    )
  }

  return (
    <section className="screen screen-center">
      <h1>카카오 로그인 처리 중</h1>
    </section>
  )
}
