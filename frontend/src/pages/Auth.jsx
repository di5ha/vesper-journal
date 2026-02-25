import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Auth() {
    const navigate = useNavigate()
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                setError({ message: 'Check your email to confirm your account.', isInfo: true })
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                navigate('/dashboard')
            }
        } catch (err) {
            setError({ message: err.message })
        } finally {
            setLoading(false)
        }
    }

    const isSignup = mode === 'signup'

    return (
        <div className="relative min-h-screen bg-[#F6F5F3] flex items-center justify-center overflow-hidden px-6 py-12">
            {/* Blobs — matching amplemarket hero */}
            <div className="blob-orange w-[480px] h-[480px] -left-40 bottom-0 pointer-events-none" />
            <div className="blob-purple w-[400px] h-[400px] right-10 bottom-20 pointer-events-none" />

            {/* Glassmorphism card */}
            <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-[rgba(17,17,17,0.10)] rounded-2xl p-10 shadow-[0_8px_48px_rgba(17,17,17,0.08)]">
                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-10">
                    <div className="w-7 h-7 bg-[#111111] rounded-md flex items-center justify-center">
                        <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white">
                            <path d="M10 2L3 7.5V18h5.5v-5h3v5H18V7.5L10 2z" />
                        </svg>
                    </div>
                    <span className="font-extrabold text-[#111111] tracking-tight text-lg">vesper</span>
                </div>

                {/* Heading */}
                <h1 className="heading-tight text-3xl text-[#111111] mb-1">
                    {isSignup ? 'Create your account' : 'Welcome back'}
                </h1>
                <p className="text-sm text-[rgba(17,17,17,0.55)] mb-8">
                    {isSignup ? 'Start your reflection journey today.' : 'Continue your journaling practice.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#111111] uppercase tracking-wide">Email</label>
                        <input
                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="h-12 bg-white border border-[rgba(17,17,17,0.15)] rounded-lg px-4 text-sm text-[#111111] placeholder-[rgba(17,17,17,0.35)] focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors"
                        />
                    </div>
                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#111111] uppercase tracking-wide">Password</label>
                        <input
                            type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 bg-white border border-[rgba(17,17,17,0.15)] rounded-lg px-4 text-sm text-[#111111] placeholder-[rgba(17,17,17,0.35)] focus:outline-none focus:border-[#111111] focus:ring-0 transition-colors"
                        />
                    </div>

                    {/* Error / info */}
                    {error && (
                        <p className={`text-xs rounded-lg px-3 py-2.5 leading-relaxed ${error.isInfo
                                ? 'bg-[#F0F7FF] text-[#4A90E2] border border-[#4A90E2]/20'
                                : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                            {error.message}
                        </p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit" disabled={loading}
                        className="w-full h-12 mt-1 bg-[#111111] hover:bg-[#2a2a2a] disabled:opacity-40 text-white font-semibold text-sm rounded-lg transition-colors"
                    >
                        {loading
                            ? (isSignup ? 'Creating account…' : 'Signing in…')
                            : (isSignup ? 'Get started free' : 'Sign in')
                        }
                    </button>
                </form>

                <p className="mt-6 text-sm text-[rgba(17,17,17,0.55)] text-center">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(null) }}
                        className="text-[#111111] font-semibold underline underline-offset-2 hover:text-[#FF6B4A] transition-colors"
                    >
                        {isSignup ? 'Log in' : 'Sign up'}
                    </button>
                </p>
            </div>
        </div>
    )
}
