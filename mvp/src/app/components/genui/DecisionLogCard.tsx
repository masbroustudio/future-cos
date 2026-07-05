import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { ConfidenceWidget } from "./ReasoningTrailPanel";

export type DecisionLogCardProps = {
  title: string;
  description: string;
  decision_made: string;
  rationale: string;
  assumptions: string[];
  alternatives_considered: string[];
  confidence_score: number;
  data_sources: string[];
  tags: string[];
  userId?: string;
};

export default function DecisionLogCard({
  title,
  description,
  decision_made,
  rationale,
  assumptions,
  alternatives_considered,
  confidence_score,
  data_sources,
  tags,
  userId = "default"
}: DecisionLogCardProps) {
  const [status, setStatus] = useState<"draft" | "saving" | "saved" | "error">("draft");
  const [errorMessage, setErrorMessage] = useState("");
  const [decisionId, setDecisionId] = useState("");

  const handleSave = async () => {
    setStatus("saving");
    try {
      const generatedId = "dec_" + Math.random().toString(36).substring(2, 14);
      const confidenceLabel = confidence_score >= 0.8 ? "High" : confidence_score >= 0.5 ? "Medium" : "Low";
      
      const cleanedUser = localStorage.getItem("cos_username") || userId;

      await setDoc(doc(db, "decisions", generatedId), {
        id: generatedId,
        userId: cleanedUser,
        title,
        description,
        decisionMade: decision_made,
        rationale,
        assumptions,
        alternativesConsidered: alternatives_considered,
        confidenceScore: confidence_score,
        confidenceLabel,
        dataSources: data_sources,
        tags,
        status: "confirmed",
        madeAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdByAgent: "CoS_Orchestrator_v1"
      });

      setDecisionId(generatedId);
      setStatus("saved");
    } catch (err: any) {
      console.error("Failed to save decision in frontend:", err);
      setStatus("error");
      setErrorMessage(err.message || "Gagal menghubungi database");
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
      fontFamily: "var(--font-geist-sans), -apple-system, sans-serif",
      position: "relative"
    }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <span style={{ 
            fontSize: "10px", 
            fontWeight: 800, 
            color: "#0071E3", 
            backgroundColor: "#E8F2FC", 
            padding: "2px 8px", 
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            ✍️ Draf Keputusan
          </span>
          <h4 style={{ margin: "6px 0 0 0", fontWeight: 800, fontSize: "16px", color: "#1d1d1f" }}>
            {title}
          </h4>
        </div>
        <ConfidenceWidget score={confidence_score} label={confidence_score >= 0.8 ? "High" : confidence_score >= 0.5 ? "Medium" : "Low"} />
      </div>

      {/* Description */}
      <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#86868b", lineHeight: "1.4" }}>
        {description}
      </p>

      {/* The Decision Made (Primary highlight) */}
      <div style={{ 
        backgroundColor: "#F5F5F7", 
        borderLeft: "4px solid #1d1d1f",
        padding: "12px 16px",
        borderRadius: "0 8px 8px 0",
        marginBottom: "16px"
      }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: "4px" }}>
          Keputusan yang Diambil:
        </div>
        <div style={{ fontSize: "14px", fontWeight: 800, color: "#1d1d1f", lineHeight: "1.4" }}>
          {decision_made}
        </div>
      </div>

      {/* Rationale */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: "4px" }}>
          Alasan & Justifikasi:
        </div>
        <div style={{ fontSize: "13px", color: "#1d1d1f", lineHeight: "1.4" }}>
          {rationale}
        </div>
      </div>

      {/* Two columns: Assumptions and Alternatives */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px",
        marginBottom: "20px"
      }}>
        {/* Assumptions */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: "6px" }}>
            Asumsi Kunci:
          </div>
          <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "12px", color: "#515154", lineHeight: "1.5" }}>
            {assumptions.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Alternatives */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: "6px" }}>
            Alternatif yang Ditolak:
          </div>
          <ul style={{ paddingLeft: "16px", margin: 0, fontSize: "12px", color: "#515154", lineHeight: "1.5" }}>
            {alternatives_considered.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tags & Sources */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "6px", 
        borderTop: "1px solid rgba(0, 0, 0, 0.05)",
        paddingTop: "12px",
        marginBottom: "16px"
      }}>
        {tags.map((tag, idx) => (
          <span key={idx} style={{ 
            fontSize: "11px", 
            color: "#515154", 
            backgroundColor: "#F5F5F7", 
            padding: "3px 8px", 
            borderRadius: "6px" 
          }}>
            #{tag}
          </span>
        ))}
      </div>

      {/* CTA Buttons / Status */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}>
        {status === "draft" && (
          <>
            <button 
              onClick={() => setStatus("error")} // just hides or ignores
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#FF3B30",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 12px"
              }}
            >
              Abaikan
            </button>
            <button 
              onClick={handleSave}
              style={{
                backgroundColor: "#0071E3",
                border: "none",
                color: "#FFFFFF",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 16px",
                outline: "none"
              }}
            >
              Simpan ke Decision Log
            </button>
          </>
        )}

        {status === "saving" && (
          <span style={{ fontSize: "13px", color: "#86868b", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="animate-pulse" style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "#0071E3", borderRadius: "50%" }}></span>
            Menyimpan...
          </span>
        )}

        {status === "saved" && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "6px",
            color: "#15A34A",
            backgroundColor: "#DCFCE7",
            border: "1px solid #BBF7D0",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700
          }}>
            <span>✓ Tersimpan di Log Keputusan</span>
            <span style={{ fontSize: "10px", color: "#166534", fontWeight: 500 }}>({decisionId})</span>
          </div>
        )}

        {status === "error" && (
          <span style={{ fontSize: "13px", color: "#FF3B30" }}>
            ⚠️ {errorMessage || "Aksi dibatalkan"}
          </span>
        )}
      </div>

    </div>
  );
}
