const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ── Language config ──────────────────────────────────────────────
const LANG_CONFIG = {
  python: {
    ext: "py",
    cmd: (file) => `python "${file}"`,
    fallback: ["python3", "py"],
  },
  javascript: {
    ext: "js",
    cmd: (file) => `node "${file}"`,
  },
  typescript: {
    ext: "ts",
    cmd: (file) => `npx --yes ts-node "${file}"`,
  },
  java: {
    ext: "java",
    cmd: (file, dir) => `cd "${dir}" && javac Main.java && java Main`,
    filename: "Main.java",
  },
  cpp: {
    ext: "cpp",
    cmd: (file, dir) => `g++ -o "${path.join(dir, "out")}" "${file}" && "${path.join(dir, "out")}"`,
  },
  c: {
    ext: "c",
    cmd: (file, dir) => `gcc -o "${path.join(dir, "out")}" "${file}" && "${path.join(dir, "out")}"`,
  },
  go: {
    ext: "go",
    cmd: (file) => `go run "${file}"`,
  },
  rust: {
    ext: "rs",
    cmd: (file, dir) => `rustc -o "${path.join(dir, "out")}" "${file}" && "${path.join(dir, "out")}"`,
  },
};

// ── Compile rate limiting (in-memory) ────────────────────────────
const compileAttempts = new Map();
const COMPILE_COOLDOWN_MS = 3000; // 3 seconds between compilations
const MAX_COMPILES_PER_MINUTE = 20;

// ── Code size & security limits ──────────────────────────────────
const MAX_CODE_SIZE = 50 * 1024;   // 50KB max code size
const BLOCKED_PATTERNS = [
  /import\s+os/i,
  /import\s+subprocess/i,
  /import\s+shutil/i,
  /require\s*\(\s*['"]child_process['"]\s*\)/i,
  /require\s*\(\s*['"]fs['"]\s*\)/i,
  /require\s*\(\s*['"]net['"]\s*\)/i,
  /require\s*\(\s*['"]http['"]\s*\)/i,
  /exec\s*\(/i,
  /execSync\s*\(/i,
  /system\s*\(/i,
  /eval\s*\(/i,
  /__import__\s*\(/i,
  /subprocess\./i,
  /os\.system/i,
  /os\.popen/i,
  /Process\s*\(/i,
  /Runtime\.getRuntime/i,
  /ProcessBuilder/i,
  /\/etc\/passwd/i,
  /\/etc\/shadow/i,
  /rm\s+-rf/i,
  /rmdir\s+/i,
  /del\s+\/[sfq]/i,
  /format\s+[cCdD]:/i,
];

// ── POST /api/compile ────────────────────────────────────────────
router.post("/", protect, (req, res) => {
  const { language, code } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "language and code are required" });
  }

  // ── Code size check ─────────────────────────────────────────
  if (code.length > MAX_CODE_SIZE) {
    return res.status(413).json({ error: "Code exceeds maximum size limit (50KB)" });
  }

  // ── Compile rate limiting ───────────────────────────────────
  const userId = req.user.id;
  const now = Date.now();
  const userAttempts = compileAttempts.get(userId);

  if (userAttempts) {
    // Check per-minute limit
    if (userAttempts.minuteStart && (now - userAttempts.minuteStart) < 60000) {
      if (userAttempts.minuteCount >= MAX_COMPILES_PER_MINUTE) {
        return res.status(429).json({
          error: "Too many compilation requests. Please wait a moment.",
        });
      }
      userAttempts.minuteCount += 1;
    } else {
      userAttempts.minuteStart = now;
      userAttempts.minuteCount = 1;
    }

    // Check cooldown
    if ((now - userAttempts.lastCompile) < COMPILE_COOLDOWN_MS) {
      return res.status(429).json({
        error: "Please wait before compiling again",
      });
    }
  } else {
    compileAttempts.set(userId, {
      lastCompile: now,
      minuteStart: now,
      minuteCount: 1,
    });
  }
  compileAttempts.get(userId).lastCompile = now;

  const cfg = LANG_CONFIG[language];
  if (!cfg) {
    return res.status(400).json({ error: `Language '${language}' not supported` });
  }

  // ── Security: Block dangerous code patterns ─────────────────
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return res.status(403).json({
        error: "Code contains potentially unsafe operations that are not permitted in the exam environment",
      });
    }
  }

  // Create a temp directory for this run
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lpu_compile_"));
  const filename = cfg.filename || `solution.${cfg.ext}`;
  const filepath = path.join(tmpDir, filename);

  try {
    fs.writeFileSync(filepath, code, "utf8");
  } catch (e) {
    return res.status(500).json({ error: "Failed to write source file", details: e.message });
  }

  const command = cfg.cmd(filepath, tmpDir);

  exec(
    command,
    {
      timeout:  15000,   // 15 second max execution
      maxBuffer: 1024 * 512, // 512KB output limit
      cwd: tmpDir,
    },
    (err, stdout, stderr) => {
      // Cleanup temp files
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

      if (err && err.killed) {
        return res.json({
          success: false,
          stdout: stdout || "",
          stderr: "⏱ Time limit exceeded (15 seconds)",
          exitCode: -1,
        });
      }

      res.json({
        success: !err || err.code === 0,
        stdout:  stdout || "",
        stderr:  stderr || (err?.message && !stdout ? err.message : "") || "",
        exitCode: err ? (err.code || 1) : 0,
      });
    }
  );
});

module.exports = router;
