"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export const PALETTE = ["#0a84ff", "#ff9f0a", "#30d158", "#bf5af2", "#ff375f", "#64d2ff", "#ffd60a", "#ac8e68", "#5e5ce6", "#8e8e93"];

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTHS[(month || 1) - 1] ?? ""} ${String(year ?? "").slice(2)}`.trim();
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("tr-TR");
}

export function formatMoney(value: number): string {
  return `₺${Math.round(value).toLocaleString("tr-TR")}`;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} Mr`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} Mn`;
  if (abs >= 10_000) return `${Math.round(value / 1000).toLocaleString("tr-TR")} B`;
  return formatNumber(value);
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const raw = value / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const steps = power >= 10 ? [1, 2, 2.5, 3, 4, 5, 10] : [1, 2, 3, 4, 5, 10];
  const step = (steps.find((candidate) => candidate * power >= raw) ?? 10) * power;
  return Math.max(4, step * 4);
}

export function ChartCard({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="glass-card glass-chart-card">
      <div className="glass-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p className="glass-muted glass-chart-sub">{subtitle}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export type Slice = { label: string; value: number };

export function Donut({ data, total, empty = "Veri yok." }: { data: Slice[]; total?: string; empty?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const rows = data.filter((row) => row.value > 0);
  const sum = rows.reduce((acc, row) => acc + row.value, 0);
  if (sum === 0) {
    return <div className="glass-chart-empty">{empty}</div>;
  }
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const gap = rows.length > 1 ? 2.5 : 0;
  let offset = 0;
  const shown = active === null ? null : rows[active];
  return (
    <div className="glass-donut">
      <svg viewBox="0 0 180 180" role="img" aria-label={rows.map((row) => `${row.label} ${row.value}`).join(", ")}>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(120,120,128,0.1)" strokeWidth="22" />
        {rows.map((row, index) => {
          const length = (row.value / sum) * circumference;
          const dash = Math.max(0.5, length - gap);
          const node = (
            <circle
              key={row.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={PALETTE[index % PALETTE.length]}
              strokeWidth={active === index ? 26 : 22}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
              opacity={active === null || active === index ? 1 : 0.35}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            />
          );
          offset += length;
          return node;
        })}
        <text x="90" y="86" textAnchor="middle" className="glass-donut-value">
          {shown ? formatNumber(shown.value) : total ?? formatNumber(sum)}
        </text>
        <text x="90" y="106" textAnchor="middle" className="glass-donut-label">
          {shown ? `%${Math.round((shown.value / sum) * 100)}` : "Toplam"}
        </text>
      </svg>
      <ul className="glass-legend">
        {rows.map((row, index) => (
          <li key={row.label} data-active={active === index} onPointerEnter={() => setActive(index)} onPointerLeave={() => setActive(null)}>
            <i style={{ background: PALETTE[index % PALETTE.length] }} />
            <span>{row.label}</span>
            <strong>{formatNumber(row.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type Series = { name: string; color: string; values: number[] };

export function ComboChart({
  labels,
  bars = [],
  lines = [],
  area = false,
  height = 240,
  format = formatCompact,
  lineFormat = formatCompact,
  tooltipFormat = formatNumber,
  lineTooltipFormat = formatNumber,
}: {
  labels: string[];
  bars?: Series[];
  lines?: Series[];
  area?: boolean;
  height?: number;
  format?: (value: number) => string;
  lineFormat?: (value: number) => string;
  tooltipFormat?: (value: number) => string;
  lineTooltipFormat?: (value: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const dual = bars.length > 0 && lines.length > 0;
  const leftValues = (bars.length > 0 ? bars : lines).flatMap((series) => series.values);
  const rightValues = lines.flatMap((series) => series.values);
  const leftMax = niceMax(Math.max(0, ...leftValues));
  const rightMax = niceMax(Math.max(0, ...rightValues));
  const allZero = [...leftValues, ...rightValues].every((value) => value === 0);
  const pad = { top: 14, right: dual ? 48 : 14, bottom: 28, left: 48 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const step = labels.length > 0 ? innerW / labels.length : 0;
  const x = (index: number) => pad.left + step * index + step / 2;
  const yLeft = (value: number) => pad.top + innerH - (value / leftMax) * innerH;
  const yRight = (value: number) => pad.top + innerH - (value / (dual ? rightMax : leftMax)) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const barGroup = Math.min(42, step * 0.62);
  const barWidth = bars.length > 0 ? barGroup / bars.length : 0;
  const every = width < 420 ? Math.ceil(labels.length / 4) : width < 640 ? 2 : 1;

  return (
    <div ref={ref} className="glass-chart" style={{ minHeight: height }} onPointerLeave={() => setHover(null)}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={[...bars, ...lines].map((series) => series.name).join(", ")}>
          {ticks.map((tick) => {
            const y = pad.top + innerH - tick * innerH;
            return (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className="glass-grid-line" />
                <text x={pad.left - 8} y={y + 4} textAnchor="end" className="glass-axis">{format(tick * leftMax)}</text>
                {dual ? <text x={width - pad.right + 8} y={y + 4} className="glass-axis">{lineFormat(tick * rightMax)}</text> : null}
              </g>
            );
          })}
          {hover !== null ? <rect x={pad.left + step * hover} y={pad.top} width={step} height={innerH} rx="8" className="glass-hover-band" /> : null}
          {bars.map((series, seriesIndex) => series.values.map((value, index) => {
            const top = yLeft(value);
            const h = Math.max(0, pad.top + innerH - top);
            return (
              <rect
                key={`${series.name}-${index}`}
                x={x(index) - barGroup / 2 + seriesIndex * barWidth + 1}
                y={top}
                width={Math.max(1, barWidth - 2)}
                height={h}
                rx={Math.min(6, barWidth / 3)}
                fill={series.color}
                className="glass-bar"
                style={{ animationDelay: `${index * 30}ms` }}
              />
            );
          }))}
          {lines.map((series) => {
            const points = series.values.map((value, index) => `${x(index)},${yRight(value)}`);
            const path = `M${points.join(" L")}`;
            const fillPath = `${path} L${x(series.values.length - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`;
            return (
              <g key={series.name}>
                {area ? <path d={fillPath} fill={series.color} opacity="0.12" /> : null}
                <path d={path} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="glass-line" />
                {series.values.map((value, index) => (
                  <circle key={index} cx={x(index)} cy={yRight(value)} r={hover === index ? 4.5 : 0} fill="#fff" stroke={series.color} strokeWidth="2" />
                ))}
              </g>
            );
          })}
          {labels.map((label, index) => (index % every === 0 ? (
            <text key={label + index} x={x(index)} y={height - 8} textAnchor="middle" className="glass-axis">{label}</text>
          ) : null))}
          {labels.map((label, index) => (
            <rect key={`hit-${label}-${index}`} x={pad.left + step * index} y={0} width={step} height={height} fill="transparent" onPointerEnter={() => setHover(index)} onPointerDown={() => setHover(index)} />
          ))}
        </svg>
      ) : null}
      {allZero && width > 0 ? <div className="glass-chart-overlay" style={{ height }}>Henüz veri yok.</div> : null}
      {hover !== null && width > 0 ? (
        <div className="glass-tooltip" style={{ left: Math.min(Math.max(x(hover), 90), width - 90), top: 4 }}>
          <strong>{labels[hover]}</strong>
          {bars.map((series) => (
            <span key={series.name}><i style={{ background: series.color }} />{series.name}<b>{tooltipFormat(series.values[hover] ?? 0)}</b></span>
          ))}
          {lines.map((series) => (
            <span key={series.name}><i style={{ background: series.color }} />{series.name}<b>{lineTooltipFormat(series.values[hover] ?? 0)}</b></span>
          ))}
        </div>
      ) : null}
      <div className="glass-chart-keys">
        {[...bars, ...lines].map((series) => (
          <span key={series.name}><i style={{ background: series.color }} />{series.name}</span>
        ))}
      </div>
    </div>
  );
}
