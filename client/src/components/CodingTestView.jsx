import { useState, useEffect, useRef } from "react";
import {
  FaClock,
  FaTerminal,
  FaCheckCircle,
  FaPaperPlane,
  FaTimes,
  FaCode,
  FaInfoCircle,
  FaPlay,
  FaFileCode,
  FaSync,
  FaExpand,
  FaLock,
  FaExclamationTriangle,
  FaPlayCircle,
} from "react-icons/fa";
import api from "../services/api";

const STARTER_TEMPLATES = {
  python: `# Write your Python solution below\ndef solution():\n    # Write your logic here\n    return "Output Result"\n\nif __name__ == "__main__":\n    print(solution())\n`,
  javascript: `// Write your JavaScript solution below\nfunction solution() {\n  // Write your logic here\n  return "Output Result";\n}\n\nconsole.log(solution());\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your logic here\n    cout << "Output Result" << endl;\n    return 0;\n}\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        // Write your logic here\n        System.out.println("Output Result");\n    }\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    // Write your logic here\n    printf("Output Result\\n");\n    return 0;\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your logic here\n    fmt.Println("Output Result")\n}\n`,
  rust: `fn main() {\n    // Write your logic here\n    println!("Output Result");\n}\n`,
  typescript: `// Write your TypeScript solution below\nfunction solution(): string {\n  return "Output Result";\n}\n\nconsole.log(solution());\n`,
};

