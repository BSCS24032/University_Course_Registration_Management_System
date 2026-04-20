/**
 * Pure-SVG bar chart. Expects `data` = [{ label, value }].
 * Scales bars proportionally to the largest value.
 * Height and color are configurable via props.
 */
const BarChart = ({ data = [], height = 220, color = '#1a3a6e', valueFormatter = (v) => v }) => {
    if (!data.length) {
        return <div className="empty-state"><em>No data to display.</em></div>;
    }
    const max = Math.max(...data.map(d => Number(d.value) || 0), 1);
    const barHeight = 24;
    const gap = 8;
    const labelWidth = 180;
    const chartWidth = 420;
    const svgHeight = Math.max(height, data.length * (barHeight + gap) + 20);

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${labelWidth + chartWidth + 10} ${svgHeight}`}
            preserveAspectRatio="xMinYMin meet"
            style={{ display: 'block' }}
        >
            {data.map((d, i) => {
                const y = 10 + i * (barHeight + gap);
                const w = ((Number(d.value) || 0) / max) * chartWidth;
                return (
                    <g key={i}>
                        <text
                            x={labelWidth - 10}
                            y={y + barHeight / 2 + 4}
                            textAnchor="end"
                            fontSize="12"
                            fill="#333"
                        >
                            {d.label}
                        </text>
                        <rect
                            x={labelWidth}
                            y={y}
                            width={Math.max(w, 1)}
                            height={barHeight}
                            fill={color}
                            rx={3}
                        />
                        <text
                            x={labelWidth + w + 6}
                            y={y + barHeight / 2 + 4}
                            fontSize="12"
                            fill="#333"
                        >
                            {valueFormatter(d.value)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

export default BarChart;
