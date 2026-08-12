import { Link } from "react-router-dom";
import { useState } from "react";
import CompilerEmbed from "../components/CompilerEmbed";

export default function TestCompilerPage() {
  const [language, setLanguage] = useState("python");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #1e1e2f 0%, #0b0b12 45%, #1a1020 100%)",
        padding: "28px 20px 40px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <header style={{ marginBottom: 22, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>
              CV Shortlisting · Assessment Lab
            </p>
            <h1 style={{ color: "#f0f0ff", fontSize: 26, fontWeight: 700, margin: "6px 0 0" }}>
              Code Compiler · Test
            </h1>
            <p style={{ color: "#8888a8", fontSize: 13, marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
              Preview the same IDE students see during HR-assigned coding tests. HR can validate language and layout before sending an assessment.
            </p>
          </div>
          <Link
            to="/login"
            style={{
              color: "#e8e8ff",
              textDecoration: "none",
              fontSize: 13,
              padding: "10px 18px",
              borderRadius: 12,
              border: "1px solid #4a4a6a",
              background: "rgba(45, 45, 68, 0.6)",
            }}
          >
            ← Back to portal
          </Link>
        </header>

        <CompilerEmbed
          language={language}
          onLanguageChange={setLanguage}
          title="Code Compiler"
          subtitle="Sandbox — not proctored"
          hrName="Preview (HR)"
          iframeHeight={560}
        />

        <p style={{ color: "#505068", fontSize: 12, marginTop: 16, textAlign: "center" }}>
          Powered by OneCompiler embed · Secure runner remains available inside live coding tests
        </p>
      </div>
    </div>
  );
}
