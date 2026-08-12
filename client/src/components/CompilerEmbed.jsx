import { useEffect, useRef, useState } from "react";
import { FaTerminal, FaCode, FaCirclePlay, FaRotateRight, FaUserTie, FaGraduationCap } from "react-icons/fa6";

export const ONECOMPILER_LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "javascript", label: "JavaScript" },
  { id: "c", label: "C" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "php", label: "PHP" },
  { id: "ruby", label: "Ruby" },
  { id: "swift", label: "Swift" },
  { id: "kotlin", label: "Kotlin" },
  { id: "typescript", label: "TypeScript" },
];

const embedUrl = (lang) => `https://onecompiler.com/embed/${lang || "python"}`;

export default function CompilerEmbed({
  language = "python",
  onLanguageChange,
  lockLanguage = false,
  title = "Code Compiler",
  subtitle,
  hrName,
  candidateName,
  variant = "lpu",
  iframeHeight = 560,
  className = "",
  hideFooter = false,
  fillHeight = false,
}) {
  const [currentLang, setCurrentLang] = useState(language);
  const [iframeKey, setIframeKey] = useState(0);
  const stretch = fillHeight || iframeHeight === "100%";

  useEffect(() => {
    if (language && language !== currentLang) setCurrentLang(language);
  }, [language, currentLang]);

  const accent = variant === "lpu"
    ? { primary: "#a78bfa", secondary: "#F5A623", headerBg: "#25253a", cardBg: "#2d2d44" }
    : { primary: "#a78bfa", secondary: "#7c6df0", headerBg: "#25253a", cardBg: "#2d2d44" };

  const handleLangChange = (lang) => {
    if (lockLanguage || !lang || lang === currentLang) return;
    setCurrentLang(lang);
    onLanguageChange?.(lang);
  };

  return (
    <div
      className={`compiler-embed-root ${stretch ? "compiler-embed-root--fill" : ""} ${className}`.trim()}
      style={{ background: accent.cardBg }}
    >
      <div className="compiler-embed-header" style={{ background: accent.headerBg }}>
        <div className="compiler-embed-header-text">
          <h2 className="compiler-embed-title">
            <FaTerminal style={{ color: accent.primary, fontSize: 20, flexShrink: 0 }} aria-hidden />
            {title}
          </h2>
          {(subtitle || hrName || candidateName) && (
            <p className="compiler-embed-subtitle">
              {subtitle}
              {hrName && (
                <span className="compiler-embed-chip">
                  <FaUserTie size={11} /> HR: {hrName}
                </span>
              )}
              {candidateName && (
                <span className="compiler-embed-chip">
                  <FaGraduationCap size={11} /> {candidateName}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="compiler-embed-lang">
          <label htmlFor="compilerLangSelect" className="compiler-embed-lang-label">
            <FaCode aria-hidden /> Language
          </label>
          <select
            id="compilerLangSelect"
            value={currentLang}
            disabled={lockLanguage}
            onChange={(e) => handleLangChange(e.target.value)}
            className="compiler-embed-select"
            style={{ opacity: lockLanguage ? 0.65 : 1, cursor: lockLanguage ? "not-allowed" : "pointer" }}
          >
            {ONECOMPILER_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => setIframeKey((k) => k + 1)} className="compiler-embed-reload" title="Reload">
            <FaRotateRight />
          </button>
        </div>
      </div>

      <div className="compiler-embed-frame-host">
        <iframe
          key={`${currentLang}-${iframeKey}`}
          title="Online Compiler"
          src={embedUrl(currentLang)}
          className="compiler-embed-iframe"
          style={stretch ? undefined : { height: typeof iframeHeight === "number" ? iframeHeight : 560 }}
          allow="clipboard-read; clipboard-write"
        />
      </div>

      {!hideFooter && (
        <div className="compiler-embed-footer" style={{ background: accent.headerBg }}>
          <span className="compiler-embed-hint">
            <FaCirclePlay style={{ color: accent.secondary, fontSize: 15, flexShrink: 0 }} aria-hidden />
            Write and run your code — paste your final solution into the submission panel for HR review
          </span>
          <span className="compiler-embed-badge">
            <FaRotateRight style={{ color: accent.primary, fontSize: 13 }} aria-hidden />
            onecompiler.com
          </span>
        </div>
      )}

      <style>{`
        .compiler-embed-root {
          width: 100%;
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.45);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .compiler-embed-root--fill {
          flex: 1;
          min-height: 0;
          height: 100%;
          border-radius: 12px;
        }
        .compiler-embed-header {
          flex-shrink: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 14px;
          border-bottom: 1px solid #3e3e5a;
        }
        .compiler-embed-title {
          margin: 0;
          color: #f0f0ff;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .compiler-embed-subtitle {
          margin: 4px 0 0;
          font-size: 11px;
          color: #9696b0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .compiler-embed-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(167,139,250,0.12);
          border: 1px solid rgba(167,139,250,0.35);
          color: #d0d0f0;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
        }
        .compiler-embed-lang {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .compiler-embed-lang-label {
          color: #b0b0d0;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .compiler-embed-select {
          background: #1e1e32;
          color: #e8e8ff;
          border: 1px solid #4a4a6a;
          border-radius: 999px;
          padding: 7px 34px 7px 14px;
          font-size: 13px;
          outline: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a78bfa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        .compiler-embed-reload {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #4a4a6a;
          background: #1e1e32;
          color: #a78bfa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .compiler-embed-frame-host {
          flex: 1;
          min-height: 0;
          position: relative;
          background: #1a1a2b;
          padding: 4px;
        }
        .compiler-embed-root:not(.compiler-embed-root--fill) .compiler-embed-frame-host {
          height: auto;
          min-height: 420px;
        }
        .compiler-embed-iframe {
          position: absolute;
          inset: 4px;
          width: calc(100% - 8px);
          height: calc(100% - 8px);
          border: none;
          border-radius: 10px;
          background: #0f0f1a;
        }
        .compiler-embed-root:not(.compiler-embed-root--fill) .compiler-embed-iframe {
          position: relative;
          inset: auto;
          width: 100%;
        }
        .compiler-embed-footer {
          flex-shrink: 0;
          padding: 10px 14px;
          border-top: 1px solid #3a3a52;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .compiler-embed-hint {
          color: #9696b0;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          line-height: 1.4;
        }
        .compiler-embed-badge {
          background: #3a3a5a;
          color: #d0d0f0;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>
    </div>
  );
}
