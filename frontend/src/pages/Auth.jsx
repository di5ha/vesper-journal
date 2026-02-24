import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Auth page — handles both Sign Up and Login in one view.
 * Toggle between modes with the link at the bottom.
 */
export default function Auth() {
    const navigate = useNavigate()
    const [mode, setMode] = useState('login')   // 'login' | 'signup'
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
                // After sign-up, Supabase may require email confirmation.
                // If confirmed automatically (e.g. in dev), onAuthStateChange fires and
                // ProtectedRoute will redirect to /dashboard.
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
        <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center px-4">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <span className="text-3xl font-semibold tracking-tight text-white">
                        ✦ vesper
                    </span>
                    <p className="mt-2 text-sm text-white/40">
                        {isSignup ? 'Begin your reflection journey.' : 'Welcome back.'}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    <h1 className="text-lg font-medium text-white mb-6">
                        {isSignup ? 'Create account' : 'Sign in'}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                            />
                        </div>

                        {/* Error / Info message */}
                        {error && (
                            <p className={`text-xs px-3 py-2 rounded-lg ${error.isInfo
                                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {error.message}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors mt-2"
                        >
                            {loading
                                ? (isSignup ? 'Creating account…' : 'Signing in…')
                                : (isSignup ? 'Create account' : 'Sign in')
                            }
                        </button>
                    </form>
                </div>

                {/* Toggle mode */}
                <p className="mt-6 text-center text-sm text-white/30">
                    {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(null) }}
                        className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                        {isSignup ? 'Sign in' : 'Sign up'}
                    </button>
                </p>
            </div>
        </div>
    )
}
