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
        <div className="min-h-screen bg-surface flex">
            {/* ── Left panel — Redo-style hero gradient ── */}
            <div
                className="hidden lg:flex flex-col w-[440px] shrink-0 p-10 justify-between"
                style={{ background: 'linear-gradient(160deg, #FA9819 0%, #B6C9CF 45%, #1E3D59 100%)' }}
            >
                {/* Logo */}
                <span className="text-white font-bold text-2xl tracking-tight">
                    ✦ vesper
                </span>

                {/* Headline */}
                <div>
                    <p className="text-white/60 text-sm font-medium mb-3 uppercase tracking-widest">Your Journal</p>
                    <h1 className="font-serif text-white text-4xl leading-snug">
                        Write, reflect,<br />and understand<br />yourself better.
                    </h1>
                </div>

                {/* Feature list */}
                <div className="space-y-4">
                    {[
                        'AI-powered mood & theme analysis',
                        'Emotional drift timeline',
                        'Weekly insight reports',
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            <span className="text-white/80 text-sm">{f}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right panel — form ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-surface">
                {/* Mobile logo */}
                <span className="lg:hidden font-bold text-ink text-2xl mb-10 self-start">✦ vesper</span>

                <div className="w-full max-w-sm">
                    {/* Section heading — Redo style */}
                    <div className="mb-8">
                        <span className="text-accent font-bold text-sm">
                            {isSignup ? '01' : '01'}
                        </span>
                        <h2 className="text-3xl font-bold text-ink mt-0.5">
                            {isSignup ? 'Create account' : 'Sign in'}
                        </h2>
                        <p className="text-muted text-sm mt-2">
                            {isSignup ? 'Begin your reflection journey.' : 'Continue your journaling practice.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-surface border border-grey rounded-none px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-ink mb-2 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-surface border border-grey rounded-none px-4 py-3 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </div>

                        {/* Error / info */}
                        {error && (
                            <p className={`text-xs px-3 py-2.5 ${error.isInfo
                                    ? 'bg-sky text-navy border border-baby-blue'
                                    : 'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                {error.message}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent hover:bg-accent-deep disabled:opacity-50 text-white font-semibold text-sm px-4 py-3.5 transition-colors mt-2"
                        >
                            {loading
                                ? (isSignup ? 'Creating account…' : 'Signing in…')
                                : (isSignup ? 'Join for free' : 'Sign in')
                            }
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="mt-6 text-sm text-muted">
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(null) }}
                            className="text-accent font-semibold hover:text-accent-deep transition-colors"
                        >
                            {isSignup ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
