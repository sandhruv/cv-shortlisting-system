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
    // Java class must be named Main
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

// ── POST /api/compile ────────────────────────────────────────────
router.post("/", protect, (req, res) => {
  const { language, code } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "language and code are required" });
  }

  const cfg = LANG_CONFIG[language];
  if (!cfg) {
    return res.status(400).json({ error: `Language '${language}' not supported` });
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
