/**
 * MoodSparkline — tiny 7-day trend line using recharts.
 * No axes, no grid, no labels — just a clean smooth line and subtle gradient fill.
 */
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

function fmtDay(iso) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
}

function MiniTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    if (d.mood == null) return null
    return (
        <div className="bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1 shadow-xl">
            <p className="text-[9px] text-white/40">{fmtDay(d.date)}</p>
            <p className="text-xs font-bold text-violet-300">{d.mood.toFixed(1)}</p>
        </div>
    )
}

export default function MoodSparkline({ data = [] }) {
    // Filter to only days with data for the line, but keep gaps natural
    const chartData = data.map(d => ({
        date: d.date,
        mood: d.mood,
    }))

    const hasMood = chartData.some(d => d.mood != null)

    if (!hasMood) {
        return (
            <div className="flex items-center justify-center h-full px-4">
                <p className="text-[10px] text-white/15">No mood data yet</p>
            </div>
        )
    }

    return (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
            <p className="text-[10px] text-white/25 mb-2">7-day mood</p>
            <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                        <defs>
                            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<MiniTooltip />} cursor={false} />
                        <Area
                            type="monotone"
                            dataKey="mood"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="url(#sparkGrad)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#8b5cf6', stroke: '#0f0f13', strokeWidth: 2 }}
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
