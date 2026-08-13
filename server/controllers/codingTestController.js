const CodingTest = require("../models/CodingTest");
const Application = require("../models/Application");
const Job = require("../models/Job");

// ── Rate limiting map for submissions (in-memory) ───────────────
const submissionAttempts = new Map();
const SUBMISSION_COOLDOWN_MS = 10000; // 10 seconds between submissions
const MAX_SUBMISSIONS_PER_TEST = 5;   // Max submission attempts per test

// HR creates & assigns a coding test to a student application
exports.createCodingTest = async (req, res) => {
  try {
    const { applicationId, title, description, language, testCases, durationMinutes } = req.body;

    if (!applicationId || !title || !description) {
      return res.status(400).json({ message: "Application ID, title, and description are required" });
    }

    const application = await Application.findById(applicationId).populate("job");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Ensure HR / Admin authorized
    if (
      application.job.postedBy.toString() !== req.user.id &&
      !["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized to assign test for this job" });
    }

    const codingTest = await CodingTest.create({
      job: application.job._id,
      application: application._id,
      student: application.student,
      createdBy: req.user.id,
      title,
      description,
      language: language || "python",
      testCases: Array.isArray(testCases) ? testCases : [],
      durationMinutes: durationMinutes || 30,
      status: "assigned",
    });

    // Update application status
    application.status = "coding_test_assigned";
    await application.save();

    res.status(201).json({ message: "Coding test assigned successfully", codingTest });
  } catch (err) {
    console.error("❌ Error in createCodingTest:", err);
    res.status(500).json({ message: err.message });
  }
};