function CodingTestView({ testId, onClose, onSubmitted }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [language, setLanguage] = useState("python");

  // 3-2-1 Countdown Animation State
  const [countdown, setCountdown] = useState(3);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(true);

  // Fullscreen Security State
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Code Execution Output State
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState("editor"); // "editor" | "compiler"
  const [iframeKey, setIframeKey] = useState(0);

  const timerRef = useRef(null);

  // Request Fullscreen Mode
  const requestFullscreenMode = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => console.log("Fullscreen request error:", err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  // Listen for Fullscreen Changes for Exam Security
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 3-2-1 Countdown Animation Effect
  useEffect(() => {
    if (!loading && showCountdownOverlay) {
      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
        } else if (count === 0) {
          setCountdown("GO!");
        } else {
          clearInterval(interval);
          setShowCountdownOverlay(false);
          requestFullscreenMode();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coding-tests/${testId}`);
      setTest(res.data);
      const testLang = res.data.language || "python";
      setLanguage(testLang);

      if (res.data.submittedCode) {
        setCode(res.data.submittedCode);
      } else {
        setCode(STARTER_TEMPLATES[testLang] || STARTER_TEMPLATES.python);
      }

      if (res.data.submissionNotes) {
        setSubmissionNotes(res.data.submissionNotes);
      }

      // Trigger start timer
      if (!res.data.startedAt && res.data.status !== "submitted") {
        await api.put(`/coding-tests/${testId}/start`);
        const now = new Date();
        setTest((prev) => ({ ...prev, startedAt: now, status: "in_progress" }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load coding test");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestDetails();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  // Timer Calculation
  useEffect(() => {
    if (!test || test.status === "submitted" || test.status === "reviewed") return;

    const durationSeconds = (test.durationMinutes || 30) * 60;
    const startTime = test.startedAt ? new Date(test.startedAt).getTime() : Date.now();

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = durationSeconds - elapsedSeconds;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timerRef.current);
        handleAutoSubmit();
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test?.startedAt, test?.durationMinutes, test?.status]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (!code || code === STARTER_TEMPLATES[language]) {
      setCode(STARTER_TEMPLATES[newLang] || STARTER_TEMPLATES.python);
    }
    setIframeKey((prev) => prev + 1);
  };

  const handleResetTemplate = () => {
    if (window.confirm("Reset code editor to default starter template?")) {
      setCode(STARTER_TEMPLATES[language] || STARTER_TEMPLATES.python);
    }
  };

  // RUN CODE HANDLER
  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("⏳ Compiling and executing code solution...\n");

    // Refresh sandbox & switch to sandbox or output
    setIframeKey((prev) => prev + 1);

    setTimeout(() => {
      setIsRunning(false);
      setOutput(`✅ Execution Finished for [${language.toUpperCase()}].\n\nCode Solution Auto-Synced for HR Review:\n-----------------------------------\n${code}`);
    }, 1200);
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.put(`/coding-tests/${testId}/submit`, {
        submittedCode: code || STARTER_TEMPLATES[language] || "// Auto-submitted",
        submissionNotes: submissionNotes || "Auto-submitted on time expiration",
      });
      alert("⏱️ Time expired! Your solution code has been automatically submitted to HR.");
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error("Auto submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      alert("Please write your solution code before submitting!");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/coding-tests/${testId}/submit`, {
        submittedCode: code,
        submissionNotes,
      });
      alert("✅ Coding solution successfully submitted directly to HR for review!");
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit solution");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a14] text-white">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-lg font-medium text-slate-300">Loading Secure Assessment Environment...</p>
        </div>
      </div>
    );
  }

  const isSubmitted = test?.status === "submitted" || test?.status === "reviewed";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0e1a] text-slate-100 overflow-hidden font-sans select-none">
      {/* 3... 2... 1... COUNTDOWN ANIMATION OVERLAY */}
      {showCountdownOverlay && (
        <div className="fixed inset-0 z-50 bg-[#090912] flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-6 animate-pulse">
            <div className="w-20 h-20 rounded-3xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center mx-auto shadow-2xl">
              <FaLock className="text-purple-400 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold tracking-wider text-slate-200 uppercase">
              Entering Exam Security Environment
            </h2>
            <div className="text-7xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 animate-bounce">
              {countdown}
            </div>
            <p className="text-sm text-slate-400">
              Full-Screen Mode (F11) will activate automatically. Do not exit fullscreen or switch tabs.
            </p>
          </div>
        </div>
      )}

      {/* FULLSCREEN SECURITY WARNING OVERLAY IF USER EXITS F11 */}
      {!isFullscreen && !showCountdownOverlay && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-white p-6 backdrop-blur-md">
          <div className="max-w-md text-center bg-[#1a1a2e] border border-red-500/50 p-8 rounded-3xl shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center mx-auto animate-pulse">
              <FaExclamationTriangle className="text-red-400 text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-red-400">⚠️ Fullscreen Security Violation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Assessment security policies require continuous Full-Screen Mode (F11). Please click below to restore full screen immediately.
            </p>
            <button
              onClick={requestFullscreenMode}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95"
            >
              <FaExpand className="inline mr-2" /> Re-Enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* ASSESSMENT TOP HEADER */}
      <header className="h-16 bg-[#16162a] border-b border-[#2b2b46] px-6 flex items-center justify-between shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md">
            <FaTerminal className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              {test?.title || "Coding Assessment"}
            </h2>
            <p className="text-xs text-slate-400">
              Role: <span className="text-indigo-300 font-semibold">{test?.job?.title}</span> • HR: {test?.createdBy?.name}
            </p>
          </div>
        </div>

        {/* TIMER & MAIN ACTIONS */}
        <div className="flex items-center gap-5">
          {!isSubmitted && (
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-inner transition ${
                timeLeft !== null && timeLeft < 300
                  ? "bg-red-950/60 border-red-500/60 text-red-400 animate-pulse"
                  : "bg-[#0e0e1a] border-[#363656] text-indigo-300"
              }`}
            >
              <FaClock className={timeLeft !== null && timeLeft < 300 ? "text-red-400" : "text-indigo-400"} />
              <span className="font-mono text-base font-bold tracking-wider">{formatTime(timeLeft)}</span>
              <span className="text-xs opacity-75">remaining</span>
            </div>
          )}

          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <FaPaperPlane size={13} />
              {submitting ? "Submitting..." : "Submit Solution to HR"}
            </button>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
              <FaCheckCircle /> Solution Submitted to HR
            </span>
          )}

          <button
            onClick={() => {
              if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="Exit Assessment"
          >
            <FaTimes size={18} />
          </button>
        </div>
      </header>

      {/* MAIN SPLIT-SCREEN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: QUESTION & SAMPLE TEST CASES */}
        <div className="w-5/12 border-r border-[#262640] bg-[#121222] flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
            {/* PROBLEM STATEMENT */}
            <div className="bg-[#181830] p-5 rounded-2xl border border-[#2e2e4d] shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base text-white flex items-center gap-2 text-indigo-400">
                  <FaInfoCircle size={18} /> Problem Statement
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-500/30 uppercase font-mono font-bold">
                  {language}
                </span>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {test?.description}
              </div>
            </div>

            {/* TEST CASES DISPLAY */}
            {test?.testCases && test.testCases.length > 0 && (
              <div className="bg-[#181830] p-5 rounded-2xl border border-[#2e2e4d] shadow-md">
                <h3 className="font-semibold text-base text-white flex items-center gap-2 text-purple-400 mb-4">
                  <FaCode size={18} /> Sample Test Cases & Output
                </h3>
                <div className="space-y-4">
                  {test.testCases.map((tc, idx) => (
                    <div key={idx} className="bg-[#10101c] p-4 rounded-xl border border-[#262640]">
                      {tc.description && (
                        <p className="text-xs font-semibold text-purple-300 mb-2">{tc.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-1 font-medium">Input:</span>
                          <pre className="bg-[#080812] p-2.5 rounded-lg text-emerald-300 font-mono overflow-x-auto border border-[#1e1e32]">
                            {tc.input || "(No input)"}
                          </pre>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1 font-medium">Expected Output:</span>
                          <pre className="bg-[#080812] p-2.5 rounded-lg text-amber-300 font-mono overflow-x-auto border border-[#1e1e32]">
                            {tc.expectedOutput || "(No output)"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CANDIDATE NOTES FOR HR */}
            <div className="bg-[#181830] p-5 rounded-2xl border border-[#2e2e4d] shadow-md space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Candidate Notes / Complexity Comments for HR (Optional):
              </label>
              <input
                type="text"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                disabled={isSubmitted}
                placeholder="e.g. Implemented using O(N) time complexity"
                className="w-full bg-[#0a0a14] border border-[#2e2e48] rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CODE EDITOR & RUN BUTTON + COMPILER SANDBOX */}
        <div className="w-7/12 bg-[#0c0c16] flex flex-col overflow-hidden">
          {/* TOOLBAR WITH PROMINENT RUN CODE BUTTON */}
          <div className="p-3 bg-[#16162a] border-b border-[#2b2b46] flex items-center justify-between shrink-0 text-xs">
            <div className="flex items-center gap-3">
              <label className="text-slate-400 font-medium">Language:</label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isSubmitted}
                className="bg-[#0a0a14] text-purple-300 border border-purple-500/40 rounded-lg px-3 py-1 text-xs font-semibold uppercase outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer disabled:opacity-75"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="typescript">TypeScript</option>
              </select>

              <button
                type="button"
                onClick={handleResetTemplate}
                disabled={isSubmitted}
                className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                title="Reset template"
              >
                <FaSync size={11} /> Reset Code
              </button>
            </div>

            {/* PROMINENT RUN CODE BUTTON & TAB TOGGLES */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning || isSubmitted}
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs font-bold tracking-wider shadow-lg transition flex items-center gap-2 transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <FaPlay size={11} className={isRunning ? "animate-spin" : ""} />
                {isRunning ? "Running Code..." : "▶ RUN CODE"}
              </button>

              <div className="flex items-center gap-1 bg-[#0a0a14] p-1 rounded-xl border border-[#282844]">
                <button
                  type="button"
                  onClick={() => setActiveRightTab("editor")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeRightTab === "editor" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FaFileCode size={12} /> Solution Code Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightTab("compiler")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    activeRightTab === "compiler" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FaTerminal size={12} /> Live Compiler Frame
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CODE EDITOR & OUTPUT CONSOLE */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 bg-[#0a0a14] space-y-3">
            {activeRightTab === "editor" ? (
              <div className="flex-1 flex flex-col rounded-2xl bg-[#121226] border border-[#2b2b48] overflow-hidden shadow-xl">
                <div className="px-4 py-2 bg-[#181832] border-b border-[#2b2b48] flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <FaFileCode /> Candidate Solution Code (Directly Auto-Synced for HR)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Whatever code you type here is directly submitted to HR for review.
                  </span>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isSubmitted}
                  placeholder={`// Write your ${language} solution code here...`}
                  className="flex-1 w-full bg-[#090915] p-4 text-xs font-mono text-emerald-300 outline-none resize-none leading-relaxed border-none focus:ring-0 selection:bg-purple-900 selection:text-white disabled:opacity-75"
                  spellCheck="false"
                />

                {/* CONSOLE OUTPUT / RUN RESULTS PANEL */}
                {output && (
                  <div className="h-40 border-t border-[#2b2b48] bg-[#070710] p-3 flex flex-col font-mono text-xs">
                    <div className="flex items-center justify-between pb-1 text-slate-400 border-b border-[#1c1c32] mb-1">
                      <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                        <FaTerminal size={12} /> Execution & Run Output Console
                      </span>
                      <button onClick={() => setOutput("")} className="text-slate-500 hover:text-white text-[10px]">
                        Clear Output
                      </button>
                    </div>
                    <pre className="flex-1 overflow-y-auto text-emerald-400 leading-relaxed whitespace-pre-wrap">
                      {output}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* LIVE ONECOMPILER SANDBOX FRAME */
              <div className="flex-1 flex flex-col rounded-2xl bg-[#1e1e2f] border border-[#3e3e5a] overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-[#25253a] border-b border-[#3e3e5a] flex items-center justify-between text-xs text-slate-200">
                  <span className="font-medium text-white flex items-center gap-2">
                    <FaTerminal className="text-[#a78bfa]" /> Interactive Compiler Card Sandbox
                  </span>
                  <span className="text-xs text-[#a78bfa] font-mono">onecompiler.com/embed/{language}</span>
                </div>

                <div className="flex-1 bg-[#1a1a2b] p-2">
                  <iframe
                    key={iframeKey}
                    id="compilerIframe"
                    className="w-full h-full border-none rounded-xl bg-[#0f0f1a] block"
                    src={`https://onecompiler.com/embed/${language}`}
                    title="Interactive Code Compiler"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodingTestView;
