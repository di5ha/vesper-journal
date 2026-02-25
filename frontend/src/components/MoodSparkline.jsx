import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

function fmtDay(iso) { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }) }

function MiniTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    if (d.mood == null) return null
    return (
        <div className="bg-white/90 backdrop-blur border border-[rgba(17,17,17,0.08)] rounded-xl px-2.5 py-2 shadow-md">
            <p className="text-[9px] text-[rgba(17,17,17,0.4)] font-semibold uppercase tracking-wider">{fmtDay(d.date)}</p>
            <p className="text-xs font-extrabold text-[#111111]" style={{ letterSpacing: '-0.03em' }}>{d.mood.toFixed(1)}</p>
        </div>
    )
}

export default function MoodSparkline({ data = [] }) {
    const hasMood = data.some(d => d.mood != null)
    if (!hasMood) {
        return (
            <div className="flex items-center justify-center bg-white border border-[rgba(17,17,17,0.08)] rounded-xl px-4 py-3 shadow-[0_1px_8px_rgba(17,17,17,0.05)]">
                <p className="text-[10px] text-[rgba(17,17,17,0.4)] font-semibold">No mood data yet</p>
            </div>
        )
    }
    return (
        <div className="bg-white border border-[rgba(17,17,17,0.08)] rounded-xl px-4 py-3 shadow-[0_1px_8px_rgba(17,17,17,0.05)]">
            <p className="text-[10px] text-[rgba(17,17,17,0.45)] font-semibold uppercase tracking-wider mb-2">7-day mood</p>
            <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                        <defs>
                            <linearGradient id="sparkGradAM" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#B68DFF" stopOpacity={0.03} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<MiniTooltip />} cursor={false} />
                        <Area
                            type="monotone" dataKey="mood"
                            stroke="#FF6B4A" strokeWidth={2}
                            fill="url(#sparkGradAM)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#FF6B4A', stroke: '#FFFFFF', strokeWidth: 2 }}
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
