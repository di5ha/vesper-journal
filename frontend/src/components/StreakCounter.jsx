export default function StreakCounter({ streak = 0 }) {
    const flameColor = streak >= 7 ? 'text-accent' : streak >= 3 ? 'text-accent-deep' : 'text-muted'
    return (
        <div className="flex items-center gap-3 border border-grey px-4 py-3">
            <span className={`text-xl ${flameColor}`}>🔥</span>
            <div>
                <p className="text-2xl font-bold text-ink leading-none">{streak}</p>
                <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mt-0.5">day streak</p>
            </div>
        </div>
    )
}
