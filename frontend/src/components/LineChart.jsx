/** Pure-SVG line chart. `data` = [{ label, value }]. */
const LineChart = ({ data = [], height = 200, color = '#1a3a6e' }) => {
    if (data.length < 2) {
        return <div className="empty-state"><em>Not enough data to draw a trend.</em></div>;
    }
    const W = 560, H = height;
    const padL = 40, padR = 20, padT = 15, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const max = Math.max(...data.map(d => Number(d.value) || 0), 1);
    const min = Math.min(...data.map(d => Number(d.value) || 0), 0);
    const span = max - min || 1;

    const x = (i) => padL + (i * chartW) / (data.length - 1);
    const y = (v) => padT + chartH - ((v - min) / span) * chartH;

    const pathD = data.map((d, i) =>
        `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.value)}`
    ).join(' ');

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => padT + chartH * t);

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMinYMin meet"
            style={{ display: 'block' }}
        >
            {gridLines.map((gy, i) => (
                <line
                    key={i}
                    x1={padL} y1={gy} x2={W - padR} y2={gy}
                    stroke="#eee" strokeWidth="1"
                />
            ))}
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" />
            {data.map((d, i) => (
                <g key={i}>
                    <circle cx={x(i)} cy={y(d.value)} r="4" fill={color} />
                    <text x={x(i)} y={H - 10} fontSize="11" textAnchor="middle" fill="#666">
                        {d.label}
                    </text>
                    <text
                        x={x(i)}
                        y={y(d.value) - 10}
                        fontSize="11"
                        textAnchor="middle"
                        fill="#333"
                        fontWeight="600"
                    >
                        {d.value}
                    </text>
                </g>
            ))}
            <text x={padL - 8} y={padT + 4} fontSize="10" textAnchor="end" fill="#888">
                {max}
            </text>
            <text x={padL - 8} y={H - padB} fontSize="10" textAnchor="end" fill="#888">
                {min}
            </text>
        </svg>
    );
};

export default LineChart;
