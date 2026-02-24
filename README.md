# 5늘할일 프론트엔드

`5늘할일`은 "오늘에만 집중"이라는 컨셉으로, 하루 할 일을 최대 5개까지 관리하는 모바일 중심 To-do 웹앱입니다.

## 기술 스택
- React + TypeScript
- Vite
- React Router
- Zustand (로컬 상태 + persist)
- React Hook Form + Zod
- Day.js

## 지금까지 구현된 핵심 기능 (1차)
- Home 화면
  - 오늘 날짜/안내 문구 표시
  - 오늘 할 일 목록(최대 5개)
  - 체크박스로 완료/미완료 토글
  - 카드 액션: `상세보기`, `보관`, `삭제`
- 할 일 등록 화면
  - 제목 + 상세 메모 입력
  - 등록 후 Home 복귀
- 상세 화면
  - 제목/날짜/메모 표시
  - 뒤로가기 동선
- 보관함/일정 화면
  - 완료 여부(`isDone`) 기준 집계/표시
- 로그인(My) 화면
  - 카카오 버튼 + 이메일 로그인 폼
  - `Or login with` 하단 영역 정렬 보정
  - `로그인 상태 유지` 체크박스 UI/체크 동작 반영
  - `아직 회원이 아니세요? 회원가입` 문구(현재 버튼 동작 없음)
- 디자인/폰트
  - `온글잎 김콩해` 웹폰트(CDN) 적용
  - Home 타이틀 `5늘할일`은 별도 폰트 유지
  - 전반적 가독성 개선(텍스트 크기/줄바꿈 보정)

## 실행 방법 (`npm run dev`)

### 1) 프로젝트 폴더 이동
```bash
cd 5todolist
```

### 2) 의존성 설치
```bash
npm install
```

### 3) 개발 서버 실행
```bash
npm run dev
```

### 4) 브라우저 접속
터미널에 출력되는 주소(기본값 `http://localhost:5173`)로 접속합니다.

## 환경변수 및 카카오 로그인(SSO) 연동 가이드

안전한 보안 통신과 카카오 인증을 위해 환경 변수 파일(`.env.local`)을 사용합니다. 프론트엔드 코드 내에 키 값을 하드코딩하지 **않습니다.** (저장소 공유 시 보안 유지)

### 1) `.env.local` 파일 생성
프로젝트 루트(`5todolist/`)에 `.env.local` 파일을 생성합니다. (`.env`나 `.env.example`을 복사해도 됨)

### 2) VITE 변수 설정
```env
# 백엔드 API 서버의 주소
VITE_API_BASE_URL=http://localhost:8000

# Kakao Developers > 내 애플리케이션 > 앱 키 > JavaScript 키
VITE_KAKAO_JS_KEY=본인의_카카오_자바스크립트_키를_입력하세요

# 카카오 인가 코드 반환을 위한 리다이렉트 URI (카카오 콘솔 설정과 100% 동일해야 함)
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
```

### 3) Kakao Developers 콘솔 설정 필수 내역
카카오 로그인이 브라우저에서 올바르게 구동되려면, [Kakao Developers](https://developers.kakao.com/) 내 애플리케이션 설정에서 다음이 등록되어 있어야 합니다.
1. **플랫폼 > Web 사이트 도메인**: `http://localhost:5173` 추가
2. **카카오 로그인 > 활성화 설정**: `ON`
3. **카카오 로그인 > Redirect URI**: `http://localhost:5173/auth/kakao/callback` 등록

> **보안 주의**: `VITE_KAKAO_JS_KEY`는 클라이언트(브라우저) 측으로 노출되는 안전한 Public 성격의 키입니다. 백엔드에서만 쓰는 비밀번호나 `REST API 키`는 이곳에 넣지 마세요.

## 폴더 구조 (요약)
```text
src/
  5todolist/         # Home, 등록, 상세, 일정, store
  authetication/     # 로그인, 카카오 인증 관련
  box/               # 보관함
  app/               # 라우터/에러 페이지
  layouts/           # 모바일 레이아웃/하단 네비
```

## 참고 문서
- 변경 이력/의사결정: `../docs/8_대규모수정사항.md`
