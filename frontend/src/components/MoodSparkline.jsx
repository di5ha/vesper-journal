import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

function fmtDay(iso) { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' }) }

function MiniTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    if (d.mood == null) return null
    return (
        <div className="bg-surface border border-grey px-2 py-1.5 shadow-md">
            <p className="text-[9px] text-muted font-semibold uppercase tracking-wider">{fmtDay(d.date)}</p>
            <p className="text-xs font-bold text-ink">{d.mood.toFixed(1)}</p>
        </div>
    )
}

export default function MoodSparkline({ data = [] }) {
    const hasMood = data.some(d => d.mood != null)
    if (!hasMood) {
        return (
            <div className="flex items-center justify-center px-4 py-3 border border-grey">
                <p className="text-[10px] text-muted font-semibold">No mood data yet</p>
            </div>
        )
    }
    return (
        <div className="border border-grey px-4 py-3">
            <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-2">7-day mood</p>
            <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                        <defs>
                            <linearGradient id="sparkGradRedo" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FA9819" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#FA9819" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<MiniTooltip />} cursor={false} />
                        <Area
                            type="monotone" dataKey="mood"
                            stroke="#FA9819" strokeWidth={2}
                            fill="url(#sparkGradRedo)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#FA9819', stroke: '#FFFFFF', strokeWidth: 2 }}
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
