import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import CompilerEmbed from "./CompilerEmbed";

/* ─── LPU Brand Colors ────────────────────────────────────────── */
const C = {
  maroon:  "#8B1A1A",
  maroonD: "#5c0f0f",
  maroonL: "#a82020",
  gold:    "#F5A623",
  goldL:   "#f7c05a",
  goldD:   "#c4831a",
  bg:      "#0b0b12",
  panel:   "#10101a",
  card:    "#14141f",
  brd:     "#1e1e2e",
  brd2:    "#252535",
  text:    "#e8e8f4",
  mid:     "#8888a8",
  dim:     "#505068",
  green:   "#22c55e",
  greenD:  "#15803d",
  red:     "#ef4444",
  blue:    "#60a5fa",
};

/* ─── Starter templates (initial submission draft) ─────────────── */
const TEMPLATES = {
  python:     "# Write your solution here\ndef solve():\n    # TODO\n    pass\n\nsolve()\n",
  javascript: "// Write your solution here\nfunction solve() {\n    // TODO\n    return 'Hello LPU'\n}\n\nconsole.log(solve());\n",
  java:       "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println(\"Hello LPU\");\n    }\n}\n",
  cpp:        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << \"Hello LPU\" << endl;\n    return 0;\n}\n",
  c:          "#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    printf(\"Hello LPU\\n\");\n    return 0;\n}\n",
  typescript: "function solve(): string {\n    return 'Hello LPU';\n}\nconsole.log(solve());\n",
  go:         "package main\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello LPU\")\n}\n",
  rust:       "fn main() {\n    println!(\"Hello LPU\");\n}\n",
};

