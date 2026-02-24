const KAKAO_SDK_URL = 'https://developers.kakao.com/sdk/js/kakao.min.js'

type KakaoSdk = {
  isInitialized: () => boolean
  init: (key: string) => void
  Auth: { authorize: (options: { redirectUri: string; state?: string }) => void }
}

type KakaoWindow = Window & { Kakao?: KakaoSdk }

const getKakaoJsKey = () => import.meta.env.VITE_KAKAO_JS_KEY
const getRedirectUri = () =>
  import.meta.env.VITE_KAKAO_REDIRECT_URI ||
  `${window.location.origin}/auth/kakao/callback`

async function loadKakaoSdk(): Promise<KakaoSdk> {
  const w = window as KakaoWindow
  if (w.Kakao) return w.Kakao

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = KAKAO_SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('카카오 SDK 로딩 실패'))
    document.head.appendChild(script)
  })

  if (!w.Kakao) throw new Error('카카오 SDK를 사용할 수 없습니다.')
  return w.Kakao
}

export async function authorizeWithKakao(redirectTo: string, isLinking = false) {
  const jsKey = getKakaoJsKey()
  if (!jsKey) throw new Error('VITE_KAKAO_JS_KEY가 설정되지 않았습니다.')

  const kakao = await loadKakaoSdk()
  if (!kakao.isInitialized()) kakao.init(jsKey)

  // 영숫자만 사용하는 랜덤 nonce (URL 인코딩 문제 없음)
  const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
  sessionStorage.setItem('kakao_oauth_state', nonce)
  sessionStorage.setItem('kakao_oauth_redirect', redirectTo)
  sessionStorage.setItem('kakao_oauth_action', isLinking ? 'link' : 'login')

  kakao.Auth.authorize({ redirectUri: getRedirectUri(), state: nonce })
}

export function parseKakaoState(encoded: string | null): { redirectTo: string } | null {
  if (!encoded) return null
  try {
    const payload = JSON.parse(decodeURIComponent(atob(encoded))) as { redirectTo?: string }
    return payload.redirectTo ? { redirectTo: payload.redirectTo } : null
  } catch {
    return null
  }
}