// Student: get assigned tests
exports.getStudentTests = async (req, res) => {
  try {
    const tests = await CodingTest.find({ student: req.user.id })
      .populate("job", "title location")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: get tests created by HR
exports.getHRTests = async (req, res) => {
  try {
    const tests = await CodingTest.find({ createdBy: req.user.id })
      .populate("job", "title location")
      .populate("student", "name email uid")
      .populate("application")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single test by ID
exports.getTestById = async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id)
      .populate("job", "title location")
      .populate("student", "name email uid")
      .populate("createdBy", "name email");

    if (!test) {
      return res.status(404).json({ message: "Coding test not found" });
    }

    // Check authorization: must be student assigned or creator/admin
    const isStudent = test.student._id.toString() === req.user.id;
    const isCreatorOrAdmin =
      test.createdBy._id.toString() === req.user.id ||
      ["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role);

    if (!isStudent && !isCreatorOrAdmin) {
      return res.status(403).json({ message: "Not authorized to view this test" });
    }

    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student starts the test — records IP address
exports.startTest = async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (test.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Prevent re-starting a submitted or reviewed test
    if (test.status === "submitted" || test.status === "reviewed") {
      return res.status(400).json({ message: "Test already submitted" });
    }

    // Record IP address for security tracking
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    test.ipAddress = ipAddress;

    if (!test.startedAt) {
      test.startedAt = new Date();
      test.status = "in_progress";
      await test.save();
    }

    res.json({ message: "Test started", test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student submits code solution — with comprehensive security validation
exports.submitTest = async (req, res) => {
  try {
    const { submittedCode, submissionNotes, antiCheatLog, browserFingerprint, sessionDuration } = req.body;
    const test = await CodingTest.findById(req.params.id);

    if (!test) return res.status(404).json({ message: "Test not found" });
    if (test.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Prevent double submission
    if (test.status === "submitted" || test.status === "reviewed") {
      return res.status(400).json({ message: "Test already submitted" });
    }

    // ── Server-side time validation ──────────────────────────────
    if (test.startedAt) {
      const elapsed = (Date.now() - new Date(test.startedAt).getTime()) / 1000;
      const minTimeSec = 30; // Minimum 30 seconds for a valid submission
      if (elapsed < minTimeSec) {
        return res.status(400).json({
          message: `Test must be attempted for at least ${minTimeSec} seconds before submission`,
        });
      }
    }

    // ── Submission rate limiting ─────────────────────────────────
    const rateKey = `${test._id}_${req.user.id}`;
    const lastAttempt = submissionAttempts.get(rateKey);
    const now = Date.now();
    if (lastAttempt && (now - lastAttempt.time) < SUBMISSION_COOLDOWN_MS) {
      const waitSec = Math.ceil((SUBMISSION_COOLDOWN_MS - (now - lastAttempt.time)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec} seconds before submitting again`,
      });
    }
    if (lastAttempt && lastAttempt.count >= MAX_SUBMISSIONS_PER_TEST) {
      return res.status(429).json({
        message: `Maximum submission attempts (${MAX_SUBMISSIONS_PER_TEST}) reached for this test`,
      });
    }
    submissionAttempts.set(rateKey, {
      time: now,
      count: (lastAttempt?.count || 0) + 1,
    });

    // ── Store IP address ─────────────────────────────────────────
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    // ── Calculate total violations ───────────────────────────────
    let totalViolations = 0;
    if (antiCheatLog) {
      totalViolations = (antiCheatLog.warnings || 0)
        + (antiCheatLog.tabSwitches || 0)
        + (antiCheatLog.rightClickAttempts || 0)
        + (antiCheatLog.clipboardAttempts || 0)
        + (antiCheatLog.devToolsOpened || 0)
        + (antiCheatLog.keyboardBlockAttempts || 0)
        + (antiCheatLog.mouseLeaveCount || 0)
        + (antiCheatLog.screenshotAttempts || 0);
    }

    // ── Update test record ───────────────────────────────────────
    test.submittedCode = submittedCode || test.submittedCode || "";
    test.submissionNotes = submissionNotes || "";
    test.submittedAt = new Date();
    test.status = "submitted";
    test.ipAddress = test.ipAddress || ipAddress;

    // Store comprehensive anti-cheat data
    if (antiCheatLog) {
      test.antiCheatLog = {
        warnings: antiCheatLog.warnings || 0,
        tabSwitches: antiCheatLog.tabSwitches || 0,
        rightClickAttempts: antiCheatLog.rightClickAttempts || 0,
        clipboardAttempts: antiCheatLog.clipboardAttempts || 0,
        devToolsOpened: antiCheatLog.devToolsOpened || 0,
        keyboardBlockAttempts: antiCheatLog.keyboardBlockAttempts || 0,
        mouseLeaveCount: antiCheatLog.mouseLeaveCount || 0,
        focusLossCount: antiCheatLog.focusLossCount || 0,
        codePasteCount: antiCheatLog.codePasteCount || 0,
        fullscreenExits: antiCheatLog.fullscreenExits || 0,
        screenshotAttempts: antiCheatLog.screenshotAttempts || 0,
        violationTimestamps: antiCheatLog.violationTimestamps || [],
        events: antiCheatLog.events || [],
      };
      test.violationCount = totalViolations;
    }

    // Store browser fingerprint
    if (browserFingerprint) {
      test.browserFingerprint = {
        userAgent: browserFingerprint.userAgent || "",
        screenResolution: browserFingerprint.screenResolution || "",
        timezone: browserFingerprint.timezone || "",
        language: browserFingerprint.language || "",
        platform: browserFingerprint.platform || "",
        cookieEnabled: browserFingerprint.cookieEnabled || false,
        doNotTrack: browserFingerprint.doNotTrack || "",
        hardwareConcurrency: browserFingerprint.hardwareConcurrency || 0,
        deviceMemory: browserFingerprint.deviceMemory || 0,
        colorDepth: browserFingerprint.colorDepth || 0,
      };
    }

    // Store session duration
    if (sessionDuration) {
      test.sessionDuration = sessionDuration;
    }

    await test.save();

    // Update application status
    await Application.findByIdAndUpdate(test.application, {
      status: "coding_test_submitted",
    });

    // ── Log security summary ─────────────────────────────────────
    console.log(`📝 Test ${test._id} submitted by ${req.user.id}`);
    console.log(`   IP: ${ipAddress}`);
    console.log(`   Violations: ${totalViolations}`);
    console.log(`   Session: ${sessionDuration || "N/A"}s`);
    if (totalViolations > 10) {
      console.log(`   ⚠️ HIGH VIOLATION COUNT — Test ${test._id} flagged for review`);
    }

    res.json({ message: "Test submitted successfully", test });
  } catch (err) {
    console.error("❌ Error in submitTest:", err);
    res.status(500).json({ message: err.message });
  }
};

// HR reviews the test submission
exports.reviewTest = async (req, res) => {
  try {
    const { score, hrFeedback, verdict } = req.body;
    const test = await CodingTest.findById(req.params.id);

    if (!test) return res.status(404).json({ message: "Test not found" });

    if (
      test.createdBy.toString() !== req.user.id &&
      !["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized to review this test" });
    }

    if (score !== undefined) test.score = score;
    if (hrFeedback !== undefined) test.hrFeedback = hrFeedback;
    if (verdict !== undefined) test.verdict = verdict;
    test.status = "reviewed";

    await test.save();

    // If passed, update application status to shortlisted for interview!
    if (verdict === "passed") {
      await Application.findByIdAndUpdate(test.application, {
        status: "coding_test_passed",
      });
    } else if (verdict === "failed") {
      await Application.findByIdAndUpdate(test.application, {
        status: "coding_test_failed",
      });
    }

    res.json({ message: "Test review saved", test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload periodic proctoring camera snapshot
exports.uploadSnapshot = async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const { imageBase64 } = req.body;

    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Only the assigned student can upload snapshots
    if (test.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!imageBase64) {
      return res.status(400).json({ message: "No image data provided" });
    }

    // Rate limit snapshots: max 1 per 30 seconds
    const lastSnapshot = test.proctorSnapshots[test.proctorSnapshots.length - 1];
    if (lastSnapshot) {
      const timeSinceLast = Date.now() - new Date(lastSnapshot.capturedAt).getTime();
      if (timeSinceLast < 30000) {
        return res.status(429).json({ message: "Snapshot rate limited" });
      }
    }

    const uploadsDir = path.join(__dirname, "../uploads/proctoring", req.params.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `snapshot_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/proctoring/${req.params.id}/${filename}`;
    test.proctorSnapshots.push({
      imagePath: relativePath,
      capturedAt: new Date(),
    });

    await test.save();

    res.json({ message: "Snapshot saved", relativePath, totalSnapshots: test.proctorSnapshots.length });
  } catch (err) {
    console.error("❌ Error saving snapshot:", err);
    res.status(500).json({ message: err.message });
  }
};
