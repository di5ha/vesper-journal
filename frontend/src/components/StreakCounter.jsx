export default function StreakCounter({ streak = 0 }) {
    const flameColor = streak >= 7 ? 'text-[#FF6B4A]' : streak >= 3 ? '#FFD25A' : 'text-[rgba(17,17,17,0.3)]'
    return (
        <div className="flex items-center gap-3 bg-white border border-[rgba(17,17,17,0.08)] rounded-xl px-4 py-3 shadow-[0_1px_8px_rgba(17,17,17,0.05)]">
            <span className={`text-xl ${streak >= 3 ? 'text-[#FF6B4A]' : 'text-[rgba(17,17,17,0.3)]'}`}>🔥</span>
            <div>
                <p className="text-2xl font-extrabold text-[#111111] leading-none" style={{ letterSpacing: '-0.04em' }}>{streak}</p>
                <p className="text-[10px] text-[rgba(17,17,17,0.45)] font-semibold uppercase tracking-wide mt-0.5">day streak</p>
            </div>
        </div>
    )
}
