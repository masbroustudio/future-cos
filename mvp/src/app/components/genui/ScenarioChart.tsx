import { ReasoningTrailPanel, ReasoningTrailProps } from "./ReasoningTrailPanel";

export type ScenarioChartProps = {
  scenario_type: string;
  title: string;
  summary_metrics: Record<string, any>;
  projections: any[];
  reasoning_trail: ReasoningTrailProps;
};

export default function ScenarioChart({
  scenario_type,
  title,
  summary_metrics,
  projections,
  reasoning_trail
}: ScenarioChartProps) {
  
  // Normalize scenario_type so AI variations all map correctly
  const normalizeType = (t: string): "revenue_growth" | "hiring" | "pricing" => {
    const s = (t || "").toLowerCase();
    if (s.includes("hir") || s.includes("headcount") || s.includes("staff")) return "hiring";
    if (s.includes("pric")) return "pricing";
    return "revenue_growth";
  };
  const normalizedType = normalizeType(scenario_type);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper to draw a line chart using plain SVG
  const renderLineChart = (
    data: any[],
    baselineKey: string,
    scenarioKey: string,
    labelKey: string
  ) => {
    if (!data || data.length === 0) return null;

    const width = 500;
    const height = 180;
    const padding = 35;

    // Find min and max for scaling
    const allValues = data.flatMap(d => [d[baselineKey], d[scenarioKey]]);
    const maxVal = Math.max(...allValues, 1) * 1.1; // 10% headroom
    const minVal = Math.min(...allValues, 0) * 0.9;

    const scaleX = (index: number) => {
      return padding + (index / (data.length - 1)) * (width - padding * 2);
    };

    const scaleY = (val: number) => {
      const range = maxVal - minVal;
      return height - padding - ((val - minVal) / range) * (height - padding * 2);
    };

    // Build line path
    let baselinePath = "";
    let scenarioPath = "";

    data.forEach((d, idx) => {
      const x = scaleX(idx);
      const yBase = scaleY(d[baselineKey]);
      const yScen = scaleY(d[scenarioKey]);

      if (idx === 0) {
        baselinePath = `M ${x} ${yBase}`;
        scenarioPath = `M ${x} ${yScen}`;
      } else {
        baselinePath += ` L ${x} ${yBase}`;
        scenarioPath += ` L ${x} ${yScen}`;
      }
    });

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = minVal + ratio * (maxVal - minVal);
            const y = scaleY(val);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(0, 0, 0, 0.05)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding - 5}
                  y={y + 4}
                  fill="#86868b"
                  fontSize="9px"
                  textAnchor="end"
                >
                  {formatCompactValue(val)}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {data.map((d, idx) => {
            if (idx % Math.ceil(data.length / 6) !== 0 && idx !== data.length - 1) return null;
            return (
              <text
                key={idx}
                x={scaleX(idx)}
                y={height - 10}
                fill="#86868b"
                fontSize="9px"
                textAnchor="middle"
              >
                {d[labelKey]}
              </text>
            );
          })}

          {/* Baseline Line (Gray Dotted) */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#86868b"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Scenario Line (Solid Blue) */}
          <path
            d={scenarioPath}
            fill="none"
            stroke="#0071e3"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on scenario line */}
          {data.map((d, idx) => {
            if (idx % Math.ceil(data.length / 4) !== 0 && idx !== data.length - 1) return null;
            return (
              <circle
                key={idx}
                cx={scaleX(idx)}
                cy={scaleY(d[scenarioKey])}
                r="4"
                fill="#0071e3"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  // Helper to draw a bar chart using plain SVG
  const renderBarChart = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const width = 500;
    const height = 180;
    const padding = 35;
    const barWidth = 30;

    const maxVal = Math.max(...data.map(d => d.revenue), 1) * 1.1;

    const scaleX = (index: number) => {
      return padding + (index / (data.length - 1)) * (width - padding * 2 - barWidth);
    };

    const scaleY = (val: number) => {
      return height - padding - (val / maxVal) * (height - padding * 2);
    };

    return (
      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = ratio * maxVal;
            const y = scaleY(val);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="rgba(0, 0, 0, 0.05)"
                  strokeWidth="1"
                />
                <text
                  x={padding - 5}
                  y={y + 4}
                  fill="#86868b"
                  fontSize="9px"
                  textAnchor="end"
                >
                  {formatCompactValue(val)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((d, idx) => {
            const x = scaleX(idx);
            const y = scaleY(d.revenue);
            const isCenter = idx === Math.floor(data.length / 2); // new price step
            return (
              <g key={idx}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height - padding - y}
                  fill={isCenter ? "#0071e3" : "#86868b"}
                  opacity={isCenter ? "1" : "0.5"}
                  rx="4"
                />
                {/* Value Label on top */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  fill="#1d1d1f"
                  fontSize="8px"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {formatCompactValue(d.revenue)}
                </text>
                {/* Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  fill="#86868b"
                  fontSize="9px"
                  textAnchor="middle"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Format big currency into compact readable form (e.g. 150M or 1.2M)
  const formatCompactValue = (val: number) => {
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(1).replace(/\.0$/, "") + "M"; // Milyar
    }
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1).replace(/\.0$/, "") + "Jt"; // Juta
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1).replace(/\.0$/, "") + "Rb"; // Ribu
    }
    return val.toString();
  };

  return (
    <div className="genui-card animate-enter" style={{
      width: "100%",
      backgroundColor: "#FFFFFF",
      border: "1px solid rgba(0, 0, 0, 0.08)",
      borderRadius: "16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      padding: "20px",
      boxSizing: "border-box",
      fontFamily: "var(--font-geist-sans), -apple-system, sans-serif"
    }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h4 style={{ margin: 0, fontWeight: 800, fontSize: "16px", color: "#111113", display: "flex", alignItems: "center", gap: "6px" }}>
          📈 Scenario Copilot: {title}
        </h4>
        <span style={{ 
          fontSize: "10px", 
          color: "#86868b", 
          fontWeight: 700, 
          backgroundColor: "#f5f5f7", 
          padding: "2px 8px", 
          borderRadius: "4px"
        }}>
          WHAT-IF SIMULATION
        </span>
      </div>

      {/* Summary Metrics Grid depending on scenario type */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", 
        gap: "10px",
        marginBottom: "20px" 
      }}>
        {normalizedType === "revenue_growth" && (
          <>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Delta Proyeksi</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: summary_metrics.revenue_delta >= 0 ? "#15A34A" : "#FF3B30", display: "block" }}>
                {summary_metrics.revenue_delta >= 0 ? "+" : ""}{formatCurrency(summary_metrics.revenue_delta)}
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>
                ({Math.round(summary_metrics.revenue_delta_percent * 100)}% kenaikan)
              </span>
            </div>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Revenue Skenario</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#1d1d1f", display: "block" }}>
                {formatCurrency(summary_metrics.total_revenue_scenario)}
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>Proyeksi total</span>
            </div>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Revenue Baseline</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#86868b", display: "block" }}>
                {formatCurrency(summary_metrics.total_revenue_baseline)}
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>Tanpa intervensi</span>
            </div>
          </>
        )}

        {normalizedType === "hiring" && (
          <>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Tambahan Burn Rate</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#FF9500", display: "block" }}>
                +{formatCurrency(summary_metrics.additional_monthly_burn)}/bln
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>
                Burn baru: {formatCurrency(summary_metrics.new_monthly_burn)}
              </span>
            </div>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Runway Skenario</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: summary_metrics.new_runway_months < 6 ? "#FF3B30" : "#1d1d1f", display: "block" }}>
                {summary_metrics.new_runway_months} Bulan
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>
                Baseline: {summary_metrics.baseline_runway_months} bln
              </span>
            </div>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Rencana Break-Even</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#15A34A", display: "block" }}>
                {summary_metrics.break_even_months ? `${summary_metrics.break_even_months} Bulan` : "N/A"}
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>Staf ramp up & productive</span>
            </div>
          </>
        )}

        {normalizedType === "pricing" && (
          <>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Delta Profit Bulanan</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: summary_metrics.profit_change >= 0 ? "#15A34A" : "#FF3B30", display: "block" }}>
                {summary_metrics.profit_change >= 0 ? "+" : ""}{formatCurrency(summary_metrics.profit_change)}
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>Margin baru: {formatCurrency(summary_metrics.new_monthly_profit)}</span>
            </div>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Volume Baru</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#1d1d1f", display: "block" }}>
                {summary_metrics.new_volume} Unit
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>
                ({Math.round(summary_metrics.volume_change_percent * 100)}% elastisitas)
              </span>
            </div>
            <div style={{ border: "1px solid rgba(0, 0, 0, 0.04)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
              <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Revenue Baru</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#1d1d1f", display: "block" }}>
                {formatCurrency(summary_metrics.new_monthly_revenue)}
              </span>
              <span style={{ fontSize: "10px", color: "#86868b" }}>
                Delta: {formatCurrency(summary_metrics.revenue_change)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Chart Section */}
      <div style={{ 
        border: "1px solid rgba(0, 0, 0, 0.05)", 
        borderRadius: "12px", 
        padding: "16px", 
        backgroundColor: "#FCFCFD",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#1d1d1f" }}>
            Visualisasi Grafik Proyeksi (12 Bulan)
          </span>
          {normalizedType !== "pricing" && (
            <div style={{ display: "flex", gap: "12px", fontSize: "10px", fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#86868b" }}>
                <span style={{ display: "inline-block", width: "8px", height: "0", borderTop: "2px dashed #86868b" }}></span>
                Baseline
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0071e3" }}>
                <span style={{ display: "inline-block", width: "8px", height: "0", borderTop: "2px solid #0071e3" }}></span>
                Skenario
              </span>
            </div>
          )}
        </div>

        {normalizedType === "revenue_growth" && renderLineChart(projections, "baseline", "scenario", "month")}
        {normalizedType === "hiring" && renderLineChart(projections, "cash_baseline", "cash_scenario", "month")}
        {normalizedType === "pricing" && renderBarChart(projections)}
      </div>

      {/* Reasoning Trail Panel */}
      <ReasoningTrailPanel trail={reasoning_trail} />

    </div>
  );
}
