import { ReasoningTrailPanel, ReasoningTrailProps } from "./ReasoningTrailPanel";

export type HighlightItem = {
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
};

export type FinancialMetrics = {
  revenue: number;
  revenueTarget?: number;
  revenueTrend?: number; // percentage delta (e.g. 0.03 for +3%)
  cashBalance: number;
  cashRunwayMonths: number;
  monthlyBurn: number;
};

export type AgendaItem = {
  time: string;
  title: string;
  attendees: string[];
  isImportant: boolean;
  preparationNote?: string;
};

export type BriefingCardProps = {
  highlights: HighlightItem[];
  metrics: FinancialMetrics;
  agenda: AgendaItem[];
  reasoning_trail: ReasoningTrailProps;
};

export default function BriefingCard({
  highlights,
  metrics,
  agenda,
  reasoning_trail
}: BriefingCardProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSeverityStyle = (severity: HighlightItem["severity"]) => {
    switch (severity) {
      case "critical":
        return { text: "#FF3B30", bg: "#FFEBEB", label: "🔴 Critical" };
      case "warning":
        return { text: "#FF9500", bg: "#FFF9E6", label: "🟡 Warning" };
      case "info":
      default:
        return { text: "#0071E3", bg: "#E8F2FC", label: "🔵 Info" };
    }
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h4 style={{ margin: 0, fontWeight: 800, fontSize: "16px", color: "#111113", display: "flex", alignItems: "center", gap: "6px" }}>
          📊 Daily Executive Briefing
        </h4>
        <span style={{ fontSize: "11px", color: "#86868b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Today
        </span>
      </div>

      {/* Highlights Section */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", color: "#86868b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Key Highlights
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {highlights.map((item, index) => {
            const styles = getSeverityStyle(item.severity);
            return (
              <div key={index} style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: styles.bg,
                borderLeft: `4px solid ${styles.text}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#1d1d1f" }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: styles.text }}>
                    {styles.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#515154", lineHeight: "1.4" }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", color: "#86868b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Financial Health
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
        }}>
          {/* Revenue */}
          <div style={{ border: "1px solid rgba(0, 0, 0, 0.05)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
            <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Revenue (This Month)</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#1d1d1f", display: "block" }}>
              {formatCurrency(metrics.revenue)}
            </span>
            {metrics.revenueTrend !== undefined && (
              <span style={{ fontSize: "10px", fontWeight: 700, color: metrics.revenueTrend >= 0 ? "#15A34A" : "#FF3B30" }}>
                {metrics.revenueTrend >= 0 ? "▲" : "▼"} {Math.abs(Math.round(metrics.revenueTrend * 100))}% vs last month
              </span>
            )}
          </div>

          {/* Cash Runway */}
          <div style={{ border: "1px solid rgba(0, 0, 0, 0.05)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
            <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Cash Runway</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: metrics.cashRunwayMonths < 6 ? "#FF9500" : "#1d1d1f", display: "block" }}>
              {metrics.cashRunwayMonths} Months
            </span>
            <span style={{ fontSize: "10px", color: "#86868b" }}>
              Burn: {formatCurrency(metrics.monthlyBurn)}/mo
            </span>
          </div>

          {/* Cash Balance */}
          <div style={{ border: "1px solid rgba(0, 0, 0, 0.05)", borderRadius: "10px", padding: "12px", backgroundColor: "#fcfcfd" }}>
            <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginBottom: "4px" }}>Cash Balance</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#1d1d1f", display: "block" }}>
              {formatCurrency(metrics.cashBalance)}
            </span>
            <span style={{ fontSize: "10px", color: "#15A34A", fontWeight: 700 }}>
              SME Healthy Level
            </span>
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", color: "#86868b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Today's Important Agenda
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {agenda.map((event, idx) => (
            <div key={idx} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "10px 12px",
              border: "1px solid rgba(0, 0, 0, 0.04)",
              borderRadius: "10px",
              backgroundColor: event.isImportant ? "rgba(255, 149, 0, 0.02)" : "#FFFFFF"
            }}>
              {/* Time Indicator */}
              <div style={{
                fontSize: "12px",
                fontWeight: 700,
                color: event.isImportant ? "#FF9500" : "#86868b",
                backgroundColor: event.isImportant ? "#FFF9E6" : "#F5F5F7",
                padding: "4px 8px",
                borderRadius: "6px",
                whiteSpace: "nowrap"
              }}>
                {event.time}
              </div>

              {/* Event Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1d1d1f" }}>
                    {event.title}
                  </span>
                  {event.isImportant && (
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#FF9500", backgroundColor: "#FFF9E6", padding: "1px 6px", borderRadius: "4px" }}>
                      IMPORTANT
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "#86868b", display: "block", marginTop: "2px" }}>
                  Attendees: {event.attendees.join(", ")}
                </span>
                {event.preparationNote && (
                  <div style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "#0071E3",
                    backgroundColor: "#E8F2FC",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    fontWeight: 600
                  }}>
                    💡 Prep: {event.preparationNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning Trail Panel */}
      <ReasoningTrailPanel trail={reasoning_trail} />
    </div>
  );
}
