import { useState } from "react";

export type ReasoningTrailProps = {
  dataSources: string[];
  assumptions: string[];
  confidenceScore: number;
  confidenceLabel: "High" | "Medium" | "Low";
  alternativeOptions?: string[];
  warnings?: string[];
};

export function ConfidenceWidget({ score, label }: { score: number; label: string }) {
  const getConfidenceColor = (l: string) => {
    switch (l) {
      case "High":
        return { text: "#15A34A", bg: "#DCFCE7", border: "#BBF7D0" };
      case "Medium":
        return { text: "#D97706", bg: "#FEF3C7", border: "#FDE68A" };
      case "Low":
      default:
        return { text: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" };
    }
  };

  const colors = getConfidenceColor(label);

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "9999px",
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      fontSize: "12px",
      fontWeight: 700,
      color: colors.text,
    }}>
      <span style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: colors.text,
        display: "inline-block",
      }}></span>
      <span>Confidence: {label} ({Math.round(score * 100)}%)</span>
    </div>
  );
}

export function ReasoningTrailPanel({ trail }: { trail: ReasoningTrailProps }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!trail) return null;

  return (
    <div style={{
      marginTop: "16px",
      borderTop: "1px solid rgba(0, 0, 0, 0.06)",
      paddingTop: "12px",
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          color: "#0071e3",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: 0,
          outline: "none",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {isOpen ? "Sembunyikan Jalur Reasoning" : "Lihat Jalur Reasoning (Audit Trail)"}
      </button>

      {isOpen && (
        <div style={{
          marginTop: "12px",
          backgroundColor: "#f5f5f7",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "13px",
          color: "#1d1d1f",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "slideDownFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}>
          {/* Confidence Score Widget */}
          <div>
            <div style={{ fontWeight: 600, color: "#86868b", marginBottom: "6px" }}>Tingkat Keyakinan AI</div>
            <ConfidenceWidget score={trail.confidenceScore} label={trail.confidenceLabel} />
          </div>

          {/* Warnings */}
          {trail.warnings && trail.warnings.length > 0 && (
            <div style={{
              backgroundColor: "#fff9e6",
              border: "1px solid #ffe699",
              borderRadius: "8px",
              padding: "10px 12px",
              color: "#b27a00",
            }}>
              <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span>⚠️ Catatan Akurasi Data</span>
              </div>
              <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "12px", lineHeight: "1.5" }}>
                {trail.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Data Sources */}
          <div>
            <div style={{ fontWeight: 600, color: "#86868b", marginBottom: "4px" }}>Sumber Data Referensi</div>
            <ul style={{ paddingLeft: "18px", margin: 0, lineHeight: "1.5", color: "#48484a" }}>
              {trail.dataSources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>

          {/* Assumptions */}
          {trail.assumptions && trail.assumptions.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, color: "#86868b", marginBottom: "4px" }}>Asumsi Perhitungan</div>
              <ul style={{ paddingLeft: "18px", margin: 0, lineHeight: "1.5", color: "#48484a" }}>
                {trail.assumptions.map((assumption, i) => (
                  <li key={i}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternative Options */}
          {trail.alternativeOptions && trail.alternativeOptions.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, color: "#86868b", marginBottom: "4px" }}>Opsi Alternatif yang Dipertimbangkan</div>
              <ul style={{ paddingLeft: "18px", margin: 0, lineHeight: "1.5", color: "#48484a" }}>
                {trail.alternativeOptions.map((option, i) => (
                  <li key={i}>{option}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
