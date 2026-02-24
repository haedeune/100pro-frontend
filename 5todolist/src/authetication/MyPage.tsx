import { LogOut, MessageCircle, Trophy, User } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTodoStore } from '../5todolist/todoStore'
import { useAuthStore } from './authStore'
import { authorizeWithKakao } from './kakaoAuth'
import { useState } from 'react'

export function MyPage() {
    const navigate = useNavigate()
    const { user, logout, deleteAccount } = useAuthStore()
    const todos = useTodoStore((state) => state.todos)

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    const [kakaoLinkError, setKakaoLinkError] = useState('')

    const handleKakaoLink = async () => {
        try {
            setKakaoLinkError('')
            await authorizeWithKakao('/mypage', true)
        } catch (error) {
            setKakaoLinkError(error instanceof Error ? error.message : '카카오 연동을 시작할 수 없습니다.')
        }
    }

    const handleDeleteAccount = () => {
        const isConfirmed = window.confirm('정말로 회원 탈퇴를 진행하시겠습니까?\\n삭제된 계정 정보는 복구할 수 없습니다.')
        if (isConfirmed) {
            deleteAccount()
            alert('회원 탈퇴가 완료되었습니다.')
            navigate('/login', { replace: true })
        }
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Calculate today's stats
    const toLocalDateKey = (isoString: string) => {
        const parsed = new Date(isoString)
        if (Number.isNaN(parsed.getTime())) return ''
        const year = parsed.getFullYear()
        const month = String(parsed.getMonth() + 1).padStart(2, '0')
        const day = String(parsed.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const todayKey = toLocalDateKey(new Date().toISOString())
    const todaysTodos = todos.filter((t) => !t.archived && toLocalDateKey(t.createdAt) === todayKey)
    const completedCount = todaysTodos.filter((t) => t.isDone).length
    const totalCount = todaysTodos.length
    const progressRatio = totalCount === 0 ? 0 : Math.round((completedCount / Math.max(totalCount, 1)) * 100)

    return (
        <section className="screen my-screen" style={{ background: '#f5f5f7', minHeight: '100vh', paddingBottom: '80px' }}>
            <header className="screen-header" style={{ padding: '32px 24px 20px', background: '#fff' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', margin: '0 0 6px' }}>마이페이지</h1>
                <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>5늘할일과 함께하는 나의 기록</p>
            </header>

            <div className="my-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Profile Card */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: '#FFD561', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={32} color="#292929" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name} 님</h2>
                        <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                    </div>
                </div>

                {/* Productivity Stats Card */}
                <div style={{ background: '#292929', borderRadius: '20px', padding: '24px', color: '#fff', boxShadow: '0 8px 24px rgba(41,41,41,0.15)', position: 'relative', overflow: 'hidden' }}>
                    {/* Decorative background circle */}
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50px', background: 'rgba(255, 213, 97, 0.1)' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', position: 'relative' }}>
                        <div style={{ background: 'rgba(255, 213, 97, 0.2)', padding: '8px', borderRadius: '12px' }}>
                            <Trophy size={20} color="#FFD561" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>오늘의 달성률</h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '40px', fontWeight: '800', color: '#FFD561', lineHeight: '1' }}>{completedCount}</span>
                            <span style={{ fontSize: '20px', color: '#aaa', marginLeft: '6px', fontWeight: '600' }}>/ {totalCount}</span>
                        </div>
                        <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{progressRatio}%</span>
                    </div>

                    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.15)', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: `${progressRatio}%`, height: '100%', background: '#FFD561', borderRadius: '5px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>

                    <p style={{ margin: '16px 0 0', fontSize: '14px', color: '#d0d0d0', textAlign: 'center', fontWeight: '500', position: 'relative' }}>
                        {completedCount >= 5 ? '완벽한 하루네요! 수고하셨습니다 🎉' :
                            completedCount > 0 ? '조금만 더 힘내세요! 목표가 코앞이에요 🚀' : '오늘의 5가지 중요한 일을 시작해볼까요?'}
                    </p>
                </div>

                {/* Account & Settings */}
                <h3 style={{ fontSize: '15px', color: '#666', margin: '10px 0 0 10px', fontWeight: '600' }}>계정 관리</h3>

                <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <button
                        onClick={user.provider === 'kakao' ? () => { } : handleKakaoLink}
                        style={{ width: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', borderBottom: '1px solid #f2f2f5', cursor: user.provider === 'kakao' ? 'default' : 'pointer', transition: 'background 0.2s', opacity: user.provider === 'kakao' ? 0.8 : 1 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ background: '#FEE500', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageCircle size={20} color="#000000" fill="#000000" />
                            </div>
                            <span style={{ fontSize: '16px', color: '#292929', fontWeight: '600' }}>카카오 계정 연동</span>
                        </div>
                        <span style={{ fontSize: '14px', color: user.provider === 'kakao' ? '#292929' : '#999', fontWeight: user.provider === 'kakao' ? '700' : '500' }}>
                            {user.provider === 'kakao' ? '연동됨' : '미연동'}
                        </span>
                    </button>
                    {kakaoLinkError && (
                        <div style={{ padding: '10px 20px', color: 'red', fontSize: '13px' }}>{kakaoLinkError}</div>
                    )}

                    <button
                        onClick={handleLogout}
                        style={{ width: '100%', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#FF4D4F', transition: 'background 0.2s' }}
                    >
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF1F0' }}>
                            <LogOut size={20} />
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: '600' }}>로그아웃</span>
                    </button>
                </div>

                {/* Delete Account */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                        onClick={handleDeleteAccount}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#adb5bd',
                            fontSize: '13px',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: '4px 8px',
                        }}
                    >
                        회원탈퇴
                    </button>
                </div>

            </div>
        </section>
    )
}
