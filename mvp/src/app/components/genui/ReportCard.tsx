import { useState } from "react";

export type ReportCardProps = {
  title: string;
  report_type: string;
  period: string;
  content_markdown: string;
};

export default function ReportCard({
  title,
  report_type,
  period,
  content_markdown
}: ReportCardProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    try {
      const blob = new Blob([content_markdown], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "_") + ".md";
      link.setAttribute("download", safeTitle);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            color: "#15A34A", 
            backgroundColor: "#DCFCE7", 
            padding: "2px 8px", 
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            📄 Draf Laporan {String(report_type).toLowerCase().includes("board") ? "Dewan Direksi" : "Investor"}
          </span>
          <h4 style={{ margin: "6px 0 0 0", fontWeight: 800, fontSize: "16px", color: "#1d1d1f" }}>
            {title}
          </h4>
          <span style={{ fontSize: "12px", color: "#86868b" }}>Periode: {period}</span>
        </div>
        
        <span style={{ 
          fontSize: "11px", 
          fontWeight: 700, 
          color: "#86868b", 
          border: "1px solid rgba(0, 0, 0, 0.15)", 
          padding: "3px 8px", 
          borderRadius: "6px",
          backgroundColor: "#F5F5F7"
        }}>
          STATUS: DRAFT
        </span>
      </div>

      {/* Markdown Preview Area */}
      <div style={{
        backgroundColor: "#F5F5F7",
        borderRadius: "10px",
        padding: "16px",
        maxHeight: "220px",
        overflowY: "auto",
        marginBottom: "20px",
        border: "1px solid rgba(0, 0, 0, 0.04)"
      }}>
        <pre style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "12px",
          fontFamily: "var(--font-geist-mono), monospace",
          color: "#333333",
          lineHeight: "1.5"
        }}>
          {content_markdown}
        </pre>
      </div>

      {/* Actions */}
      <div style={{ 
        display: "flex", 
        justifyContent: "flex-end", 
        alignItems: "center", 
        gap: "10px",
        borderTop: "1px solid rgba(0, 0, 0, 0.05)",
        paddingTop: "16px"
      }}>
        <button 
          onClick={handleCopy}
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(0, 0, 0, 0.15)",
            color: "#1d1d1f",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 16px",
            outline: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          {copied ? "✓ Tersalin" : "📋 Salin Laporan"}
        </button>
        <button 
          onClick={handleDownload}
          style={{
            backgroundColor: "#0071E3",
            border: "none",
            color: "#FFFFFF",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            padding: "8px 18px",
            outline: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          📥 Unduh File (.md)
        </button>
      </div>

    </div>
  );
}
