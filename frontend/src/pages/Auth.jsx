import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Auth page: 3 views — landing / login / signup ───────────────────────────

export default function Auth() {
    const [view, setView] = useState('landing') // 'landing' | 'login' | 'signup'

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6"
            style={{ background: 'var(--color-background)' }}>
            <div className="w-full max-w-sm">
                {view === 'landing' && <LandingCard onLogin={() => setView('login')} onSignup={() => setView('signup')} />}
                {view === 'login' && <LoginCard onSignup={() => setView('signup')} onBack={() => setView('landing')} />}
                {view === 'signup' && <SignupCard onLogin={() => setView('login')} onBack={() => setView('landing')} />}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing Card (matches the V0 screenshot exactly)
// ─────────────────────────────────────────────────────────────────────────────
function LandingCard({ onLogin, onSignup }) {
    return (
        <div style={{ borderRadius: '1.5rem', overflow: 'hidden', background: 'var(--color-card)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Illustration */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 2rem 0' }}>
                <div style={{ width: '224px', height: '224px', overflow: 'hidden' }}>
                    <img
                        src="/journal-hero.png"
                        alt="Woman journaling at desk"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>
            </div>

            {/* Text + Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 2rem 2.5rem', textAlign: 'center' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--color-foreground)', margin: '0 0 2rem' }}>
                    Start keeping track of your{' '}
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                        <span style={{ position: 'relative', zIndex: 1 }}>life</span>
                        <span style={{
                            position: 'absolute', inset: '-1px -6px 0',
                            bottom: 0, height: '40%', zIndex: 0,
                            background: 'oklch(0.50 0.10 170 / 0.18)',
                            borderRadius: '3px'
                        }} />
                    </span>
                </h1>

                <button className="btn-primary" style={{ width: '100%', marginBottom: '1.25rem', fontSize: '1rem' }}
                    onClick={onSignup}>
                    Join for free
                </button>

                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                    Already have an account?{' '}
                    <button onClick={onLogin}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, color: 'var(--color-foreground)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                        Log in
                    </button>
                </p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Card
// ─────────────────────────────────────────────────────────────────────────────
function LoginCard({ onSignup, onBack }) {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true); setError(null)
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            navigate('/dashboard')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                    <BookOpen size={32} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>Welcome back to your journal</p>
            </div>

            {/* Form card */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="label" htmlFor="email">Email</label>
                        <input id="email" type="email" className="input" placeholder="you@example.com"
                            required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" htmlFor="password">Password</label>
                        <input id="password" type="password" className="input"
                            required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    {error && <p style={{ fontSize: '0.875rem', color: 'var(--color-destructive)', margin: 0 }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : 'Sign in'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                        Don't have an account?{' '}
                        <button type="button" onClick={onSignup}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            Sign up
                        </button>
                    </p>
                </form>
            </div>

            <button onClick={onBack} className="btn-ghost" style={{ margin: '0 auto' }}>← Back</button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-up Card
// ─────────────────────────────────────────────────────────────────────────────
function SignupCard({ onLogin, onBack }) {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (password !== confirm) { setError('Passwords do not match'); return }
        setLoading(true); setError(null)
        try {
            const { error } = await supabase.auth.signUp({
                email, password,
                options: { emailRedirectTo: `${window.location.origin}/dashboard` },
            })
            if (error) throw error
            setDone(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={24} color='var(--color-primary)' />
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Check your email</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', lineHeight: 1.6, margin: 0 }}>
                    We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                </p>
                <button onClick={onLogin} className="btn-primary" style={{ marginTop: '0.5rem' }}>Back to sign in</button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                    <BookOpen size={32} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>Create your personal journal</p>
            </div>

            {/* Form card */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label className="label" htmlFor="su-email">Email</label>
                        <input id="su-email" type="email" className="input" placeholder="you@example.com"
                            required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" htmlFor="su-password">Password</label>
                        <input id="su-password" type="password" className="input"
                            required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" htmlFor="su-confirm">Confirm password</label>
                        <input id="su-confirm" type="password" className="input"
                            required value={confirm} onChange={e => setConfirm(e.target.value)} />
                    </div>
                    {error && <p style={{ fontSize: '0.875rem', color: 'var(--color-destructive)', margin: 0 }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : 'Create account'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                        Already have an account?{' '}
                        <button type="button" onClick={onLogin}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, color: 'var(--color-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            Sign in
                        </button>
                    </p>
                </form>
            </div>

            <button onClick={onBack} className="btn-ghost" style={{ margin: '0 auto' }}>← Back</button>
        </div>
    )
}