const MAX_WARN = 3;

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function CodingTestView({ testId, onClose, onSubmitted }) {
  /* state */
  const [test,         setTest]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [code,         setCode]         = useState("");
  const [notes,        setNotes]        = useState("");
  const [language,     setLanguage]     = useState("python");
  const [submitting,   setSubmitting]   = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(null);

  /* exam lifecycle */
  const [phase,        setPhase]        = useState("countdown"); // countdown|exam|done
  const [countdown,    setCountdown]    = useState(3);

  /* anti-cheat & proctoring */
  const [warnings,        setWarnings]        = useState(0);
  const [warnMsg,         setWarnMsg]         = useState("");
  const [showWarn,        setShowWarn]        = useState(false);
  const [tabCount,        setTabCount]        = useState(0);
  const [terminated,      setTerminated]      = useState(false);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  /* camera & proctoring refs */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);

  const timerRef   = useRef(null);
  const warnRef    = useRef(0);

  /* ── violation helper ────────────────────────────────────────── */
  const warn = useCallback((msg) => {
    if (phase !== "exam") return;
    warnRef.current += 1;
    setWarnings(warnRef.current);
    setWarnMsg(msg);
    setShowWarn(true);
    if (warnRef.current >= MAX_WARN) setTerminated(true);
  }, [phase]);

  /* ── fullscreen ──────────────────────────────────────────────── */
  const enterFS = () => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
  };

  /* ── anti-cheat listeners ────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "exam") return;
    const onFS = () => {
      const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(full);
      if (!full) warn("⚠️ Fullscreen mode exited — active window focus required.");
    };
    const onVis = () => {
      if (document.hidden) {
        setIsWindowFocused(false);
        setTabCount((t) => t + 1);
        warn("⚠️ Tab switch or window hiding detected — active test window lost.");
      }
    };
    const onBlur = () => {
      setIsWindowFocused(false);
      setTabCount((t) => t + 1);
      warn("⚠️ Active window lost! Switching applications, splitting windows, or using cheat scripts is forbidden.");
    };
    const onFocus = () => {
      setIsWindowFocused(true);
    };
    const blockCopyPaste = (e) => {
      e.preventDefault();
      warn("⚠️ Copying, pasting, cutting, or dragging material is strictly prohibited.");
      return false;
    };
    const noCtx = (e) => {
      e.preventDefault();
      warn("⚠️ Context menu & right-click inspecting are disabled.");
      return false;
    };
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (
        e.key === "F12" ||
        e.key === "PrintScreen" ||
        (ctrl && e.shiftKey && ["i", "j", "c", "k", "s"].includes(k)) ||
        (ctrl && ["u", "s", "p", "c", "v", "x", "a"].includes(k))
      ) {
        e.preventDefault();
        warn(`⚠️ Security violation: Restricted shortcut (${e.key}) blocked.`);
        return false;
      }
    };

    document.addEventListener("fullscreenchange",       onFS);
    document.addEventListener("webkitfullscreenchange", onFS);
    document.addEventListener("visibilitychange",       onVis);
    window.addEventListener("blur",                     onBlur);
    window.addEventListener("focus",                    onFocus);
    document.addEventListener("contextmenu",            noCtx);
    document.addEventListener("keydown",                onKey);
    document.addEventListener("copy",                   blockCopyPaste);
    document.addEventListener("cut",                    blockCopyPaste);
    document.addEventListener("paste",                  blockCopyPaste);
    document.addEventListener("dragstart",              blockCopyPaste);
    document.addEventListener("drop",                   blockCopyPaste);

    return () => {
      document.removeEventListener("fullscreenchange",       onFS);
      document.removeEventListener("webkitfullscreenchange", onFS);
      document.removeEventListener("visibilitychange",       onVis);
      window.removeEventListener("blur",                     onBlur);
      window.removeEventListener("focus",                    onFocus);
      document.removeEventListener("contextmenu",            noCtx);
      document.removeEventListener("keydown",                onKey);
      document.removeEventListener("copy",                   blockCopyPaste);
      document.removeEventListener("cut",                    blockCopyPaste);
      document.removeEventListener("paste",                  blockCopyPaste);
      document.removeEventListener("dragstart",              blockCopyPaste);
      document.removeEventListener("drop",                   blockCopyPaste);
    };
  }, [phase, warn]);

  /* ── camera proctoring & 1-min snapshot stream ───────────────── */
  useEffect(() => {
    if (phase !== "exam") return;
    let streamTrack = null;
    let snapshotInterval = null;
    let socketFrameInterval = null;

    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const socketUrl = isDev ? "http://localhost:5000" : window.location.origin;
    socketRef.current = io(socketUrl, { auth: { token: localStorage.getItem("token") } });

    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamTrack = stream.getVideoTracks()[0];
        setCameraActive(true);

        const captureAndUpload = async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, 320, 240);

          const base64 = canvas.toDataURL("image/jpeg", 0.35);

          try {
            await api.put(`/coding-tests/${testId}/snapshot`, { imageBase64: base64 });
            setSnapshotCount((c) => c + 1);
          } catch (err) {
            console.warn("Proctor snapshot upload failed:", err);
          }
        };

        // Capture initial snapshot after 2 seconds
        setTimeout(captureAndUpload, 2000);

        // Capture snapshot every 1 minute (60,000 ms)
        snapshotInterval = setInterval(captureAndUpload, 60000);

        // Emit live video frame to HR/Faculty every 3 seconds
        socketFrameInterval = setInterval(() => {
          if (!videoRef.current || !canvasRef.current || !socketRef.current) return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = 240;
          canvas.height = 180;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, 240, 180);
          const frame = canvas.toDataURL("image/jpeg", 0.3);
          socketRef.current.emit("proctor-frame", { testId, frame });
        }, 3000);
      })
      .catch((err) => {
        console.warn("Webcam access denied or unavailable:", err);
        setCameraActive(false);
      });

    return () => {
      if (streamTrack) streamTrack.stop();
      if (snapshotInterval) clearInterval(snapshotInterval);
      if (socketFrameInterval) clearInterval(socketFrameInterval);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [phase, testId]);

  /* ── countdown ───────────────────────────────────────────────── */
  useEffect(() => {
    if (loading || phase !== "countdown") return;
    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (c > 0) setCountdown(c);
      else if (c === 0) setCountdown("GO!");
      else { clearInterval(iv); enterFS(); setIsFullscreen(true); setPhase("exam"); }
    }, 1000);
    return () => clearInterval(iv);
  }, [loading, phase]);

  /* ── fetch ───────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const r   = await api.get(`/coding-tests/${testId}`);
        const t   = r.data;
        setTest(t);
        const lg  = t.language || "python";
        setLanguage(lg);
        setCode(t.submittedCode || TEMPLATES[lg] || "");
        if (t.submissionNotes) setNotes(t.submissionNotes);
        if (!t.startedAt && t.status !== "submitted") {
          await api.put(`/coding-tests/${testId}/start`);
          setTest(prev => ({ ...prev, startedAt: new Date(), status: "in_progress" }));
        }
        if (t.status === "submitted" || t.status === "reviewed") setPhase("done");
      } catch (e) { alert(e.response?.data?.message || "Failed to load"); onClose(); }
      finally     { setLoading(false); }
    })();
    return () => clearInterval(timerRef.current);
  }, [testId]);

  /* ── timer ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!test || phase === "done") return;
    const dur   = (test.durationMinutes || 30) * 60;
    const start = test.startedAt ? new Date(test.startedAt).getTime() : Date.now();
    const tick  = () => {
      const rem = dur - Math.floor((Date.now()-start)/1000);
      if (rem <= 0) { setTimeLeft(0); clearInterval(timerRef.current); autoSubmit(); }
      else setTimeLeft(rem);
    };
    tick(); timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [test?.startedAt, test?.durationMinutes, phase]);

  /* ── submit ──────────────────────────────────────────────────── */
  const autoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/coding-tests/${testId}/submit`, {
        submittedCode:  code || TEMPLATES[language] || "// auto",
        submissionNotes: notes || "Auto-submitted",
        antiCheatLog:  { warnings: warnRef.current, tabSwitches: tabCount },
      });
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!code.trim()) { alert("Write your solution before submitting!"); return; }
    if (!window.confirm("Submit your final solution to HR for review?")) return;
    setSubmitting(true);
    try {
      await api.put(`/coding-tests/${testId}/submit`, {
        submittedCode:  code,
        submissionNotes: notes,
        antiCheatLog:  { warnings: warnRef.current, tabSwitches: tabCount },
      });
      alert("✅ Solution submitted to HR successfully!");
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (e) { alert(e.response?.data?.message || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const fmt = (s) => s==null ? "--:--"
    : `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const urgent     = timeLeft !== null && timeLeft < 300;
  const isSubmitted = phase === "done" || test?.status === "submitted" || test?.status === "reviewed";

  /* ══ LOADING ═══════════════════════════════════════════════════ */
  if (loading) return (
    <div style={S.cover}>
      <div style={S.spin} />
      <p style={{ color: C.mid, marginTop: 18, fontSize: 13 }}>Initialising LPU Secure Assessment…</p>
    </div>
  );

  /* ══ TERMINATED ════════════════════════════════════════════════ */
  if (terminated) return (
    <div style={S.cover}>
      <div style={{ background: "#1a0808", border:`1px solid ${C.red}`, borderRadius:20, padding:"36px 40px", maxWidth:420, textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:14 }}>🚫</div>
        <h2 style={{ color:C.red, fontSize:20, fontWeight:800, marginBottom:8 }}>Exam Terminated</h2>
        <p style={{ color:C.mid, fontSize:12, lineHeight:1.8, marginBottom:20 }}>
          You exceeded {MAX_WARN} security violations. Your session has been flagged.
          Current code will be auto-submitted.
        </p>
        <button onClick={autoSubmit} style={{ background:C.red, color:"#fff", border:"none", padding:"10px 28px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13 }}>
          Submit & Exit
        </button>
      </div>
    </div>
  );

  /* ══ COUNTDOWN ═════════════════════════════════════════════════ */
  if (phase === "countdown") return (
    <div style={S.cover}>
      <div style={S.lpuTopBar}>
        <div style={S.lpuBadge}>LPU</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Lovely Professional University</div>
          <div style={{ fontSize:10, color:C.mid }}>Secure Coding Assessment Portal</div>
        </div>
      </div>

      <div style={{ textAlign:"center", maxWidth:500, padding:"0 24px" }}>
        <div style={{ fontSize:56, marginBottom:16, filter:"drop-shadow(0 0 20px rgba(245,166,35,.4))" }}>🛡️</div>
        <h2 style={{ fontSize:17, fontWeight:800, color:C.text, letterSpacing:2, textTransform:"uppercase", marginBottom:24 }}>
          Entering Secure Exam Environment
        </h2>

        <div style={{ fontSize:100, fontWeight:900, fontFamily:"monospace", lineHeight:1, marginBottom:30,
          background:`linear-gradient(135deg,${C.gold},${C.maroonL},${C.goldL})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"pulse 0.8s ease-in-out infinite" }}>
          {countdown}
        </div>

        <div style={{ background:"#14141f", border:`1px solid ${C.maroon}`, borderRadius:14, padding:"16px 24px", textAlign:"left" }}>
          {[
            "Do NOT switch tabs or windows",
            "Stay in Fullscreen Mode (F11) at all times",
            "DevTools, right-click & copy shortcuts are disabled",
            `${MAX_WARN} violations = automatic exam termination`,
            "Copy your final code into the submission panel on the left",
          ].map((r,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 0",
              borderBottom: i < 4 ? `1px solid ${C.brd}` : "none", fontSize:12, color:C.mid }}>
              <span style={{ color:C.gold, fontSize:14 }}>⚑</span> {r}
            </div>
          ))}
        </div>

        <p style={{ color:C.dim, fontSize:11, marginTop:14 }}>Fullscreen activates automatically…</p>
      </div>
    </div>
  );

  /* ══ MAIN EXAM ══════════════════════════════════════════════════ */
  return (
    <div style={{ ...S.root, userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}>

      {/* ── active window lost overlay ─────────────────────────── */}
      {!isWindowFocused && phase === "exam" && !terminated && (
        <div style={S.modalBg}>
          <div style={{ ...S.modal, border: `2px solid ${C.red}`, background: "#180808" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔒</div>
            <h3 style={{ color: C.red, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Active Test Window Required
            </h3>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              Active window focus lost! You left the test environment. Switching windows, opening external applications, or running background cheat scripts is forbidden.
            </p>
            <p style={{ color: C.gold, fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
              Warning {warnings} / {MAX_WARN} logged. Re-focus the window immediately.
            </p>
            <button
              onClick={() => {
                setIsWindowFocused(true);
                setShowWarn(false);
                enterFS();
              }}
              style={{ ...S.goldBtn, background: C.red, color: "#fff" }}
            >
              Re-Focus Active Window & Resume Test
            </button>
          </div>
        </div>
      )}

      {/* ── violation modal ──────────────────────────────────────── */}
      {showWarn && !terminated && (
        <div style={S.modalBg}>
          <div style={S.modal}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <h3 style={{ color:C.gold, fontSize:16, fontWeight:800, marginBottom:8 }}>
              Security Violation Detected
            </h3>
            <p style={{ color:C.text, fontSize:12, lineHeight:1.7, marginBottom:6 }}>{warnMsg}</p>
            <p style={{ color:C.red, fontSize:12, fontWeight:700, marginBottom:20 }}>
              Warning {warnings} / {MAX_WARN} — {MAX_WARN - warnings} violation{MAX_WARN-warnings!==1?"s":""} before termination
            </p>
            <button onClick={() => { setShowWarn(false); enterFS(); }} style={S.goldBtn}>
              Acknowledge &amp; Re-Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── fullscreen nag ───────────────────────────────────────── */}
      {!isFullscreen && phase==="exam" && !showWarn && (
        <div style={S.fsBar}>
          <span style={{ color:C.red, fontSize:12, fontWeight:700 }}>🔴 FULLSCREEN REQUIRED</span>
          <button onClick={enterFS} style={{ background:"white", color:C.red, border:"none",
            padding:"3px 14px", borderRadius:6, fontSize:11, fontWeight:700, cursor:"pointer" }}>
            Re-Enter Fullscreen
          </button>
        </div>
      )}

      {/* ════════════ HEADER ════════════════════════════════════════ */}
      <header style={S.header}>
        {/* brand */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={S.lpuIcon}>LPU</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:C.text }}>
              {test?.title || "Coding Assessment"}
            </div>
            <div style={{ fontSize:10, color:C.mid }}>
              Lovely Professional University &nbsp;·&nbsp;
              <span style={{ color:C.goldL }}>{test?.job?.title || "Technical Round"}</span>
              &nbsp;·&nbsp; HR: <span style={{ color:C.goldL }}>{test?.createdBy?.name || "–"}</span>
            </div>
          </div>
        </div>

        {/* anti-cheat status */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={S.pill(warnings===0 ? C.green : warnings===1 ? C.gold : C.red)}>
            🛡️ Proctored &nbsp;·&nbsp; Warns: {warnings}/{MAX_WARN}
          </div>
          {tabCount > 0 && <div style={S.pill(C.red)}>Tabs: {tabCount}</div>}
        </div>

        {/* timer + actions */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {!isSubmitted && (
            <div style={S.timer(urgent)}>
              <span>⏱</span>
              <span style={{ fontFamily:"monospace", fontWeight:800, fontSize:17, letterSpacing:3 }}>
                {fmt(timeLeft)}
              </span>
              <span style={{ fontSize:9, opacity:.7 }}>left</span>
            </div>
          )}

          {!isSubmitted ? (
            <button onClick={handleSubmit} disabled={submitting} style={S.submitBtn(submitting)}>
              {submitting ? "Submitting…" : "⬆  Submit to HR"}
            </button>
          ) : (
            <div style={S.doneBadge}>✅ Submitted</div>
          )}

          <button onClick={() => {
            if (window.confirm("Exit exam? Unsaved work may be lost.")) {
              if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
              onClose();
            }
          }} style={S.closeBtn} title="Exit">✕</button>
        </div>
      </header>

      {/* ════════════ BODY ══════════════════════════════════════════ */}
      <div style={S.body} className="coding-exam-body">

        {/* ══ LEFT: Question + submission ═══════════════════════════ */}
        <div style={S.left} className="coding-exam-left">
          <div style={S.leftScroll}>

            {/* Question title + difficulty */}
            <div style={S.qCard}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
                <h2 style={{ fontSize:16, fontWeight:800, color:C.text, margin:0 }}>
                  {test?.title || "Problem"}
                </h2>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {test?.difficulty && (
                    <span style={S.diffBadge(test.difficulty)}>
                      {test.difficulty.toUpperCase()}
                    </span>
                  )}
                  <span style={S.langBadge}>{language.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.9, whiteSpace:"pre-wrap" }}>
                {test?.description}
              </div>
            </div>

            {/* Constraints */}
            {test?.constraints && (
              <div style={S.section}>
                <div style={S.sectionTitle("#60a5fa")}>📐 Constraints</div>
                <div style={{ fontSize:12, color:C.mid, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"monospace" }}>
                  {test.constraints}
                </div>
              </div>
            )}

            {/* Input / Output format */}
            {(test?.inputFormat || test?.outputFormat) && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {test.inputFormat && (
                  <div style={S.section}>
                    <div style={S.sectionTitle("#a78bfa")}>📥 Input Format</div>
                    <div style={{ fontSize:12, color:C.mid, lineHeight:1.7, fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
                      {test.inputFormat}
                    </div>
                  </div>
                )}
                {test.outputFormat && (
                  <div style={S.section}>
                    <div style={S.sectionTitle("#34d399")}>📤 Output Format</div>
                    <div style={{ fontSize:12, color:C.mid, lineHeight:1.7, fontFamily:"monospace", whiteSpace:"pre-wrap" }}>
                      {test.outputFormat}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample test cases */}
            {test?.testCases?.length > 0 && (
              <div>
                <div style={S.sectionTitle(C.gold)}>🧪 Sample Test Cases</div>
                {test.testCases.map((tc, i) => (
                  <div key={i} style={S.tcCard}>
                    <div style={{ fontSize:11, fontWeight:700, color:C.goldL, marginBottom:10 }}>
                      Example {i + 1}{tc.description ? ` — ${tc.description}` : ""}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <div style={S.ioLabel}>Input</div>
                        <pre style={S.ioPre(C.blue)}>{tc.input || "(none)"}</pre>
                      </div>
                      <div>
                        <div style={S.ioLabel}>Expected Output</div>
                        <pre style={S.ioPre(C.gold)}>{tc.expectedOutput || "(none)"}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HR Notes input */}
            <div style={S.section}>
              <div style={S.sectionTitle(C.mid)}>💬 Notes for HR (Optional)</div>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isSubmitted}
                placeholder="e.g. Time complexity O(n log n), Approach: Binary Search…"
                style={{ ...S.notesInput, marginBottom: 0 }}
              />
            </div>

          </div>

          {/* Final solution — always visible on left */}
          <div style={S.submitCodeStrip} className="coding-exam-submit">
            <div style={S.submitCodeLabel}>
              Final solution for HR
              <span style={{ color: C.dim, fontWeight: 500, marginLeft: 6 }}>
                (copy from compiler on the right →)
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitted}
              placeholder={`Paste or type your ${language} solution here before submitting to HR…`}
              style={S.submitCodeTA}
              spellCheck={false}
            />
            <div style={S.codeMeta}>
              {code.trim() ? `${code.split("\n").length} lines · ${code.length} chars` : "Waiting for your solution…"}
            </div>
          </div>

          {/* Submit footer */}
          {!isSubmitted && (
            <div style={S.leftFoot}>
              <button onClick={handleSubmit} disabled={submitting} style={S.submitFoot(submitting)}>
                {submitting ? "Submitting…" : "⬆  Submit Final Solution to HR"}
              </button>
            </div>
          )}
        </div>

        {/* ══ RIGHT: Live compiler (fills remaining height) ════════ */}
        <div style={S.right} className="coding-exam-right">
          <CompilerEmbed
            language={language}
            lockLanguage={!!test?.language}
            onLanguageChange={(l) => {
              setLanguage(l);
              if (!code || code === TEMPLATES[language]) setCode(TEMPLATES[l] || "");
            }}
            title="Code Compiler"
            subtitle={test?.title ? `Assessment: ${test.title}` : undefined}
            hrName={test?.createdBy?.name}
            fillHeight
            hideFooter
          />
        </div>
      </div>

      {/* ── Hidden camera elements for proctoring ───────────────── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: "none", width: 1, height: 1 }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Camera live indicator (floating badge) ──────────────── */}
      {phase === "exam" && (
        <div style={{
          position: "fixed",
          bottom: 18,
          right: 18,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: cameraActive ? "#0f1f14" : "#1f0f0f",
          border: `1px solid ${cameraActive ? C.green : C.red}`,
          borderRadius: 10,
          padding: "6px 12px",
          fontSize: 11,
          color: cameraActive ? C.green : C.red,
          fontWeight: 700,
          boxShadow: `0 2px 12px ${cameraActive ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"}`,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: cameraActive ? C.green : C.red,
            display: "inline-block",
            animation: "pulse 1.4s ease-in-out infinite",
          }} />
          {cameraActive ? `📷 Proctored · ${snapshotCount} snap${snapshotCount !== 1 ? "s" : ""}` : "🚫 Cam Offline"}
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes fade  { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
        ::-webkit-scrollbar       { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.brd2}; border-radius:4px; }
        textarea { caret-color: ${C.gold}; }
        select option { background:${C.panel}; }

        .coding-exam-body {
          display: grid !important;
          grid-template-columns: minmax(280px, 34%) 1fr;
          grid-template-rows: 1fr;
          min-height: 0 !important;
          height: calc(100vh - 56px) !important;
        }
        .coding-exam-left {
          display: grid !important;
          grid-template-rows: minmax(0, 1fr) auto auto;
          min-height: 0 !important;
          width: auto !important;
          max-width: none !important;
        }
        .coding-exam-left > div:first-child {
          min-height: 0;
          overflow-y: auto;
        }
        .coding-exam-submit {
          border-top: 2px solid ${C.goldD} !important;
          background: ${C.card} !important;
        }
        .coding-exam-right {
          min-height: 0 !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          padding: 6px !important;
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  cover: {
    position:"fixed", inset:0, zIndex:99999,
    background:C.bg, display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    color:C.text, fontFamily:"'Inter','Segoe UI',sans-serif",
  },
  spin: {
    width:44, height:44,
    border:`3px solid ${C.maroon}`, borderTopColor:C.gold,
    borderRadius:"50%", animation:"spin 0.9s linear infinite",
  },
  lpuTopBar: {
    position:"absolute", top:0, left:0, right:0,
    display:"flex", alignItems:"center", gap:14,
    padding:"14px 28px",
    background:C.maroon, borderBottom:`2px solid ${C.goldD}`,
  },
  lpuBadge: {
    width:48, height:48, borderRadius:11,
    background:C.gold, color:C.maroonD,
    fontSize:16, fontWeight:900, letterSpacing:1,
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:`0 4px 16px rgba(245,166,35,.45)`,
  },

  /* violation modal */
  modalBg: {
    position:"fixed", inset:0, zIndex:99998,
    background:"rgba(0,0,0,.9)", backdropFilter:"blur(6px)",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  modal: {
    background:"#1a1008", border:`1px solid ${C.gold}`,
    borderRadius:20, padding:"36px 40px",
    maxWidth:440, textAlign:"center",
    animation:"fade .2s ease",
    boxShadow:`0 0 60px rgba(245,166,35,.18)`,
  },
  goldBtn: {
    background:`linear-gradient(135deg,${C.gold},${C.goldD})`,
    color:C.maroonD, border:"none", borderRadius:10,
    padding:"10px 22px", fontSize:12, fontWeight:800, cursor:"pointer",
  },

  fsBar: {
    position:"fixed", top:0, left:0, right:0, zIndex:99990,
    background:C.red, padding:"6px 20px",
    display:"flex", alignItems:"center", justifyContent:"center", gap:16,
  },

  root: {
    position:"fixed", inset:0, zIndex:9999,
    display:"flex", flexDirection:"column",
    background:C.bg, color:C.text,
    fontFamily:"'Inter','Segoe UI',sans-serif",
    overflow:"hidden",
  },

  /* Header */
  header: {
    height:56, flexShrink:0,
    background:C.maroon,
    borderBottom:`2px solid ${C.goldD}`,
    padding:"0 18px",
    display:"flex", alignItems:"center", justifyContent:"space-between",
    boxShadow:"0 4px 24px rgba(0,0,0,.6)", zIndex:10,
  },
  lpuIcon: {
    width:40, height:40, borderRadius:10,
    background:C.gold, color:C.maroonD,
    fontSize:13, fontWeight:900, letterSpacing:1,
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:`0 4px 14px rgba(245,166,35,.5)`,
  },
  pill: (col) => ({
    fontSize:10, fontWeight:700, color:col,
    background:`${col}22`, border:`1px solid ${col}55`,
    padding:"3px 10px", borderRadius:999,
  }),
  timer: (u) => ({
    display:"flex", alignItems:"center", gap:6,
    padding:"5px 14px", borderRadius:999,
    background: u ? "rgba(127,29,29,.7)" : C.panel,
    border:`1px solid ${u ? C.red : C.maroon}`,
    color: u ? C.red : C.goldL,
    animation: u ? "pulse 1s infinite" : "none",
  }),
  submitBtn: (d) => ({
    padding:"7px 16px", borderRadius:10,
    background: d ? "#374151" : `linear-gradient(135deg,${C.gold},${C.goldD})`,
    color: d ? "#aaa" : C.maroonD,
    border:"none", cursor: d ? "not-allowed" : "pointer",
    fontSize:11, fontWeight:800, letterSpacing:.5,
    boxShadow: d ? "none" : `0 4px 14px rgba(245,166,35,.4)`,
  }),
  doneBadge: {
    padding:"5px 14px", borderRadius:999,
    background:"rgba(34,197,94,.15)", border:"1px solid rgba(34,197,94,.4)",
    color:C.green, fontSize:12, fontWeight:700,
  },
  closeBtn: {
    width:32, height:32, borderRadius:8,
    background:"transparent", border:`1px solid ${C.maroonL}`,
    color:C.mid, cursor:"pointer", fontSize:14,
    display:"flex", alignItems:"center", justifyContent:"center",
  },

  body: { flex:1, display:"flex", overflow:"hidden", minHeight:0 },

  /* Left panel */
  left: {
    background:C.panel,
    borderRight:`1px solid ${C.brd}`,
    overflow:"hidden",
  },
  leftScroll: { overflowY:"auto", padding:"14px 14px 8px" },
  leftFoot: {
    padding:"12px 16px", background:C.card,
    borderTop:`1px solid ${C.brd}`, flexShrink:0,
  },
  submitFoot: (d) => ({
    width:"100%", padding:"11px 0",
    background: d ? "#374151" : `linear-gradient(135deg,${C.gold},${C.goldD})`,
    color: d ? "#aaa" : C.maroonD, border:"none", borderRadius:12,
    fontSize:12, fontWeight:800, cursor: d ? "not-allowed" : "pointer",
    letterSpacing:.5, boxShadow: d ? "none" : `0 4px 20px rgba(245,166,35,.3)`,
  }),

  /* Question card */
  qCard: {
    background:C.card, border:`1px solid ${C.brd2}`,
    borderLeft:`3px solid ${C.maroon}`,
    borderRadius:12, padding:16, marginBottom:12,
  },
  diffBadge: (d) => {
    const m = { easy:["#22c55e","#052e16"], medium:[C.gold,"#1c1002"], hard:[C.red,"#1a0505"] };
    const [col, bg] = m[d?.toLowerCase()] || [C.mid, C.brd];
    return { fontSize:9, fontWeight:800, color:col, background:`${col}22`,
      border:`1px solid ${col}55`, padding:"2px 8px", borderRadius:999,
      textTransform:"uppercase", letterSpacing:1 };
  },
  langBadge: {
    fontSize:9, fontWeight:800, color:C.gold,
    background:`${C.gold}18`, border:`1px solid ${C.gold}44`,
    padding:"2px 8px", borderRadius:999, fontFamily:"monospace",
  },

  section: {
    background:C.card, border:`1px solid ${C.brd}`,
    borderRadius:12, padding:14, marginBottom:10,
  },
  sectionTitle: (col) => ({
    fontSize:11, fontWeight:700, color:col,
    textTransform:"uppercase", letterSpacing:1.2,
    marginBottom:8, display:"flex", alignItems:"center", gap:6,
  }),

  tcCard: {
    background:C.bg, border:`1px solid ${C.brd2}`,
    borderRadius:10, padding:12, marginBottom:10,
  },
  ioLabel: {
    fontSize:10, color:C.dim, fontWeight:700,
    textTransform:"uppercase", letterSpacing:.8, marginBottom:4,
  },
  ioPre: (col) => ({
    background:"#070710", padding:8, borderRadius:8,
    color:col, fontSize:11, fontFamily:"monospace",
    border:`1px solid ${C.brd}`, overflow:"auto", margin:0,
    maxHeight:80,
  }),
  notesInput: {
    width:"100%", background:C.bg,
    border:`1px solid ${C.brd2}`,
    borderRadius:8, padding:"7px 12px",
    fontSize:12, color:C.text, outline:"none", boxSizing:"border-box",
  },

  /* Right: live compiler */
  right: {
    minWidth:0, background:C.bg,
    overflow:"hidden",
  },
  submitCodeStrip: {
    padding:"10px 14px",
  },
  submitCodeLabel: {
    fontSize:11, fontWeight:800, color:C.goldL,
    marginBottom:6, letterSpacing:0.5,
  },
  submitCodeTA: {
    width:"100%", height:120,
    background:"#070710", color:"#d4d4d4",
    border:`1px solid ${C.brd}`, borderRadius:8,
    fontFamily:"'Fira Code','Consolas',monospace", fontSize:12,
    lineHeight:1.5, padding:10, resize:"none", outline:"none",
    boxSizing:"border-box",
  },
  codeMeta: {
    marginTop:6, fontSize:10, color:C.dim, fontFamily:"monospace",
  },
};
