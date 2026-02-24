# 프론트엔드 작업 이력 — 인증 시스템 실제 연동 (PRO-F-Auth)

## 작업 일시
- **Date:** 2026-02-24

---

## 배경 (Background)

기존 프론트엔드의 이메일 로그인 및 카카오 로그인은 모두 mock 데이터 기반으로만 구현되어 있었습니다.

- **이메일 로그인**: `authStore.ts` 내 하드코딩된 `mockUsers` 배열과 비교하는 방식 (백엔드 미연결)
- **카카오 로그인**: Kakao SDK로 인가 코드는 수신하나, 백엔드로 전송하지 않고 mock 함수 호출 후 에러 반환

이를 백엔드 API와 실제로 연결하는 작업을 수행했습니다.

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/authetication/authStore.ts` | mock 전면 제거 → 실제 API 호출로 교체 |
| `src/authetication/KakaoCallbackPage.tsx` | 인가 코드를 백엔드로 POST 전송, JWT 저장 |
| `src/authetication/LoginPage.tsx` | `onSubmit` async 처리 |
| `src/authetication/SignupPage.tsx` | `onSubmit` async 처리 |
| `src/authetication/kakaoAuth.ts` | state를 URL-safe 랜덤 nonce로 교체, redirectTo 별도 저장 |
| `.env.example` | `VITE_API_BASE_URL` 항목 추가 |
| `.env.local` | `VITE_API_BASE_URL`, `VITE_KAKAO_JS_KEY` 설정 (gitignore 대상) |

---

## 주요 변경 내용

### 1. `authStore.ts` — mock 제거 및 실제 API 연동

**Before:** 하드코딩된 `mockUsers` 배열에서 로그인 처리
```typescript
const mockUsers = [{ name: '백프로', email: 'test@test.com', password: '123456' }]
login: (email, password) => {
  const found = users.find(u => u.email === email && u.password === password)
  ...
}
```

**After:** 백엔드 `POST /auth/login` 호출, JWT 토큰 저장
```typescript
login: async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', ... })
  const data = await res.json()
  set({ isAuthenticated: true, token: data.access_token, user: data.user })
}
```

**추가된 메서드:**
- `loginWithToken(token, user, provider)` — 카카오 콜백에서 JWT 직접 저장용
- `deleteAccount()` — 로컬 상태 즉시 초기화 + 백엔드 `DELETE /auth/withdraw` 비동기 호출

**State 변경:**
- `users: User[]` (mock 배열) 제거
- `token: string | null` 추가

---

### 2. `KakaoCallbackPage.tsx` — S2S 흐름 연결

**Before:** 카카오로부터 인가 코드 수신 후 mock `login('kakao')` 호출 → 에러 반환

**After:**
1. sessionStorage에서 state 검증 (CSRF 방어)
2. 인가 코드를 백엔드 `POST /auth/kakao`로 전송
3. 백엔드가 카카오 서버와 S2S 통신 후 반환한 JWT + 유저 정보 저장
4. 지정된 `redirectTo` 경로로 이동

---

### 3. `kakaoAuth.ts` — state 인코딩 버그 수정

**문제:** `btoa(encodeURIComponent(JSON.stringify(...)))` 형식의 base64 state가 URL 파라미터로 전달될 때 `+`, `=` 문자 인코딩 불일치 → state mismatch 에러 발생

**수정:** state를 영숫자만 포함하는 랜덤 nonce로 단순화, `redirectTo`는 sessionStorage에 별도 저장
```typescript
const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
sessionStorage.setItem('kakao_oauth_state', nonce)
sessionStorage.setItem('kakao_oauth_redirect', redirectTo)
```

---

## 프론트엔드 작업 이력 — 데이터 마이그레이션 & 게스트 모드 (PRO-B-48)

### 주요 변경 내용

#### 1. `todoStore.ts` — API 통신 및 게스트 제어
- 로컬 스토리지에만 의존하던 기존 로직(mock)을 모두 들어냄.
- 로그인한 유저에 한해 `fetchTodos`로 백엔드 DB 데이터를 동기화함.
- `migrateAndFetch` 함수를 신설: 게스트 상태에서 기록된 할 일 항목을 식별(`id`가 'todo-'로 시작)하여, 유저가 로그인하는 즉시 백엔드로 `POST /tasks` 승격 전송 후 로컬스토어 동기화.

#### 2. `authStore.ts` — 계정 전환 Hook
- `login`, `kakaoAuth` 등의 액션 성공 시 `todoStore.getState().migrateAndFetch()`가 자동 호출되도록 트리거 로직 추가.
- `logout`, `deleteAccount` 발생 시 `todoStore.getState().clearStore()`를 호출하여 타인 계정 잔재를 비움.

#### 3. UX 접근 제어 로직 (`ArchivePage`, `SchedulePage`)
- 비로그인 유저가 보관함에 진입하거나, 캘린더에서 과거/미래로 이동하려 할 때 `useAuthStore`의 `isAuthenticated` 상태를 이용해 차단.
- React StrictMode 더블 렌더링으로 인해 `alert` 창이 두 번 뜨는 버그를 `useRef`로 해결.

## 환경 변수 설정

### `.env.local` (gitignore, 직접 생성 필요)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_KAKAO_JS_KEY=<Kakao Developers JavaScript 키>
```

### Kakao Developers 콘솔 설정 필요 항목
- 플랫폼 > Web > 사이트 도메인: `http://localhost:5173`
- 카카오 로그인 > Redirect URI: `http://localhost:5173/auth/kakao/callback`

---

## 인증 흐름 요약

```
[이메일 로그인]
LoginPage → POST /auth/login → JWT + UserInfo → authStore.token 저장

[카카오 로그인]
LoginPage → Kakao SDK authorize() → 카카오 서버 → /auth/kakao/callback?code=XXX
→ KakaoCallbackPage → POST /auth/kakao → 백엔드 S2S → JWT + UserInfo → authStore.token 저장

[회원가입]
SignupPage → POST /auth/signup → 완료 → /login 이동

[회원탈퇴]
MyPage → deleteAccount() → 로컬 상태 초기화 + DELETE /auth/withdraw
```

---

## 결과
- 이메일 로그인 / 회원가입: 백엔드 DB 기반으로 정상 동작
- 카카오 로그인: S2S OAuth 흐름 완성, JWT 발급 확인
- 인증 상태는 Zustand persist(localStorage)로 유지
