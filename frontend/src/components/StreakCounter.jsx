/**
 * StreakCounter — small widget showing consecutive days with entries.
 * Pairs the count with a flame icon that scales in colour by streak length.
 */
export default function StreakCounter({ streak = 0 }) {
    const flameColor = streak >= 7
        ? 'text-orange-400'
        : streak >= 3
            ? 'text-amber-400'
            : 'text-white/20'

    return (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl">
            {/* Flame icon */}
            <span className={`text-lg ${flameColor} transition-colors`}>
                🔥
            </span>
            <div>
                <p className="text-xl font-bold text-white leading-none">
                    {streak}
                </p>
                <p className="text-[10px] text-white/25 mt-0.5">
                    day {streak === 1 ? 'streak' : 'streak'}
                </p>
            </div>
        </div>
    )
}
