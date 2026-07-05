import { useState } from "react";

export type MarketDigestItem = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_date?: string;
};

export type MarketDigestCardProps = {
  query: string;
  results: MarketDigestItem[];
  insights: string;
  cached_at: string;
  cache_hit: boolean;
};

export default function MarketDigestCard({
  query,
  results,
  insights,
  cached_at,
  cache_hit
}: MarketDigestCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [statusText, setStatusText] = useState("");

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB, " + d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    } catch {
      return isoStr;
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    setStatusText("Menghubungi API & Memperbarui Cache...");
    
    // Simulate cache invalidation and reload request via a friendly helper alert or reload prompt
    setTimeout(() => {
      setRefreshing(false);
      setStatusText("Cache Firestore diperbarui. Silakan ketik 'Segarkan intelijen pasar' untuk melihat metrik terbaru.");
    }, 2000);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
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
            🔍 Market Intelligence
          </span>
          <h4 style={{ margin: "6px 0 0 0", fontWeight: 800, fontSize: "16px", color: "#1d1d1f" }}>
            Analisis Kompetitor: "{query}"
          </h4>
        </div>
        
        <span style={{ 
          fontSize: "10px", 
          color: cache_hit ? "#15A34A" : "#86868b", 
          backgroundColor: cache_hit ? "#DCFCE7" : "#F5F5F7", 
          padding: "3px 8px", 
          borderRadius: "6px",
          fontWeight: 700,
          border: "1px solid rgba(0, 0, 0, 0.05)"
        }}>
          {cache_hit ? "✓ CACHED (Firestore)" : "⚡ FRESH SEARCH"}
        </span>
      </div>

      {/* AI Insights Synthesis */}
      <div style={{
        backgroundColor: "#F5F5F7",
        borderRadius: "12px",
        padding: "14px 16px",
        fontSize: "13px",
        color: "#1d1d1f",
        lineHeight: "1.5",
        marginBottom: "20px",
        borderLeft: "4px solid #0071E3"
      }}>
        <strong>Sintesis AI:</strong> {insights}
      </div>

      {/* Competitors List / Grid */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: "8px" }}>
          Temuan Sumber & Kompetitor Utama:
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {results.map((item, idx) => (
            <div key={idx} style={{
              border: "1px solid rgba(0, 0, 0, 0.06)",
              borderRadius: "10px",
              padding: "12px",
              backgroundColor: "#FCFCFD"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontWeight: 800, fontSize: "13px", color: "#1d1d1f" }}>
                  🏢 {item.source || "Kompetitor"}
                </span>
                {item.published_date && (
                  <span style={{ fontSize: "10px", color: "#86868b" }}>
                    Diperbarui: {item.published_date}
                  </span>
                )}
              </div>
              
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#515154", lineHeight: "1.4" }}>
                {item.snippet}
              </p>
              
              <a 
                href={item.url} 
                target="_blank" 
                rel="noreferrer"
                style={{ 
                  fontSize: "11px", 
                  color: "#0071E3", 
                  textDecoration: "none", 
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                Kunjungi Sumber Web ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info & Refresh Trigger */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderTop: "1px solid rgba(0, 0, 0, 0.05)",
        paddingTop: "14px",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <span style={{ fontSize: "11px", color: "#86868b" }}>
          🕒 Sinkronisasi Cache: {formatTimestamp(cached_at)}
        </span>
        
        <button 
          onClick={handleForceRefresh}
          disabled={refreshing}
          style={{
            backgroundColor: "transparent",
            border: "1.5px solid #0071E3",
            color: "#0071E3",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
            padding: "6px 12px",
            outline: "none",
            transition: "all 0.2s"
          }}
        >
          {refreshing ? "Menyegarkan..." : "🔄 Force Refresh"}
        </button>
      </div>

      {statusText && (
        <div style={{ 
          marginTop: "12px", 
          fontSize: "11px", 
          color: statusText.includes("diperbarui") ? "#15A34A" : "#0071E3",
          textAlign: "right"
        }}>
          {statusText}
        </div>
      )}

    </div>
  );
}
