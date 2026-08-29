import { useState, useEffect, useRef, useCallback } from "react";

const CODE_SNIPPETS = [
  `const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};`,
  `function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
  `const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};`,
  `async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}`,
  `class LinkedList {
  constructor() {
    this.head = null;
  }
  append(value) {
    const node = { value, next: null };
    if (!this.head) { this.head = node; return; }
    let current = this.head;
    while (current.next) current = current.next;
    current.next = node;
  }
}`,
  `const quickSort = (arr) => {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x <= pivot);
  const right = arr.slice(1).filter(x => x > pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
};`,
  `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}`,
  `const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache[key]) return cache[key];
    cache[key] = fn(...args);
    return cache[key];
  };
};`,
];

function getHighScores() {
  try {
    return JSON.parse(localStorage.getItem("typingTestScores") || "[]");
  } catch {
    return [];
  }
}

function saveScore(score) {
  const scores = getHighScores();
  scores.push(score);
  scores.sort((a, b) => b.wpm - a.wpm);
  localStorage.setItem("typingTestScores", JSON.stringify(scores.slice(0, 10)));
}

export default function TypingTest({ theme }) {
  const [snippet, setSnippet] = useState("");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("idle"); // idle | running | finished
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [highScores, setHighScores] = useState(getHighScores());
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const pickSnippet = useCallback(() => {
    const idx = Math.floor(Math.random() * CODE_SNIPPETS.length);
    setSnippet(CODE_SNIPPETS[idx]);
    setTyped("");
    setStatus("idle");
    setStartTime(null);
    setElapsed(0);
    setWpm(0);
    setAccuracy(100);
  }, []);

  useEffect(() => {
    pickSnippet();
    return () => clearInterval(timerRef.current);
  }, [pickSnippet]);

  useEffect(() => {
    if (status === "running" && startTime) {
      timerRef.current = setInterval(() => {
        const secs = (Date.now() - startTime) / 1000;
        setElapsed(secs);
        const words = typed.trim().split(/\s+/).filter(Boolean).length;
        setWpm(secs > 0 ? Math.round((words / secs) * 60) : 0);
      }, 100);
    }
    return () => clearInterval(timerRef.current);
  }, [status, startTime, typed]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (status === "idle") {
      setStatus("running");
      setStartTime(Date.now());
    }
    setTyped(val);

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === snippet[i]) correct++;
    }
    setAccuracy(val.length > 0 ? Math.round((correct / val.length) * 100) : 100);

    // Check completion
    if (val.length >= snippet.length) {
      clearInterval(timerRef.current);
      const finalTime = (Date.now() - startTime) / 1000;
      const finalWords = val.trim().split(/\s+/).filter(Boolean).length;
      const finalWpm = Math.round((finalWords / finalTime) * 60);
      let finalCorrect = 0;
      for (let i = 0; i < snippet.length; i++) {
        if (val[i] === snippet[i]) finalCorrect++;
      }
      const finalAccuracy = Math.round((finalCorrect / snippet.length) * 100);
      setWpm(finalWpm);
      setAccuracy(finalAccuracy);
      setElapsed(finalTime);
      setStatus("finished");
      const score = { wpm: finalWpm, accuracy: finalAccuracy, time: Math.round(finalTime), date: new Date().toLocaleDateString() };
      saveScore(score);
      setHighScores(getHighScores());
    }
  };

  const startGame = () => {
    pickSnippet();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const renderSnippet = () => {
    return snippet.split("").map((char, i) => {
      let color = theme.textSecondary;
      if (i < typed.length) {
        color = typed[i] === char ? theme.green : theme.red;
      } else if (i === typed.length) {
        color = theme.text;
      }
      return (
        <span key={i} style={{ color, backgroundColor: i === typed.length ? "rgba(255,255,255,0.1)" : "transparent", borderBottom: i === typed.length ? `2px solid ${theme.gold}` : "none", padding: "0 1px" }}>
          {char}
        </span>
      );
    });
  };

  const cardStyle = { backgroundColor: theme.bgCard, borderColor: theme.border };
  const inputStyle = { backgroundColor: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.text };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border shadow-sm p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Typing Speed Test</h2>
            <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>Type the code below as fast as you can</p>
          </div>
          <button onClick={startGame} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-80" style={{ backgroundColor: theme.gold }}>
            {status === "idle" ? "Start" : "Restart"}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
            <div className="text-2xl font-bold" style={{ color: theme.gold }}>{wpm}</div>
            <div className="text-xs" style={{ color: theme.textSecondary }}>WPM</div>
          </div>
          <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
            <div className="text-2xl font-bold" style={{ color: accuracy >= 90 ? theme.green : accuracy >= 70 ? theme.yellow : theme.red }}>{accuracy}%</div>
            <div className="text-xs" style={{ color: theme.textSecondary }}>Accuracy</div>
          </div>
          <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
            <div className="text-2xl font-bold" style={{ color: theme.text }}>{Math.round(elapsed)}s</div>
            <div className="text-xs" style={{ color: theme.textSecondary }}>Time</div>
          </div>
        </div>
      </div>

      {/* Code Display */}
      <div className="rounded-xl border shadow-sm p-5" style={cardStyle}>
        <div className="font-mono text-sm leading-relaxed p-4 rounded-lg" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textSecondary, minHeight: "120px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {renderSnippet()}
        </div>
        <textarea
          ref={inputRef}
          value={typed}
          onChange={handleChange}
          disabled={status === "finished"}
          placeholder={status === "finished" ? "Test completed!" : "Start typing here..."}
          className="w-full mt-3 p-3 rounded-lg font-mono text-sm outline-none resize-none"
          style={{ ...inputStyle, opacity: status === "finished" ? 0.6 : 1, minHeight: "80px" }}
          rows={3}
        />
      </div>

      {/* Results */}
      {status === "finished" && (
        <div className="rounded-xl border shadow-sm p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Result</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
              <div className="text-xl font-bold" style={{ color: theme.green }}>✓</div>
              <div className="text-xs" style={{ color: theme.textSecondary }}>{accuracy}% correct</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
              <div className="text-xl font-bold" style={{ color: theme.gold }}>{wpm}</div>
              <div className="text-xs" style={{ color: theme.textSecondary }}>WPM</div>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
              <div className="text-xl font-bold" style={{ color: theme.text }}>{Math.round(elapsed)}s</div>
              <div className="text-xs" style={{ color: theme.textSecondary }}>Time</div>
            </div>
          </div>
        </div>
      )}

      {/* High Scores */}
      {highScores.length > 0 && (
        <div className="rounded-xl border shadow-sm p-5" style={cardStyle}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.text }}>High Scores</h3>
          <div className="space-y-2">
            {highScores.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: theme.bgInput, border: `1px solid ${theme.border}` }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-center" style={{ color: i < 3 ? theme.gold : theme.textSecondary }}>#{i + 1}</span>
                  <span className="text-sm" style={{ color: theme.text }}>{s.wpm} WPM</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: s.accuracy >= 90 ? theme.green : theme.textSecondary }}>{s.accuracy}%</span>
                  <span className="text-xs" style={{ color: theme.textSecondary }}>{s.time}s</span>
                  <span className="text-xs" style={{ color: theme.textSecondary }}>{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
