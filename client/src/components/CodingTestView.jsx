import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import CompilerEmbed from "./CompilerEmbed";
import VettoraLoader from "./VettoraLoader";

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

const MAX_WARN = 5;

const collectFingerprint = () => ({
  userAgent: navigator.userAgent || "",
  screenResolution: `${screen.width}x${screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  language: navigator.language || "",
  platform: navigator.platform || "",
  cookieEnabled: navigator.cookieEnabled || false,
  doNotTrack: navigator.doNotTrack || "",
  hardwareConcurrency: navigator.hardwareConcurrency || 0,
  deviceMemory: navigator.deviceMemory || 0,
  colorDepth: screen.colorDepth || 0,
});

/* ════════════════════════════════════════════════════════════════ */
export default function CodingTestView({ testId, onClose, onSubmitted }) {
  const [test,         setTest]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [code,         setCode]         = useState("");
  const [notes,        setNotes]        = useState("");
  const [language,     setLanguage]     = useState("python");
  const [timeLeft,     setTimeLeft]     = useState(null);

  const [phase,        setPhase]        = useState("countdown");
  const [countdown,    setCountdown]    = useState(3);

  const [warnings,        setWarnings]        = useState(0);
  const [warnMsg,         setWarnMsg]         = useState("");
  const [showWarn,        setShowWarn]        = useState(false);
  const [tabCount,        setTabCount]        = useState(0);
  const [terminated,      setTerminated]      = useState(false);
  const [isFullscreen,    setIsFullscreen]    = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  /* refs — always stable, never stale */
  const rightClickCount   = useRef(0);
  const clipboardCount    = useRef(0);
  const devToolsCount     = useRef(0);
  const keyboardCount     = useRef(0);
  const mouseLeaveCount   = useRef(0);
  const focusLossCount    = useRef(0);
  const codePasteCount    = useRef(0);
  const fullscreenExits   = useRef(0);
  const screenshotCount   = useRef(0);
  const violationEvents   = useRef([]);
  const sessionStartTime  = useRef(Date.now());
  const fingerprint       = useRef(collectFingerprint());
  const submittingRef     = useRef(false);
  const testIdRef         = useRef(testId);
  const codeRef           = useRef(code);
  const notesRef          = useRef(notes);
  const languageRef       = useRef(language);
  const tabCountRef       = useRef(tabCount);
  const warnRef           = useRef(0);
  const submittingNow     = useRef(false);

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const socketRef   = useRef(null);
  const timerRef    = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);

  /* keep refs synced */
  testIdRef.current    = testId;
  codeRef.current      = code;
  notesRef.current     = notes;
  languageRef.current  = language;
  tabCountRef.current  = tabCount;

  const enterFS = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(() => {});
  };

  const buildAntiCheatPayload = () => ({
    warnings: warnRef.current,
    tabSwitches: tabCountRef.current,
    rightClickAttempts: rightClickCount.current,
    clipboardAttempts: clipboardCount.current,
    devToolsOpened: devToolsCount.current,
    keyboardBlockAttempts: keyboardCount.current,
    mouseLeaveCount: mouseLeaveCount.current,
    focusLossCount: focusLossCount.current,
    codePasteCount: codePasteCount.current,
    fullscreenExits: fullscreenExits.current,
    screenshotAttempts: screenshotCount.current,
    violationTimestamps: violationEvents.current.slice(-50),
    events: violationEvents.current.slice(-100),
  });

  /* ══ SUBMIT — uses refs only, never stale ═══════════════════════ */
  const doSubmit = useCallback(async (codeArg, notesArg, auto) => {
    if (submittingNow.current) return;
    submittingNow.current = true;
    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      await api.put(`/coding-tests/${testIdRef.current}/submit`, {
        submittedCode:  codeArg || "",
        submissionNotes: notesArg || (auto ? "Auto-submitted" : ""),
        antiCheatLog: buildAntiCheatPayload(),
        browserFingerprint: fingerprint.current,
        sessionDuration,
      });
      if (!auto) alert("Solution submitted to HR successfully!");
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message || "Submission failed";
      if (!auto) alert(msg);
      else console.error("Auto-submit failed:", msg);
    } finally {
      submittingNow.current = false;
    }
  }, [onSubmitted, onClose]);

  const handleSubmit = () => {
    const c = codeRef.current;
    if (!c.trim()) { alert("Write your solution before submitting!"); return; }
    if (!window.confirm("Submit your final solution to HR for review?")) return;
    doSubmit(c, notesRef.current, false);
  };

  const handleAutoSubmit = useCallback(() => {
    doSubmit(codeRef.current, notesRef.current, true);
  }, [doSubmit]);

  /* ══ WARNING SYSTEM ════════════════════════════════════════════ */
  const warn = useCallback((msg) => {
    warnRef.current += 1;
    setWarnings(warnRef.current);
    setWarnMsg(msg);
    setShowWarn(true);
    violationEvents.current.push(`${msg} @${new Date().toISOString()}`);
    setTimeout(() => setShowWarn(false), 4000);
    if (warnRef.current >= MAX_WARN) {
      setTerminated(true);
      setTimeout(() => handleAutoSubmit(), 2000);
    }
  }, [handleAutoSubmit]);

  /* ══ ANTI-CHEAT ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (phase !== "exam") return;

    const onContextMenu = (e) => {
      e.preventDefault();
      rightClickCount.current += 1;
      warn(`Right-click blocked (attempt #${rightClickCount.current})`);
      return false;
    };

    const BLOCKED_KEYS = new Set(["F12", "PrintScreen", "Insert", "ContextMenu"]);
    const BLOCKED_COMBOS = [
      { ctrl: true, shift: true, key: "I" },
      { ctrl: true, shift: true, key: "J" },
      { ctrl: true, shift: true, key: "C" },
      { ctrl: true, shift: true, key: "K" },
      { ctrl: true, key: "u" },
      { ctrl: true, key: "s" },
      { ctrl: true, key: "p" },
      { ctrl: true, key: "n" },
      { ctrl: true, key: "t" },
      { ctrl: true, key: "w" },
      { ctrl: true, key: "r" },
      { ctrl: true, key: "f" },
      { ctrl: true, key: "h" },
      { alt: true, key: "Tab" },
      { alt: true, key: "F4" },
    ];

    const onKeyDown = (e) => {
      const key = e.key;

      if (BLOCKED_KEYS.has(key)) {
        e.preventDefault();
        e.stopPropagation();
        keyboardCount.current += 1;
        if (key === "PrintScreen") {
          screenshotCount.current += 1;
          warn("Screenshot blocked (PrintScreen)");
        } else {
          warn(`Blocked key: ${key}`);
        }
        return false;
      }

      for (const combo of BLOCKED_COMBOS) {
        const ctrlMatch  = combo.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey;
        const altMatch   = combo.alt ? e.altKey : !e.altKey;
        const keyMatch   = combo.key.toLowerCase() === key.toLowerCase();
        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          e.stopPropagation();
          keyboardCount.current += 1;
          warn(`Blocked: ${(combo.ctrl?"Ctrl+":"")+(combo.shift?"Shift+":"")+(combo.alt?"Alt+":"")}${key}`);
          return false;
        }
      }
    };

    const onCopy = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      e.preventDefault(); clipboardCount.current += 1; warn("Copy blocked"); return false;
    };
    const onCut = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      e.preventDefault(); clipboardCount.current += 1; warn("Cut blocked"); return false;
    };
    const onPaste = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      e.preventDefault(); clipboardCount.current += 1; warn("Paste blocked"); return false;
    };
    const onDragStart = (e) => { e.preventDefault(); return false; };
    const onDrop = (e) => { e.preventDefault(); return false; };
    const onSelectStart = (e) => {
      if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); return false; }
    };

    let devToolsInterval = null;
    const checkDevTools = () => {
      const t = performance.now(); debugger;
      if (performance.now() - t > 160) {
        devToolsCount.current += 1;
        warn(`DevTools detected (#${devToolsCount.current})`);
      }
    };
    devToolsInterval = setInterval(checkDevTools, 5000);

    const onMouseLeave = (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        mouseLeaveCount.current += 1;
        warn(`Mouse left window (#${mouseLeaveCount.current})`);
      }
    };

    const onFS = () => {
      const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(full);
      if (!full) { fullscreenExits.current += 1; warn(`Fullscreen exited (#${fullscreenExits.current})`); }
    };

    const onVis = () => {
      if (document.hidden) {
        setIsWindowFocused(false);
        setTabCount((t) => t + 1);
        focusLossCount.current += 1;
        warn("Tab/window switched — return to test");
      } else {
        setIsWindowFocused(true);
      }
    };

    const onBlur = () => setIsWindowFocused(false);
    const onFocus = () => setIsWindowFocused(true);

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Leave? Your exam will be auto-submitted.";
      return e.returnValue;
    };

    document.addEventListener("contextmenu",     onContextMenu);
    document.addEventListener("keydown",         onKeyDown, true);
    document.addEventListener("copy",            onCopy, true);
    document.addEventListener("cut",             onCut, true);
    document.addEventListener("paste",           onPaste, true);
    document.addEventListener("dragstart",       onDragStart, true);
    document.addEventListener("drop",            onDrop, true);
    document.addEventListener("selectstart",     onSelectStart, true);
    document.addEventListener("fullscreenchange",       onFS);
    document.addEventListener("webkitfullscreenchange", onFS);
    document.addEventListener("visibilitychange",       onVis);
    document.addEventListener("blur",            onBlur);
    document.addEventListener("focus",           onFocus);
    document.addEventListener("beforeunload",   onBeforeUnload);

    if (navigator.clipboard) {
      navigator.clipboard.readText = () => Promise.reject(new Error("Blocked"));
      navigator.clipboard.writeText = () => Promise.reject(new Error("Blocked"));
    }
    if (navigator.mediaDevices?.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = () => Promise.reject(new Error("Blocked"));
    }

    return () => {
      document.removeEventListener("contextmenu",     onContextMenu);
      document.removeEventListener("keydown",         onKeyDown, true);
      document.removeEventListener("copy",            onCopy, true);
      document.removeEventListener("cut",             onCut, true);
      document.removeEventListener("paste",           onPaste, true);
      document.removeEventListener("dragstart",       onDragStart, true);
      document.removeEventListener("drop",            onDrop, true);
      document.removeEventListener("selectstart",     onSelectStart, true);
      document.removeEventListener("fullscreenchange",       onFS);
      document.removeEventListener("webkitfullscreenchange", onFS);
      document.removeEventListener("visibilitychange",       onVis);
      document.removeEventListener("blur",            onBlur);
      document.removeEventListener("focus",           onFocus);
      document.removeEventListener("beforeunload",   onBeforeUnload);
      if (devToolsInterval) clearInterval(devToolsInterval);
    };
  }, [phase, warn]);

  /* ══ CAMERA PROCTORING ═════════════════════════════════════════ */
  useEffect(() => {
    if (phase !== "exam") return;
    let streamTrack = null;
    let snapIv = null;
    let frameIv = null;

    const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    socketRef.current = io(isDev ? "http://localhost:5000" : window.location.origin, {
      auth: { token: localStorage.getItem("token") }
    });

    navigator.mediaDevices?.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
        streamTrack = stream.getVideoTracks()[0];
        setCameraActive(true);

        const captureAndUpload = async () => {
          if (!videoRef.current || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = 320; canvas.height = 240;
          canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
          const base64 = canvas.toDataURL("image/jpeg", 0.35);
          try { await api.put(`/coding-tests/${testId}/snapshot`, { imageBase64: base64 }); setSnapshotCount((c) => c + 1); }
          catch (err) { console.warn("Snapshot failed:", err); }
        };

        setTimeout(captureAndUpload, 2000);
        snapIv = setInterval(captureAndUpload, 60000);

        frameIv = setInterval(() => {
          if (!videoRef.current || !canvasRef.current || !socketRef.current) return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = 240; canvas.height = 180;
          canvas.getContext("2d").drawImage(video, 0, 0, 240, 180);
          socketRef.current.emit("proctor-frame", { testId, frame: canvas.toDataURL("image/jpeg", 0.3) });
        }, 3000);
      })
      .catch(() => setCameraActive(false));

    return () => {
      if (streamTrack) streamTrack.stop();
      if (snapIv) clearInterval(snapIv);
      if (frameIv) clearInterval(frameIv);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [phase, testId]);

  /* ══ COUNTDOWN ═════════════════════════════════════════════════ */
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

  /* ══ FETCH TEST ════════════════════════════════════════════════ */
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/coding-tests/${testId}`);
        const t = r.data;
        setTest(t);
        const lg = t.language || "python";
        setLanguage(lg);
        setCode(t.submittedCode || TEMPLATES[lg] || "");
        if (t.submissionNotes) setNotes(t.submissionNotes);
        if (!t.startedAt && t.status !== "submitted") {
          await api.put(`/coding-tests/${testId}/start`);
          setTest(prev => ({ ...prev, startedAt: new Date(), status: "in_progress" }));
        }
        if (t.status === "submitted" || t.status === "reviewed") setPhase("done");
      } catch (e) { alert(e.response?.data?.message || "Failed to load"); onClose(); }
      finally { setLoading(false); }
    })();
    return () => clearInterval(timerRef.current);
  }, [testId]);

  /* ══ TIMER ═════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!test || phase === "done") return;
    const dur = (test.durationMinutes || 30) * 60;
    const start = test.startedAt ? new Date(test.startedAt).getTime() : Date.now();
    const tick = () => {
      const rem = dur - Math.floor((Date.now() - start) / 1000);
      if (rem <= 0) { setTimeLeft(0); clearInterval(timerRef.current); handleAutoSubmit(); }
      else setTimeLeft(rem);
    };
    tick(); timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [test?.startedAt, test?.durationMinutes, phase, handleAutoSubmit]);

  const fmt = (s) => s == null ? "--:--"
    : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const urgent = timeLeft !== null && timeLeft < 300;
  const isSubmitted = phase === "done" || test?.status === "submitted" || test?.status === "reviewed";

  /* ══ LOADING ═══════════════════════════════════════════════════ */
  if (loading) return <VettoraLoader message="Initialising LPU Secure Assessment…" />;

  /* ══ TERMINATED ════════════════════════════════════════════════ */
  if (terminated) return (
    <div style={S.cover}>
      <div style={{ background: "#1a0808", border: `1px solid ${C.red}`, borderRadius: 20, padding: "36px 40px", maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 14 }}>🚫</div>
        <h2 style={{ color: C.red, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Exam Terminated</h2>
        <p style={{ color: C.mid, fontSize: 12, lineHeight: 1.8, marginBottom: 12 }}>
          You exceeded {MAX_WARN} security violations. Your session has been flagged.
        </p>
        <div style={{ background: "#0d0d15", border: `1px solid ${C.brd}`, borderRadius: 10, padding: 12, marginBottom: 16, textAlign: "left" }}>
          {[
            `Warnings: ${warnRef.current}`,
            `Tab switches: ${tabCountRef.current}`,
            `Blocked keys: ${keyboardCount.current}`,
            `Right-clicks: ${rightClickCount.current}`,
            `Clipboard: ${clipboardCount.current}`,
            `DevTools: ${devToolsCount.current}`,
            `Mouse exits: ${mouseLeaveCount.current}`,
            `Fullscreen exits: ${fullscreenExits.current}`,
          ].map((line, i) => (
            <div key={i} style={{ fontSize: 10, color: C.red, fontFamily: "monospace", padding: "2px 0" }}>{line}</div>
          ))}
        </div>
        <p style={{ color: C.mid, fontSize: 11, marginBottom: 20 }}>Auto-submitting your current code…</p>
        <button onClick={handleAutoSubmit} style={{ background: C.red, color: "#fff", border: "none", padding: "10px 28px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
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
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Lovely Professional University</div>
          <div style={{ fontSize: 10, color: C.mid }}>Secure Coding Assessment Portal</div>
        </div>
      </div>
      <div style={{ textAlign: "center", maxWidth: 500, padding: "0 24px" }}>
        <div style={{ fontSize: 56, marginBottom: 16, filter: "drop-shadow(0 0 20px rgba(245,166,35,.4))" }}>🛡️</div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
          Entering Secure Exam Environment
        </h2>
        <div style={{ fontSize: 100, fontWeight: 900, fontFamily: "monospace", lineHeight: 1, marginBottom: 30,
          background: `linear-gradient(135deg,${C.gold},${C.maroonL},${C.goldL})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "pulse 0.8s ease-in-out infinite" }}>
          {countdown}
        </div>
        <div style={{ background: "#14141f", border: `1px solid ${C.maroon}`, borderRadius: 14, padding: "16px 24px", textAlign: "left" }}>
          {[
            "Right-click, copy, paste, and keyboard shortcuts are disabled",
            "Switching tabs or windows is tracked and counted",
            "Developer tools and screenshots are blocked and logged",
            "Leaving the browser window is tracked",
            `${MAX_WARN} violations will auto-submit and flag your session`,
            "Keep your camera on for live proctoring throughout",
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0",
              borderBottom: i < 5 ? `1px solid ${C.brd}` : "none", fontSize: 12, color: C.mid }}>
              <span style={{ color: C.gold, fontSize: 14 }}>⚑</span> {r}
            </div>
          ))}
        </div>
        <p style={{ color: C.dim, fontSize: 11, marginTop: 14 }}>Fullscreen activates automatically…</p>
      </div>
    </div>
  );

  /* ══ MAIN EXAM ══════════════════════════════════════════════════ */
  return (
    <div style={{ ...S.root, userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}>

      {/* window lost overlay */}
      {!isWindowFocused && phase === "exam" && !terminated && (
        <div style={S.modalBg}>
          <div style={{ ...S.modal, border: `2px solid ${C.gold}`, background: "#1a1008" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <h3 style={{ color: C.gold, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Please Return to Your Test</h3>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              You switched away from the test window. Please click back on the test tab.
            </p>
            <p style={{ color: C.mid, fontSize: 12, fontWeight: 500, marginBottom: 20 }}>
              Warning {warnings} / {MAX_WARN} logged.
            </p>
            <button onClick={() => { setIsWindowFocused(true); setShowWarn(false); enterFS(); }} style={S.goldBtn}>
              Return to Test
            </button>
          </div>
        </div>
      )}

      {/* violation modal */}
      {showWarn && !terminated && (
        <div style={S.modalBg}>
          <div style={S.modal}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: C.gold, fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Heads Up</h3>
            <p style={{ color: C.text, fontSize: 12, lineHeight: 1.7, marginBottom: 6 }}>{warnMsg}</p>
            <p style={{ color: C.mid, fontSize: 12, fontWeight: 500, marginBottom: 20 }}>
              Warning {warnings} / {MAX_WARN} — Stay in the exam window.
            </p>
            <button onClick={() => { setShowWarn(false); enterFS(); }} style={S.goldBtn}>Got It</button>
          </div>
        </div>
      )}

      {/* fullscreen nag */}
      {!isFullscreen && phase === "exam" && !showWarn && (
        <div style={S.fsBar}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Fullscreen recommended</span>
          <button onClick={enterFS} style={{ background: "white", color: C.maroon, border: "none",
            padding: "3px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Enter Fullscreen
          </button>
          <button onClick={() => setIsFullscreen(true)} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
            padding: "3px 14px", borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
            Continue
          </button>
        </div>
      )}

      {/* HEADER */}
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={S.lpuIcon}>LPU</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{test?.title || "Coding Assessment"}</div>
            <div style={{ fontSize: 10, color: C.mid }}>
              Lovely Professional University &nbsp;·&nbsp;
              <span style={{ color: C.goldL }}>{test?.job?.title || "Technical Round"}</span>
              &nbsp;·&nbsp; HR: <span style={{ color: C.goldL }}>{test?.createdBy?.name || "–"}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={S.pill(warnings === 0 ? C.green : warnings <= 2 ? C.gold : C.red)}>
            🛡️ Proctored · Warns: {warnings}/{MAX_WARN}
          </div>
          {tabCount > 0 && <div style={S.pill(C.red)}>Tabs: {tabCount}</div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isSubmitted && (
            <div style={S.timer(urgent)}>
              <span>⏱</span>
              <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 17, letterSpacing: 3 }}>{fmt(timeLeft)}</span>
              <span style={{ fontSize: 9, opacity: .7 }}>left</span>
            </div>
          )}

          {!isSubmitted ? (
            <button onClick={handleSubmit} style={S.submitBtn(false)}>
              ⬆ Submit to HR
            </button>
          ) : (
            <div style={S.doneBadge}>✅ Submitted</div>
          )}

          <button onClick={() => {
            if (window.confirm("Exit exam? Unsaved work may be lost.")) {
              if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
              onClose();
            }
          }} style={S.closeBtn} title="Exit">✕</button>
        </div>
      </header>

      {/* BODY */}
      <div style={S.body} className="coding-exam-body">
        <div style={S.left} className="coding-exam-left">
          <div style={S.leftScroll}>
            <div style={S.qCard}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{test?.title || "Problem"}</h2>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {test?.difficulty && <span style={S.diffBadge(test.difficulty)}>{test.difficulty.toUpperCase()}</span>}
                  <span style={S.langBadge}>{language.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{test?.description}</div>
            </div>

            {test?.constraints && (
              <div style={S.section}>
                <div style={S.sectionTitle("#60a5fa")}>📐 Constraints</div>
                <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{test.constraints}</div>
              </div>
            )}

            {(test?.inputFormat || test?.outputFormat) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {test.inputFormat && (
                  <div style={S.section}>
                    <div style={S.sectionTitle("#a78bfa")}>📥 Input Format</div>
                    <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{test.inputFormat}</div>
                  </div>
                )}
                {test.outputFormat && (
                  <div style={S.section}>
                    <div style={S.sectionTitle("#34d399")}>📤 Output Format</div>
                    <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>{test.outputFormat}</div>
                  </div>
                )}
              </div>
            )}

            {test?.testCases?.length > 0 && (
              <div>
                <div style={S.sectionTitle(C.gold)}>🧪 Sample Test Cases</div>
                {test.testCases.map((tc, i) => (
                  <div key={i} style={S.tcCard}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.goldL, marginBottom: 10 }}>
                      Example {i + 1}{tc.description ? ` — ${tc.description}` : ""}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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

            <div style={S.section}>
              <div style={S.sectionTitle(C.mid)}>💬 Notes for HR (Optional)</div>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isSubmitted}
                placeholder="e.g. Time complexity O(n log n)…"
                style={{ ...S.notesInput, marginBottom: 0 }}
              />
            </div>
          </div>

          {/* Final solution textarea */}
          <div style={S.submitCodeStrip} className="coding-exam-submit">
            <div style={S.submitCodeLabel}>
              Final solution for HR
              <span style={{ color: C.dim, fontWeight: 500, marginLeft: 6 }}>(copy from compiler →)</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitted}
              placeholder={`Paste or type your ${language} solution here…`}
              style={S.submitCodeTA}
              spellCheck={false}
            />
            <div style={S.codeMeta}>
              {code.trim() ? `${code.split("\n").length} lines · ${code.length} chars` : "Waiting for your solution…"}
            </div>
          </div>

          {!isSubmitted && (
            <div style={S.leftFoot}>
              <button onClick={handleSubmit} style={S.submitFoot(false)}>
                ⬆ Submit Final Solution to HR
              </button>
            </div>
          )}
        </div>

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

      {/* Hidden camera */}
      <video ref={videoRef} autoPlay muted playsInline style={{ display: "none", width: 1, height: 1 }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Camera indicator */}
      {phase === "exam" && (
        <div style={{
          position: "fixed", bottom: 18, right: 18, zIndex: 99999,
          display: "flex", alignItems: "center", gap: 8,
          background: cameraActive ? "#0f1f14" : "#1f0f0f",
          border: `1px solid ${cameraActive ? C.green : C.red}`,
          borderRadius: 10, padding: "6px 12px", fontSize: 11,
          color: cameraActive ? C.green : C.red, fontWeight: 700,
          boxShadow: `0 2px 12px ${cameraActive ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"}`,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: cameraActive ? C.green : C.red,
            display: "inline-block", animation: "pulse 1.4s ease-in-out infinite",
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
        .coding-exam-body { display:grid !important; grid-template-columns: minmax(280px,34%) 1fr; grid-template-rows:1fr; min-height:0 !important; height:calc(100vh - 56px) !important; }
        .coding-exam-left { display:grid !important; grid-template-rows: minmax(0,1fr) auto auto; min-height:0 !important; width:auto !important; max-width:none !important; }
        .coding-exam-left > div:first-child { min-height:0; overflow-y:auto; }
        .coding-exam-submit { border-top:2px solid ${C.goldD} !important; background:${C.card} !important; }
        .coding-exam-right { min-height:0 !important; height:100% !important; display:flex !important; flex-direction:column !important; padding:6px !important; }
      `}</style>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  cover: { position:"fixed", inset:0, zIndex:99999, background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.text, fontFamily:"'Inter','Segoe UI',sans-serif" },
  spin: { width:44, height:44, border:`3px solid ${C.maroon}`, borderTopColor:C.gold, borderRadius:"50%", animation:"spin 0.9s linear infinite" },
  lpuTopBar: { position:"absolute", top:0, left:0, right:0, display:"flex", alignItems:"center", gap:14, padding:"14px 28px", background:C.maroon, borderBottom:`2px solid ${C.goldD}` },
  lpuBadge: { width:48, height:48, borderRadius:11, background:C.gold, color:C.maroonD, fontSize:16, fontWeight:900, letterSpacing:1, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 16px rgba(245,166,35,.45)` },
  modalBg: { position:"fixed", inset:0, zIndex:99998, background:"rgba(0,0,0,.9)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center" },
  modal: { background:"#1a1008", border:`1px solid ${C.gold}`, borderRadius:20, padding:"36px 40px", maxWidth:440, textAlign:"center", animation:"fade .2s ease", boxShadow:`0 0 60px rgba(245,166,35,.18)` },
  goldBtn: { background:`linear-gradient(135deg,${C.gold},${C.goldD})`, color:C.maroonD, border:"none", borderRadius:10, padding:"10px 22px", fontSize:12, fontWeight:800, cursor:"pointer" },
  fsBar: { position:"fixed", top:0, left:0, right:0, zIndex:99990, background:C.maroon, padding:"6px 20px", display:"flex", alignItems:"center", justifyContent:"center", gap:16 },
  root: { position:"fixed", inset:0, zIndex:9999, display:"flex", flexDirection:"column", background:C.bg, color:C.text, fontFamily:"'Inter','Segoe UI',sans-serif", overflow:"hidden" },
  header: { height:56, flexShrink:0, background:C.maroon, borderBottom:`2px solid ${C.goldD}`, padding:"0 18px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 4px 24px rgba(0,0,0,.6)", zIndex:10 },
  lpuIcon: { width:40, height:40, borderRadius:10, background:C.gold, color:C.maroonD, fontSize:13, fontWeight:900, letterSpacing:1, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px rgba(245,166,35,.5)` },
  pill: (col) => ({ fontSize:10, fontWeight:700, color:col, background:`${col}22`, border:`1px solid ${col}55`, padding:"3px 10px", borderRadius:999 }),
  timer: (u) => ({ display:"flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:999, background:u?"rgba(127,29,29,.7)":C.panel, border:`1px solid ${u?C.red:C.maroon}`, color:u?C.red:C.goldL, animation:u?"pulse 1s infinite":"none" }),
  submitBtn: (d) => ({ padding:"7px 16px", borderRadius:10, background:`linear-gradient(135deg,${C.gold},${C.goldD})`, color:C.maroonD, border:"none", cursor:"pointer", fontSize:11, fontWeight:800, letterSpacing:.5, boxShadow:`0 4px 14px rgba(245,166,35,.4)` }),
  doneBadge: { padding:"5px 14px", borderRadius:999, background:"rgba(34,197,94,.15)", border:"1px solid rgba(34,197,94,.4)", color:C.green, fontSize:12, fontWeight:700 },
  closeBtn: { width:32, height:32, borderRadius:8, background:"transparent", border:`1px solid ${C.maroonL}`, color:C.mid, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  body: { flex:1, display:"flex", overflow:"hidden", minHeight:0 },
  left: { background:C.panel, borderRight:`1px solid ${C.brd}`, overflow:"hidden" },
  leftScroll: { overflowY:"auto", padding:"14px 14px 8px" },
  leftFoot: { padding:"12px 16px", background:C.card, borderTop:`1px solid ${C.brd}`, flexShrink:0 },
  submitFoot: (d) => ({ width:"100%", padding:"11px 0", background:`linear-gradient(135deg,${C.gold},${C.goldD})`, color:C.maroonD, border:"none", borderRadius:12, fontSize:12, fontWeight:800, cursor:"pointer", letterSpacing:.5, boxShadow:`0 4px 20px rgba(245,166,35,.3)` }),
  qCard: { background:C.card, border:`1px solid ${C.brd2}`, borderLeft:`3px solid ${C.maroon}`, borderRadius:12, padding:16, marginBottom:12 },
  diffBadge: (d) => { const m={easy:["#22c55e","#052e16"],medium:[C.gold,"#1c1002"],hard:[C.red,"#1a0505"]}; const [col,bg]=m[d?.toLowerCase()]||[C.mid,C.brd]; return { fontSize:9, fontWeight:800, color:col, background:`${col}22`, border:`1px solid ${col}55`, padding:"2px 8px", borderRadius:999, textTransform:"uppercase", letterSpacing:1 }; },
  langBadge: { fontSize:9, fontWeight:800, color:C.gold, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, padding:"2px 8px", borderRadius:999, fontFamily:"monospace" },
  section: { background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, padding:14, marginBottom:10 },
  sectionTitle: (col) => ({ fontSize:11, fontWeight:700, color:col, textTransform:"uppercase", letterSpacing:1.2, marginBottom:8, display:"flex", alignItems:"center", gap:6 }),
  tcCard: { background:C.bg, border:`1px solid ${C.brd2}`, borderRadius:10, padding:12, marginBottom:10 },
  ioLabel: { fontSize:10, color:C.dim, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, marginBottom:4 },
  ioPre: (col) => ({ background:"#070710", padding:8, borderRadius:8, color:col, fontSize:11, fontFamily:"monospace", border:`1px solid ${C.brd}`, overflow:"auto", margin:0, maxHeight:80 }),
  notesInput: { width:"100%", background:C.bg, border:`1px solid ${C.brd2}`, borderRadius:8, padding:"7px 12px", fontSize:12, color:C.text, outline:"none", boxSizing:"border-box" },
  right: { minWidth:0, background:C.bg, overflow:"hidden" },
  submitCodeStrip: { padding:"10px 14px" },
  submitCodeLabel: { fontSize:11, fontWeight:800, color:C.goldL, marginBottom:6, letterSpacing:0.5 },
  submitCodeTA: { width:"100%", height:120, background:"#070710", color:"#d4d4d4", border:`1px solid ${C.brd}`, borderRadius:8, fontFamily:"'Fira Code','Consolas',monospace", fontSize:12, lineHeight:1.5, padding:10, resize:"none", outline:"none", boxSizing:"border-box" },
  codeMeta: { marginTop:6, fontSize:10, color:C.dim, fontFamily:"monospace" },
};
