import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Loader2, PenLine, Lock, BarChart2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Auth page: 3 views — landing / login / signup ───────────────────────────
export default function Auth() {
    const [view, setView] = useState('landing') // 'landing' | 'login' | 'signup'

    return (
        <div style={{ position: 'relative', minHeight: '100svh', background: 'oklch(0.975 0.005 75)', overflow: 'hidden' }}>

            {/* Blob background */}
            <div className="blob-scene">
                <div className="blob blob-teal" style={{ width: '620px', height: '620px', top: '-20%', left: '-12%' }} />
                <div className="blob blob-sage" style={{ width: '560px', height: '560px', bottom: '-12%', right: '-8%' }} />
                <div className="blob blob-amber" style={{ width: '380px', height: '380px', bottom: '5%', left: '30%' }} />
                <div className="blob blob-blush" style={{ width: '460px', height: '460px', top: '-5%', right: '22%' }} />
                <div className="blob blob-deep" style={{ width: '700px', height: '700px', top: '30%', left: '42%' }} />
            </div>

            {/* ── Nav ─────────────────────────────────────────────────────────── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 30,
                background: 'rgba(253,251,248,0.80)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(200,195,185,0.45)',
            }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '72px' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={28} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-foreground)' }}>vesper</span>
                    </div>

                    {/* Nav actions */}
                    {view === 'landing' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button onClick={() => setView('login')}
                                style={{ background: 'none', border: 'none', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-foreground)', borderRadius: '0.5rem', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-muted)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                Sign in
                            </button>
                            <button onClick={() => setView('signup')} className="btn-primary"
                                style={{ padding: '0.4rem 1.125rem', borderRadius: '9999px', fontSize: '0.9375rem' }}>
                                Get started
                            </button>
                        </div>
                    )}
                    {view !== 'landing' && (
                        <button onClick={() => setView('landing')}
                            style={{ background: 'none', border: 'none', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-muted-fg)', borderRadius: '0.5rem' }}>
                            ← Back
                        </button>
                    )}
                </div>
            </header>

            {/* ── Main content ─────────────────────────────────────────────────── */}
            <main style={{ position: 'relative', zIndex: 1, maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem 6rem' }}>

                {view === 'landing' && <LandingContent onLogin={() => setView('login')} onSignup={() => setView('signup')} />}

                {view !== 'landing' && (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
                        <div style={{ width: '100%', maxWidth: '22rem' }}>
                            {view === 'login' && <LoginCard onSignup={() => setView('signup')} />}
                            {view === 'signup' && <SignupCard onLogin={() => setView('login')} />}
                        </div>
                    </div>
                )}
            </main>

            {/* ── Footer ───────────────────────────────────────────────────────── */}
            {view === 'landing' && (
                <footer style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '1.25rem', borderTop: '1px solid rgba(200,195,185,0.4)', background: 'rgba(253,251,248,0.55)', backdropFilter: 'blur(12px)' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                        vesper — your personal journaling space
                    </p>
                </footer>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Landing content — Inkwell-inspired full-page layout
// ─────────────────────────────────────────────────────────────────────────────
function LandingContent({ onLogin, onSignup }) {
    const features = [
        {
            Icon: BarChart2,
            title: 'Drift Timeline',
            desc: 'Pick any topic and watch your emotional relationship with it change over weeks and months — a visual journey through your mind.',
        },
        {
            Icon: PenLine,
            title: 'Real-time AI Analysis',
            desc: 'Every entry is analysed for mood, recurring themes, and cognitive patterns using a CBT framework — automatically, as you write.',
        },
        {
            Icon: Lock,
            title: 'Semantic Search',
            desc: 'Find any memory or feeling with meaning-based search. Ask "show me entries where I felt hopeful" and actually get them.',
        },
    ]

    return (
        <>
            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section style={{ textAlign: 'center', padding: '3rem 1rem 3rem' }}>
                {/* Headline */}
                <h1 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: 'var(--color-foreground)',
                    margin: '0 auto 2rem',
                    maxWidth: '28rem',
                    letterSpacing: '-0.02em',
                }}>
                    A quiet space for<br />your thoughts
                </h1>

                {/* Illustration — directly below headline */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '220px', height: '220px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'rgba(253,251,248,0.70)',
                        backdropFilter: 'blur(16px)',
                        boxShadow: '0 12px 60px rgba(0,0,0,0.10), 0 0 0 1px rgba(200,195,185,0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img
                            src="/journal-hero.png"
                            alt="Woman journaling at desk"
                            style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                        />
                    </div>
                </div>

                {/* Tagline from PRD */}
                <p style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    color: 'var(--color-muted-fg)',
                    fontStyle: 'italic',
                    margin: '0 auto 0.5rem',
                    maxWidth: '20rem',
                    letterSpacing: '0.01em',
                }}>
                    &#8220;Your mind is changing. Watch it happen.&#8221;
                </p>

                <p style={{
                    fontSize: '1.0625rem',
                    color: 'var(--color-muted-fg)',
                    lineHeight: 1.7,
                    maxWidth: '26rem',
                    margin: '0.75rem auto 2.25rem',
                }}>
                    Write daily. Your AI journal analyses mood, surfaces patterns,
                    and shows how your thinking evolves — entry by entry.
                </p>

                {/* CTA buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                    <button onClick={onSignup} className="btn-primary"
                        style={{ padding: '0.75rem 1.75rem', borderRadius: '9999px', fontSize: '1rem', fontWeight: 600 }}>
                        Start journaling
                    </button>
                    <button onClick={onLogin}
                        style={{ padding: '0.75rem 1.75rem', borderRadius: '9999px', border: '1.5px solid rgba(180,175,165,0.7)', background: 'rgba(253,251,248,0.75)', backdropFilter: 'blur(12px)', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: 'var(--color-foreground)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(253,251,248,0.95)'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,251,248,0.75)'; e.currentTarget.style.borderColor = 'rgba(180,175,165,0.7)' }}>
                        Sign in
                    </button>
                </div>
            </section>

            {/* ── Feature cards ────────────────────────────────────────────── */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                padding: '0.5rem 0 2rem',
            }}>
                {features.map(({ Icon, title, desc }) => (
                    <div key={title} style={{
                        borderRadius: '1.25rem',
                        padding: '2rem 1.5rem',
                        background: 'rgba(253,251,248,0.72)',
                        backdropFilter: 'blur(20px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
                        border: '1px solid rgba(200,195,185,0.45)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        textAlign: 'center',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        cursor: 'default',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 40px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
                        <div style={{
                            width: '2.75rem', height: '2.75rem',
                            background: 'oklch(0.50 0.10 170 / 0.10)',
                            borderRadius: '0.875rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                        }}>
                            <Icon size={20} color="var(--color-primary)" />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.625rem', color: 'var(--color-foreground)' }}>{title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
                    </div>
                ))}
            </section>
        </>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Card
// ─────────────────────────────────────────────────────────────────────────────
function LoginCard({ onSignup }) {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Brand */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--color-foreground)' }}>Welcome back</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>Sign in to your journal</p>
            </div>

            {/* Form card */}
            <div style={{ borderRadius: '1.25rem', padding: '1.75rem', background: 'rgba(253,251,248,0.88)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: '1px solid rgba(200,195,185,0.45)', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
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
                        {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</> : 'Sign in'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                        Don't have an account?{' '}
                        <button type="button" onClick={onSignup}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            Sign up
                        </button>
                    </p>
                </form>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-up Card
// ─────────────────────────────────────────────────────────────────────────────
function SignupCard({ onLogin }) {
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
            <div style={{ borderRadius: '1.25rem', padding: '2.5rem 2rem', background: 'rgba(253,251,248,0.88)', backdropFilter: 'blur(24px) saturate(1.4)', border: '1px solid rgba(200,195,185,0.45)', boxShadow: '0 8px 40px rgba(0,0,0,0.09)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={24} color="var(--color-primary)" />
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Brand */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--color-foreground)' }}>Create account</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>Start your journaling journey</p>
            </div>

            {/* Form card */}
            <div style={{ borderRadius: '1.25rem', padding: '1.75rem', background: 'rgba(253,251,248,0.88)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: '1px solid rgba(200,195,185,0.45)', boxShadow: '0 8px 40px rgba(0,0,0,0.09)' }}>
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
                        {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : 'Create account'}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                        Already have an account?{' '}
                        <button type="button" onClick={onLogin}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            Sign in
                        </button>
                    </p>
                </form>
            </div>
        </div>
    )
}
