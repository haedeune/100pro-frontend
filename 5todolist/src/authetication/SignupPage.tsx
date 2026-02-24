import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuthStore } from './authStore'

const schema = z.object({
    name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
    email: z.email('올바른 이메일 형식을 입력해주세요.'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
})

type SignupFormValues = z.infer<typeof schema>

export function SignupPage() {
    const navigate = useNavigate()
    const signup = useAuthStore((state) => state.signup)
    const [signupError, setSignupError] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', email: '', password: '' },
    })

    const onSubmit = async (data: SignupFormValues) => {
        setSignupError('')
        const result = await signup({
            name: data.name,
            email: data.email,
            password: data.password,
        })

        if (result.ok) {
            alert('회원가입이 완료되었습니다. 로그인해주세요.')
            navigate('/login', { replace: true })
        } else {
            setSignupError(result.reason || '회원가입에 실패했습니다.')
        }
    }

    return (
        <section className="screen login-screen">
            <header className="screen-header login-hero">
                <h1>회원가입</h1>
                <p>계정을 만들고 모든 서비스를 이용해보세요</p>
            </header>

            <div className="login-panel">
                <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                    <label>
                        Name
                        <input id="name" type="text" {...register('name')} />
                        {errors.name ? <span className="error-text">{errors.name.message}</span> : null}
                    </label>
                    <label>
                        Email
                        <input id="email" type="email" {...register('email')} />
                        {errors.email ? <span className="error-text">{errors.email.message}</span> : null}
                    </label>
                    <label>
                        Password
                        <input id="password" type="password" {...register('password')} />
                        {errors.password ? (
                            <span className="error-text">{errors.password.message}</span>
                        ) : null}
                        {signupError ? <span className="error-text">{signupError}</span> : null}
                    </label>
                    <button type="submit" className="login-submit">
                        Sign Up
                    </button>
                    <div className="login-signup-row" style={{ marginTop: '1rem' }}>
                        <span>이미 계정이 있으신가요?</span>
                        <button type="button" className="link-button login-signup-button" onClick={() => navigate('/login')}>
                            로그인
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}
