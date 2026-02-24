import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ArchivePage } from '../box/ArchivePage'
import { ComposePage } from '../5todolist/ComposePage'
import { HomePage } from '../5todolist/HomePage'
import { SchedulePage } from '../5todolist/SchedulePage'
import { TodoDetailPage } from '../5todolist/TodoDetailPage'
import { KakaoCallbackPage } from '../authetication/KakaoCallbackPage'
import { LoginPage } from '../authetication/LoginPage'
import { SignupPage } from '../authetication/SignupPage'
import { MyPage } from '../authetication/MyPage'
import { SplashPage } from '../firstpage/SplashPage'
import { MobileLayout } from '../layouts/MobileLayout'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <MobileLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/splash" replace /> },
      { path: 'splash', element: <SplashPage /> },
      { path: 'home', element: <HomePage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'compose', element: <ComposePage /> },
      { path: 'todo/:id', element: <TodoDetailPage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'mypage', element: <MyPage /> },
      { path: 'auth/kakao/callback', element: <KakaoCallbackPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
